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
| `smart` | Charges from the sources switched on below |
| `now` | Maximum current (3p in auto phase mode) |

Smart mode has two switches, and any combination works:

| Switch | When on |
|---|---|
| `smart_pv` (*PV surplus*) | Surplus charging with enable/disable delays and automatic 1p/3p switching |
| `smart_price` (*Cheap price*) | While price ≤ threshold, also charges from the grid; total grid import is capped at `grid_charge_max_power`. With PV surplus off, the car only charges at a cheap price |

With both off, smart mode doesn't charge. The modes `pv` and `pv_grid` of 0.3.0 and earlier are migrated on the first start: `pv` becomes smart with PV surplus, `pv_grid` smart with both switches on. Automations that set `pv` or `pv_grid` need to set `smart` and the switches instead.

- **Home battery priority (evcc model):**
  - `priority_soc`: below it, PV charges the battery first.
  - `buffer_soc`: above it, the battery may keep a running session at minimum current.
  - `buffer_start_soc`: above it, the battery may start a session at minimum current.
- **Battery discharge block (hold), via SMA Modbus registers 40236/40793–40801 with a 30 s keep-alive:**
  - While the EV charges from the grid (`now`, or smart with *Cheap price* on and a cheap price). Switch `block_battery_on_ev_grid_charge`.
  - Optionally whenever price ≤ threshold, even without an EV. Switch `block_battery_on_cheap_price`.
- **Phase switching:** `auto` / `1p` / `3p`, with configurable switch-up and switch-down power. Unbalanced-load limits only cap the 1p current; they never trigger a switch.
- **Protection:**
  - Per-phase main fuse limit, applied in every mode.
  - Unbalanced-load limit with three modes:
    - `dynamic`: measured at the grid connection point via the SHM2 per-phase power. A single-phase PV inverter on the same phase is counted automatically.
    - `static`: `unbalance_max / 230 V`
    - `off`
