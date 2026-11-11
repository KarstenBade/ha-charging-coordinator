import { css, html, nothing, type TemplateResult } from "lit";
import {
  COLORS,
  CoordinatorCard,
  PREFIX_FIELD,
  TITLE_FIELD,
  baseStyles,
  define,
  formatPower,
  num,
  pipeColor,
  registerCard,
  simpleEditor,
  type BaseConfig,
  type EntitySlot,
} from "./common";

/**
 * Battery and car: when the home battery comes before the car (evcc's priority,
 * buffer and buffer start SoC), set by dragging markers on the battery's scale,
 * plus the two battery hold switches.
 */

type LevelKey = "priority_soc" | "buffer_soc" | "buffer_start_soc";
type Zone = "battery" | "car" | "keep" | "start";

const LEVELS: { key: LevelKey; name: string }[] = [
  { key: "priority_soc", name: "Battery first below" },
  { key: "buffer_soc", name: "May keep a charge going above" },
  { key: "buffer_start_soc", name: "May start a charge from" },
];

/** Every entity the card uses; each can be mapped in the card's `entities`. */
const SLOTS: EntitySlot[] = [
  { key: "battery_soc", domain: "sensor", label: "Battery state of charge" },
  { key: "battery_power", domain: "sensor", label: "Battery power (+ discharge, - charge)" },
  { key: "battery_hold", domain: "binary_sensor", label: "Battery hold" },
  { key: "priority_soc", domain: "number", label: "Battery first below (%)" },
  { key: "buffer_soc", domain: "number", label: "May keep a charge going above (%)" },
  { key: "buffer_start_soc", domain: "number", label: "May start a charge from (%)" },
  { key: "block_battery_on_ev_grid_charge", domain: "switch", label: "Hold while the car charges from the grid" },
  { key: "block_battery_on_cheap_price", domain: "switch", label: "Hold at a cheap price" },
];

const ZONE_COLORS: Record<Zone, string> = {
  battery: pipeColor(COLORS.batteryIn, 45),
  car: pipeColor(COLORS.home, 25),
  keep: pipeColor(COLORS.batteryOut, 30),
  start: pipeColor(COLORS.batteryOut, 60),
};

const MIN_FLOW = 30;

/** What the battery does at a given SoC, as in the controller (surplus.py). */
function zoneAt(soc: number, levels: Record<LevelKey, number>): Zone {
  if (soc < levels.priority_soc) return "battery";
  if (levels.buffer_start_soc > 0 && soc >= levels.buffer_start_soc) return "start";
  if (levels.buffer_soc > 0 && soc > levels.buffer_soc) return "keep";
  return "car";
}

class ChargingCoordinatorBatteryCard extends CoordinatorCard {
  static properties = {
    ...CoordinatorCard.properties,
    _drag: { state: true },
  };

  // the marker being dragged and its value, written when it is let go
  private _drag: { key: LevelKey; value: number } | null = null;

  getCardSize(): number {
    return 5;
  }

  getGridOptions(): Record<string, number> {
    return { columns: 12, min_columns: 6 };
  }

  static getStubConfig(): Partial<BaseConfig> {
    return {};
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("charging-coordinator-battery-card-editor");
  }

