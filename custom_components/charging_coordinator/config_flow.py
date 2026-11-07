"""Config and options flow."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
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
    DEFAULT_BATTERY_POWER,
    DEFAULT_CONTROL_INTERVAL,
    DEFAULT_GOE_TOPIC,
    DEFAULT_PORT,
    DEFAULT_UNIT_ID,
    DOMAIN,
    NAME,
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
