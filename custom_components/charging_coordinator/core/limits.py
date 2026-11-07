"""Main fuse and unbalanced-load protection."""

from __future__ import annotations

import math
from dataclasses import dataclass

from .models import NOMINAL_VOLTAGE, Measurements, Settings, UnbalanceMode


@dataclass(frozen=True)
class Limit:
    current: float  # max charger current per phase, math.inf if unlimited
    reason: str | None
    fuse_headroom: float | None  # smallest per-phase fuse headroom of the used phases
    unbalance: float | None  # current max(L) - min(L) at the grid point in W


def grid_phase_of(charger_phase: int, s: Settings) -> int:
    """Map a charger phase index (0..2) to a grid phase index (0..2).

    The charger's L1 sits on `charger_grid_phase`, L2/L3 follow in rotation.
    """
    return (s.charger_grid_phase - 1 + charger_phase) % 3


def charger_current_on_grid(m: Measurements, s: Settings) -> list[float]:
    currents = [0.0, 0.0, 0.0]
    for i, current in enumerate(m.charger.phase_currents):
        currents[grid_phase_of(i, s)] += current
    return currents


def compute_limit(m: Measurements, s: Settings, phases: int) -> Limit:
    current = math.inf
    reason: str | None = None
    headroom: float | None = None
    unbalance: float | None = None

    ev_on_grid = charger_current_on_grid(m, s)
    used = [grid_phase_of(i, s) for i in range(phases)]

    if m.grid_phase_current is not None:
        headroom = min(s.main_fuse_current - m.grid_phase_current[p] for p in used)
        fuse_current, phase = min(
            (ev_on_grid[p] + s.main_fuse_current - m.grid_phase_current[p], p) for p in used
        )
        if fuse_current < current:
            current, reason = fuse_current, f"main fuse L{phase + 1}"

    if m.grid_phase_power is not None:
        unbalance = max(m.grid_phase_power) - min(m.grid_phase_power)

    if phases == 1:
        k = used[0]
        if s.unbalance_mode == UnbalanceMode.STATIC:
            unbalance_current = s.unbalance_max / NOMINAL_VOLTAGE
        elif s.unbalance_mode == UnbalanceMode.DYNAMIC and m.grid_phase_power is not None:
            base = list(m.grid_phase_power)
            base[k] -= m.charger.power
            p_ev_max = min(base[i] for i in range(3) if i != k) + s.unbalance_max - base[k]
            voltage = NOMINAL_VOLTAGE
            if m.grid_phase_voltage is not None and m.grid_phase_voltage[k] > 0:
                voltage = m.grid_phase_voltage[k]
            unbalance_current = p_ev_max / voltage
        else:
            unbalance_current = math.inf
        if unbalance_current < current:
            current, reason = unbalance_current, f"unbalance L{k + 1}"

    return Limit(current=current, reason=reason, fuse_headroom=headroom, unbalance=unbalance)
