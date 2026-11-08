"""Scenario tests for the charge mode state machine."""

from __future__ import annotations

from dataclasses import replace

import pytest

from custom_components.charging_coordinator.core.controller import Controller
from custom_components.charging_coordinator.core.models import (
    BatteryMode,
    ChargeMode,
    ChargerState,
    ChargerStatus,
    Measurements,
    PhaseMode,
    Settings,
    UnbalanceMode,
)

V = 230.0


def charger(
    status: ChargerStatus = ChargerStatus.CONNECTED,
    enabled: bool = False,
    current: float = 0.0,
    phases: int = 1,
) -> ChargerState:
    charging = status == ChargerStatus.CHARGING
    draw = current if charging else 0.0
    currents = (draw, draw if phases == 3 else 0.0, draw if phases == 3 else 0.0)
    return ChargerState(
        available=True,
        status=status,
        enabled=enabled,
        offered_current=current,
        phases=phases,
        power=draw * phases * V,
        phase_currents=currents,
    )


def meas(grid: float, ch: ChargerState, **kwargs) -> Measurements:
    return Measurements(grid_power=grid, charger=ch, **kwargs)


@pytest.fixture
def ctl() -> Controller:
    c = Controller()
    # simulate an already connected vehicle so connect transitions don't elapse timers
    c._was_connected = True
    c._last_mode = ChargeMode.PV
    return c


PV = Settings(charge_mode=ChargeMode.PV, unbalance_mode=UnbalanceMode.OFF)


def test_disconnected_disables() -> None:
    d = Controller().decide(meas(-5000, charger(ChargerStatus.DISCONNECTED)), PV, 0)
    assert d.valid and not d.enabled and d.status == "disconnected"


def test_charger_unavailable_is_invalid() -> None:
    d = Controller().decide(meas(0, ChargerState(available=False)), PV, 0)
    assert not d.valid


def test_missing_grid_data_is_invalid(ctl: Controller) -> None:
    d = ctl.decide(Measurements(charger=charger()), PV, 0)
    assert not d.valid and "grid" in d.status


def test_off_mode(ctl: Controller) -> None:
    s = replace(PV, charge_mode=ChargeMode.OFF)
    d = ctl.decide(meas(-8000, charger(enabled=True)), s, 0)
    assert not d.enabled and d.status == "off"


def test_pv_enable_waits_for_delay(ctl: Controller) -> None:
    m = meas(-1500, charger())  # 1500 W surplus >= 1380 W 1p min power
    d = ctl.decide(m, PV, 0)
    assert not d.enabled and d.pv_action == "enable" and d.phases == 1
    d = ctl.decide(m, PV, 59)
    assert not d.enabled
    d = ctl.decide(m, PV, 60)
    assert d.enabled and d.current == 6 and d.phases == 1


def test_pv_enable_immediately_after_plug_in() -> None:
    c = Controller()
    d = c.decide(meas(-2000, charger()), PV, 0)
    assert d.enabled and d.current == 6


def test_pv_enable_timer_resets_on_cloud(ctl: Controller) -> None:
    ctl.decide(meas(-1500, charger()), PV, 0)
    ctl.decide(meas(-500, charger()), PV, 30)  # cloud: surplus gone
    d = ctl.decide(meas(-1500, charger()), PV, 61)
    assert not d.enabled and d.pv_action == "enable"


def test_pv_follows_surplus(ctl: Controller) -> None:
    # charging 1p at 10 A, 1150 W export left -> +5 A
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=10)
    d = ctl.decide(meas(-1150, ch), PV, 0)
    assert d.enabled and d.current == 15 and d.phases == 1


def test_pv_caps_at_max_current_1p(ctl: Controller) -> None:
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=30)
    s = replace(PV, phase_mode=PhaseMode.ONE)
    d = ctl.decide(meas(-3000, ch), s, 0)
    assert d.current == 32


