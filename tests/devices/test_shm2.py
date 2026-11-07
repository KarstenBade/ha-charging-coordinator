from __future__ import annotations

import struct

import pytest

from custom_components.charging_coordinator.devices.shm2_speedwire import (
    Shm2Listener,
    parse_datagram,
)


def obis(index: int, value: int, kind: int = 4) -> bytes:
    fmt = ">I" if kind == 4 else ">Q"
    return bytes([0, index, kind, 0]) + struct.pack(fmt, value)


def datagram(
    serial: int = 3012345678,
    p_import: float = 0,
    p_export: float = 0,
    phases: tuple[tuple[float, float, float, float], ...] = ((0, 0, 0, 230),) * 3,
    protocol: int = 0x6069,
) -> bytes:
    """Build an energy meter datagram. phases: (p_import, p_export, current A, voltage V)."""
    records = obis(1, int(p_import * 10)) + obis(1, 123 * 3_600_000, kind=8)
    records += obis(2, int(p_export * 10)) + obis(2, 45 * 3_600_000, kind=8)
    for base, (pi, pe, current, voltage) in zip((20, 40, 60), phases, strict=True):
        records += obis(base + 1, int(pi * 10)) + obis(base + 2, int(pe * 10))
        records += obis(base + 11, int(current * 1000)) + obis(base + 12, int(voltage * 1000))
    records += bytes([0x90, 0, 0, 0]) + bytes([2, 3, 4, 0x52])  # software version
    body = struct.pack(">HHII", protocol, 0x0174, serial, 1000) + records
    header = b"SMA\x00" + struct.pack(">HHI", 4, 0x02A0, 1)
    return header + struct.pack(">HH", len(body) + 2, 0x0010) + body + b"\x00\x00\x00\x00"


def test_parse_totals_and_phases() -> None:
    data = datagram(
        p_import=0,
        p_export=2500,
        phases=((100, 0, 0.5, 231), (0, 3000, 13.2, 232.5), (400, 0, 1.8, 230)),
    )
    s = parse_datagram(data)
    assert s is not None
    assert s.serial == 3012345678
    assert s.power == -2500
    assert s.phase_power == (100, -3000, 400)
    assert s.phase_current == pytest.approx((0.5, -13.2, 1.8))
    assert s.phase_voltage == pytest.approx((231, 232.5, 230))
    assert s.energy_import == pytest.approx(123)
    assert s.energy_export == pytest.approx(45)


def test_ignores_other_protocols() -> None:
    assert parse_datagram(datagram(protocol=0x6081)) is None
    assert parse_datagram(b"garbage") is None


def test_listener_filters_serial_and_averages() -> None:
    now = [0.0]
    listener = Shm2Listener(serial=1, clock=lambda: now[0])
    listener.datagram_received(datagram(serial=2, p_import=9999), ("x", 0))
    listener.datagram_received(datagram(serial=1, p_import=1000), ("x", 0))
    listener.datagram_received(datagram(serial=1, p_import=2000), ("x", 0))
    snap = listener.snapshot()
    assert snap is not None and snap.power == 1500
    # without new samples the latest value is reused
    snap = listener.snapshot()
    assert snap is not None and snap.power == 2000
    now[0] = 11.0
    assert listener.snapshot() is None
