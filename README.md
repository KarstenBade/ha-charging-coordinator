# Charging Coordinator

A Home Assistant custom integration that coordinates EV charging with PV surplus, electricity price and a home battery. It replaces evcc for this setup:

- **Hybrid inverter:** SMA Sunny Tripower Smart Energy (STP SE) with battery, controlled over Modbus TCP
- **PV inverter (optional):** SMA Sunny Boy, read over Modbus TCP
- **Grid meter:** SMA Sunny Home Manager 2.0, read from its Speedwire multicast (about 1 s)
- **Wallbox:** go-eCharger V3/V4/Gemini, controlled over its MQTT API v2
- **Price:** any HA sensor with the current electricity price

The control logic follows evcc's proven algorithms (surplus calculation, enable/disable timers, battery priority SoCs, battery hold), but this integration owns it.

## Features

| Charge mode | Behavior |
|---|---|
| `off` | Charger disabled |
| `pv` | Surplus charging with enable/disable delays and automatic 1p/3p switching |
| `pv_grid` | Like `pv`. When price ≤ threshold, also charges from the grid; total grid import is capped at `grid_charge_max_power` |
| `now` | Maximum current (3p in auto phase mode) |

- **Home battery priority (evcc model):**
  - `priority_soc`: below it, PV charges the battery first.
  - `buffer_soc`: above it, the battery may keep a running session at minimum current.
  - `buffer_start_soc`: above it, the battery may start a session at minimum current.
- **Battery discharge block (hold), via SMA Modbus registers 40236/40793–40801 with a 30 s keep-alive:**
  - While the EV charges from the grid (`now`, or `pv_grid` with a cheap price). Switch `block_battery_on_ev_grid_charge`.
  - Optionally whenever price ≤ threshold, even without an EV. Switch `block_battery_on_cheap_price`.
- **Phase switching:** `auto` / `1p` / `3p`, with configurable switch-up and switch-down power. Unbalanced-load limits only cap the 1p current; they never trigger a switch.
- **Protection:**
  - Per-phase main fuse limit, applied in every mode.
  - Unbalanced-load limit with three modes:
    - `dynamic`: measured at the grid connection point via the SHM2 per-phase power. A single-phase PV inverter on the same phase is counted automatically.
    - `static`: `unbalance_max / 230 V`
    - `off`
- **Shadow mode:** with `switch.charging_coordinator_active_control` off, every decision is computed and published but nothing is written. Use it to compare against evcc before cutover.
- **Lovelace card** `custom:charging-coordinator-card`, bundled and registered automatically, plus an [example dashboard](examples/dashboard.yaml).

## Prerequisites

1. **Modbus TCP** enabled on the STP SE (and on the Sunny Boy, if you use it). This needs installer access in the inverter web UI. SMA unit ID is 3.
2. **Forecast-based charging** switched **off** in the Sunny Portal. Otherwise it conflicts with the battery control.
3. **SHM2 multicast** (239.12.255.254:9522) must reach the HA host: same L2 network, no IGMP filtering.
4. **go-eCharger MQTT** (API v2) enabled and connected to the broker used by HA's MQTT integration. Topic prefix is e.g. `go-eCharger/123456`.
5. **Before cutover**, evcc must stop writing to the go-e and the STP SE. evcc reading in parallel is fine.

## Installation

- **HACS:** add this repository as a custom repository (category *Integration*) and install.
- **Manual:** copy `custom_components/charging_coordinator` into your HA `config/custom_components`.

Then restart HA and add *Charging Coordinator* under *Settings → Devices & services*.

| Config field | Meaning |
|---|---|
| Hybrid inverter host / port / unit ID | STP SE Modbus TCP (502 / 3) |
| PV inverter host | Optional Sunny Boy, for display only |
| SHM2 serial | Only datagrams from this meter are used; leave empty to accept any |
| Multicast interface IP | Optional local interface for the multicast membership |
| go-eCharger MQTT topic prefix | e.g. `go-eCharger/123456` |
| Electricity price sensor | Current price, same unit as `price_threshold` |
| Grid phase of charger L1 | Grid phase the charger uses on 1p. L2/L3 are assumed to follow in rotation |
| Battery max charge/discharge power | Written to the inverter. Normal mode writes the discharge value, so don't set it below what the inverter supports |
| Control interval | Default 10 s |

For fixed time-of-use tariffs, create a template sensor that outputs the current price.

## Rollout

1. **Install** and leave `active_control` **off** (shadow mode). Compare `sensor.charging_coordinator_status`, the target current/phases and the battery mode target with evcc for a few days.
2. **Calibrate the phase mapping:** start a 1p session and check which `grid_power_lX` rises. Set *Grid phase of charger L1* accordingly.
3. **Verify the battery hold once by hand:**
   1. Disable evcc's battery control.
   2. Turn `active_control` on, set mode `now` and plug in.
   3. `sensor.charging_coordinator_battery_power` should go to ~0 W (or negative) while charging.
