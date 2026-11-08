"""End-to-end tests of setup, shadow mode, actuation and unload."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_mqtt_message,
)

from custom_components.charging_coordinator.const import DOMAIN
from custom_components.charging_coordinator.devices.shm2_speedwire import MeterSample

from ..devices.test_shm2 import datagram

TOPIC = "go-eCharger/123456"
CONFIG = {
    "hybrid_host": "192.168.1.10",
    "hybrid_port": 502,
    "hybrid_unit_id": 3,
    "goe_topic": TOPIC,
    "price_entity": "sensor.price",
    "charger_grid_phase": 1,
    "battery_max_charge_power": 5000,
    "battery_max_discharge_power": 5000,
    "control_interval": 10,
}


def goe_state(hass: HomeAssistant, **values: Any) -> None:
    for key, value in values.items():
        async_fire_mqtt_message(hass, f"{TOPIC}/{key}", str(value))


def set_topics(mqtt_mock: MagicMock) -> list[tuple[str, str]]:
    return [
        (c.args[0], c.args[1])
        for c in mqtt_mock.async_publish.call_args_list
        if c.args[0].endswith("/set")
    ]


async def setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, data=CONFIG, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def feed_and_tick(hass: HomeAssistant, entry: MockConfigEntry, grid: float) -> None:
    rt = entry.runtime_data
    p_import, p_export = (grid, 0) if grid >= 0 else (0, -grid)
    rt.shm2.datagram_received(datagram(p_import=p_import, p_export=p_export), ("x", 0))
    await rt._async_tick()
    await hass.async_block_till_done()


async def test_config_flow_creates_entry(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    user_input = {**CONFIG, "goe_topic": TOPIC + "/", "charger_grid_phase": "2"}
    result = await hass.config_entries.flow.async_configure(result["flow_id"], user_input)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"]["goe_topic"] == TOPIC
    assert result["data"]["charger_grid_phase"] == 2


async def test_config_flow_rejects_topic_without_serial(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**CONFIG, "goe_topic": "go-eCharger/", "charger_grid_phase": "1"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"goe_topic": "invalid_topic"}


async def test_shadow_mode_computes_but_writes_nothing(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    hass.states.async_set("sensor.price", "0.30")
    entry = await setup(hass)
    assert hass.states.get("switch.charging_coordinator_active_control").state == "off"
    assert hass.states.get("select.charging_coordinator_charge_mode").state == "pv"

    goe_state(hass, car=3, frc=1, amp=6, psm=1, nrg="[230,230,230,0,0,0,0,0,0,0,0,0,0,0,0,0]")
    await hass.async_block_till_done()
    await feed_and_tick(hass, entry, grid=-3000)

    assert hass.states.get("binary_sensor.charging_coordinator_target_enabled").state == "on"
    assert hass.states.get("sensor.charging_coordinator_target_phases").state == "1"
    assert hass.states.get("sensor.charging_coordinator_grid_power").state == "-3000.0"
    assert hass.states.get("sensor.charging_coordinator_battery_soc").state == "60.0"
    assert hass.states.get("sensor.charging_coordinator_pv_dc_power").state == "3000.0"
    assert hass.states.get("select.charging_coordinator_unbalance_mode").state == "static"
    assert set_topics(mqtt_mock) == []
    mock_devices["write_u32"].assert_not_called()


async def test_active_control_writes_charger_and_battery(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    hass.states.async_set("sensor.price", "0.10")
    entry = await setup(hass)
    goe_state(hass, car=3, frc=1, amp=16, psm=2, nrg="[230,230,230,0,0,0,0,0,0,0,0,0,0,0,0,0]")
    await hass.async_block_till_done()

    await hass.services.async_call(
        "select",
        "select_option",
        {"entity_id": "select.charging_coordinator_charge_mode", "option": "now"},
        blocking=True,
    )
    await hass.services.async_call(
        "switch",
        "turn_on",
        {"entity_id": "switch.charging_coordinator_active_control"},
        blocking=True,
    )
    await feed_and_tick(hass, entry, grid=500)

    assert (f"{TOPIC}/frc/set", "2") in set_topics(mqtt_mock)
    # not charging yet -> battery stays normal, written once to clear stale holds
    written = [c.args for c in mock_devices["write_u32"].call_args_list]
    assert (40799, 5000) in written

    # vehicle starts charging -> battery hold
    mock_devices["write_u32"].reset_mock()
    goe_state(hass, car=2, nrg="[230,230,230,0,16,16,16,3680,3680,3680,0,11040,1,1,1,0]")
    await hass.async_block_till_done()
    await feed_and_tick(hass, entry, grid=11500)
    written = [c.args for c in mock_devices["write_u32"].call_args_list]
    assert (40799, 0) in written
    assert hass.states.get("binary_sensor.charging_coordinator_battery_hold").state == "on"

    # unloading releases the battery
    mock_devices["write_u32"].reset_mock()
    assert await hass.config_entries.async_unload(entry.entry_id)
    written = [c.args for c in mock_devices["write_u32"].call_args_list]
    assert (40799, 5000) in written


async def test_settings_are_restored_into_runtime(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    entry = await setup(hass)
    await hass.services.async_call(
        "number",
        "set_value",
        {"entity_id": "number.charging_coordinator_price_threshold", "value": 0.15},
        blocking=True,
    )
    assert entry.runtime_data.settings.price_threshold == 0.15
    assert isinstance(MeterSample, type)


async def test_battery_untouched_until_first_valid_decision(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    hass.states.async_set("sensor.price", "0.10")
    entry = await setup(hass)
    rt = entry.runtime_data

    # active control comes back on after a restart: no meter data yet, decision invalid
    await hass.services.async_call(
        "switch",
        "turn_on",
        {"entity_id": "switch.charging_coordinator_active_control"},
        blocking=True,
    )
    assert rt.decision is not None and not rt.decision.valid
    mock_devices["write_u32"].assert_not_called()

    # still no valid data after the grace time: fall back to normal (clears stale holds)
    rt._battery_wait_until = 0.0
    await rt._async_tick()
    written = [c.args for c in mock_devices["write_u32"].call_args_list]
    assert (40799, 5000) in written
