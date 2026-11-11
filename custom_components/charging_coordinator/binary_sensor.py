"""Binary sensors for the coordinator decision and each car's connected template."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
    BinarySensorEntityDescription,
)
from homeassistant.const import STATE_ON
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.util import dt as dt_util
from homeassistant.util import slugify

from . import ChargingCoordinatorConfigEntry
from .const import DOMAIN, NAME
from .core.models import BatteryMode
from .entity import CoordinatorEntity
from .runtime import CoordinatorRuntime
from .vehicles import VehicleTracker


@dataclass(frozen=True, kw_only=True)
class CoordinatorBinarySensorDescription(BinarySensorEntityDescription):
    value_fn: Callable[[CoordinatorRuntime], bool | None]


BINARY_SENSORS = (
    CoordinatorBinarySensorDescription(
        key="target_enabled",
        icon="mdi:ev-station",
        value_fn=lambda rt: rt.decision.enabled if rt.decision and rt.decision.valid else None,
    ),
    CoordinatorBinarySensorDescription(
        key="price_cheap",
        icon="mdi:cash-check",
        value_fn=lambda rt: rt.decision.price_cheap if rt.decision else None,
    ),
    CoordinatorBinarySensorDescription(
        key="battery_hold",
        icon="mdi:battery-lock",
        value_fn=lambda rt: rt.decision.battery_mode == BatteryMode.HOLD if rt.decision else None,
    ),
    CoordinatorBinarySensorDescription(
        key="vehicle_connected",
        icon="mdi:car-electric",
        value_fn=lambda rt: (
            rt.measurements.charger.connected if rt.measurements.charger.available else None
        ),
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ChargingCoordinatorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    runtime = entry.runtime_data
    async_add_entities(CoordinatorBinarySensor(runtime, d) for d in BINARY_SENSORS)
    for vehicle in runtime.vehicles:
        async_add_entities(
            [VehicleConnectedSensor(runtime, vehicle)],
            config_subentry_id=vehicle.config.subentry_id,
        )


class CoordinatorBinarySensor(CoordinatorEntity, BinarySensorEntity):
    _entity_domain = "binary_sensor"

    entity_description: CoordinatorBinarySensorDescription

    @property
    def is_on(self) -> bool | None:
        return self.entity_description.value_fn(self.runtime)


class VehicleConnectedSensor(CoordinatorEntity, RestoreEntity, BinarySensorEntity):
    """Result of one car's connected template, on the car's own device."""

    _entity_domain = "binary_sensor"
    _attr_device_class = BinarySensorDeviceClass.PLUG

    def __init__(self, runtime: CoordinatorRuntime, vehicle: VehicleTracker) -> None:
        super().__init__(runtime, BinarySensorEntityDescription(key="car_connected"))
        self.vehicle = vehicle
        config = vehicle.config
        entry_id = runtime.entry.entry_id
        self._attr_unique_id = f"{entry_id}_{config.subentry_id}_connected"
        self.entity_id = f"binary_sensor.{DOMAIN}_{slugify(config.name)}_connected"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, config.subentry_id)},
            name=config.name,
            manufacturer=NAME,
            model="Vehicle",
            via_device=(DOMAIN, entry_id),
        )
        if config.image:
            self._attr_entity_picture = config.image

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is not None and last.state == STATE_ON:
            since = dt_util.parse_datetime(str(last.attributes.get("connected_since", "")))
            if since is not None:
                self.vehicle.restore(since)

    @property
    def is_on(self) -> bool:
        return self.vehicle.connected

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        v = self.vehicle
        return {
            "connected_since": v.connected_since.isoformat() if v.connected_since else None,
            "error": v.error,
        }
