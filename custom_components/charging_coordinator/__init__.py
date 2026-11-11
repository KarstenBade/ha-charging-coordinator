"""The Charging Coordinator integration."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import mqtt
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .runtime import CoordinatorRuntime

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [
    Platform.BINARY_SENSOR,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.TEXT,
]
CARD_URL = f"/{DOMAIN}/charging-coordinator-card.js"
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type ChargingCoordinatorConfigEntry = ConfigEntry[CoordinatorRuntime]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the Lovelace card bundled with the integration."""
    card = Path(__file__).parent / "www" / "charging-coordinator-card.js"
    if not card.exists() or hass.http is None:
        return True
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(card), cache_headers=False)]
    )
    if "frontend" in hass.config.components:
        from homeassistant.components.frontend import add_extra_js_url

        # the mtime query string makes browsers fetch a new bundle after updates
        add_extra_js_url(hass, f"{CARD_URL}?v={int(card.stat().st_mtime)}")
    else:
        _LOGGER.debug("Frontend not loaded, card not registered")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ChargingCoordinatorConfigEntry) -> bool:
    if not await mqtt.async_wait_for_mqtt_client(hass):
        raise ConfigEntryNotReady("MQTT is not available")

    runtime = CoordinatorRuntime(hass, entry)
    try:
        await runtime.async_start()
    except OSError as err:
        await runtime.async_stop()
        raise ConfigEntryNotReady(f"Cannot listen for SHM2 multicast: {err}") from err

    entry.runtime_data = runtime
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ChargingCoordinatorConfigEntry) -> bool:
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await entry.runtime_data.async_stop()
    return unloaded


async def _async_reload(hass: HomeAssistant, entry: ChargingCoordinatorConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)