  private level(key: LevelKey): number {
    if (this._drag?.key === key) return this._drag.value;
    return this.numberValue(key) ?? 0;
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    if (!this.entity("number", "priority_soc")) return this.renderMissing("priority_soc");

    const soc = num(this.entity("sensor", "battery_soc"));
    const power = num(this.entity("sensor", "battery_power"));
    const hold = this.entity("binary_sensor", "battery_hold")?.state === "on";
    const levels = Object.fromEntries(LEVELS.map((l) => [l.key, this.level(l.key)])) as Record<
      LevelKey,
      number
    >;

    let state: string;
    if (hold) state = "On hold, not discharging";
    else if ((power ?? 0) < -MIN_FLOW) state = `Charging · ${formatPower(-(power ?? 0))}`;
    else if ((power ?? 0) > MIN_FLOW) state = `Discharging · ${formatPower(power)}`;
    else state = power === undefined ? "–" : "Idle";

    return html`<ha-card>
      ${this._config.title ? html`<div class="title">${this._config.title}</div>` : nothing}
      <div class="spread">
        <div>
          <div class="label">Home battery</div>
          <div class="hint ${hold ? "hold" : ""}">${state}</div>
        </div>
        <span class="value big">${soc === undefined ? "–" : `${Math.round(soc)} %`}</span>
      </div>
      ${this.renderScale(levels, soc)} ${this.renderLegend(levels)}
      <div class="section">
        ${this.renderSwitch(
          "block_battery_on_ev_grid_charge",
          "Hold the battery while the car charges from the grid",
        )}
        ${this.renderSwitch(
          "block_battery_on_cheap_price",
          "Hold the battery when the price is at or below the limit",
        )}
      </div>
    </ha-card>`;
  }

  /** Colored zones from 0 to 100 %, the three draggable levels and the current SoC. */
  private renderScale(levels: Record<LevelKey, number>, soc: number | undefined): TemplateResult {
    const cuts = [0, 100, ...Object.values(levels)]
      .map((v) => Math.min(100, Math.max(0, v)))
      .sort((a, b) => a - b)
      .filter((v, i, all) => i === 0 || v !== all[i - 1]);
    const zones = cuts.slice(0, -1).map((from, i) => ({
      from,
      to: cuts[i + 1],
      zone: zoneAt((from + cuts[i + 1]) / 2, levels),
    }));

    return html`<div class="scale">
      <div class="zones" @pointerdown=${(ev: PointerEvent) => ev.preventDefault()}>
        ${zones.map(
          (z) =>
            html`<div style="left: ${z.from}%; width: ${z.to - z.from}%; background: ${ZONE_COLORS[z.zone]}"></div>`,
        )}
      </div>
      ${soc === undefined
        ? nothing
        : html`<div class="soc" style="left: ${Math.min(100, Math.max(0, soc))}%" title="Now ${Math.round(soc)} %"></div>`}
      ${LEVELS.map((l) => this.renderMarker(l.key, l.name, levels[l.key]))}
    </div>`;
  }

  private renderMarker(key: LevelKey, name: string, value: number): TemplateResult {
    const off = value <= 0;
    const set = (v: number) => this.setNumber(key, Math.min(100, Math.max(0, Math.round(v))));
    return html`<div
      class="marker ${this._drag?.key === key ? "dragging" : ""}"
      style="left: ${value}%"
      role="slider"
      tabindex="0"
      aria-label=${name}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${value}
      aria-valuetext=${off ? "off" : `${value} %`}
      @keydown=${(ev: KeyboardEvent) => {
        const steps: Record<string, number> = {
          ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10,
        };
        if (ev.key in steps) set(value + steps[ev.key]);
        else if (ev.key === "Home") set(0);
        else if (ev.key === "End") set(100);
        else return;
        ev.preventDefault();
      }}
      @pointerdown=${(ev: PointerEvent) => this.startDrag(ev, key)}
    >
      <span class="marker-label">${off ? "off" : `${value} %`}</span>
    </div>`;
  }

