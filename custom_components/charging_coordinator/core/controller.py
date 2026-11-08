"""Charge mode state machine.

The controller is evaluated once per tick. Like evcc's loadpoint, it keeps its
own commanded session state (enabled, phases). The measured charger state is
used for what the vehicle actually does: connection, status, power and currents.

- Shadow mode: nothing is written, so the charger never follows our decisions.
  The commanded state is never read back; otherwise every enable decision would
  be undone on the next tick.
- Active mode: once our last `frc`/`psm` write is older than
  CHARGER_SWITCH_SETTLE, the charger's enabled state and phases are adopted
  (evcc `syncCharger`). A change made in the go-e app thus becomes the new
  starting point, and the normal logic and its timers decide what happens next,
  instead of the change being overwritten blindly.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, replace

from .battery_policy import is_price_cheap, required_battery_mode
from .limits import compute_limit
from .models import (
    NOMINAL_VOLTAGE,
    ChargeMode,
    ChargerState,
    Decision,
    Measurements,
    PhaseMode,
    Settings,
)
from .phases import max_current, min_power, switch_thresholds
from .surplus import SitePower, battery_supported, compute_site_power
from .timers import DelayTimer

_LOGGER = logging.getLogger(__name__)

PHASE_SWITCH_SETTLE = 60.0
CHARGER_SWITCH_SETTLE = 60.0  # s after an frc/psm write in which a mismatch is expected
LIMIT_HYSTERESIS = 1.0  # A above min current needed to resume after a limit block


@dataclass
class _PvResult:
    enabled: bool
    current: float
    status: str
    action: str = "inactive"
    remaining: float = 0.0


def effective_current(charger: ChargerState) -> float:
    """Current the vehicle actually draws, capped by what is offered (evcc effectiveCurrent)."""
    if not charger.charging:
        return 0.0
    return min(max(charger.phase_currents) + 2.0, charger.offered_current)


class Controller:
    def __init__(self) -> None:
        self._pv_timer = DelayTimer()
        self._phase_timer = DelayTimer()
        self._phase_switch_at: float | None = None
        self._was_connected = False
        self._was_grid_cheap = False
        self._last_mode: ChargeMode | None = None
        self._limit_blocked = False
        # commanded session state; None until synced from the charger once
        self._enabled: bool | None = None
        self._phases: int | None = None
        self._last_command_at: float | None = None

    def notify_phase_switch(self, now: float) -> None:
        """Start the settle time after a phase switch of a running session."""
        self._phase_switch_at = now
        self._phase_timer.reset()

    def notify_charger_command(self, now: float) -> None:
        """Called by the runtime after it wrote `frc` or `psm` to the charger."""
        self._last_command_at = now

    def resync(self) -> None:
        """Adopt the charger's state on the next active decision.

        Used when active control is switched on: the shadow state may differ
        from what the charger actually does (e.g. evcc controlled it so far).
        """
        self._last_command_at = None
        self._phase_switch_at = None

    def decide(
        self, m: Measurements, s: Settings, now: float, sync_from_charger: bool = False
    ) -> Decision:
        """Decide for this tick. `sync_from_charger` is True in active mode."""
        charger = m.charger
        cheap = is_price_cheap(m, s)
        grid_cheap = s.charge_mode == ChargeMode.PV_GRID and cheap
        grid_charging = s.charge_mode == ChargeMode.NOW or grid_cheap
        battery_mode, battery_reason = required_battery_mode(m, s, grid_charging)

        if charger.available:
            if self._enabled is None:
                # adopt the charger's state once, so a restart doesn't interrupt a session
                self._enabled = charger.enabled
                self._phases = charger.phases
            elif sync_from_charger and self._charger_settled(now):
                self._adopt_charger_state(charger)

        # site power is a property of the house, published whatever the charger does
        sp = compute_site_power(m, s)
        base = Decision(
            valid=True,
            phases=self._phases or charger.phases,
            battery_mode=battery_mode,
            battery_reason=battery_reason,
            site_power=sp.site_power if sp else None,
            price_cheap=cheap,
        )

        if not charger.available:
            return replace(base, valid=False, status="charger unavailable")

        decision = self._decide(m, s, now, base, sp, grid_cheap, cheap)
        if decision.valid:
            if self._enabled and decision.enabled and decision.phases != self._phases:
                self.notify_phase_switch(now)
            self._enabled = decision.enabled
            self._phases = decision.phases
        return decision

    def _charger_settled(self, now: float) -> bool:
        """No command of ours is still in flight, so a mismatch is a real change."""
        last_command, phase_switch = self._last_command_at, self._phase_switch_at
        if last_command is not None and now - last_command < CHARGER_SWITCH_SETTLE:
            return False
        return phase_switch is None or now - phase_switch >= PHASE_SWITCH_SETTLE

    def _adopt_charger_state(self, charger: ChargerState) -> None:
        changes = []
        if charger.enabled != self._enabled:
            changes.append(f"enabled {self._enabled} -> {charger.enabled}")
            self._enabled = charger.enabled
        if charger.phases != self._phases:
            changes.append(f"phases {self._phases} -> {charger.phases}")
            self._phases = charger.phases
            self._phase_timer.reset()
        if changes:
            _LOGGER.info(
                "Charger changed outside the coordinator, adopting: %s", ", ".join(changes)
            )

    def _decide(
        self,
        m: Measurements,
        s: Settings,
        now: float,
        base: Decision,
        sp: SitePower | None,
        grid_cheap: bool,
        cheap: bool,
    ) -> Decision:
        charger = m.charger
        enabled = bool(self._enabled)
        self._track_transitions(charger, s, grid_cheap)

        if not charger.connected:
            return replace(base, status="disconnected")
        if s.charge_mode == ChargeMode.OFF:
            return replace(base, status="off")
        if sp is None:
            return replace(base, valid=False, status="waiting for grid meter data")

        if self._phase_switch_at is not None:
            if now - self._phase_switch_at < PHASE_SWITCH_SETTLE:
                return replace(
                    base, enabled=True, current=s.min_current, status="phase switch settling"
                )
            self._phase_switch_at = None

        if s.charge_mode == ChargeMode.NOW:
            phases = 1 if s.phase_mode == PhaseMode.ONE else 3
            pv = _PvResult(True, max_current(s, phases), f"now: {phases}p max power")
            decision = replace(base, phases=phases)
        else:
            offset = s.grid_charge_max_power if grid_cheap else 0.0
            site_power = sp.site_power - offset
            phases, phase_action, phase_remaining = self._target_phases(
                enabled, base.phases, charger.power, s, site_power, grid_cheap, m, now
            )
            if enabled and phases != base.phases:
                pv = _PvResult(True, s.min_current, f"switching to {phases}p")
            else:
                pv = self._pv_current(m, s, sp, site_power, phases, grid_cheap, enabled, now)
            prefix = self._mode_prefix(m, s, cheap)
            decision = replace(
                base,
                phases=phases,
                phase_action=phase_action,
                phase_remaining=phase_remaining,
                pv_action=pv.action,
                pv_remaining=pv.remaining,
            )
            pv.status = f"{prefix}: {pv.status}"

        return self._apply_limits(decision, pv, m, s)

    def _track_transitions(self, charger: ChargerState, s: Settings, grid_cheap: bool) -> None:
        if s.charge_mode != self._last_mode:
            self._pv_timer.reset()
            self._phase_timer.reset()
            self._last_mode = s.charge_mode
        elif grid_cheap != self._was_grid_cheap:
            # react immediately when the price crosses the threshold
            self._pv_timer.elapse()
        self._was_grid_cheap = grid_cheap

        if charger.connected and not self._was_connected:
            # first decision after plug-in (or startup) must not wait for the delays
            self._pv_timer.elapse()
            self._phase_timer.reset()
        self._was_connected = charger.connected

    @staticmethod
    def _mode_prefix(m: Measurements, s: Settings, cheap: bool) -> str:
        if s.charge_mode != ChargeMode.PV_GRID:
            return s.charge_mode.value
        if m.price is None:
            return "pv_grid (price unknown)"
        op = "<=" if cheap else ">"
        return f"pv_grid ({m.price:.3f} {op} {s.price_threshold:.3f})"

    def _target_phases(
        self,
        enabled: bool,
        current_phases: int,
        charger_power: float,
        s: Settings,
        site_power: float,
        grid_cheap: bool,
        m: Measurements,
        now: float,
    ) -> tuple[int, str, float]:
        if s.phase_mode == PhaseMode.ONE:
            return 1, "inactive", 0.0
        if s.phase_mode == PhaseMode.THREE:
            return 3, "inactive", 0.0

        up, down = switch_thresholds(s)
        available = charger_power - site_power

        if not enabled:
            # no running session, so choosing the start phases interrupts nothing
            self._phase_timer.reset()
            phases = 3 if available >= up else 1
            if phases == 1 and grid_cheap and self._one_phase_blocked(m, s, available):
                phases = 3
            return phases, "inactive", 0.0

        if current_phases == 1:
            if available >= up or (grid_cheap and self._one_phase_blocked(m, s, available)):
                return self._phase_timer_step(now, s.enable_delay, 1, 3, "scale3p")
            self._phase_timer.reset()
            return 1, "inactive", 0.0

        if available < down:
            return self._phase_timer_step(now, s.disable_delay, 3, 1, "scale1p")
        self._phase_timer.reset()
        return 3, "inactive", 0.0

    def _phase_timer_step(
        self, now: float, delay: float, current: int, target: int, action: str
    ) -> tuple[int, str, float]:
        self._phase_timer.start(now)
        if self._phase_timer.elapsed(now, delay):
            return target, "inactive", 0.0
        return current, action, self._phase_timer.remaining(now, delay)

    @staticmethod
    def _one_phase_blocked(m: Measurements, s: Settings, available: float) -> bool:
        """1p is capped below min current, but 3p would be possible."""
        return compute_limit(m, s, 1).current < s.min_current and available >= min_power(s, 3)

    def _pv_current(
        self,
        m: Measurements,
        s: Settings,
        sp: SitePower,
        site_power: float,
        phases: int,
        grid_cheap: bool,
        enabled: bool,
        now: float,
    ) -> _PvResult:
        """evcc pvMaxCurrent without the phase scaling part."""
        charger = m.charger
        min_i = s.min_current
        max_i = max_current(s, phases)
        eff_i = effective_current(charger)
        target = eff_i + (-site_power) / (phases * NOMINAL_VOLTAGE)

        battery = not grid_cheap and battery_supported(m, s, sp, min_power(s, phases))
        if battery and target < min_i:
            self._pv_timer.reset()
            return _PvResult(True, min_i, "battery supports min current")

        if enabled and target < min_i:
            threshold = s.disable_threshold
            if site_power >= threshold:
                self._pv_timer.start(now)
                if self._pv_timer.elapsed(now, s.disable_delay):
                    self._pv_timer.reset()
                    return _PvResult(False, 0.0, "insufficient surplus")
                remaining = self._pv_timer.remaining(now, s.disable_delay)
                return _PvResult(
                    True, min_i, f"disabling in {remaining:.0f} s", "disable", remaining
                )
            self._pv_timer.reset()
            return _PvResult(True, min_i, f"{phases}p min current")

        if not enabled:
            # Without a session of ours the vehicle shouldn't draw power. If it does
            # (shadow mode while evcc charges, or a stop still in progress), that
            # power would be available to us, so don't count it as house load.
            idle_site_power = site_power - charger.power
            if s.enable_threshold != 0:
                ok = idle_site_power <= s.enable_threshold
            else:
                ok = idle_site_power <= -min_power(s, phases)
            if ok:
                self._pv_timer.start(now)
                if self._pv_timer.elapsed(now, s.enable_delay):
                    self._pv_timer.reset()
                    return _PvResult(True, min_i, f"starting {phases}p")
                remaining = self._pv_timer.remaining(now, s.enable_delay)
                return _PvResult(False, 0.0, f"enabling in {remaining:.0f} s", "enable", remaining)
            self._pv_timer.reset()
            return _PvResult(False, 0.0, "waiting for surplus")

        self._pv_timer.reset()
        current = min(target, max_i)
        return _PvResult(True, current, f"{phases}p {math.floor(current)} A")

    def _apply_limits(
        self, decision: Decision, pv: _PvResult, m: Measurements, s: Settings
    ) -> Decision:
        limit = compute_limit(m, s, decision.phases)
        enabled = pv.enabled
        current = min(pv.current, max_current(s, decision.phases))
        status = pv.status

        if enabled and limit.current < current:
            current = limit.current
            status = f"{status}, limited by {limit.reason}"

        if enabled:
            threshold = s.min_current + (LIMIT_HYSTERESIS if self._limit_blocked else 0.0)
            if limit.current < threshold:
                enabled = False
                self._limit_blocked = True
                status = f"{pv.status}, blocked by {limit.reason}"
            else:
                self._limit_blocked = False

        current = float(math.floor(max(current, s.min_current))) if enabled else 0.0

        return replace(
            decision,
            enabled=enabled,
            current=current,
            status=status,
            limit_current=None if math.isinf(limit.current) else limit.current,
            limit_reason=limit.reason,
            fuse_headroom=limit.fuse_headroom,
            unbalance=limit.unbalance,
        )
