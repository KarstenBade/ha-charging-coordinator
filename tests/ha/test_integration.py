"""End-to-end tests of setup, shadow mode, actuation and unload."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock

from freezegun.api import FrozenDateTimeFactory
from homeassistant import config_entries
from homeassistant.core import HomeAssistant, State
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_mqtt_message,
    mock_restore_cache,
)

from custom_components.charging_coordinator.const import DOMAIN
from custom_components.charging_coordinator.devices.shm2_speedwire import MeterSample
from custom_components.charging_coordinator.vehicles import (
    IMAGE_UPLOAD_MEDIA,
    media_value,
    picture_url,
)

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
    assert hass.states.get("select.charging_coordinator_charge_mode").state == "smart"

    goe_state(hass, car=3, frc=1, amp=6, psm=1, nrg="[230,230,230,0,0,0,0,0,0,0,0,0,0,0,0,0]")
    await hass.async_block_till_done()
    await feed_and_tick(hass, entry, grid=-3000)

    assert hass.states.get("binary_sensor.charging_coordinator_target_enabled").state == "on"
    assert hass.states.get("sensor.charging_coordinator_target_phases").state == "1"
    assert hass.states.get("sensor.charging_coordinator_grid_power").state == "-3000.0"
    assert hass.states.get("sensor.charging_coordinator_battery_soc").state == "60.0"
    assert hass.states.get("sensor.charging_coordinator_pv_dc_power").state == "3000.0"
    assert hass.states.get("select.charging_coordinator_unbalance_mode").state == "static"
    # the price card finds the forecast through the source price sensor
    price = hass.states.get("sensor.charging_coordinator_price")
    assert price.state == "0.3"
    assert price.attributes["source"] == "sensor.price"
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


async def test_charger_values_unknown_until_charger_data(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    entry = await setup(hass)
    await feed_and_tick(hass, entry, grid=10000)  # meter data, but no go-e message yet

    assert hass.states.get("sensor.charging_coordinator_status").state == "charger unavailable"
    for entity_id in (
        "sensor.charging_coordinator_charger_power",
        "binary_sensor.charging_coordinator_vehicle_connected",
        "binary_sensor.charging_coordinator_target_enabled",
        "sensor.charging_coordinator_target_current",
        "sensor.charging_coordinator_target_phases",
    ):
        assert hass.states.get(entity_id).state == "unknown", entity_id
    assert hass.states.get("sensor.charging_coordinator_site_power").state == "10000.0"


def vehicle(sub_id: str, name: str, flag: str, picture: dict[str, str]) -> dict[str, Any]:
    return {
        "subentry_id": sub_id,
        "subentry_type": "vehicle",
        "title": name,
        "unique_id": None,
        "data": {
            "soc_entity": f"sensor.{flag}_soc",
            "connected_template": f"{{{{ is_state('input_boolean.{flag}_plugged', 'on') }}}}",
            **picture,
        },
    }


async def setup_with_vehicles(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN,
        data=CONFIG,
        unique_id=DOMAIN,
        subentries_data=[
            # a picture URL, and an image entity
            vehicle("sub3", "ID.3", "id3", {"image": "/local/id3.png"}),
            vehicle("sub7", "ID.7", "id7", {"image_entity": "image.id7"}),
        ],
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_newest_connected_template_wins(
    hass: HomeAssistant,
    mqtt_mock: MagicMock,
    mock_devices: dict[str, AsyncMock],
    freezer: FrozenDateTimeFactory,
) -> None:
    hass.states.async_set("image.id7", "2026-11-11", {"entity_picture": "/api/image_proxy/x"})
    entry = await setup_with_vehicles(hass)
    goe_state(hass, car=3, frc=1, amp=6, psm=1, nrg="[230,230,230,0,0,0,0,0,0,0,0,0,0,0,0,0]")
    await hass.async_block_till_done()
    await feed_and_tick(hass, entry, grid=500)
    sensor = "sensor.charging_coordinator_connected_vehicle"
    id7 = hass.states.get("binary_sensor.charging_coordinator_id_7_connected")
    assert id7.attributes["entity_picture"] == "/api/image_proxy/x"
    assert hass.states.get(sensor).state == "none"

    hass.states.async_set("input_boolean.id3_plugged", "on")
    await hass.async_block_till_done()
    assert hass.states.get(sensor).state == "ID.3"
    id3 = hass.states.get("binary_sensor.charging_coordinator_id_3_connected")
    assert id3.state == "on" and id3.attributes["entity_picture"] == "/local/id3.png"

    # Tibber still reports the ID.3 as plugged in when the ID.7 arrives
    freezer.tick(60)
    hass.states.async_set("input_boolean.id7_plugged", "on")
    await hass.async_block_till_done()
    assert hass.states.get(sensor).state == "ID.7"
    cars = hass.states.get(sensor).attributes["vehicles"]
    assert [(c["name"], c["connected"]) for c in cars] == [("ID.3", True), ("ID.7", True)]
    assert cars[1]["soc_entity"] == "sensor.id7_soc"
    assert cars[1]["image_entity"] == "image.id7"

    hass.states.async_set("input_boolean.id7_plugged", "off")
    await hass.async_block_till_done()
    assert hass.states.get(sensor).state == "ID.3"

    goe_state(hass, car=1)  # no cable at the charger: no car, whatever the templates say
    await hass.async_block_till_done()
    await feed_and_tick(hass, entry, grid=500)
    assert hass.states.get(sensor).state == "none"
    assert hass.states.get("binary_sensor.charging_coordinator_id_3_connected").state == "on"


async def test_connected_since_survives_a_restart(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    hass.states.async_set("input_boolean.id3_plugged", "on")
    hass.states.async_set("input_boolean.id7_plugged", "on")
    mock_restore_cache(
        hass,
        [
            State(
                "binary_sensor.charging_coordinator_id_3_connected",
                "on",
                {"connected_since": "2026-11-10T20:00:00+00:00"},
            ),
            State(
                "binary_sensor.charging_coordinator_id_7_connected",
                "on",
                {"connected_since": "2026-11-11T07:00:00+00:00"},
            ),
        ],
    )
    entry = await setup_with_vehicles(hass)
    goe_state(hass, car=2)
    await hass.async_block_till_done()
    await feed_and_tick(hass, entry, grid=500)
    assert hass.states.get("sensor.charging_coordinator_connected_vehicle").state == "ID.7"


async def test_legacy_charge_mode_is_migrated(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    mock_restore_cache(hass, [State("select.charging_coordinator_charge_mode", "pv_grid")])
    entry = await setup(hass)
    settings = entry.runtime_data.settings
    assert settings.charge_mode == "smart" and settings.smart_pv and settings.smart_price
    await feed_and_tick(hass, entry, grid=500)
    assert hass.states.get("select.charging_coordinator_charge_mode").state == "smart"
    assert hass.states.get("switch.charging_coordinator_smart_price").state == "on"


async def test_old_connected_vehicle_text_entity_is_removed(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    entry = MockConfigEntry(domain=DOMAIN, data=CONFIG, unique_id=DOMAIN)
    entry.add_to_hass(hass)
    registry = er.async_get(hass)
    registry.async_get_or_create(
        "text", DOMAIN, f"{entry.entry_id}_connected_vehicle", config_entry=entry
    )
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert (
        registry.async_get_entity_id("text", DOMAIN, f"{entry.entry_id}_connected_vehicle") is None
    )


async def test_vehicle_subentry_flow(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    entry = await setup_with_vehicles(hass)
    result = await hass.config_entries.subentries.async_init(
        (entry.entry_id, "vehicle"), context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    user_input = {
        "name": "id.3",
        "soc_entity": "sensor.e_up_soc",
        "connected_template": "{{ true }}",
    }
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], user_input)
    assert result["errors"] == {"name": "name_exists"}

    picked = {"media_content_id": f"{IMAGE_UPLOAD_MEDIA}abc", "media_content_type": "image/png"}
    user_input |= {"name": " e-up! ", "image": picked}
    result = await hass.config_entries.subentries.async_configure(result["flow_id"], user_input)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    created = [s for s in entry.subentries.values() if s.title == "e-up!"]
    assert len(created) == 1
    assert created[0].data == {
        "soc_entity": "sensor.e_up_soc",
        "connected_template": "{{ true }}",
        "image": picked,
    }
    cars = hass.states.get("sensor.charging_coordinator_connected_vehicle").attributes["vehicles"]
    assert cars[-1]["image"] == "/api/image/serve/abc/512x512"


async def test_reconfigure_keeps_a_picture_url_as_media(
    hass: HomeAssistant, mqtt_mock: MagicMock, mock_devices: dict[str, AsyncMock]
) -> None:
    entry = MockConfigEntry(
        domain=DOMAIN,
        data=CONFIG,
        unique_id=DOMAIN,
        subentries_data=[vehicle("sub3", "ID.3", "id3", {"image": "/api/image/serve/abc/512x512"})],
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    result = await entry.start_subentry_reconfigure_flow(hass, "sub3")
    image_key = next(k for k in result["data_schema"].schema if k == "image")
    assert image_key.description == {
        "suggested_value": {
            "media_content_id": f"{IMAGE_UPLOAD_MEDIA}abc",
            "media_content_type": "image",
        }
    }


def test_picture_urls() -> None:
    assert picture_url(f"{IMAGE_UPLOAD_MEDIA}abc") == "/api/image/serve/abc/512x512"
    # My media needs a signed URL, which the cards ask for
    assert picture_url("media-source://media_source/local/id7.png") is None
    assert picture_url("/local/id7.png") == "/local/id7.png"
    assert media_value("/local/id7.png") is None
