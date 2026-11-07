"""Constants for the charging coordinator."""

from __future__ import annotations

DOMAIN = "charging_coordinator"
NAME = "Charging Coordinator"

CONF_HYBRID_HOST = "hybrid_host"
CONF_HYBRID_PORT = "hybrid_port"
CONF_HYBRID_UNIT_ID = "hybrid_unit_id"
CONF_PV_INVERTER_HOST = "pv_inverter_host"
CONF_SHM2_SERIAL = "shm2_serial"
CONF_SHM2_INTERFACE = "shm2_interface"
CONF_GOE_TOPIC = "goe_topic"
CONF_PRICE_ENTITY = "price_entity"
CONF_CHARGER_GRID_PHASE = "charger_grid_phase"
CONF_BATTERY_MAX_CHARGE_POWER = "battery_max_charge_power"
CONF_BATTERY_MAX_DISCHARGE_POWER = "battery_max_discharge_power"
CONF_CONTROL_INTERVAL = "control_interval"

DEFAULT_PORT = 502
DEFAULT_UNIT_ID = 3
DEFAULT_GOE_TOPIC = "go-eCharger/"
DEFAULT_BATTERY_POWER = 5000
DEFAULT_CONTROL_INTERVAL = 10

SMA_POLL_INTERVAL = 5
SMA_STALE_AFTER = 30.0