def test_pv_disable_after_delay(ctl: Controller) -> None:
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=6)
    m = meas(300, ch)  # importing at min current
    d = ctl.decide(m, PV, 0)
    assert d.enabled and d.current == 6 and d.pv_action == "disable"
    d = ctl.decide(m, PV, 179)
    assert d.enabled
    d = ctl.decide(m, PV, 180)
    assert not d.enabled


def test_battery_discharge_counts_as_import(ctl: Controller) -> None:
    # grid is balanced at 0 W because the battery delivers 2 kW -> no surplus
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=10)
    d = ctl.decide(meas(0, ch, battery_power=2000, battery_soc=50), PV, 0)
    assert d.current == 6 and d.pv_action == "disable"


def test_battery_charging_is_surplus_above_priority_soc(ctl: Controller) -> None:
    s = replace(PV, priority_soc=40)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=6)
    m = meas(0, ch, battery_power=-2300, battery_soc=60)
    assert ctl.decide(m, s, 0).current == 16


def test_battery_keeps_charge_power_below_priority_soc(ctl: Controller) -> None:
    s = replace(PV, priority_soc=80)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=6)
    m = meas(0, ch, battery_power=-2300, battery_soc=60)
    d = ctl.decide(m, s, 0)
    # residual forced to +100 W -> slight import -> stays at min, disable timer runs
    assert d.current == 6 and d.pv_action == "disable"


def test_buffer_soc_keeps_session_on_battery(ctl: Controller) -> None:
    s = replace(PV, priority_soc=20, buffer_soc=50)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=6)
    m = meas(0, ch, battery_power=1000, battery_soc=70)
    d = ctl.decide(m, s, 0)
    assert d.enabled and d.current == 6 and d.pv_action == "inactive"
    assert ctl.decide(m, s, 500).enabled


def test_buffer_start_soc_starts_session(ctl: Controller) -> None:
    s = replace(PV, buffer_start_soc=90)
    d = ctl.decide(meas(0, charger(), battery_power=0, battery_soc=95), s, 0)
    assert d.enabled and d.current == 6


def test_phase_start_3p_with_large_surplus() -> None:
    d = Controller().decide(meas(-9000, charger(phases=1)), PV, 0)
    assert d.enabled and d.phases == 3


def test_phase_scale_up_after_enable_delay(ctl: Controller) -> None:
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=32, phases=1)
    m = meas(-1500, ch)  # 7360 + 1500 = 8860 W available >= 8000
    d = ctl.decide(m, PV, 0)
    assert d.phases == 1 and d.phase_action == "scale3p"
    d = ctl.decide(m, PV, 60)
    assert d.phases == 3 and d.enabled and d.current == 6 and "switching" in d.status


def test_phase_scale_down_after_disable_delay(ctl: Controller) -> None:
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=6, phases=3)
    m = meas(200, ch)  # 4140 - 200 = 3940 W available < 5000
    d = ctl.decide(m, PV, 0)
    assert d.phases == 3 and d.phase_action == "scale1p"
    d = ctl.decide(m, PV, 180)
    assert d.phases == 1 and d.enabled and d.current == 6


def test_phase_switch_settling(ctl: Controller) -> None:
    ctl.notify_phase_switch(100)
    ch = charger(ChargerStatus.CONNECTED, enabled=True, current=6, phases=3)
    d = ctl.decide(meas(500, ch), PV, 120)
    assert d.enabled and d.current == 6 and d.status == "phase switch settling"
    d = ctl.decide(meas(500, ch), PV, 161)
    assert d.status != "phase switch settling"


def test_fixed_3p_never_switches(ctl: Controller) -> None:
    s = replace(PV, phase_mode=PhaseMode.THREE)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=6, phases=3)
    assert ctl.decide(meas(200, ch), s, 1000).phases == 3


def test_now_mode_3p_max_and_battery_hold(ctl: Controller) -> None:
    s = replace(PV, charge_mode=ChargeMode.NOW)
    ctl._last_mode = ChargeMode.NOW
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=16, phases=3)
    d = ctl.decide(meas(8000, ch, battery_power=0, battery_soc=50), s, 0)
    assert d.enabled and d.current == 16 and d.phases == 3
    assert d.battery_mode == BatteryMode.HOLD


