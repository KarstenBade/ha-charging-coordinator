"""Control loop wiring devices, the pure controller and the entities together."""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from dataclasses import replace
from datetime import datetime, timedelta
from typing import Any

from homeassistant.components import mqtt
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_time_interval

from .const import (
    BATTERY_STARTUP_GRACE,
    CONF_BATTERY_MAX_CHARGE_POWER,
    CONF_BATTERY_MAX_DISCHARGE_POWER,
    CONF_CHARGER_GRID_PHASE,
    CONF_CONTROL_INTERVAL,
    CONF_GOE_TOPIC,
    CONF_HYBRID_HOST,
    CONF_HYBRID_PORT,
    CONF_HYBRID_UNIT_ID,
    CONF_PRICE_ENTITY,
    CONF_PV_INVERTER_HOST,
    CONF_SHM2_INTERFACE,
    CONF_SHM2_SERIAL,
    DEFAULT_BATTERY_POWER,
    DEFAULT_CONTROL_INTERVAL,
    DEFAULT_PORT,
    DEFAULT_UNIT_ID,
    SMA_POLL_INTERVAL,
    SMA_STALE_AFTER,
)
from .core.controller import Controller
from .core.models import BatteryMode, Decision, Measurements, Settings
from .devices.goe import SUBSCRIBED_KEYS, GoeCharger
from .devices.shm2_speedwire import MeterSample, Shm2Listener
from .devices.sma_modbus import (
    BatteryController,
    HybridReading,
    ModbusError,
    PvInverterReading,
    SmaModbusClient,
    read_hybrid,
    read_pv_inverter,
)

_LOGGER = logging.getLogger(__name__)


