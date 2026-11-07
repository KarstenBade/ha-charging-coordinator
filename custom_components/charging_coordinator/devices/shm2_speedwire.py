"""SMA Sunny Home Manager 2.0 / Energy Meter via Speedwire multicast.

The meter broadcasts a datagram roughly every second to 239.12.255.254:9522.
Layout (big endian):

    0   "SMA\\0"
    4   tag 0x02A0 (group), group id
    12  data length, tag 0x0010
    16  protocol id 0x6069 (energy meter)
    18  SUSy id (2), serial (4), ticker ms (4)
    28  OBIS records: channel, index, type, tariff + 4 or 8 byte value,
        terminated by 0x00000000
"""

from __future__ import annotations

import asyncio
import logging
import socket
import struct
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

_LOGGER = logging.getLogger(__name__)

MULTICAST_GROUP = "239.12.255.254"
PORT = 9522
PROTOCOL_EMETER = 0x6069
STALE_AFTER = 10.0

# OBIS measured value indices
_P_IMPORT = 1
_P_EXPORT = 2
_PHASE_BASE = (20, 40, 60)  # +1 P import, +2 P export, +11 current, +12 voltage
_VERSION_CHANNEL = 0x90


@dataclass(frozen=True)
class MeterSample:
    serial: int
    power: float  # W, positive = import
    phase_power: tuple[float, float, float]
    phase_current: tuple[float, float, float]  # A, signed by phase power direction
    phase_voltage: tuple[float, float, float]
    energy_import: float | None  # kWh
    energy_export: float | None  # kWh


def parse_datagram(data: bytes) -> MeterSample | None:
    """Parse one energy meter datagram, returning None for anything else."""
    if len(data) < 32 or data[:4] != b"SMA\x00":
        return None
    if struct.unpack_from(">H", data, 16)[0] != PROTOCOL_EMETER:
        return None
    data_len = struct.unpack_from(">H", data, 12)[0]
    end = min(len(data), 16 + data_len)
    serial = struct.unpack_from(">I", data, 20)[0]

    actual: dict[int, int] = {}
    counter: dict[int, int] = {}
    pos = 28
    while pos + 4 <= end:
        channel, index, kind, _tariff = data[pos : pos + 4]
        pos += 4
        if channel == 0 and index == 0 and kind == 0:
            break
        if channel == _VERSION_CHANNEL or kind == 4:
            if pos + 4 > end:
                break
            if channel != _VERSION_CHANNEL:
                actual[index] = struct.unpack_from(">I", data, pos)[0]
            pos += 4
        elif kind == 8:
            if pos + 8 > end:
                break
            counter[index] = struct.unpack_from(">Q", data, pos)[0]
            pos += 8
        else:
            _LOGGER.debug("Unknown OBIS record type %s at %s", kind, pos)
            return None

    def watts(index: int) -> float:
        return actual.get(index, 0) / 10.0

    def kwh(index: int) -> float | None:
        value = counter.get(index)
        return None if value is None else value / 3_600_000.0

    phase_power = []
    phase_current = []
    phase_voltage = []
    for base in _PHASE_BASE:
        power = watts(base + _P_IMPORT) - watts(base + _P_EXPORT)
        current = actual.get(base + 11, 0) / 1000.0
        phase_power.append(power)
        phase_current.append(-current if power < 0 else current)
        phase_voltage.append(actual.get(base + 12, 0) / 1000.0)

    return MeterSample(
        serial=serial,
        power=watts(_P_IMPORT) - watts(_P_EXPORT),
        phase_power=(phase_power[0], phase_power[1], phase_power[2]),
        phase_current=(phase_current[0], phase_current[1], phase_current[2]),
        phase_voltage=(phase_voltage[0], phase_voltage[1], phase_voltage[2]),
        energy_import=kwh(_P_IMPORT),
        energy_export=kwh(_P_EXPORT),
    )


@dataclass
class _Accumulator:
    samples: list[MeterSample] = field(default_factory=list)
    latest: MeterSample | None = None
    received_at: float = 0.0


def average(samples: list[MeterSample]) -> MeterSample:
    """Mean of power/current/voltage values, latest energy counters."""
    n = len(samples)
    last = samples[-1]

    def mean3(
        get: Callable[[MeterSample], tuple[float, float, float]],
    ) -> tuple[float, float, float]:
        return (
            sum(get(s)[0] for s in samples) / n,
            sum(get(s)[1] for s in samples) / n,
            sum(get(s)[2] for s in samples) / n,
        )

    return MeterSample(
        serial=last.serial,
        power=sum(s.power for s in samples) / n,
        phase_power=mean3(lambda s: s.phase_power),
        phase_current=mean3(lambda s: s.phase_current),
        phase_voltage=mean3(lambda s: s.phase_voltage),
        energy_import=last.energy_import,
        energy_export=last.energy_export,
    )


class Shm2Listener(asyncio.DatagramProtocol):
    """Receives meter datagrams and averages them between control ticks."""

    def __init__(self, serial: int | None, clock: Callable[[], float] = time.monotonic) -> None:
        self._serial = serial
        self._clock = clock
        self._acc = _Accumulator()
        self._transport: asyncio.DatagramTransport | None = None
        self._listeners: list[Callable[[MeterSample], None]] = []

    def add_listener(self, listener: Callable[[MeterSample], None]) -> Callable[[], None]:
        self._listeners.append(listener)
        return lambda: self._listeners.remove(listener)

    def datagram_received(self, data: bytes, addr: tuple[str | Any, int]) -> None:
        sample = parse_datagram(data)
        if sample is None:
            return
        if self._serial is not None and sample.serial != self._serial:
            return
        self._acc.samples.append(sample)
        self._acc.latest = sample
        self._acc.received_at = self._clock()
        for listener in list(self._listeners):
            listener(sample)

    @property
    def latest(self) -> MeterSample | None:
        if self._acc.latest is None or self._clock() - self._acc.received_at > STALE_AFTER:
            return None
        return self._acc.latest

    def snapshot(self) -> MeterSample | None:
        """Average since the last snapshot; None when the meter went silent."""
        latest = self.latest
        if latest is None:
            self._acc.samples.clear()
            return None
        samples = self._acc.samples or [latest]
        self._acc.samples = []
        return average(samples)

    async def start(self, interface_ip: str | None = None) -> None:
        loop = asyncio.get_running_loop()
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if hasattr(socket, "SO_REUSEPORT"):
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
        sock.bind(("", PORT))
        membership = socket.inet_aton(MULTICAST_GROUP) + socket.inet_aton(interface_ip or "0.0.0.0")
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, membership)
        sock.setblocking(False)
        transport, _ = await loop.create_datagram_endpoint(lambda: self, sock=sock)
        self._transport = transport

    def stop(self) -> None:
        if self._transport is not None:
            self._transport.close()
            self._transport = None