def test_now_mode_hold_only_while_charging(ctl: Controller) -> None:
    s = replace(PV, charge_mode=ChargeMode.NOW)
    d = ctl.decide(meas(0, charger(enabled=True, phases=3)), s, 0)
    assert d.battery_mode == BatteryMode.NORMAL


def test_hold_switch_off_keeps_battery_normal(ctl: Controller) -> None:
    s = replace(PV, charge_mode=ChargeMode.NOW, block_battery_on_ev_grid_charge=False)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=16, phases=3)
    assert ctl.decide(meas(8000, ch), s, 0).battery_mode == BatteryMode.NORMAL


PV_GRID = replace(
    PV, charge_mode=ChargeMode.PV_GRID, price_threshold=0.20, grid_charge_max_power=11000
)


def test_pv_grid_expensive_behaves_like_pv(ctl: Controller) -> None:
    ctl._last_mode = ChargeMode.PV_GRID
    d = ctl.decide(meas(500, charger(), price=0.30), PV_GRID, 0)
    assert not d.enabled and not d.price_cheap
    assert d.status.startswith("pv_grid (0.300 > 0.200)")


def test_pv_grid_cheap_starts_immediately_capped_by_grid(ctl: Controller) -> None:
    ctl._last_mode = ChargeMode.PV_GRID
    d = ctl.decide(meas(500, charger(phases=1), price=0.15), PV_GRID, 0)
    # 11000 - 500 W house = 10500 W >= 8000 W -> 3p start
    assert d.enabled and d.phases == 3 and d.price_cheap


def test_pv_grid_cheap_limits_total_grid_import(ctl: Controller) -> None:
    ctl._last_mode = ChargeMode.PV_GRID
    ctl._was_grid_cheap = True
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=16, phases=3)
    # 11040 W EV + 1000 W house, no PV -> 12040 W import, 1040 W over the cap
    d = ctl.decide(meas(12040, ch, price=0.10), PV_GRID, 0)
    assert d.current == 14  # 16 - 1040 / 690 = 14.49


def test_pv_grid_cheap_holds_battery_while_charging(ctl: Controller) -> None:
    ctl._last_mode = ChargeMode.PV_GRID
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=16, phases=3)
    d = ctl.decide(meas(5000, ch, price=0.10, battery_power=0, battery_soc=50), PV_GRID, 0)
    assert d.battery_mode == BatteryMode.HOLD


def test_price_unknown_is_never_cheap(ctl: Controller) -> None:
    ctl._last_mode = ChargeMode.PV_GRID
    s = replace(PV_GRID, block_battery_on_cheap_price=True)
    d = ctl.decide(meas(500, charger()), s, 0)
    assert not d.price_cheap and not d.enabled and d.battery_mode == BatteryMode.NORMAL


def test_cheap_price_switch_holds_without_ev(ctl: Controller) -> None:
    s = replace(PV, block_battery_on_cheap_price=True)
    d = ctl.decide(meas(500, charger(ChargerStatus.DISCONNECTED), price=0.1), s, 0)
    assert d.battery_mode == BatteryMode.HOLD


def test_main_fuse_limits_current(ctl: Controller) -> None:
    s = replace(PV, charge_mode=ChargeMode.NOW)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=16, phases=3)
    # L2 at 55 A incl. 16 A EV -> EV may draw 16 + (50 - 55) = 11 A
    d = ctl.decide(meas(20000, ch, grid_phase_current=(30, 55, 30)), s, 0)
    assert d.current == 11 and "main fuse L2" in d.status and d.fuse_headroom == -5


