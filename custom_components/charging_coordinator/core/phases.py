"""Phase switching thresholds."""

from __future__ import annotations

from .models import NOMINAL_VOLTAGE, Settings


def min_power(s: Settings, phases: int) -> float:
    return s.min_current * phases * NOMINAL_VOLTAGE


def max_current(s: Settings, phases: int) -> float:
    return s.max_current_1p if phases == 1 else s.max_current_3p


def switch_thresholds(s: Settings) -> tuple[float, float]:
    """Return (up, down) power thresholds for automatic 1p/3p switching.

    Both are raised to at least the 3p minimum power, since 3p cannot run
    below it. `down` never exceeds `up`, so a misconfiguration cannot make
    the two conditions overlap.
    """
    min3 = min_power(s, 3)
    up = max(s.phase_switch_up_power, min3)
    down = min(max(s.phase_switch_down_power, min3), up)
    return up, down