  private startDrag(ev: PointerEvent, key: LevelKey): void {
    const marker = ev.currentTarget as HTMLElement;
    const scale = marker.parentElement as HTMLElement;
    marker.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    const valueAt = (e: PointerEvent) => {
      const box = scale.getBoundingClientRect();
      return Math.round(Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100)));
    };
    this._drag = { key, value: valueAt(ev) };
    const move = (e: PointerEvent) => (this._drag = { key, value: valueAt(e) });
    const end = () => {
      marker.removeEventListener("pointermove", move);
      marker.removeEventListener("pointerup", end);
      marker.removeEventListener("pointercancel", end);
      const drag = this._drag;
      this._drag = null;
      if (drag) void this.setNumber(drag.key, drag.value);
    };
    marker.addEventListener("pointermove", move);
    marker.addEventListener("pointerup", end);
    marker.addEventListener("pointercancel", end);
  }

  private renderLegend(levels: Record<LevelKey, number>): TemplateResult {
    const { priority_soc: priority, buffer_soc: buffer, buffer_start_soc: start } = levels;
    const items: [Zone, string][] = [];
    items.push(
      priority > 0
        ? ["battery", `Below ${priority} %, PV charges the battery before the car.`]
        : ["car", "PV always goes to the car before the battery."],
    );
    const hasCarZone = [...Array(100).keys()].some((s) => zoneAt(s + 0.5, levels) === "car");
    if (priority > 0 && hasCarZone) {
      items.push(["car", "In the grey range, PV goes to the car first and the battery doesn't help."]);
    }
    if (buffer > 0) items.push(["keep", `Above ${buffer} %, the battery may keep a running charge going.`]);
    if (start > 0) items.push(["start", `From ${start} %, the battery may start a charge.`]);
    if (buffer <= 0 && start <= 0) items.push(["car", "The battery never helps charge the car."]);

    return html`<ul class="legend">
      ${items.map(
        ([zone, text]) =>
          html`<li><i style="background: ${ZONE_COLORS[zone]}"></i><span>${text}</span></li>`,
      )}
    </ul>
    <div class="hint drag-hint">Drag a marker to change it; at 0 % it is off.</div>`;
  }

  private renderSwitch(key: string, label: string): TemplateResult {
    const entity = this.entity("switch", key);
    if (!entity) return html``;
    const on = entity.state === "on";
    return html`<div class="toggle">
      <span>${label}</span>
      <button
        class="switch"
        role="switch"
        aria-checked=${on ? "true" : "false"}
        aria-label=${label}
        @click=${() => this.toggle(key, !on)}
      ></button>
    </div>`;
  }

  static styles = [
    baseStyles,
    css`
      .big {
        font-size: 1.4rem;
      }
      .hint.hold {
        color: var(--warning-color, #ffa600);
      }
      .scale {
        position: relative;
        height: 30px;
        margin: 30px 10px 14px;
        touch-action: none;
      }
      .zones {
        position: absolute;
        inset: 9px 0;
        border-radius: 6px;
        overflow: hidden;
      }
      .zones div {
        position: absolute;
        top: 0;
        bottom: 0;
      }
      .soc {
        position: absolute;
        top: 4px;
        bottom: 4px;
        width: 4px;
        margin-left: -2px;
        border-radius: 2px;
        background: var(--energy-battery-out-color, #4db6ac);
        pointer-events: none;
      }
      .marker {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 24px;
        margin-left: -12px;
        cursor: ew-resize;
        outline: none;
      }
      .marker::before {
        content: "";
        position: absolute;
        left: 10px;
        top: 0;
        bottom: 0;
        width: 4px;
        border-radius: 2px;
        background: var(--primary-text-color);
      }
      .marker::after {
        content: "";
        position: absolute;
        left: 5px;
        top: 8px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--primary-text-color);
        border: 2px solid var(--card-background-color, #fff);
        box-sizing: border-box;
      }
      .marker:focus-visible::after,
      .marker.dragging::after {
        background: var(--primary-color);
      }
      .marker-label {
        position: absolute;
        bottom: calc(100% + 2px);
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
      }
      .legend {
        display: grid;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 0.86rem;
      }
      .legend li {
        display: flex;
        gap: 8px;
        align-items: baseline;
      }
      .legend i {
        flex: none;
        width: 10px;
        height: 10px;
        border-radius: 3px;
        transform: translateY(1px);
      }
      .drag-hint {
        margin-top: 6px;
      }
      .toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 0;
        font-size: 0.9rem;
      }
    `,
  ];
}

define("charging-coordinator-battery-card-editor", simpleEditor([TITLE_FIELD, PREFIX_FIELD], SLOTS));
define("charging-coordinator-battery-card", ChargingCoordinatorBatteryCard);
registerCard(
  "charging-coordinator-battery-card",
  "Charging Coordinator battery",
  "When the home battery comes before the car, and the battery hold switches",
);