def test_main_fuse_blocks_below_min_with_hysteresis(ctl: Controller) -> None:
    s = replace(PV, charge_mode=ChargeMode.NOW)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=6, phases=3)
    d = ctl.decide(meas(20000, ch, grid_phase_current=(30, 51, 30)), s, 0)
    assert not d.enabled and "blocked by main fuse" in d.status
    off = charger(ChargerStatus.CONNECTED, enabled=False, phases=3)
    # 6.5 A headroom is not enough to resume (needs min + 1 A)
    assert not ctl.decide(meas(14000, off, grid_phase_current=(30, 43.5, 30)), s, 10).enabled
    assert ctl.decide(meas(14000, off, grid_phase_current=(30, 42, 30)), s, 20).enabled


def test_static_unbalance_caps_1p(ctl: Controller) -> None:
    s = replace(PV, phase_mode=PhaseMode.ONE, unbalance_mode=UnbalanceMode.STATIC)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=25)
    d = ctl.decide(meas(-3000, ch), s, 0)
    assert d.current == 20 and "unbalance L1" in d.status


def test_dynamic_unbalance_uses_pv_on_same_phase(ctl: Controller) -> None:
    s = replace(PV, phase_mode=PhaseMode.ONE, unbalance_mode=UnbalanceMode.DYNAMIC)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=20)  # 4600 W on L1
    # Sunny Boy exports 4000 W on L1: L1 = 4600 - 4000 + 200 house = 800 W
    m = meas(1200, ch, grid_phase_power=(800, 200, 200))
    d = ctl.decide(m, replace(s, max_current_1p=32), 0)
    # base L1 = -3800, others 200 -> EV may take 200 + 4600 + 3800 = 8600 W -> 37 A, capped at 32
    assert d.limit_current is not None and d.limit_current > 32


def test_dynamic_unbalance_with_pv_on_other_phase(ctl: Controller) -> None:
    s = replace(PV, phase_mode=PhaseMode.ONE, unbalance_mode=UnbalanceMode.DYNAMIC)
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=20)  # 4600 W on L1
    # Sunny Boy exports 4000 W on L2
    m = meas(-3000, ch, grid_phase_power=(4800, -3800, 200))
    d = ctl.decide(m, s, 0)
    # base L1 = 200, min other = -3800 -> EV may take -3800 + 4600 - 200 = 600 W
    assert not d.enabled and "unbalance L1" in d.status


def test_charger_phase_mapping(ctl: Controller) -> None:
    s = replace(
        PV,
        phase_mode=PhaseMode.ONE,
        unbalance_mode=UnbalanceMode.OFF,
        charger_grid_phase=3,
    )
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=16)
    d = ctl.decide(meas(-5000, ch, grid_phase_current=(0, 0, 45)), s, 0)
    assert "main fuse L3" in d.status and d.current == 21


# --- shadow mode: nothing is written, so the charger never follows the decisions ---


def test_shadow_enable_is_not_undone_next_tick(ctl: Controller) -> None:
    ctl._last_mode = ChargeMode.PV_GRID
    idle = charger(phases=3)  # stays disabled because nothing is written
    m = meas(500, idle, price=0.30)
    s = replace(PV_GRID, price_threshold=0.35)
    d = ctl.decide(m, s, 0)
    assert d.enabled
    for t in (10, 20, 30, 300):
        d = ctl.decide(m, s, t)
        assert d.enabled and d.pv_action != "enable", t


def test_shadow_pv_session_keeps_running(ctl: Controller) -> None:
    m = meas(-1500, charger())
    ctl.decide(m, PV, 0)
    assert ctl.decide(m, PV, 60).enabled
    d = ctl.decide(m, PV, 70)
    assert d.enabled and d.current == 6  # 1500 W / 230 V = 6.5 A


def test_shadow_phase_switch_completes(ctl: Controller) -> None:
    # session of ours on 1p; the real charger stays on 1p because nothing is written
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=32, phases=1)
    m = meas(-1500, ch)
    ctl.decide(m, PV, 0)
    d = ctl.decide(m, PV, 60)
    assert d.phases == 3 and "switching" in d.status
    d = ctl.decide(m, PV, 70)
    assert d.phases == 3 and d.status == "phase switch settling"
    d = ctl.decide(m, PV, 121)
    assert d.phases == 3 and "switching" not in d.status and d.status != "phase switch settling"


