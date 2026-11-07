"""SMA inverters via Modbus TCP (SMA register profile, unit id 3).

Register map and battery control sequence follow evcc's `sma-hybrid` template.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any

from ..core.models import BatteryMode

_LOGGER = logging.getLogger(__name__)

DEFAULT_PORT = 502
DEFAULT_UNIT_ID = 3
KEEPALIVE_INTERVAL = 30.0

NAN_S32 = 0x80000000
NAN_U32 = 0xFFFFFFFF
NAN_U64 = 0xFFFFFFFFFFFFFFFF

# STP SE (hybrid)
REG_DC_POWER = (30773, 30961, 30967)  # DcMs.Watt per MPP tracker, S32
REG_BAT_BLOCK = 30843  # Bat.Amp S32 mA, 30845 Bat.ChaStt U32 %, ..., 30851 Bat.Vol U32 0.01 V
REG_BAT_ENERGY = 34661  # BatChrg.ActBatChrg U64 Wh, 34665 BatDsch.ActBatDsch U64 Wh
# Sunny Boy
REG_AC_POWER = 30775  # GridMs.TotW S32
REG_TOTAL_YIELD = 30513  # Metering.TotWhOut U64 Wh

# battery control (CmpBMS)
REG_BMS_OPMODE = 40236
REG_CHA_MIN = 40793
REG_CHA_MAX = 40795
REG_DSCH_MIN = 40797
REG_DSCH_MAX = 40799
REG_GRID_SETPOINT = 40801
OPMODE_DEFAULT = 2424


def u32(regs: Sequence[int], offset: int = 0) -> int | None:
    value = (regs[offset] << 16) | regs[offset + 1]
    return None if value == NAN_U32 else value


def s32(regs: Sequence[int], offset: int = 0) -> int | None:
    value = (regs[offset] << 16) | regs[offset + 1]
    if value == NAN_S32:
        return None
    return value - 0x100000000 if value & 0x80000000 else value


def u64(regs: Sequence[int], offset: int = 0) -> int | None:
    value = 0
    for reg in regs[offset : offset + 4]:
        value = (value << 16) | reg
    return None if value == NAN_U64 else value


def u32_registers(value: int) -> list[int]:
    return [(value >> 16) & 0xFFFF, value & 0xFFFF]


class ModbusError(Exception):
    pass


class SmaModbusClient:
    """Thin async wrapper serialising access to one inverter."""

    def __init__(
        self,
        host: str,
        port: int = DEFAULT_PORT,
        unit_id: int = DEFAULT_UNIT_ID,
        client_factory: Callable[..., Any] | None = None,
    ) -> None:
        if client_factory is None:
            from pymodbus.client import AsyncModbusTcpClient

            client_factory = AsyncModbusTcpClient
        self.host = host
        self._unit_id = unit_id
        self._client = client_factory(host, port=port, timeout=3, retries=1)
        self._lock = asyncio.Lock()

    async def _ensure_connected(self) -> None:
        if not self._client.connected and not await self._client.connect():
            raise ModbusError(f"cannot connect to {self.host}")

    async def read(self, address: int, count: int) -> list[int]:
        async with self._lock:
            await self._ensure_connected()
            try:
                result = await self._client.read_holding_registers(
                    address, count=count, device_id=self._unit_id
                )
            except Exception as err:
                raise ModbusError(f"read {address} failed: {err}") from err
            if result.isError():
                raise ModbusError(f"read {address} failed: {result}")
            return list(result.registers)

    async def write_u32(self, address: int, value: int) -> None:
        async with self._lock:
            await self._ensure_connected()
            try:
                result = await self._client.write_registers(
                    address, u32_registers(value), device_id=self._unit_id
                )
            except Exception as err:
                raise ModbusError(f"write {address} failed: {err}") from err
            if result.isError():
                raise ModbusError(f"write {address} failed: {result}")

    def close(self) -> None:
        self._client.close()


@dataclass(frozen=True)
class HybridReading:
    battery_soc: float | None
    battery_power: float | None  # W, positive = discharging
    pv_power: float | None  # W, DC
    battery_charge_energy: float | None  # kWh
    battery_discharge_energy: float | None  # kWh


@dataclass(frozen=True)
class PvInverterReading:
    power: float | None  # W, AC
    energy: float | None  # kWh


async def read_hybrid(client: SmaModbusClient) -> HybridReading:
    bat = await client.read(REG_BAT_BLOCK, 10)
    amp, soc, volt = s32(bat, 0), u32(bat, 2), u32(bat, 8)
    battery_power = None if amp is None or volt is None else amp * 0.001 * volt * 0.01

    dc_a = await client.read(REG_DC_POWER[0], 2)
    dc_bc = await client.read(REG_DC_POWER[1], 8)  # 30961..30968
    dc_values = [s32(dc_a), s32(dc_bc, 0), s32(dc_bc, 6)]
    known = [v for v in dc_values if v is not None]
    pv_power = float(sum(known)) if known else None

    energy = await client.read(REG_BAT_ENERGY, 8)
    charged, discharged = u64(energy, 0), u64(energy, 4)

    return HybridReading(
        battery_soc=None if soc is None else float(soc),
        battery_power=battery_power,
        pv_power=pv_power,
        battery_charge_energy=None if charged is None else charged / 1000.0,
        battery_discharge_energy=None if discharged is None else discharged / 1000.0,
    )


async def read_pv_inverter(client: SmaModbusClient) -> PvInverterReading:
    power = s32(await client.read(REG_AC_POWER, 2))
    energy = u64(await client.read(REG_TOTAL_YIELD, 4))
    return PvInverterReading(
        power=None if power is None else float(power),
        energy=None if energy is None else energy / 1000.0,
    )


def battery_sequence(
    mode: BatteryMode, max_charge: int, max_discharge: int
) -> list[tuple[int, int]]:
    """Register writes for a battery mode, in the order evcc writes them."""
    discharge = 0 if mode == BatteryMode.HOLD else max_discharge
    return [
        (REG_BMS_OPMODE, OPMODE_DEFAULT),
        (REG_CHA_MIN, 0),
        (REG_CHA_MAX, max_charge),
        (REG_DSCH_MIN, 0),
        (REG_DSCH_MAX, discharge),
        (REG_GRID_SETPOINT, 0),
    ]


class BatteryController:
    """Applies battery modes and keeps a non-normal mode alive by rewriting it."""

    def __init__(
        self,
        client: SmaModbusClient,
        max_charge_power: int,
        max_discharge_power: int,
        keepalive_interval: float = KEEPALIVE_INTERVAL,
    ) -> None:
        self._client = client
        self._max_charge = max_charge_power
        self._max_discharge = max_discharge_power
        self._interval = keepalive_interval
        self._keepalive: asyncio.Task[None] | None = None
        self.applied_mode: BatteryMode | None = None

    async def set_mode(self, mode: BatteryMode) -> None:
        """Apply `mode` if it differs from the applied one. Raises ModbusError on failure."""
        if mode == self.applied_mode:
            return
        self._stop_keepalive()
        self.applied_mode = None
        await self._write(mode)
        self.applied_mode = mode
        _LOGGER.info("Battery mode set to %s", mode)
        if mode != BatteryMode.NORMAL:
            self._keepalive = asyncio.create_task(self._keepalive_loop(mode))

    async def _write(self, mode: BatteryMode) -> None:
        for address, value in battery_sequence(mode, self._max_charge, self._max_discharge):
            await self._client.write_u32(address, value)

    async def _keepalive_loop(self, mode: BatteryMode) -> None:
        while True:
            await asyncio.sleep(self._interval)
            try:
                await self._write(mode)
            except ModbusError as err:
                _LOGGER.warning("Battery keep-alive failed: %s", err)
                self.applied_mode = None
                return

    def _stop_keepalive(self) -> None:
        if self._keepalive is not None:
            self._keepalive.cancel()
            self._keepalive = None

    async def shutdown(self) -> None:
        """Release control: stop the keep-alive and write normal once."""
        self._stop_keepalive()
        try:
            await self._write(BatteryMode.NORMAL)
            self.applied_mode = BatteryMode.NORMAL
        except ModbusError as err:
            _LOGGER.warning("Could not reset battery mode to normal: %s", err)
            self.applied_mode = None