- **Shadow mode:** with `switch.charging_coordinator_active_control` off, every decision is computed and published but nothing is written. Use it to compare against evcc before cutover.
- **Lovelace cards**, bundled and registered automatically, plus an [example dashboard](examples/dashboard.yaml). See [The cards](#the-cards).

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

### Vehicles

The go-e can't tell cars apart, so each car gets a template that says when it is plugged in at home. Add a car on the integration's page with **Add vehicle** (needs Home Assistant 2025.3 or newer):

| Field | Meaning |
|---|---|
| Name | Shown in the cards, e.g. `ID.7` |
| State of charge | SoC sensor of the car, e.g. from the Tibber integration |
| Connected | Template that is true while the car is plugged in at home |
| Target state of charge | Optional, the charge target set in the car; shown on the SoC bar |
| Range | Optional range sensor |
| Picture | Optional picture of the car, picked in the media browser: e.g. one under *Image Upload* that you uploaded for another card, or one from *My media* |
| Picture entity | Optional image or camera entity, e.g. the car image from the car's integration. Used instead of the picture while it has one |

For example, with a device tracker and a cable sensor:

```jinja
{{ is_state('device_tracker.id_7', 'home')
   and is_state('binary_sensor.id_7_charging_cable', 'on') }}
```

Test the template in *Developer tools → Template* first. To change a car later, open its ⋮ menu and choose *Reconfigure*.

Each car gets its own device with `binary_sensor.charging_coordinator_<name>_connected`, the template's result. `sensor.charging_coordinator_connected_vehicle` names the car on the cable, or `none`. It only names a car while the charger reports a cable. If two templates are true at once, for example because the car API is slow to report an unplug, the car whose template turned true last wins. This survives restarts. The sensor's `vehicles` attribute lists all cars with their entities; the cards read the cars from it.

## The cards

### Overview

`custom:charging-coordinator-card` shows everything relevant at one glance:

- **Top:** charge mode (with the smart mode sources, e.g. *Smart · PV + price*) and phase mode as chips. Tap one to change it in a small menu. On the right, whether the coordinator is **Active** or in **Shadow** mode.
- **Headline:** what is happening, e.g. *Charging · 10.6 kW* with *3p · 16 A*, *Paused* with the reason, or *No vehicle connected*.
- **Energy flow**, left to right, drawn as pipes whose width is power. The house rail runs along the bottom: the grid feeds it from the left and it feeds the charger on the right. PV comes down into it, home rises out of it, and the home battery sits above it between them. PV charges the battery directly (the hybrid inverter does that on its DC side, so it never reaches the house); only charging beyond the hybrid inverter's own PV, e.g. from the grid, comes from the rail, and discharging feeds into the rail. Export forks off the PV pipe down to the grid. Colors fade into the rail's grey where the sources meet, because the meter can't tell which source feeds which consumer. Dots move in the direction of flow, faster with more power (no dots with reduced motion enabled). The battery fills up with its SoC; it is grey while idle and orange with *hold* while it is held.
- **Cars:** the car named by `sensor.charging_coordinator_connected_vehicle` is shown under the charger with its SoC, and the other cars are in the bottom row. Cars are set up in the integration, see [Vehicles](#vehicles).
- **Bottom row:** the cars not at the charger, the next action with its timer (*Starts in 35 s*, *Stops in 2:40 min*, *3 phases in 42 s*), price against threshold, and reasons: why the battery holds, and why charging is limited or blocked.

Configure it in the card editor or in YAML:

```yaml
type: custom:charging-coordinator-card
title: Wallbox            # optional
```

The `vehicles:` option of 0.3.0 and earlier is gone; set the cars up in the integration instead. All parameters are on the dashboard's *Settings* view; the card only changes the charge mode and the phase mode.

### Charging control

`custom:charging-coordinator-control-card`: *Off*, *Smart* and *Now*, with a sentence on what the chosen mode does. In *Smart*, the switches *PV surplus* and *Cheap price* appear. The price limit, on a scale next to the current price ("above your limit: grid charging waits"), and max grid power appear only while *Cheap price* is on. The full card also shows the limit while *Hold battery on cheap price* is on, because that hold uses it too. With `compact: true` it shows the same controls without explanations, for phones. `hide_price_limit: true` leaves out the price limit and current price, e.g. with two fixed tariff zones where the limit just sits between them.

### Vehicles

`custom:charging-coordinator-vehicle-card`: every car set up in the integration with its picture, SoC, target (the orange tick), range, and whether it is plugged in or charging. Each car follows its own template, so if two cars report a cable at once, both show as connected; that makes double reports easy to spot. Without a cable at the charger, no car shows as connected. Three layouts, chosen with `layout` or in the card editor:

| `layout` | Looks like |
|---|---|
| `tiles` (default) | One tile per car, the connected one outlined in green |
| `rows` | One compact row per car, a green dot marks the connected one |
| `spotlight` | The connected car large, the others as one line each |

It stacks well above the compact control card.

### Battery and car

`custom:charging-coordinator-battery-card`: the home battery's level against the three priority levels, in words (*below 20 %, PV charges the battery before the car*). Drag a marker, or focus it and use the arrow keys, to change `priority_soc`, `buffer_soc` or `buffer_start_soc`; at 0 % a level is off. Below are the two battery hold switches.

### Prices

`custom:charging-coordinator-price-card`: prices as bars with the limit as a line. Bars at or below the limit, where *Cheap price* charging draws from the grid, are green, and the summary says when the next such stretch starts and how long it lasts. Tap a bar to use its price as the limit. The forecast is read from your price sensor's attributes; common formats work without configuration (Nord Pool `raw_today`/`raw_tomorrow` or `today`/`tomorrow`, ENTSO-e `prices`, EPEX Spot `data`, lists of `{start, value}`/`{startsAt, total}`). Without a forecast, the card shows today's recorded prices so far.

### Options for all cards

- `title`: optional heading.
- `prefix`: only if you renamed the integration's entities; the cards look for `<domain>.<prefix>_<key>`.
- `entities`: replaces single entities, so the cards also work with other integrations or helpers. Map a key to any entity; keys you leave out keep the coordinator's entity. The card editors list every key with its default under *Entities*.

```yaml
type: custom:charging-coordinator-control-card
compact: true
entities:
  charge_mode: input_select.car_charge_mode     # select or input_select
  price_threshold: input_number.car_price_limit # number or input_number
  price: sensor.electricity_price
```

Services are called for the mapped entity's own type, so helpers (`input_select`, `input_number`, `input_boolean`) work wherever the card changes something. Power sensors in kW or MW are converted to W. Signs must follow the coordinator's convention: grid power is positive for import, battery power positive for discharge. For the price card, `price_forecast` names the sensor whose attributes hold the forecast; by default it is the coordinator price sensor's `source`.

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

**Changes made in the go-e app** (start/stop, phases) are adopted in active mode, as evcc does, once the coordinator's own last `frc`/`psm` write is more than 60 s old. The normal logic then decides from the new state: in smart mode with PV surplus, a stopped session restarts only after the enable delay if there is surplus. An app phase change stays in `auto` until the phase timer decides otherwise, and is switched back right away if the phase mode is fixed. In shadow mode the coordinator keeps its own decisions and never reads them back. Switching `active_control` on adopts the charger's current state first.

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

In VS Code, start **Home Assistant (dev)** from *Run and Debug* to get breakpoints anywhere, including HA itself (`justMyCode` is off). **Home Assistant (dev, asyncio debug)** adds HA's `--debug` mode, which reports blocking calls in the event loop. After a code change, restart HA; the symlink means no copying. A restart from the HA UI makes HA exit with code 100. `scripts/dev-run.sh` starts it again; a VS Code debug session ends instead, so start it again with F5.

Only `dev-config/configuration.yaml` is tracked. It loads a small subset of `default_config`, enables debug logging for the integration, and adds a price slider (`input_number.dev_electricity_price` → `sensor.dev_electricity_price`). Drag the slider across `price_threshold` to test cheap price charging and the battery hold. The sidebar entry *Charging (example)* shows [examples/dashboard.yaml](examples/dashboard.yaml) straight from the repo (through a symlink), so edits there show after a browser reload.

Connecting to the hardware:

| Source | Setup |
|---|---|
| SHM2 | Multicast reaches the Mac directly if it is on the same network. Prefer Ethernet; Wi-Fi often drops multicast. Allow incoming connections for Python if the macOS firewall asks. |
| STP SE / Sunny Boy | Same Modbus TCP hosts as production. The inverters accept several clients. |
| go-e | Add the MQTT integration pointing at production HA's Mosquitto broker, with a separate MQTT user. Disable MQTT discovery in its options, otherwise all production MQTT devices appear here. |

> **Keep `active_control` off in the dev instance** unless production HA and evcc are both hands-off. In shadow mode the dev instance writes nothing to the charger or the inverter.

The `FFmpeg fails` error at startup comes from HA itself, not from this integration, and is harmless; `brew install ffmpeg` silences it.
