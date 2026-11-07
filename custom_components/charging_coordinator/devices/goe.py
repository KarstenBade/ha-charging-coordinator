"""go-eCharger (API v2) via its MQTT interface.

The charger publishes every API key as `<prefix>/<key>` with a JSON payload
and accepts writes on `<prefix>/<key>/set`. Those are the same topics the
syssi/homeassistant-goecharger-mqtt integration uses, but we subscribe to them
directly so we don't depend on its entity naming.
"""

from __future__ import annotations

import json
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

from ..core.models import ChargerState, ChargerStatus

_LOGGER = logging.getLogger(__name__)

SUBSCRIBED_KEYS = ("car", "frc", "alw", "amp", "psm", "nrg", "wh", "eto")
STALE_AFTER = 300.0

FRC_NEUTRAL = 0
FRC_OFF = 1
FRC_ON = 2
PSM_AUTO = 0
PSM_1P = 1
PSM_3P = 2

_CAR_STATUS = {
    1: ChargerStatus.DISCONNECTED,
    2: ChargerStatus.CHARGING,
    3: ChargerStatus.CONNECTED,
    4: ChargerStatus.CONNECTED,
    5: ChargerStatus.CONNECTED,  # error, vehicle is still plugged in
}


@dataclass
class GoeValues:
    """Raw values as last received from the charger."""

    values: dict[str, Any] = field(default_factory=dict)
    received_at: float = 0.0

    def update(self, key: str, payload: str, now: float) -> None:
        try:
            self.values[key] = json.loads(payload)
        except ValueError:
            _LOGGER.debug("Ignoring non-JSON payload for %s: %s", key, payload)
            return
        self.received_at = now

    def charger_state(self, now: float) -> ChargerState:
        v = self.values
        car = v.get("car")
        if car not in _CAR_STATUS or now - self.received_at > STALE_AFTER:
            return ChargerState(available=False)

        frc = v.get("frc", FRC_NEUTRAL)
        enabled = frc == FRC_ON or (frc == FRC_NEUTRAL and bool(v.get("alw", False)))

        nrg = v.get("nrg") or []
        currents = (0.0, 0.0, 0.0)
        power = 0.0
        if isinstance(nrg, list) and len(nrg) >= 12:
            currents = (float(nrg[4]), float(nrg[5]), float(nrg[6]))
            power = float(nrg[11])

        return ChargerState(
            available=True,
            status=_CAR_STATUS[car],
            enabled=enabled,
            offered_current=float(v.get("amp", 0)),
            phases=1 if v.get("psm") == PSM_1P else 3,
            power=power,
            phase_currents=currents,
        )

    @property
    def session_energy(self) -> float | None:
        wh = self.values.get("wh")
        return None if wh is None else float(wh) / 1000.0

    @property
    def total_energy(self) -> float | None:
        eto = self.values.get("eto")
        return None if eto is None else float(eto) / 1000.0


Publish = Callable[[str, str], Awaitable[None]]


class GoeCharger:
    """Reads and writes the charger through injected MQTT publish/subscribe callables."""

    def __init__(self, topic_prefix: str, publish: Publish) -> None:
        self.topic_prefix = topic_prefix.rstrip("/")
        self._publish = publish
        self.data = GoeValues()

    def topic(self, key: str) -> str:
        return f"{self.topic_prefix}/{key}"

    def handle_message(self, topic: str, payload: str) -> None:
        key = topic.rsplit("/", 1)[-1]
        if key in SUBSCRIBED_KEYS:
            self.data.update(key, payload, time.monotonic())

    def state(self) -> ChargerState:
        return self.data.charger_state(time.monotonic())

    async def _set(self, key: str, value: int) -> None:
        await self._publish(f"{self.topic(key)}/set", str(value))
        # optimistic update so the next tick doesn't repeat the write
        self.data.values[key] = value

    async def apply(self, enabled: bool, current: int, phases: int) -> bool:
        """Write the changes needed to reach the requested state.

        A phase change first drops to the requested (min) current, then sets
        `psm`. Returns True if the phases were switched.
        """
        v = self.data.values
        switched = False
        if enabled and v.get("amp") != current:
            await self._set("amp", current)
        psm = PSM_1P if phases == 1 else PSM_3P
        if v.get("psm") != psm:
            await self._set("psm", psm)
            switched = True
        frc = FRC_ON if enabled else FRC_OFF
        if v.get("frc") != frc:
            await self._set("frc", frc)
        return switched
