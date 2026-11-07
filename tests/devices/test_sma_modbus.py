from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any

import pytest

from custom_components.charging_coordinator.core.models import BatteryMode
from custom_components.charging_coordinator.devices.sma_modbus import (
    BatteryController,
    SmaModbusClient,
    read_hybrid,
    read_pv_inverter,
    s32,
    u32,
    u64,
)


@dataclass
class _Result:
    registers: list[int] = field(default_factory=list)
    error: bool = False

    def isError(self) -> bool:
        return self.error


class FakeModbus:
    """Register store mimicking the parts of AsyncModbusTcpClient we use."""

    def __init__(self, *_args: Any, **_kwargs: Any) -> None:
        self.registers: dict[int, int] = {}
        self.writes: list[tuple[int, list[int]]] = []
        self.connected = False
        self.fail_writes = False

    async def connect(self) -> bool:
        self.connected = True
        return True

    def set_u32(self, address: int, value: int) -> None:
        self.registers[address] = (value >> 16) & 0xFFFF
        self.registers[address + 1] = value & 0xFFFF

    def set_u64(self, address: int, value: int) -> None:
        for i in range(4):
            self.registers[address + i] = (value >> (48 - 16 * i)) & 0xFFFF

    async def read_holding_registers(self, address: int, *, count: int, device_id: int) -> _Result:
        assert device_id == 3
        return _Result([self.registers.get(address + i, 0xFFFF) for i in range(count)])

    async def write_registers(self, address: int, values: list[int], *, device_id: int) -> _Result:
        if self.fail_writes:
            return _Result(error=True)
        self.writes.append((address, list(values)))
        return _Result()

    def close(self) -> None:
        self.connected = False


@pytest.fixture
def fake() -> tuple[SmaModbusClient, FakeModbus]:
    holder: dict[str, FakeModbus] = {}

    def factory(*args: Any, **kwargs: Any) -> FakeModbus:
        holder["c"] = FakeModbus(*args, **kwargs)
        return holder["c"]

    client = SmaModbusClient("1.2.3.4", client_factory=factory)
    return client, holder["c"]


def test_decoders() -> None:
    assert u32([0xFFFF, 0xFFFF]) is None
    assert s32([0x8000, 0x0000]) is None
    assert s32([0xFFFF, 0xFFFE]) == -2
    assert u64([0, 0, 1, 0]) == 65536


async def test_read_hybrid(fake: tuple[SmaModbusClient, FakeModbus]) -> None:
    client, regs = fake
    regs.set_u32(30843, (-10_000) & 0xFFFFFFFF)  # -10 A -> charging
    regs.set_u32(30845, 64)
    regs.set_u32(30851, 40_000)  # 400 V
    regs.set_u32(30773, 2000)
    regs.set_u32(30961, 1500)
    regs.set_u32(30967, 0x80000000)  # NaN, not present
    regs.set_u64(34661, 1_234_000)
    regs.set_u64(34665, 1_000_000)
    r = await read_hybrid(client)
    assert r.battery_soc == 64
    assert r.battery_power == pytest.approx(-4000)
    assert r.pv_power == 3500
    assert r.battery_charge_energy == pytest.approx(1234)
    assert r.battery_discharge_energy == pytest.approx(1000)


async def test_read_pv_inverter(fake: tuple[SmaModbusClient, FakeModbus]) -> None:
    client, regs = fake
    regs.set_u32(30775, 3210)
    regs.set_u64(30513, 25_000_000)
    r = await read_pv_inverter(client)
    assert r.power == 3210 and r.energy == pytest.approx(25_000)


async def test_hold_writes_sequence_and_keeps_alive(
    fake: tuple[SmaModbusClient, FakeModbus],
) -> None:
    client, regs = fake
    ctl = BatteryController(client, 5000, 4200, keepalive_interval=0.01)
    await ctl.set_mode(BatteryMode.HOLD)
    assert regs.writes == [
        (40236, [0, 2424]),
        (40793, [0, 0]),
        (40795, [0, 5000]),
        (40797, [0, 0]),
        (40799, [0, 0]),
        (40801, [0, 0]),
    ]
    await asyncio.sleep(0.035)
    assert len(regs.writes) >= 18  # rewritten by the keep-alive

    regs.writes.clear()
    await ctl.set_mode(BatteryMode.NORMAL)
    assert (40799, [0, 4200]) in regs.writes and len(regs.writes) == 6
    await asyncio.sleep(0.03)
    assert len(regs.writes) == 6  # normal is written once


async def test_same_mode_is_not_rewritten(fake: tuple[SmaModbusClient, FakeModbus]) -> None:
    client, regs = fake
    ctl = BatteryController(client, 5000, 4200)
    await ctl.set_mode(BatteryMode.NORMAL)
    await ctl.set_mode(BatteryMode.NORMAL)
    assert len(regs.writes) == 6


async def test_failed_write_leaves_mode_unapplied(
    fake: tuple[SmaModbusClient, FakeModbus],
) -> None:
    client, regs = fake
    regs.fail_writes = True
    ctl = BatteryController(client, 5000, 4200)
    with pytest.raises(Exception, match="write"):
        await ctl.set_mode(BatteryMode.HOLD)
    assert ctl.applied_mode is None
    await ctl.shutdown()
    assert ctl.applied_mode is None