4. **Keep-alive fallback test:** while a hold is active, stop HA (or block port 502) and measure how long the STP SE takes to return to normal discharge. This tells you what happens if HA crashes during a hold.
5. **Cutover:**
   1. Remove the charger and battery control from evcc (or stop evcc).
   2. Turn `active_control` on.

When `active_control` is switched off or the integration unloads, the battery is reset to normal. The go-e keeps its last state.

## How the control works

Each tick, the following steps run:
1. Read the averaged SHM2 values since the last tick, the latest STP SE values (polled every 5 s), the go-e MQTT state and the price.
2. `site_power = grid + battery_power + residual_power`. Negative means surplus; battery discharge counts as import. Below `priority_soc`, battery charging is not counted as surplus.
3. Decide with the mode logic in `core/controller.py`:
   - PV enable/disable timers with defaults 60 s / 180 s.
   - An elapsed timer right after plug-in or a price edge, so the first decision isn't delayed.
   - Phase timers using the same delays.
   - A 60 s settle time after a phase switch.
4. Apply the fuse and unbalance limits (`core/limits.py`) and decide the battery mode (`core/battery_policy.py`).
5. In active mode, write the changes:
   - go-e: `amp`, `psm`, `frc` over MQTT `…/set`.
   - Battery: mode over Modbus.

**Changes made in the go-e app** (start/stop, phases) are adopted in active mode, as evcc does, once the coordinator's own last `frc`/`psm` write is more than 60 s old. The normal logic then decides from the new state: in `pv`, a stopped session restarts only after the enable delay if there is surplus. An app phase change stays in `auto` until the phase timer decides otherwise, and is switched back right away if the phase mode is fixed. In shadow mode the coordinator keeps its own decisions and never reads them back. Switching `active_control` on adopts the charger's current state first.

`sensor.charging_coordinator_status` explains every decision, for example `pv: enabling in 42 s` or `now: 3p max power, limited by main fuse L2`.

## Development

```bash
python3.12 -m venv .venv && .venv/bin/pip install pytest pytest-asyncio ruff mypy pymodbus
.venv/bin/pytest tests/core tests/devices      # pure logic + drivers
```

The HA integration tests need Python 3.13 and `pytest-homeassistant-custom-component`:

```bash
uv venv --python 3.13 .venv-ha && VIRTUAL_ENV=.venv-ha uv pip install pytest-homeassistant-custom-component "pymodbus>=3.10" mypy
.venv-ha/bin/python -m pytest tests
.venv-ha/bin/mypy
```

Card:

```bash
cd frontend && npm install && npm run build   # writes custom_components/charging_coordinator/www/
```

`core/` has no Home Assistant imports. All control logic is tested with a fake clock in `tests/core/test_controller.py`.

### Local Home Assistant dev instance

A second HA instance runs natively on the development machine, with the integration symlinked from the repo. It talks to the real hardware, so you can watch and debug decisions without touching production HA. A native venv is used instead of Docker because Docker Desktop on macOS has no real host networking, so the SHM2 multicast would never arrive.

```bash
scripts/dev-setup.sh            # Python 3.14 venv .venv-dev with HA 2026.10.4 (needs uv)
scripts/dev-setup.sh 2026.11.0  # update to another HA version
scripts/dev-run.sh              # http://localhost:8123
```

In VS Code, start **Home Assistant (dev)** from *Run and Debug* to get breakpoints anywhere, including HA itself (`justMyCode` is off). **Home Assistant (dev, asyncio debug)** adds HA's `--debug` mode, which reports blocking calls in the event loop. After a code change, restart HA; the symlink means no copying.

Only `dev-config/configuration.yaml` is tracked. It loads a small subset of `default_config`, enables debug logging for the integration, and adds a price slider (`input_number.dev_electricity_price` → `sensor.dev_electricity_price`). Drag the slider across `price_threshold` to test `pv_grid` and the battery hold.

Connecting to the hardware:

| Source | Setup |
|---|---|
| SHM2 | Multicast reaches the Mac directly if it is on the same network. Prefer Ethernet; Wi-Fi often drops multicast. Allow incoming connections for Python if the macOS firewall asks. |
| STP SE / Sunny Boy | Same Modbus TCP hosts as production. The inverters accept several clients. |
| go-e | Add the MQTT integration pointing at production HA's Mosquitto broker, with a separate MQTT user. Disable MQTT discovery in its options, otherwise all production MQTT devices appear here. |

> **Keep `active_control` off in the dev instance** unless production HA and evcc are both hands-off. In shadow mode the dev instance writes nothing to the charger or the inverter.

The `FFmpeg fails` error at startup comes from HA itself, not from this integration, and is harmless; `brew install ffmpeg` silences it.