def test_shadow_ignores_ev_power_of_foreign_session(ctl: Controller) -> None:
    # evcc charges 1p at 10 A (2300 W) while our decision is "disabled"
    ctl._enabled, ctl._phases = False, 1
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=10)
    d = ctl.decide(meas(-500, ch), PV, 0)  # 2800 W available to a session of ours
    assert d.pv_action == "enable"


def test_restart_adopts_running_session(ctl: Controller) -> None:
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=10)
    d = ctl.decide(meas(-200, ch), PV, 0)
    assert d.enabled and d.pv_action != "enable"


# --- active mode: changes made outside the coordinator (go-e app) are adopted ---

ACTIVE = True


def _running_1p(ctl: Controller, s: Settings = PV) -> None:
    """A session of ours on 1p at 10 A, last written at t=0."""
    ch = charger(ChargerStatus.CHARGING, enabled=True, current=10)
    assert ctl.decide(meas(-200, ch), s, 0, ACTIVE).enabled
    ctl.notify_charger_command(0)


def test_active_app_disable_waits_for_command_settle(ctl: Controller) -> None:
    _running_1p(ctl)
    stopped = charger(enabled=False)  # app pressed stop
    d = ctl.decide(meas(-2000, stopped), PV, 30, ACTIVE)
    assert d.enabled  # our own write may still be in flight
    d = ctl.decide(meas(-2000, stopped), PV, 70, ACTIVE)
    assert not d.enabled and d.pv_action == "enable"  # adopted, normal enable delay
    assert ctl.decide(meas(-2000, stopped), PV, 130, ACTIVE).enabled


def test_active_app_disable_in_now_mode_reenables(ctl: Controller) -> None:
    s = replace(PV, charge_mode=ChargeMode.NOW)
    ctl._last_mode = ChargeMode.NOW
    _running_1p(ctl, s)
    d = ctl.decide(meas(500, charger(enabled=False, phases=3)), s, 70, ACTIVE)
    assert d.enabled and d.phases == 3


def test_active_app_phase_change_is_kept_in_auto(ctl: Controller) -> None:
    _running_1p(ctl)
    three = charger(ChargerStatus.CHARGING, enabled=True, current=6, phases=3)
    d = ctl.decide(meas(-1000, three), PV, 70, ACTIVE)  # 5140 W available >= 5000
    assert d.phases == 3 and "switching" not in d.status and d.phase_action == "inactive"


def test_active_app_phase_change_is_reverted_in_fixed_mode(ctl: Controller) -> None:
    s = replace(PV, phase_mode=PhaseMode.ONE)
    _running_1p(ctl, s)
    three = charger(ChargerStatus.CHARGING, enabled=True, current=6, phases=3)
    d = ctl.decide(meas(-1000, three), s, 70, ACTIVE)
    assert d.phases == 1 and d.current == 6 and "switching to 1p" in d.status


def test_shadow_never_adopts_app_changes(ctl: Controller) -> None:
    _running_1p(ctl)
    d = ctl.decide(meas(-2000, charger(enabled=False)), PV, 300)
    assert d.enabled


def test_resync_adopts_immediately(ctl: Controller) -> None:
    _running_1p(ctl)
    ctl.resync()  # active control switched on
    d = ctl.decide(meas(-200, charger(enabled=False)), PV, 10, ACTIVE)
    assert not d.enabled and d.status == "pv: waiting for surplus"


def test_site_power_published_without_vehicle(ctl: Controller) -> None:
    # 500 W import + 300 W battery discharge
    m = meas(500, charger(ChargerStatus.DISCONNECTED), battery_power=300, battery_soc=50)
    d = ctl.decide(m, PV, 0)
    assert d.status == "disconnected" and d.site_power == 800
    assert ctl.decide(m, replace(PV, charge_mode=ChargeMode.OFF), 10).site_power == 800
    assert ctl.decide(meas(500, ChargerState(available=False)), PV, 20).site_power == 500