class CoordinatorRuntime:
    """Owns all device connections and runs the control loop."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        cfg: dict[str, Any] = {**entry.data, **entry.options}
        self.config = cfg

        self.settings = Settings(
            charger_grid_phase=int(cfg.get(CONF_CHARGER_GRID_PHASE, 1)),
            battery_max_discharge_power=float(
                cfg.get(CONF_BATTERY_MAX_DISCHARGE_POWER, DEFAULT_BATTERY_POWER)
            ),
        )
        self.active_control = False
        self.controller = Controller()
        # monotonic deadline until which an invalid decision leaves the battery alone
        self._battery_wait_until: float | None = None

        serial = cfg.get(CONF_SHM2_SERIAL)
        self.shm2 = Shm2Listener(int(serial) if serial else None)
        self.hybrid = SmaModbusClient(
            cfg[CONF_HYBRID_HOST],
            int(cfg.get(CONF_HYBRID_PORT, DEFAULT_PORT)),
            int(cfg.get(CONF_HYBRID_UNIT_ID, DEFAULT_UNIT_ID)),
        )
        self.battery = BatteryController(
            self.hybrid,
            int(cfg.get(CONF_BATTERY_MAX_CHARGE_POWER, DEFAULT_BATTERY_POWER)),
            int(cfg.get(CONF_BATTERY_MAX_DISCHARGE_POWER, DEFAULT_BATTERY_POWER)),
        )
        pv_host = cfg.get(CONF_PV_INVERTER_HOST)
        self.pv_inverter = SmaModbusClient(pv_host) if pv_host else None
        self.goe = GoeCharger(cfg[CONF_GOE_TOPIC], self._publish)

        self.meter: MeterSample | None = None
        self.hybrid_reading: HybridReading | None = None
        self.pv_reading: PvInverterReading | None = None
        self._hybrid_at = 0.0
        self._pv_at = 0.0
        self.measurements = Measurements()
        self.decision: Decision | None = None

        self._listeners: list[Callable[[], None]] = []
        self._unsubs: list[Callable[[], None]] = []

    # --- lifecycle -------------------------------------------------------

    async def async_start(self) -> None:
        await self.shm2.start(self.config.get(CONF_SHM2_INTERFACE) or None)
        self._unsubs.append(self.shm2.stop)

        for key in SUBSCRIBED_KEYS:
            unsub = await mqtt.async_subscribe(
                self.hass, self.goe.topic(key), self._on_goe_message, 1
            )
            self._unsubs.append(unsub)

        interval = int(self.config.get(CONF_CONTROL_INTERVAL, DEFAULT_CONTROL_INTERVAL))
        self._unsubs.append(
            async_track_time_interval(
                self.hass, self._async_poll_sma, timedelta(seconds=SMA_POLL_INTERVAL)
            )
        )
        self._unsubs.append(
            async_track_time_interval(self.hass, self._async_tick, timedelta(seconds=interval))
        )
        self.hass.async_create_task(self._async_poll_sma())

    async def async_stop(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        if self.active_control:
            await self.battery.shutdown()
        self.hybrid.close()
        if self.pv_inverter is not None:
            self.pv_inverter.close()

    # --- entity plumbing -------------------------------------------------

    @callback
    def add_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(listener)
        return lambda: self._listeners.remove(listener)

    @callback
    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener()

    @callback
    def set_setting(self, key: str, value: Any) -> None:
        if getattr(self.settings, key) == value:
            return
        self.settings = replace(self.settings, **{key: value})

    async def async_set_active_control(self, active: bool) -> None:
        if active == self.active_control:
            return
        self.active_control = active
        if active:
            _LOGGER.info("Active control enabled")
            # forget the applied mode so the first valid decision is written, which
            # also clears a hold left over from an earlier crash
            self.battery.applied_mode = None
            # Right after startup the first ticks run before charger and meter data
            # arrived. Releasing a hold then would let the battery discharge into
            # a grid-charging vehicle until the next tick, so wait for valid data.
            self._battery_wait_until = time.monotonic() + BATTERY_STARTUP_GRACE
            # start from what the charger actually does, not from the shadow state
            self.controller.resync()
            await self._async_tick()
        else:
            _LOGGER.info("Active control disabled, entering shadow mode")
            await self.battery.shutdown()
            self._notify()

    # --- data ------------------------------------------------------------

    async def _publish(self, topic: str, payload: str) -> None:
        await mqtt.async_publish(self.hass, topic, payload, qos=1)

    @callback
    def _on_goe_message(self, msg: mqtt.ReceiveMessage) -> None:
        payload = msg.payload
        if isinstance(payload, bytes):
            payload = payload.decode()
        self.goe.handle_message(msg.topic, str(payload))

    async def _async_poll_sma(self, _now: datetime | None = None) -> None:
        now = time.monotonic()
        try:
            self.hybrid_reading = await read_hybrid(self.hybrid)
            self._hybrid_at = now
        except ModbusError as err:
            _LOGGER.debug("Reading hybrid inverter failed: %s", err)
            if now - self._hybrid_at > SMA_STALE_AFTER:
                self.hybrid_reading = None
        if self.pv_inverter is not None:
            try:
                self.pv_reading = await read_pv_inverter(self.pv_inverter)
                self._pv_at = now
            except ModbusError as err:
                _LOGGER.debug("Reading PV inverter failed: %s", err)
                if now - self._pv_at > SMA_STALE_AFTER:
                    self.pv_reading = None

    def _price(self) -> float | None:
        entity_id = self.config.get(CONF_PRICE_ENTITY)
        state = self.hass.states.get(entity_id) if entity_id else None
        if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return None
        try:
            return float(state.state)
        except ValueError:
            return None

    def _measurements(self) -> Measurements:
        self.meter = self.shm2.snapshot()
        meter, hybrid = self.meter, self.hybrid_reading
        return Measurements(
            grid_power=meter.power if meter else None,
            grid_phase_power=meter.phase_power if meter else None,
            grid_phase_current=meter.phase_current if meter else None,
            grid_phase_voltage=meter.phase_voltage if meter else None,
            battery_power=hybrid.battery_power if hybrid else None,
            battery_soc=hybrid.battery_soc if hybrid else None,
            price=self._price(),
            charger=self.goe.state(),
        )

    # --- control loop ----------------------------------------------------

    async def _async_tick(self, _now: datetime | None = None) -> None:
        self.measurements = self._measurements()
        decision = self.controller.decide(
            self.measurements, self.settings, time.monotonic(), self.active_control
        )
        self.decision = decision
        if self.active_control:
            await self._async_actuate(decision)
        self._notify()

    async def _async_actuate(self, decision: Decision) -> None:
        # the controller starts the phase switch settle time itself
        if decision.valid and await self.goe.apply(
            decision.enabled, int(decision.current), decision.phases
        ):
            self.controller.notify_charger_command(time.monotonic())

        if decision.valid:
            self._battery_wait_until = None
        elif self._battery_wait_until is not None:
            if time.monotonic() < self._battery_wait_until:
                _LOGGER.debug("Waiting for valid data before setting the battery mode")
                return
            # no valid data in time: fall back to the decision (normal), clearing stale holds
            self._battery_wait_until = None
        try:
            await self.battery.set_mode(decision.battery_mode)
        except ModbusError as err:
            _LOGGER.warning("Setting battery mode %s failed: %s", decision.battery_mode, err)

    @property
    def battery_mode_applied(self) -> BatteryMode | None:
        return self.battery.applied_mode
