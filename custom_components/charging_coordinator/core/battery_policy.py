"""Home battery mode decision."""

from __future__ import annotations

from .models import BatteryMode, Measurements, Settings


def is_price_cheap(m: Measurements, s: Settings) -> bool:
    """Fail closed: an unknown price is never cheap."""
    return m.price is not None and m.price <= s.price_threshold


def required_battery_mode(
    m: Measurements, s: Settings, grid_charging: bool
) -> tuple[BatteryMode, str | None]:
    """Hold the battery while the EV charges from the grid or the price is cheap.

    `grid_charging` is true when the active mode intends to draw from the grid
    (now, or pv_grid with a cheap price). Like evcc, the EV related hold only
    applies while the vehicle is actually charging.
    """
    if s.block_battery_on_cheap_price and is_price_cheap(m, s):
        return BatteryMode.HOLD, "cheap price"
    if s.block_battery_on_ev_grid_charge and grid_charging and m.charger.charging:
        return BatteryMode.HOLD, "ev grid charging"
    return BatteryMode.NORMAL, None
