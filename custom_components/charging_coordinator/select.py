"""Mode selects."""

from __future__ import annotations

from enum import StrEnum

from homeassistant.components.select import SelectEntity, SelectEntityDescription
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import ChargingCoordinatorConfigEntry
from .core.models import LEGACY_CHARGE_MODES, ChargeMode, PhaseMode, UnbalanceMode
from .entity import SettingEntity
from .runtime import CoordinatorRuntime

SELECTS: dict[str, type[StrEnum]] = {
    "charge_mode": ChargeMode,
    "phase_mode": PhaseMode,
    "unbalance_mode": UnbalanceMode,
}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ChargingCoordinatorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    runtime = entry.runtime_data
    async_add_entities(
        SettingSelect(
            runtime, SelectEntityDescription(key=key, options=[e.value for e in enum]), enum
        )
        for key, enum in SELECTS.items()
    )


class SettingSelect(SettingEntity, SelectEntity):
    _entity_domain = "select"

    def __init__(
        self,
        runtime: CoordinatorRuntime,
        description: SelectEntityDescription,
        enum: type[StrEnum],
    ) -> None:
        super().__init__(runtime, description)
        self._enum = enum

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is None:
            return
        if last.state in self.options:
            self.runtime.set_setting(self.entity_description.key, self._enum(last.state))
        elif self._enum is ChargeMode and last.state in LEGACY_CHARGE_MODES:
            # pv / pv_grid before 0.4.0 are smart mode with the matching sources
            smart_pv, smart_price = LEGACY_CHARGE_MODES[last.state]
            self.runtime.set_setting("charge_mode", ChargeMode.SMART)
            self.runtime.set_setting("smart_pv", smart_pv)
            self.runtime.set_setting("smart_price", smart_price)

    @property
    def current_option(self) -> str:
        return str(self.setting().value)

    async def async_select_option(self, option: str) -> None:
        self.push(self._enum(option))
