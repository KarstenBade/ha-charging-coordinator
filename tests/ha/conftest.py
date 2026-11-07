"""Fixtures for Home Assistant integration tests (need .venv-ha, Python 3.13)."""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import AsyncMock, patch

import pytest

pytest.importorskip("pytest_homeassistant_custom_component")

from custom_components.charging_coordinator.devices.sma_modbus import (
    HybridReading,
)

HYBRID = HybridReading(
    battery_soc=60.0,
    battery_power=0.0,
    pv_power=3000.0,
    battery_charge_energy=100.0,
    battery_discharge_energy=90.0,
)


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    return None


@pytest.fixture
def mock_devices() -> Generator[dict[str, AsyncMock]]:
    """Patch all network access of the device drivers."""
    with (
        patch(
            "custom_components.charging_coordinator.runtime.Shm2Listener.start", AsyncMock()
        ) as shm2_start,
        patch(
            "custom_components.charging_coordinator.runtime.read_hybrid",
            AsyncMock(return_value=HYBRID),
        ) as read_hybrid,
        patch(
            "custom_components.charging_coordinator.config_flow.read_hybrid",
            AsyncMock(return_value=HYBRID),
        ) as flow_read_hybrid,
        patch(
            "custom_components.charging_coordinator.devices.sma_modbus.SmaModbusClient.write_u32",
            AsyncMock(),
        ) as write_u32,
    ):
        yield {
            "shm2_start": shm2_start,
            "read_hybrid": read_hybrid,
            "flow_read_hybrid": flow_read_hybrid,
            "write_u32": write_u32,
        }
