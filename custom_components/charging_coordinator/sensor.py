"""Coordinator state and device measurement sensors."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import (
    PERCENTAGE,
    EntityCategory,
    UnitOfElectricCurrent,
    UnitOfElectricPotential,
    UnitOfEnergy,
    UnitOfPower,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import ChargingCoordinatorConfigEntry
from .core.models import BatteryMode
from .entity import CoordinatorEntity
from .runtime import CoordinatorRuntime


@dataclass(frozen=True, kw_only=True)
class CoordinatorSensorDescription(SensorEntityDescription):
    value_fn: Callable[[CoordinatorRuntime], Any]
    attrs_fn: Callable[[CoordinatorRuntime], dict[str, Any]] | None = None


def _decision(attr: str) -> Callable[[CoordinatorRuntime], Any]:
    return lambda rt: getattr(rt.decision, attr) if rt.decision else None


def _meter(get: Callable[[Any], Any]) -> Callable[[CoordinatorRuntime], Any]:
    return lambda rt: get(rt.meter) if rt.meter else None


def _meter_phase(attr: str, phase: int) -> Callable[[CoordinatorRuntime], Any]:
    return lambda rt: getattr(rt.meter, attr)[phase] if rt.meter else None


def _hybrid(attr: str) -> Callable[[CoordinatorRuntime], Any]:
    return lambda rt: getattr(rt.hybrid_reading, attr) if rt.hybrid_reading else None


def _pv(attr: str) -> Callable[[CoordinatorRuntime], Any]:
    return lambda rt: getattr(rt.pv_reading, attr) if rt.pv_reading else None


def _status_attrs(rt: CoordinatorRuntime) -> dict[str, Any]:
    d = rt.decision
    attrs: dict[str, Any] = {"active_control": rt.active_control}
    if d is not None:
        attrs |= {
            "valid": d.valid,
            "enabled": d.enabled,
            "current": d.current,
            "phases": d.phases,
            "pv_action": d.pv_action,
            "phase_action": d.phase_action,
            "limit_reason": d.limit_reason,
            "limited": d.limited,
            "battery_reason": d.battery_reason,
        }
    return attrs


def _round(value: float | None, digits: int = 0) -> float | None:
    return None if value is None else round(value, digits)


W = UnitOfPower.WATT
A = UnitOfElectricCurrent.AMPERE
V = UnitOfElectricPotential.VOLT
KWH = UnitOfEnergy.KILO_WATT_HOUR
BATTERY_MODES = [m.value for m in BatteryMode]


def _power(
    key: str, fn: Callable[[CoordinatorRuntime], Any], diag: bool = False
) -> CoordinatorSensorDescription:
    return CoordinatorSensorDescription(
        key=key,
        native_unit_of_measurement=W,
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC if diag else None,
        value_fn=lambda rt: _round(fn(rt)),
    )


def _energy(key: str, fn: Callable[[CoordinatorRuntime], Any]) -> CoordinatorSensorDescription:
    return CoordinatorSensorDescription(
        key=key,
        native_unit_of_measurement=KWH,
        device_class=SensorDeviceClass.ENERGY,
        state_class=SensorStateClass.TOTAL_INCREASING,
        value_fn=lambda rt: _round(fn(rt), 3),
    )


def _phase(
    key: str,
    unit: str,
    device_class: SensorDeviceClass,
    fn: Callable[[CoordinatorRuntime], Any],
    digits: int,
) -> CoordinatorSensorDescription:
    return CoordinatorSensorDescription(
        key=key,
        native_unit_of_measurement=unit,
        device_class=device_class,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda rt: _round(fn(rt), digits),
    )


SENSORS: tuple[CoordinatorSensorDescription, ...] = (
    CoordinatorSensorDescription(
        key="status", value_fn=_decision("status"), attrs_fn=_status_attrs, icon="mdi:information"
    ),
    CoordinatorSensorDescription(
        key="target_current",
        native_unit_of_measurement=A,
        device_class=SensorDeviceClass.CURRENT,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=_decision("current"),
    ),
    CoordinatorSensorDescription(
        key="target_phases",
        state_class=SensorStateClass.MEASUREMENT,  # numeric, so graphs draw a line
        value_fn=_decision("phases"),
        icon="mdi:sine-wave",
    ),
    _power("site_power", _decision("site_power")),
    CoordinatorSensorDescription(
        key="battery_mode_target",
        device_class=SensorDeviceClass.ENUM,
        options=BATTERY_MODES,
        value_fn=lambda rt: rt.decision.battery_mode.value if rt.decision else None,
    ),
    CoordinatorSensorDescription(
        key="battery_mode_applied",
        device_class=SensorDeviceClass.ENUM,
        options=BATTERY_MODES,
        value_fn=lambda rt: rt.battery_mode_applied.value if rt.battery_mode_applied else None,
    ),
    CoordinatorSensorDescription(
        key="pv_timer_remaining",
        native_unit_of_measurement=UnitOfTime.SECONDS,
        device_class=SensorDeviceClass.DURATION,
        value_fn=lambda rt: _round(rt.decision.pv_remaining) if rt.decision else None,
        attrs_fn=lambda rt: {"action": rt.decision.pv_action if rt.decision else None},
    ),
    CoordinatorSensorDescription(
        key="phase_timer_remaining",
        native_unit_of_measurement=UnitOfTime.SECONDS,
        device_class=SensorDeviceClass.DURATION,
        value_fn=lambda rt: _round(rt.decision.phase_remaining) if rt.decision else None,
        attrs_fn=lambda rt: {"action": rt.decision.phase_action if rt.decision else None},
    ),
    CoordinatorSensorDescription(
        key="limit_current",
        native_unit_of_measurement=A,
        device_class=SensorDeviceClass.CURRENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda rt: _round(rt.decision.limit_current, 1) if rt.decision else None,
        attrs_fn=lambda rt: {"reason": rt.decision.limit_reason if rt.decision else None},
    ),
    CoordinatorSensorDescription(
        key="fuse_headroom",
        native_unit_of_measurement=A,
        device_class=SensorDeviceClass.CURRENT,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda rt: _round(rt.decision.fuse_headroom, 1) if rt.decision else None,
    ),
    _power("unbalance", _decision("unbalance"), diag=True),
    CoordinatorSensorDescription(
        key="price",
        # no unit: it is the same as price_threshold's, which is whatever the source uses
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=3,
        value_fn=lambda rt: rt.measurements.price,
        icon="mdi:currency-eur",
    ),
    _power("charger_power", lambda rt: rt.measurements.charger.power),
    _energy("charger_session_energy", lambda rt: rt.goe.data.session_energy),
    # SHM2
    _power("grid_power", _meter(lambda m: m.power)),
    *(
        _phase(
            f"grid_power_l{i + 1}",
            W,
            SensorDeviceClass.POWER,
            _meter_phase("phase_power", i),
            0,
        )
        for i in range(3)
    ),
    *(
        _phase(
            f"grid_current_l{i + 1}",
            A,
            SensorDeviceClass.CURRENT,
            _meter_phase("phase_current", i),
            2,
        )
        for i in range(3)
    ),
    *(
        _phase(
            f"grid_voltage_l{i + 1}",
            V,
            SensorDeviceClass.VOLTAGE,
            _meter_phase("phase_voltage", i),
            1,
        )
        for i in range(3)
    ),
    _energy("grid_energy_import", _meter(lambda m: m.energy_import)),
    _energy("grid_energy_export", _meter(lambda m: m.energy_export)),
    # STP SE
    _power("pv_dc_power", _hybrid("pv_power")),
    _power("battery_power", _hybrid("battery_power")),
    CoordinatorSensorDescription(
        key="battery_soc",
        native_unit_of_measurement=PERCENTAGE,
        device_class=SensorDeviceClass.BATTERY,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=_hybrid("battery_soc"),
    ),
    _energy("battery_charge_energy", _hybrid("battery_charge_energy")),
    _energy("battery_discharge_energy", _hybrid("battery_discharge_energy")),
    # Sunny Boy
    _power("pv_inverter_power", _pv("power")),
    _energy("pv_inverter_energy", _pv("energy")),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ChargingCoordinatorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    runtime = entry.runtime_data
    descriptions = [
        d for d in SENSORS if runtime.pv_inverter is not None or not d.key.startswith("pv_inverter")
    ]
    async_add_entities(CoordinatorSensor(runtime, d) for d in descriptions)


class CoordinatorSensor(CoordinatorEntity, SensorEntity):
    _entity_domain = "sensor"

    entity_description: CoordinatorSensorDescription

    @property
    def native_value(self) -> Any:
        return self.entity_description.value_fn(self.runtime)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if self.entity_description.attrs_fn is None:
            return None
        return self.entity_description.attrs_fn(self.runtime)
