"""Site power calculation including home battery priority (evcc site.go)."""

from __future__ import annotations

from dataclasses import dataclass

from .models import Measurements, Settings

PRIORITY_RESIDUAL = 100.0


@dataclass(frozen=True)
class SitePower:
    site_power: float
    residual_power: float
    battery_power: float  # battery power as counted in site_power
    battery_buffered: bool  # battery may keep a running session at min current
    battery_start: bool  # battery may start a session at min current


def compute_site_power(m: Measurements, s: Settings) -> SitePower | None:
    """Return the power balance the EV can work with, or None without grid data.

    Battery discharge counts as import, so the EV never drains the battery in
    PV modes. Above `priority_soc` battery charging counts as surplus, below it
    the battery keeps its charge power.
    """
    if m.grid_power is None:
        return None

    residual = s.residual_power
    battery_power = 0.0
    buffered = start = False

    if m.battery_power is not None and m.battery_soc is not None:
        soc = m.battery_soc
        battery_power = m.battery_power
        below_priority = soc < s.priority_soc
        if below_priority and residual <= 0:
            residual = PRIORITY_RESIDUAL
        if below_priority and battery_power < 0:
            battery_power = 0.0
        elif not below_priority:
            buffered = s.buffer_soc > 0 and soc > s.buffer_soc
            start = s.buffer_start_soc > 0 and soc >= s.buffer_start_soc

    return SitePower(
        site_power=m.grid_power + battery_power + residual,
        residual_power=residual,
        battery_power=battery_power,
        battery_buffered=buffered,
        battery_start=start,
    )


def battery_supported(m: Measurements, s: Settings, sp: SitePower, min_power: float) -> bool:
    """Whether the home battery may hold the EV at minimum current (evcc batterySupported)."""
    charger = m.charger
    if not (sp.battery_start or (sp.battery_buffered and charger.charging)):
        return False

    # real grid import, i.e. without what the battery delivers
    tolerance = max(100.0, abs(sp.residual_power))
    grid_demand = sp.site_power - sp.battery_power - sp.residual_power - tolerance
    if grid_demand > s.disable_threshold:
        return False

    if s.battery_max_discharge_power and m.battery_power is not None:
        expected = m.battery_power + (0.0 if charger.charging else min_power)
        if expected > s.battery_max_discharge_power:
            return False

    return True
