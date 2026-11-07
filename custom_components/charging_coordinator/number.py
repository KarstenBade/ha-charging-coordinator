"""Numeric settings."""

from __future__ import annotations

from homeassistant.components.number import (
    NumberDeviceClass,
    NumberEntity,
    NumberEntityDescription,
    NumberMode,
)
from homeassistant.const import (
    PERCENTAGE,
    EntityCategory,
    UnitOfApparentPower,
    UnitOfElectricCurrent,
    UnitOfPower,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import ChargingCoordinatorConfigEntry
from .entity import SettingEntity

A = UnitOfElectricCurrent.AMPERE
W = UnitOfPower.WATT


def _desc(
    key: str,
    min_value: float,
    max_value: float,
    step: float,
    unit: str | None = None,
    device_class: NumberDeviceClass | None = None,
    config: bool = True,
) -> NumberEntityDescription:
    return NumberEntityDescription(
        key=key,
        native_min_value=min_value,
        native_max_value=max_value,
        native_step=step,
        native_unit_of_measurement=unit,
        device_class=device_class,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG if config else None,
    )


NUMBERS = (
    _desc("price_threshold", -1, 2, 0.001, config=False),
    _desc("grid_charge_max_power", 0, 50000, 100, W, NumberDeviceClass.POWER, config=False),
    _desc("min_current", 6, 16, 1, A, NumberDeviceClass.CURRENT),
    _desc("max_current_1p", 6, 32, 1, A, NumberDeviceClass.CURRENT),
    _desc("max_current_3p", 6, 32, 1, A, NumberDeviceClass.CURRENT),
    _desc("phase_switch_up_power", 0, 22000, 100, W, NumberDeviceClass.POWER),
    _desc("phase_switch_down_power", 0, 22000, 100, W, NumberDeviceClass.POWER),
    _desc("enable_threshold", -22000, 22000, 50, W, NumberDeviceClass.POWER),
    _desc("disable_threshold", -22000, 22000, 50, W, NumberDeviceClass.POWER),
    _desc("enable_delay", 0, 1800, 10, UnitOfTime.SECONDS, NumberDeviceClass.DURATION),
    _desc("disable_delay", 0, 1800, 10, UnitOfTime.SECONDS, NumberDeviceClass.DURATION),
    _desc("residual_power", -5000, 5000, 50, W, NumberDeviceClass.POWER),
    _desc("priority_soc", 0, 100, 1, PERCENTAGE, NumberDeviceClass.BATTERY),
    _desc("buffer_soc", 0, 100, 1, PERCENTAGE, NumberDeviceClass.BATTERY),
    _desc("buffer_start_soc", 0, 100, 1, PERCENTAGE, NumberDeviceClass.BATTERY),
    _desc("main_fuse_current", 10, 100, 1, A, NumberDeviceClass.CURRENT),
    _desc(
        "unbalance_max",
        0,
        20000,
        100,
        UnitOfApparentPower.VOLT_AMPERE,
        NumberDeviceClass.APPARENT_POWER,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ChargingCoordinatorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    runtime = entry.runtime_data
    async_add_entities(SettingNumber(runtime, description) for description in NUMBERS)


class SettingNumber(SettingEntity, NumberEntity):
    _entity_domain = "number"

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is None:
            return
        try:
            value = float(last.state)
        except ValueError:
            return
        self.runtime.set_setting(self.entity_description.key, value)

    @property
    def native_value(self) -> float:
        return float(self.setting())

    async def async_set_native_value(self, value: float) -> None:
        self.push(float(value))
