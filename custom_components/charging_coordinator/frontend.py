"""Serve the dashboard cards and make the frontend load them before a dashboard renders.

The frontend waits for the dashboard *resources* (Settings → Dashboards → Resources)
before it draws a dashboard, so a card registered there is always defined in time.
An "extra module" (`add_extra_js_url`) is only imported alongside the app instead:
when it arrives after the dashboard has been drawn, the cards show a configuration
error until the frontend rebuilds them, which doesn't happen reliably. So the card
is registered as a resource where possible, and only falls back to the extra module
when the resources are managed in YAML or Lovelace isn't loaded.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

CARD_PATH = Path(__file__).parent / "www" / "charging-coordinator-card.js"
CARD_URL = f"/{DOMAIN}/charging-coordinator-card.js"


async def async_register_card(hass: HomeAssistant) -> None:
    """Serve the card bundle and register it with the frontend."""
    if not CARD_PATH.exists() or hass.http is None:
        return
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=False)]
    )
    # the mtime query string makes browsers fetch a new bundle after updates
    url = f"{CARD_URL}?v={int(CARD_PATH.stat().st_mtime)}"
    if await _async_register_resource(hass, url):
        return
    if "frontend" in hass.config.components:
        from homeassistant.components.frontend import add_extra_js_url

        add_extra_js_url(hass, url)
    else:
        _LOGGER.debug("Frontend not loaded, card not registered")


async def _async_register_resource(hass: HomeAssistant, url: str) -> bool:
    """Add the card to the dashboard resources, or update the one that is there.

    Returns False when the resources can't be managed here (YAML mode, no Lovelace).
    """
    resources: Any = getattr(hass.data.get("lovelace"), "resources", None)
    if resources is None or not hasattr(resources, "async_create_item"):
        return False
    await resources.async_get_info()  # loads the collection from storage
    ours = [
        item for item in resources.async_items() if item.get("url", "").split("?")[0] == CARD_URL
    ]
    if not ours:
        await resources.async_create_item({"res_type": "module", "url": url})
        _LOGGER.info("Added the Charging Coordinator card to the dashboard resources")
    elif ours[0]["url"] != url:
        await resources.async_update_item(ours[0]["id"], {"url": url})
    return True
