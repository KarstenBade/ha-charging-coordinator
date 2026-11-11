"""Connected vehicle: which car is plugged in, picked in the card.

The go-e can't tell cars apart, so the card lets you pick the plugged-in car. The name
is only shown, the control logic doesn't use it. It is cleared when the vehicle is
unplugged, so the next car starts unpicked.
"""

from __future__ import annotations

from homeassistant.components.text import TextEntity, TextEntityDescription
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from . import ChargingCoordinatorConfigEntry
from .entity import CoordinatorEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ChargingCoordinatorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities(
        [
            ConnectedVehicleText(
                entry.runtime_data,
                TextEntityDescription(
                    key="connected_vehicle", icon="mdi:car-electric", native_max=64
                ),
            )
        ]
    )


class ConnectedVehicleText(CoordinatorEntity, RestoreEntity, TextEntity):
    _entity_domain = "text"

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is not None and last.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            self.runtime.connected_vehicle = last.state

    @property
    def native_value(self) -> str:
        return self.runtime.connected_vehicle

    async def async_set_value(self, value: str) -> None:
        self.runtime.connected_vehicle = value.strip()
        self.async_write_ha_state()
