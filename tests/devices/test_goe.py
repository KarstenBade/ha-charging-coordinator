from __future__ import annotations

from custom_components.charging_coordinator.core.models import ChargerStatus
from custom_components.charging_coordinator.devices.goe import GoeCharger, GoeValues

NRG = "[230,231,229,0,10.1,0,0,2323,0,0,0,2323,1,0,0,0]"


def test_charger_state_from_values() -> None:
    v = GoeValues()
    for key, payload in {"car": "2", "frc": "2", "amp": "10", "psm": "1", "nrg": NRG}.items():
        v.update(key, payload, 0)
    s = v.charger_state(1)
    assert s.available and s.status == ChargerStatus.CHARGING and s.enabled
    assert s.phases == 1 and s.offered_current == 10 and s.power == 2323
    assert s.phase_currents == (10.1, 0, 0)


def test_neutral_force_state_uses_alw() -> None:
    v = GoeValues()
    for key, payload in {"car": "3", "frc": "0", "alw": "false"}.items():
        v.update(key, payload, 0)
    assert not v.charger_state(0).enabled
    v.update("alw", "true", 0)
    assert v.charger_state(0).enabled


def test_missing_or_stale_is_unavailable() -> None:
    v = GoeValues()
    assert not v.charger_state(0).available
    v.update("car", "1", 0)
    assert v.charger_state(10).status == ChargerStatus.DISCONNECTED
    assert not v.charger_state(1000).available


async def test_apply_writes_only_changes_in_order() -> None:
    published: list[tuple[str, str]] = []

    async def publish(topic: str, payload: str) -> None:
        published.append((topic, payload))

    goe = GoeCharger("go-eCharger/123456/", publish)
    goe.handle_message("go-eCharger/123456/amp", "16")
    goe.handle_message("go-eCharger/123456/psm", "2")
    goe.handle_message("go-eCharger/123456/frc", "1")

    switched = await goe.apply(enabled=True, current=6, phases=1)
    assert switched
    assert published == [
        ("go-eCharger/123456/amp/set", "6"),
        ("go-eCharger/123456/psm/set", "1"),
        ("go-eCharger/123456/frc/set", "2"),
    ]
    published.clear()
    assert not await goe.apply(enabled=True, current=6, phases=1)
    assert published == []
    await goe.apply(enabled=False, current=0, phases=1)
    assert published == [("go-eCharger/123456/frc/set", "1")]
