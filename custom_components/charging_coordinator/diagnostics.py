"""Diagnostics dump of the current coordinator state."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from homeassistant.core import HomeAssistant

from . import ChargingCoordinatorConfigEntry


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ChargingCoordinatorConfigEntry
) -> dict[str, Any]:
    rt = entry.runtime_data
    return {
        "config": dict(rt.config),
        "active_control": rt.active_control,
        "settings": asdict(rt.settings),
        "measurements": asdict(rt.measurements),
        "decision": asdict(rt.decision) if rt.decision else None,
        "battery_mode_applied": rt.battery_mode_applied,
        "goe_values": rt.goe.data.values,
        "hybrid": asdict(rt.hybrid_reading) if rt.hybrid_reading else None,
        "pv_inverter": asdict(rt.pv_reading) if rt.pv_reading else None,
    }
