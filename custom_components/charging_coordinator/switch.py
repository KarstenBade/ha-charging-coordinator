"""Switches: active control (vs. shadow mode) and battery block options."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity, SwitchEntityDescription
from homeassistant.const import STATE_ON
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from . import ChargingCoordinatorConfigEntry
from .entity import CoordinatorEntity, SettingEntity

ACTIVE_CONTROL = "active_control"
SETTING_SWITCHES = ("block_battery_on_ev_grid_charge", "block_battery_on_cheap_price")


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ChargingCoordinatorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    runtime = entry.runtime_data
    entities: list[SwitchEntity] = [
        ActiveControlSwitch(runtime, SwitchEntityDescription(key=ACTIVE_CONTROL))
    ]
    entities += [SettingSwitch(runtime, SwitchEntityDescription(key=k)) for k in SETTING_SWITCHES]
    async_add_entities(entities)


class SettingSwitch(SettingEntity, SwitchEntity):
    _entity_domain = "switch"

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is not None:
            self.runtime.set_setting(self.entity_description.key, last.state == STATE_ON)

    @property
    def is_on(self) -> bool:
        return bool(self.setting())

    async def async_turn_on(self, **kwargs: Any) -> None:
        self.push(True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        self.push(False)


class ActiveControlSwitch(CoordinatorEntity, RestoreEntity, SwitchEntity):
    """Off = shadow mode: decisions are computed and published but nothing is written."""

    _entity_domain = "switch"
    _attr_icon = "mdi:steering"

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is not None and last.state == STATE_ON:
            await self.runtime.async_set_active_control(True)

    @property
    def is_on(self) -> bool:
        return self.runtime.active_control

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.runtime.async_set_active_control(True)
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.runtime.async_set_active_control(False)
        self.async_write_ha_state()
