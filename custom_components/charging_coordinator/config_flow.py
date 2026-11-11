"""Config and options flow."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    OptionsFlow,
    SubentryFlowResult,
)
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_BATTERY_MAX_CHARGE_POWER,
    CONF_BATTERY_MAX_DISCHARGE_POWER,
    CONF_CHARGER_GRID_PHASE,
    CONF_CONTROL_INTERVAL,
    CONF_GOE_TOPIC,
    CONF_HYBRID_HOST,
    CONF_HYBRID_PORT,
    CONF_HYBRID_UNIT_ID,
    CONF_PRICE_ENTITY,
    CONF_PV_INVERTER_HOST,
    CONF_SHM2_INTERFACE,
    CONF_SHM2_SERIAL,
    CONF_VEHICLE_CONNECTED,
    CONF_VEHICLE_IMAGE_ENTITY,
    CONF_VEHICLE_NAME,
    CONF_VEHICLE_RANGE,
    CONF_VEHICLE_SOC,
    CONF_VEHICLE_TARGET_SOC,
    DEFAULT_BATTERY_POWER,
    DEFAULT_CONTROL_INTERVAL,
    DEFAULT_GOE_TOPIC,
    DEFAULT_PORT,
    DEFAULT_UNIT_ID,
    DOMAIN,
    NAME,
    SUBENTRY_VEHICLE,
)
from .devices.sma_modbus import ModbusError, SmaModbusClient, read_hybrid


def _number(
    min_value: int, max_value: int, step: int = 1, unit: str | None = None
) -> selector.NumberSelector:
    config = selector.NumberSelectorConfig(
        min=min_value, max=max_value, step=step, mode=selector.NumberSelectorMode.BOX
    )
    if unit is not None:
        config["unit_of_measurement"] = unit
    return selector.NumberSelector(config)


def _schema(defaults: dict[str, Any]) -> vol.Schema:
    def opt(key: str, default: Any = None) -> vol.Optional:
        value = defaults.get(key, default)
        return vol.Optional(key, description={"suggested_value": value} if value else None)

    return vol.Schema(
        {
            vol.Required(
                CONF_HYBRID_HOST, default=defaults.get(CONF_HYBRID_HOST, vol.UNDEFINED)
            ): str,
            vol.Required(
                CONF_HYBRID_PORT, default=defaults.get(CONF_HYBRID_PORT, DEFAULT_PORT)
            ): _number(1, 65535),
            vol.Required(
                CONF_HYBRID_UNIT_ID, default=defaults.get(CONF_HYBRID_UNIT_ID, DEFAULT_UNIT_ID)
            ): _number(1, 247),
            opt(CONF_PV_INVERTER_HOST): str,
            opt(CONF_SHM2_SERIAL): str,
            opt(CONF_SHM2_INTERFACE): str,
            vol.Required(
                CONF_GOE_TOPIC, default=defaults.get(CONF_GOE_TOPIC, DEFAULT_GOE_TOPIC)
            ): str,
            vol.Required(
                CONF_PRICE_ENTITY, default=defaults.get(CONF_PRICE_ENTITY, vol.UNDEFINED)
            ): selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor")),
            vol.Required(
                CONF_CHARGER_GRID_PHASE, default=str(defaults.get(CONF_CHARGER_GRID_PHASE, 1))
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=["1", "2", "3"], translation_key=CONF_CHARGER_GRID_PHASE
                )
            ),
            vol.Required(
                CONF_BATTERY_MAX_CHARGE_POWER,
                default=defaults.get(CONF_BATTERY_MAX_CHARGE_POWER, DEFAULT_BATTERY_POWER),
            ): _number(0, 20000, 100, "W"),
            vol.Required(
                CONF_BATTERY_MAX_DISCHARGE_POWER,
                default=defaults.get(CONF_BATTERY_MAX_DISCHARGE_POWER, DEFAULT_BATTERY_POWER),
            ): _number(0, 20000, 100, "W"),
            vol.Required(
                CONF_CONTROL_INTERVAL,
                default=defaults.get(CONF_CONTROL_INTERVAL, DEFAULT_CONTROL_INTERVAL),
            ): _number(5, 60, 1, "s"),
        }
    )


def _normalize(data: dict[str, Any]) -> dict[str, Any]:
    out = dict(data)
    for key in (
        CONF_HYBRID_PORT,
        CONF_HYBRID_UNIT_ID,
        CONF_CHARGER_GRID_PHASE,
        CONF_BATTERY_MAX_CHARGE_POWER,
        CONF_BATTERY_MAX_DISCHARGE_POWER,
        CONF_CONTROL_INTERVAL,
    ):
        out[key] = int(float(out[key]))
    out[CONF_GOE_TOPIC] = out[CONF_GOE_TOPIC].strip().rstrip("/")
    return out


async def _validate(data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    serial = data.get(CONF_SHM2_SERIAL)
    if serial and not str(serial).isdigit():
        errors[CONF_SHM2_SERIAL] = "invalid_serial"
    if data[CONF_GOE_TOPIC].count("/") < 1 or data[CONF_GOE_TOPIC].endswith("go-eCharger"):
        errors[CONF_GOE_TOPIC] = "invalid_topic"

    client = SmaModbusClient(
        data[CONF_HYBRID_HOST], data[CONF_HYBRID_PORT], data[CONF_HYBRID_UNIT_ID]
    )
    try:
        await read_hybrid(client)
    except ModbusError:
        errors[CONF_HYBRID_HOST] = "cannot_connect"
    finally:
        client.close()
    return errors


class ChargingCoordinatorConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        errors: dict[str, str] = {}
        if user_input is not None:
            data = _normalize(user_input)
            errors = await _validate(data)
            if not errors:
                return self.async_create_entry(title=NAME, data=data)
        return self.async_show_form(
            step_id="user", data_schema=_schema(user_input or {}), errors=errors
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return ChargingCoordinatorOptionsFlow()

    @classmethod
    @callback
    def async_get_supported_subentry_types(
        cls, config_entry: ConfigEntry
    ) -> dict[str, type[ConfigSubentryFlow]]:
        return {SUBENTRY_VEHICLE: VehicleSubentryFlow}


class ChargingCoordinatorOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            data = _normalize(user_input)
            errors = await _validate(data)
            if not errors:
                return self.async_create_entry(data=data)
        defaults = {**self.config_entry.data, **self.config_entry.options, **(user_input or {})}
        return self.async_show_form(step_id="init", data_schema=_schema(defaults), errors=errors)


def _vehicle_schema(defaults: dict[str, Any]) -> vol.Schema:
    def req(key: str) -> vol.Required:
        return vol.Required(key, default=defaults.get(key, vol.UNDEFINED))

    def opt(key: str) -> vol.Optional:
        value = defaults.get(key)
        return vol.Optional(key, description={"suggested_value": value} if value else None)

    def entity(*domains: str) -> selector.EntitySelector:
        return selector.EntitySelector(selector.EntitySelectorConfig(domain=list(domains)))

    return vol.Schema(
        {
            req(CONF_VEHICLE_NAME): selector.TextSelector(),
            req(CONF_VEHICLE_SOC): entity("sensor", "input_number"),
            req(CONF_VEHICLE_CONNECTED): selector.TemplateSelector(),
            opt(CONF_VEHICLE_TARGET_SOC): entity("sensor", "number", "input_number"),
            opt(CONF_VEHICLE_RANGE): entity("sensor"),
            opt(CONF_VEHICLE_IMAGE_ENTITY): entity("image", "camera"),
        }
    )


class VehicleSubentryFlow(ConfigSubentryFlow):
    """Add or change a car: its entities and the template that says it is plugged in."""

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            data, errors = self._validate(user_input, None)
            if not errors:
                return self.async_create_entry(title=data.pop(CONF_VEHICLE_NAME), data=data)
        return self.async_show_form(
            step_id="user", data_schema=_vehicle_schema(user_input or {}), errors=errors
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        errors: dict[str, str] = {}
        if user_input is not None:
            data, errors = self._validate(user_input, subentry.subentry_id)
            if not errors:
                title = data.pop(CONF_VEHICLE_NAME)
                return self.async_update_and_abort(
                    self._get_entry(), subentry, title=title, data=data
                )
        defaults = user_input or {CONF_VEHICLE_NAME: subentry.title, **subentry.data}
        return self.async_show_form(
            step_id="reconfigure", data_schema=_vehicle_schema(defaults), errors=errors
        )

    def _validate(
        self, user_input: dict[str, Any], own_id: str | None
    ) -> tuple[dict[str, Any], dict[str, str]]:
        stripped = {k: v.strip() if isinstance(v, str) else v for k, v in user_input.items()}
        data = {k: v for k, v in stripped.items() if v}
        errors: dict[str, str] = {}
        name = data.get(CONF_VEHICLE_NAME, "")
        others = (
            sub.title.casefold()
            for sub in self._get_entry().subentries.values()
            if sub.subentry_type == SUBENTRY_VEHICLE and sub.subentry_id != own_id
        )
        if not name:
            errors[CONF_VEHICLE_NAME] = "name_required"
        elif name.casefold() in others:
            errors[CONF_VEHICLE_NAME] = "name_exists"
        return data, errors
