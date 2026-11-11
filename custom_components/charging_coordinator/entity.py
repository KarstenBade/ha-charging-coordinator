"""Base entities."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity, EntityDescription
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN, NAME

if TYPE_CHECKING:
    from .runtime import CoordinatorRuntime


class CoordinatorEntity(Entity):
    """Entity bound to the runtime; refreshes after every control tick."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    # set by each platform so entity ids are stable: <domain>.charging_coordinator_<key>
    _entity_domain: str

    def __init__(self, runtime: CoordinatorRuntime, description: EntityDescription) -> None:
        self.runtime = runtime
        self.entity_description = description
        entry_id = runtime.entry.entry_id
        self._attr_unique_id = f"{entry_id}_{description.key}"
        self.entity_id = f"{self._entity_domain}.{DOMAIN}_{description.key}"
        self._attr_translation_key = description.translation_key or description.key
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry_id)}, name=NAME, manufacturer=NAME
        )

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(self.runtime.add_listener(self._handle_update))

    @callback
    def _handle_update(self) -> None:
        self.async_write_ha_state()


class SettingEntity(CoordinatorEntity, RestoreEntity):
    """Entity whose value is a field of `Settings` (same name as the entity key)."""

    def setting(self) -> Any:
        return getattr(self.runtime.settings, self.entity_description.key)

    @callback
    def push(self, value: Any) -> None:
        self.runtime.set_setting(self.entity_description.key, value)
        self.async_write_ha_state()

    @callback
    def _handle_update(self) -> None:
        """Settings mostly change through the entity itself; catch the rest (e.g. migrations)."""
        value = self.setting()
        if value != getattr(self, "_shown_value", value):
            self.async_write_ha_state()
        self._shown_value = value

    @callback
    def async_write_ha_state(self) -> None:
        self._shown_value = self.setting()
        super().async_write_ha_state()
