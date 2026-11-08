"""Binary sensors for the coordinator decision."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from homeassistant.components.binary_sensor import (
    BinarySensorEntity,
    BinarySensorEntityDescription,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import ChargingCoordinatorConfigEntry
from .core.models import BatteryMode
from .entity import CoordinatorEntity
from .runtime import CoordinatorRuntime


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


class CoordinatorBinarySensor(CoordinatorEntity, BinarySensorEntity):
    _entity_domain = "binary_sensor"

    entity_description: CoordinatorBinarySensorDescription

    @property
    def is_on(self) -> bool | None:
        return self.entity_description.value_fn(self.runtime)
