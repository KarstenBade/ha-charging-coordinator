"""Data models shared by the control logic and the Home Assistant layer.

Sign conventions (same as evcc):
- grid power / grid currents: positive = import, negative = export
- battery power: positive = discharging, negative = charging
- site power: negative = surplus
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum

NOMINAL_VOLTAGE = 230.0


class ChargeMode(StrEnum):
    OFF = "off"
    PV = "pv"
    PV_GRID = "pv_grid"
    NOW = "now"


class PhaseMode(StrEnum):
    AUTO = "auto"
    ONE = "1p"
    THREE = "3p"


class UnbalanceMode(StrEnum):
    DYNAMIC = "dynamic"
    STATIC = "static"
    OFF = "off"


class BatteryMode(StrEnum):
    NORMAL = "normal"
    HOLD = "hold"


class ChargerStatus(StrEnum):
    """IEC 61851 style vehicle status."""

    DISCONNECTED = "A"
    CONNECTED = "B"
    CHARGING = "C"


@dataclass(frozen=True)
class Settings:
    """User settings, mostly backed by number/select/switch entities."""

    charge_mode: ChargeMode = ChargeMode.PV
    phase_mode: PhaseMode = PhaseMode.AUTO
    unbalance_mode: UnbalanceMode = UnbalanceMode.STATIC

    block_battery_on_ev_grid_charge: bool = True
    block_battery_on_cheap_price: bool = False
    price_threshold: float = 0.20
    grid_charge_max_power: float = 11000.0

    min_current: float = 6.0
    max_current_1p: float = 32.0
    max_current_3p: float = 16.0
    phase_switch_up_power: float = 8000.0
    phase_switch_down_power: float = 5000.0

    # 0 = automatic thresholds (evcc defaults with solar share 1.0)
    enable_threshold: float = 0.0
    disable_threshold: float = 0.0
    enable_delay: float = 60.0
    disable_delay: float = 180.0

    residual_power: float = 0.0
    priority_soc: float = 0.0
    buffer_soc: float = 0.0
    buffer_start_soc: float = 0.0

    main_fuse_current: float = 50.0
    unbalance_max: float = 4600.0

    # hardware configuration (config flow)
    charger_grid_phase: int = 1  # grid phase (1..3) the charger's L1 is wired to
    battery_max_discharge_power: float | None = None


@dataclass(frozen=True)
class ChargerState:
    available: bool = False
    status: ChargerStatus = ChargerStatus.DISCONNECTED
    enabled: bool = False
    offered_current: float = 0.0
    phases: int = 3  # configured phases (1 or 3)
    power: float = 0.0
    # charger L1..L3 currents (charger wiring, not grid phases)
    phase_currents: tuple[float, float, float] = (0.0, 0.0, 0.0)

    @property
    def connected(self) -> bool:
        return self.status != ChargerStatus.DISCONNECTED

    @property
    def charging(self) -> bool:
        return self.status == ChargerStatus.CHARGING


@dataclass(frozen=True)
class Measurements:
    grid_power: float | None = None
    grid_phase_power: tuple[float, float, float] | None = None
    grid_phase_current: tuple[float, float, float] | None = None
    grid_phase_voltage: tuple[float, float, float] | None = None
    battery_power: float | None = None
    battery_soc: float | None = None
    price: float | None = None
    charger: ChargerState = field(default_factory=ChargerState)


@dataclass(frozen=True)
class Decision:
    valid: bool
    enabled: bool = False
    current: float = 0.0
    phases: int = 3
    battery_mode: BatteryMode = BatteryMode.NORMAL
    battery_reason: str | None = None
    status: str = ""

    site_power: float | None = None
    price_cheap: bool = False
    pv_action: str = "inactive"  # enable / disable / inactive
    pv_remaining: float = 0.0
    phase_action: str = "inactive"  # scale1p / scale3p / inactive
    phase_remaining: float = 0.0
    limit_current: float | None = None
    limit_reason: str | None = None
    fuse_headroom: float | None = None
    unbalance: float | None = None
