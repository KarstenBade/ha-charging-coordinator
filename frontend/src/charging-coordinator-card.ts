import { css, html, nothing, svg, type SVGTemplateResult, type TemplateResult } from "lit";
import {
  CHARGE_MODES,
  COLORS,
  CoordinatorCard,
  PREFIX_FIELD,
  TITLE_FIELD,
  define,
  formatPower,
  num,
  pipeColor,
  readVehicles,
  registerCard,
  simpleEditor,
  type BaseConfig,
  type EntitySlot,
  type HassEntity,
  type Option,
  type Vehicle,
} from "./common";
// the other cards register themselves when the bundle loads
import "./control-card";
import "./battery-card";
import "./price-card";
import "./vehicle-card";
import "./priority-card";

type CardConfig = BaseConfig;

/** Every entity the card uses; each can be mapped in the card's `entities`. */
const SLOTS: EntitySlot[] = [
  { key: "status", domain: "sensor", label: "Status" },
  { key: "active_control", domain: "switch", label: "Active control" },
  { key: "charge_mode", domain: "select", label: "Charge mode" },
  { key: "phase_mode", domain: "select", label: "Phase mode" },
  { key: "grid_power", domain: "sensor", label: "Grid power (+ import, - export)" },
  { key: "pv_dc_power", domain: "sensor", label: "PV power of the hybrid inverter (can charge the battery directly)" },
  { key: "pv_inverter_power", domain: "sensor", label: "PV power of another inverter" },
  { key: "battery_power", domain: "sensor", label: "Battery power (+ discharge, - charge)" },
  { key: "battery_soc", domain: "sensor", label: "Battery state of charge" },
  { key: "battery_hold", domain: "binary_sensor", label: "Battery hold" },
  { key: "charger_power", domain: "sensor", label: "Charger power" },
  { key: "vehicle_connected", domain: "binary_sensor", label: "Vehicle connected" },
  { key: "connected_vehicle", domain: "sensor", label: "Connected vehicle (lists the cars)" },
  { key: "smart_pv", domain: "switch", label: "Smart: PV surplus" },
  { key: "smart_price", domain: "switch", label: "Smart: cheap price" },
  { key: "target_enabled", domain: "binary_sensor", label: "Charging released" },
  { key: "target_current", domain: "sensor", label: "Target current" },
  { key: "target_phases", domain: "sensor", label: "Target phases" },
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  { key: "price_cheap", domain: "binary_sensor", label: "Price at or below the limit" },
  { key: "pv_timer_remaining", domain: "sensor", label: "Start / stop timer" },
  { key: "phase_timer_remaining", domain: "sensor", label: "Phase switch timer" },
];

const PHASE_MODES: Option[] = [
  { value: "auto", label: "Auto", icon: "mdi:sine-wave" },
  { value: "1p", label: "1 phase", icon: "mdi:numeric-1-circle-outline" },
  { value: "3p", label: "3 phases", icon: "mdi:numeric-3-circle-outline" },
];

// --- formatting -------------------------------------------------------------

function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined) return "";
  const s = Math.max(0, Math.round(seconds));
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min` : `${s} s`;
}

function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

// --- flow diagram geometry (SVG user units, the HTML overlay uses the same box) --
//
// Every flow is a pipe: straight runs with rounded corners, so a pipe keeps its
// width everywhere and joins line up exactly. The house rail runs along the bottom
// row: the grid feeds it straight from the left and it feeds the charger straight to
// the right. PV comes down into it, home rises out of it, and the battery hangs
// above it between them, taking from or feeding into the rail. Export forks off the
// PV pipe down to the grid. Pipe width is power; colors fade into the rail's grey
// where sources merge, because the meter can't tell which source feeds which
// consumer.

const VIEW_W = 388;
const VIEW_H = 140;
const LEFT_X = 122; // pipes meet the left labels
const RIGHT_X = 262; // pipes meet the right labels
const MERGE_X = 168; // PV and grid have joined the rail, their colors faded to grey
const SPLIT_X = 216; // the rail splits into home and charger
const BATTERY = { x: 192, top: 6, w: 40, h: 44 }; // between PV and home, above the rail
const ROW_TOP = 26; // label rows
const ROW_BOTTOM = 112;
const MAX_PIPE = 36; // px of all sources together ...
const FULL_SCALE = 6000; // ... at this many W or more; below, pipes get thinner

const MIN_FLOW = 30; // W below which a pipe counts as idle

/** Seconds the dots in a pipe need for one cycle: faster with more power. */
function dotDuration(power: number): number {
  return Math.min(6, Math.max(0.9, 4000 / (power + 400)));
}

function pct(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

/** Corner radius of a pipe's center line, large enough for a clean inner corner. */
function radius(width: number): number {
  return Math.max(6, width / 2 + 4);
}

/** SVG path from commands and numbers (rounded; integers such as arc flags stay bare). */
function path(...parts: (string | number)[]): string {
  return parts
    .map((p) => (typeof p === "number" && !Number.isInteger(p) ? p.toFixed(1) : String(p)))
    .join(" ");
}

interface VehicleState {
  connected: boolean | undefined; // undefined: no charger data
  car?: Vehicle; // the plugged-in car, if known
  others: Vehicle[]; // shown in the bottom row
}

// --- the card ---------------------------------------------------------------

let cardCount = 0; // unique gradient ids per card

class ChargingCoordinatorCard extends CoordinatorCard<CardConfig> {
  static properties = {
    ...CoordinatorCard.properties,
    _menu: { state: true },
  };

  private _menu: "mode" | "phase" | null = null;
  private _menuPos = { left: 16, top: 56 };
  private _uid = `ccc${++cardCount}`;
  private _reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  getCardSize(): number {
    return 5;
  }

  getGridOptions(): Record<string, number> {
    return { columns: 12, min_columns: 6 };
  }

  static getStubConfig(): Partial<CardConfig> {
    return {};
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("charging-coordinator-card-editor");
  }

  private async select(key: string, option: string): Promise<void> {
    this._menu = null;
    await this.selectOption(key, option);
  }

  /** The cars set up in the integration, and which one it takes as plugged in. */
  private vehicleState(): VehicleState {
    const sensor = this.entity("sensor", "connected_vehicle");
    const vehicles = this.hass ? readVehicles(this.hass, sensor) : [];
    const raw = this.entity("binary_sensor", "vehicle_connected")?.state;
    const connected = raw === "on" ? true : raw === "off" ? false : undefined;
    const car = connected ? vehicles.find((v) => v.name === sensor?.state) : undefined;
    return { connected, car, others: vehicles.filter((v) => v !== car) };
  }

  /** "Smart · PV + price": the mode with the sources smart mode uses. */
  private modeLabel(mode: Option | undefined): string {
    if (!mode) return "–";
    if (mode.value !== "smart") return mode.label;
    const pv = this.entity("switch", "smart_pv")?.state === "on";
    const price = this.entity("switch", "smart_price")?.state === "on";
    const sources = [pv ? "PV" : "", price ? "price" : ""].filter(Boolean).join(" + ");
    return sources ? `Smart · ${sources}` : "Smart · nothing";
  }

  // --- render ---------------------------------------------------------------

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;

    const status = this.entity("sensor", "status");
    if (!status) {
      return html`<ha-card>
        <div class="warning">
          Charging Coordinator entities not found (looked for ${this.entityId("sensor", "status")}).
        </div>
      </ha-card>`;
    }

    const active = this.entity("switch", "active_control")?.state === "on";
    const mode = CHARGE_MODES.find((o) => o.value === this.entity("select", "charge_mode")?.state);
    const phaseMode = PHASE_MODES.find(
      (o) => o.value === this.entity("select", "phase_mode")?.state,
    );
    const targetPhases = num(this.entity("sensor", "target_phases"));
    const vehicles = this.vehicleState();

    return html`
      <ha-card>
        ${this._config.title ? html`<div class="title">${this._config.title}</div>` : nothing}
        <div class="top">
          <div class="chips">
            ${this.renderChip("mode", mode?.icon ?? "mdi:help", this.modeLabel(mode), "Charge mode")}
            ${this.renderChip(
              "phase",
              phaseMode?.icon ?? "mdi:sine-wave",
              phaseMode?.value === "auto" && targetPhases
                ? `Auto · ${targetPhases}p`
                : (phaseMode?.label ?? "–"),
              "Phases",
            )}
          </div>
          <span
            class="badge ${active ? "active" : "shadow"}"
            title=${active ? "The coordinator controls the charger and battery"
              : "Shadow mode: decisions are computed, nothing is written"}
          >
            <ha-icon .icon=${active ? "mdi:check-circle" : "mdi:eye-outline"}></ha-icon>
            ${active ? "Active" : "Shadow"}
          </span>
        </div>
        ${this.renderMenu()} ${this.renderHeadline(status, mode?.value)}
        ${this.renderFlow(vehicles)} ${this.renderFacts(status, vehicles)}
      </ha-card>
    `;
  }

  private renderChip(kind: "mode" | "phase", icon: string, label: string, title: string) {
    const open = this._menu === kind;
    return html`
      <button
        class="chip ${open ? "open" : ""}"
        title=${title}
        aria-haspopup="menu"
        aria-expanded=${open ? "true" : "false"}
        @click=${(ev: MouseEvent) => {
          // open the menu right below the chip (offsets relative to ha-card)
          const chip = ev.currentTarget as HTMLElement;
          this._menuPos = { left: chip.offsetLeft, top: chip.offsetTop + chip.offsetHeight + 4 };
          this._menu = open ? null : kind;
        }}
      >
        <ha-icon .icon=${icon}></ha-icon>
        <span>${label}</span>
        <ha-icon class="chevron" .icon=${"mdi:chevron-down"}></ha-icon>
      </button>
    `;
  }

  private renderMenu() {
    if (!this._menu) return nothing;
    const kind = this._menu;
    const options = kind === "mode" ? CHARGE_MODES : PHASE_MODES;
    const key = kind === "mode" ? "charge_mode" : "phase_mode";
    const current = this.entity("select", key)?.state;
    return html`
      <div class="scrim" @click=${() => (this._menu = null)}></div>
      <div
        class="menu"
        role="menu"
        style="left: ${this._menuPos.left}px; top: ${this._menuPos.top}px"
        @keydown=${(ev: KeyboardEvent) => {
          if (ev.key === "Escape") this._menu = null;
        }}
      >
        ${options.map(
          (o) => html`
            <button
              role="menuitemradio"
              aria-checked=${o.value === current ? "true" : "false"}
              class=${o.value === current ? "selected" : ""}
              @click=${() => this.select(key, o.value)}
            >
              <ha-icon .icon=${o.icon}></ha-icon>
              <span>${o.label}</span>
              ${o.value === current
                ? html`<ha-icon class="check" .icon=${"mdi:check"}></ha-icon>`
                : nothing}
            </button>
          `,
        )}
      </div>
    `;
  }

  protected updated(): void {
    // move focus into an opened menu, so it can be used with the keyboard
    if (this._menu) {
      const target = this.renderRoot.querySelector<HTMLButtonElement>(
        ".menu button.selected, .menu button",
      );
      if (target && !this.renderRoot.querySelector(".menu")?.contains(document.activeElement)) {
        target.focus();
      }
    }
  }

  private renderHeadline(status: HassEntity, mode: string | undefined) {
    const connected = this.entity("binary_sensor", "vehicle_connected")?.state;
    const enabled = this.entity("binary_sensor", "target_enabled")?.state === "on";
    const ev = num(this.entity("sensor", "charger_power"));
    const current = num(this.entity("sensor", "target_current"));
    const phases = num(this.entity("sensor", "target_phases"));

    const raw = status.state;
    const cut = raw.indexOf(": ");
    const detail = capitalize(cut >= 0 ? raw.slice(cut + 2) : raw);

    let state: string;
    let sub = "";
    let tone = "";
    if (connected === undefined || connected === "unknown" || connected === "unavailable") {
      state = "Waiting for charger data";
      tone = "muted";
    } else if (connected === "off") {
      state = "No vehicle connected";
      sub = mode === "off" ? "Charging is off" : "";
      tone = "muted";
    } else if (mode === "off") {
      state = "Charging off";
      tone = "muted";
    } else if (enabled && (ev ?? 0) > 100) {
      // no "from PV / grid": the meter can't tell which source feeds the charger
      state = `Charging · ${formatPower(ev)}`;
      sub = phases && current ? `${phases}p · ${current} A` : "";
      tone = "charging";
    } else if (enabled) {
      state = "Ready";
      sub = "Charging released, the vehicle is not drawing power";
    } else {
      state = "Paused";
      // a running start/stop timer is shown as its own chip below
      sub = /^(enabling|disabling) in /i.test(detail) ? "" : detail;
    }

    return html`
      <div class="headline ${tone}">
        <div class="state">${state}</div>
        ${sub ? html`<div class="sub">${sub}</div>` : nothing}
      </div>
    `;
  }

  private renderFlow(vehicles: VehicleState) {
    const grid = num(this.entity("sensor", "grid_power"));
    const pvDc = num(this.entity("sensor", "pv_dc_power"));
    const pvAc = num(this.entity("sensor", "pv_inverter_power"));
    const pv = pvDc === undefined && pvAc === undefined ? undefined : (pvDc ?? 0) + (pvAc ?? 0);
    const battery = num(this.entity("sensor", "battery_power"));
    const soc = num(this.entity("sensor", "battery_soc"));
    const ev = num(this.entity("sensor", "charger_power"));
    const hold = this.entity("binary_sensor", "battery_hold")?.state === "on";
    const home =
      grid === undefined ? undefined : grid + (pv ?? 0) + (battery ?? 0) - (ev ?? 0);

    // powers (W, >= 0) and pipe widths (px). The hybrid inverter charges the battery
    // from its own PV strings on the DC side, so that part goes from PV straight into
    // the battery and never reaches the house; only the rest (e.g. from the grid)
    // comes from the rail. Export is drawn as part of PV.
    const pvP = Math.max(0, pv ?? 0);
    const importP = Math.max(0, grid ?? 0);
    const dischargeP = Math.max(0, battery ?? 0);
    const chargeP = Math.max(0, -(battery ?? 0));
    const directP = Math.min(chargeP, Math.max(0, pvDc ?? 0));
    const railChargeP = chargeP - directP;
    const exportP = Math.min(pvP - directP, Math.max(0, -(grid ?? 0)));
    const homeP = Math.max(0, home ?? 0);
    const evP = Math.max(0, ev ?? 0);
    const scale = MAX_PIPE / Math.max(pvP + importP + dischargeP, FULL_SCALE);
    const w = (p: number) => (p > MIN_FLOW ? Math.max(2, p * scale) : 0);
    const wDirect = w(directP); // PV straight into the battery
    const wExport = w(exportP);
    const wPv = w(pvP - directP - exportP); // PV into the rail
    const wImport = w(importP);
    const wLeft = wPv + wImport; // rail left of the battery
    const wCharge = w(railChargeP); // battery charged from the rail
    const wDischarge = w(dischargeP);
    // What leaves the rail is exactly what enters it, split between home and charger
    // by power. Sizing these from their own powers would let minimum widths make the
    // two sides differ and leave a step in the rail.
    const wRight = Math.max(0, wLeft - wCharge + wDischarge); // rail right of the battery
    const homeShare = homeP > MIN_FLOW ? homeP : 0;
    const evShare = evP > MIN_FLOW ? evP : 0;
    const consumers = homeShare + evShare;
    const wHome = consumers > 0 ? (wRight * homeShare) / consumers : 0;
    const wEv = consumers > 0 ? (wRight * evShare) / consumers : 0;

    const gridColor = exportP > MIN_FLOW || (grid ?? 0) < -MIN_FLOW ? COLORS.gridOut : COLORS.gridIn;
    const batteryColor = hold
      ? COLORS.hold
      : (battery ?? 0) < -MIN_FLOW
        ? COLORS.batteryIn
        : (battery ?? 0) > MIN_FLOW
          ? COLORS.batteryOut
          : COLORS.home;
    const chargerColor = evP > MIN_FLOW ? COLORS.charger : COLORS.idle;

    // The rail runs along the bottom row, centered on it, with its bottom edge as the
    // reference: grid and charger use its bottom lane and run straight; PV comes down
    // into its top lane, home rises from its top lane, the battery hangs above it.
    // Paths without flow aren't drawn.
    const B = ROW_BOTTOM + Math.max(wLeft, wRight) / 2;
    const bx = BATTERY.x;
    const batteryBottom = BATTERY.top + BATTERY.h;
    const left = LEFT_X;
    const pvStackTop = ROW_TOP - (wDirect + wPv + wExport) / 2; // top to bottom: battery, rail, export
    const pvPipe = (width: number) => {
      const r = radius(width);
      const y0 = pvStackTop + wDirect + width / 2;
      const y1 = B - wLeft + width / 2;
      const x = MERGE_X - 1 - 2 * r;
      return path("M", left, y0, "L", x, y0, "A", r, r, 0, 0, 1, x + r, y0 + r,
        "L", x + r, y1 - r, "A", r, r, 0, 0, 0, x + 2 * r, y1, "L", MERGE_X + 0.5, y1);
    };
    const exportPipe = (width: number) => {
      const r = radius(width);
      const y = pvStackTop + wDirect + wPv + width / 2;
      return path("M", left, y, "A", r, r, 0, 0, 1, left + r, y + r,
        "L", left + r, ROW_BOTTOM - r, "A", r, r, 0, 0, 1, left, ROW_BOTTOM);
    };
    const directPipe = (width: number) => {
      const y = pvStackTop + width / 2;
      return path("M", left, y, "L", bx - BATTERY.w / 2 + 1, y);
    };
    const gridPipe = (width: number) => {
      const y = B - width / 2;
      return path("M", left, y, "L", MERGE_X + 0.5, y);
    };
    const chargePipe = (width: number) => {
      const r = radius(width);
      const y = B - wLeft + width / 2;
      return path("M", MERGE_X - 0.5, y, "L", bx - r, y, "A", r, r, 0, 0, 0, bx, y - r,
        "L", bx, batteryBottom);
    };
    const dischargePipe = (width: number) => {
      const r = radius(width);
      const y = B - wRight + width / 2;
      return path("M", bx, batteryBottom, "L", bx, y - r, "A", r, r, 0, 0, 0, bx + r, y,
        "L", SPLIT_X + 0.5, y);
    };
    const homePipe = (width: number) => {
      const r = radius(width);
      const y0 = B - wRight + width / 2;
      const x = RIGHT_X - 1 - 2 * r;
      return path("M", SPLIT_X - 0.5, y0, "L", x, y0, "A", r, r, 0, 0, 0, x + r, y0 - r,
        "L", x + r, ROW_TOP + r, "A", r, r, 0, 0, 1, x + 2 * r, ROW_TOP, "L", RIGHT_X, ROW_TOP);
    };
    const chargerPipe = (width: number) => {
      const y = B - width / 2;
      return path("M", SPLIT_X - 0.5, y, "L", RIGHT_X, y);
    };

    // colors fade along the pipes: sources into the rail's grey, the rail into consumers
    const id = (name: string) => `${this._uid}-${name}`;
    const grey = pipeColor(COLORS.home);
    const fade = (name: string, x1: number, y1: number, x2: number, y2: number, from: string, to: string) =>
      svg`<linearGradient id=${id(name)} gradientUnits="userSpaceOnUse" x1=${x1} y1=${y1} x2=${x2} y2=${y2}>
        <stop offset="0.25" style="stop-color: ${pipeColor(from)}"></stop>
        <stop offset="1" style="stop-color: ${pipeColor(to)}"></stop>
      </linearGradient>`;
    const defs = svg`<defs>
      ${fade("pv", 0, ROW_TOP, 0, B - wLeft, COLORS.pv, COLORS.home)}
      ${fade("direct", left, 0, bx - BATTERY.w / 2, 0, COLORS.pv, COLORS.batteryIn)}
      ${fade("grid", left, 0, MERGE_X, 0, COLORS.gridIn, COLORS.home)}
      ${fade("export", 0, ROW_TOP, 0, ROW_BOTTOM, COLORS.pv, COLORS.gridOut)}
      ${fade("charge", 0, B - wLeft, 0, batteryBottom, COLORS.home, COLORS.batteryIn)}
      ${fade("discharge", 0, batteryBottom, 0, B - wRight, COLORS.batteryOut, COLORS.home)}
      ${fade("ev", SPLIT_X, 0, RIGHT_X, 0, COLORS.home, COLORS.charger)}
    </defs>`;

    const pipe = (route: (width: number) => string, width: number, fill: string, power: number) =>
      width > 0 ? this.pipe(route(width), width, fill, power) : nothing;
    const railH = wCharge ? wRight : wLeft;
    const tick = (x: number, top: number, h: number, color: string) =>
      h > 0
        ? svg`<rect x=${x - 1.5} y=${top} width="3" height=${h} rx="1.5" style="fill: ${color}"></rect>`
        : nothing;
    const level = Math.min(100, Math.max(0, soc ?? 0)) / 100;
    const fillH = (BATTERY.h - 4) * level;

    return html`
      <div class="flow" style="aspect-ratio: ${VIEW_W} / ${VIEW_H}">
        <svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" aria-hidden="true">
          ${defs}
          ${railH > 0
            ? svg`<rect x=${MERGE_X} y=${B - railH} width=${SPLIT_X - MERGE_X} height=${railH} style="fill: ${grey}"></rect>`
            : nothing}
          ${pipe(directPipe, wDirect, `url(#${id("direct")})`, directP)}
          ${pipe(pvPipe, wPv, `url(#${id("pv")})`, pvP - directP - exportP)}
          ${wExport > 0 ? this.pipe(exportPipe(wExport), wExport, `url(#${id("export")})`, exportP) : nothing}
          ${wExport > 0 ? nothing : pipe(gridPipe, wImport, `url(#${id("grid")})`, importP)}
          ${wDischarge > 0
            ? this.pipe(dischargePipe(wDischarge), wDischarge, `url(#${id("discharge")})`, dischargeP)
            : wCharge > 0
              ? this.pipe(chargePipe(wCharge), wCharge, `url(#${id("charge")})`, railChargeP)
              : nothing}
          ${pipe(homePipe, wHome, grey, homeP)}
          ${pipe(chargerPipe, wEv, `url(#${id("ev")})`, evP)}
          ${railH > 0 ? this.pulse(path("M", MERGE_X, B - railH / 2, "L", SPLIT_X, B - railH / 2), railH, homeP + evP) : nothing}
          ${tick(left - 1.5, pvStackTop, wDirect + wPv + wExport, COLORS.pv)}
          ${wExport > 0
            ? tick(left - 1.5, ROW_BOTTOM - wExport / 2, wExport, gridColor)
            : tick(left - 1.5, wImport ? B - wImport : ROW_BOTTOM, wImport, gridColor)}
          ${tick(RIGHT_X + 1.5, ROW_TOP - wHome / 2, wHome, COLORS.home)}
          ${tick(RIGHT_X + 1.5, wEv ? B - wEv : ROW_BOTTOM, wEv, chargerColor)}
          <rect x=${bx - 7} y=${BATTERY.top - 4} width="14" height="5" rx="1.5"
            style="fill: ${batteryColor}"></rect>
          <rect class="battery" x=${bx - BATTERY.w / 2} y=${BATTERY.top} width=${BATTERY.w}
            height=${BATTERY.h} rx="7" style="stroke: ${batteryColor}"></rect>
          ${fillH > 0
            ? svg`<rect x=${bx - BATTERY.w / 2 + 3} y=${batteryBottom - 3 - fillH}
                width=${BATTERY.w - 6} height=${fillH} rx=${Math.min(4, fillH / 2)}
                style="fill: ${pipeColor(batteryColor)}"></rect>`
            : nothing}
        </svg>

        ${this.renderSide("left", ROW_TOP, "mdi:solar-power-variant", COLORS.pv, formatPower(pv), "PV")}
        ${this.renderSide(
          "left",
          ROW_BOTTOM,
          "mdi:transmission-tower",
          gridColor,
          formatPower(grid === undefined ? undefined : Math.abs(grid)),
          grid === undefined ? "Grid" : grid >= 0 ? "Grid import" : "Grid export",
        )}
        ${this.renderSide("right", ROW_TOP, "mdi:home", COLORS.home, formatPower(home), "Home")}
        ${this.renderSide(
          "right",
          ROW_BOTTOM,
          "mdi:ev-station",
          chargerColor,
          formatPower(ev),
          this.renderChargerSub(vehicles),
        )}
        <div
          class="battery-label"
          style="left: ${pct(bx, VIEW_W)}; top: ${pct(BATTERY.top + BATTERY.h / 2, VIEW_H)}"
          title=${hold ? "Battery hold: the home battery is not discharging" : "Home battery"}
        >
          <div class="value">${soc === undefined ? "–" : `${Math.round(soc)}%`}</div>
          <div class="node-sub">
            ${hold
              ? html`<b class="hold">hold</b>`
              : formatPower(battery === undefined ? undefined : Math.abs(battery))}
          </div>
        </div>
      </div>
    `;
  }

  /** A pipe of the given width along `d` (drawn in flow direction), with moving dots. */
  private pipe(d: string, width: number, stroke: string, power: number): SVGTemplateResult {
    return svg`<path class="pipe" d=${d} style="stroke: ${stroke}; stroke-width: ${width.toFixed(1)}"></path>
      ${this.pulse(d, width, power)}`;
  }

  private pulse(d: string, width: number, power: number): SVGTemplateResult | typeof nothing {
    if (this._reducedMotion || power <= MIN_FLOW) return nothing;
    return svg`<path class="pulse" d=${d}
      style="stroke-width: ${Math.min(4, Math.max(2, width * 0.4)).toFixed(1)}">
      <animate attributeName="stroke-dashoffset" from="0" to="-36"
        dur="${dotDuration(power).toFixed(2)}s" repeatCount="indefinite"></animate>
    </path>`;
  }

  private renderSide(
    side: "left" | "right",
    y: number,
    icon: string,
    color: string,
    value: string,
    sub: string | TemplateResult,
  ) {
    const style =
      side === "left"
        ? `right: calc(100% - ${pct(LEFT_X - 8, VIEW_W)}); top: ${pct(y, VIEW_H)}; text-align: right;`
        : `left: ${pct(RIGHT_X + 8, VIEW_W)}; top: ${pct(y, VIEW_H)};`;
    const iconEl = html`<ha-icon .icon=${icon} style="color: ${color}"></ha-icon>`;
    return html`
      <div class="side ${side}" style=${style}>
        ${side === "right" ? iconEl : nothing}
        <div>
          <div class="value">${value}</div>
          ${typeof sub === "string" ? html`<div class="node-sub">${sub}</div>` : sub}
        </div>
        ${side === "left" ? iconEl : nothing}
      </div>
    `;
  }

  private renderChargerSub(vehicles: VehicleState): TemplateResult {
    const { connected, car } = vehicles;
    if (car) {
      return html`<div class="car" title=${car.socEntity ?? ""}>
        <span>${car.name}</span>${this.renderSocBar(car.soc)}
        <b>${car.soc === undefined ? "–" : `${Math.round(car.soc)} %`}</b>
      </div>`;
    }
    const text = connected === undefined ? "–" : connected ? "Vehicle connected" : "No vehicle";
    return html`<div class="node-sub">${text}</div>`;
  }

  private renderSocBar(soc: number | undefined) {
    return html`<span class="bar"
      ><span style="width: ${Math.min(100, Math.max(0, soc ?? 0))}%"></span
    ></span>`;
  }

  /** Cars that aren't at the charger. */
  private renderVehicleChips(vehicles: VehicleState): TemplateResult[] {
    return vehicles.others.map(
      (v) => html`<span class="fact vehicle" title=${v.socEntity ?? ""}>
        <span class="vname">${v.name}</span>${this.renderSocBar(v.soc)}
        <b>${v.soc === undefined ? "–" : `${Math.round(v.soc)} %`}</b>
      </span>`,
    );
  }

  private renderFacts(status: HassEntity, vehicles: VehicleState) {
    const facts: TemplateResult[] = this.renderVehicleChips(vehicles);
    const connected = vehicles.connected === true;

    // next action with its timer
    const pvTimer = this.entity("sensor", "pv_timer_remaining");
    const phaseTimer = this.entity("sensor", "phase_timer_remaining");
    if (connected && pvTimer?.attributes.action === "enable") {
      facts.push(this.fact("mdi:timer-play-outline", `Starts in ${formatDuration(num(pvTimer))}`, "info"));
    } else if (connected && pvTimer?.attributes.action === "disable") {
      facts.push(this.fact("mdi:timer-stop-outline", `Stops in ${formatDuration(num(pvTimer))}`, "warn"));
    }
    if (connected && phaseTimer?.attributes.action === "scale3p") {
      facts.push(this.fact("mdi:timer-sync-outline", `3 phases in ${formatDuration(num(phaseTimer))}`, "info"));
    } else if (connected && phaseTimer?.attributes.action === "scale1p") {
      facts.push(this.fact("mdi:timer-sync-outline", `1 phase in ${formatDuration(num(phaseTimer))}`, "info"));
    }
    if (status.state.includes("phase switch settling")) {
      facts.push(this.fact("mdi:timer-sand", "Phase switch settling", "info"));
    }

    // price against threshold
    const price = num(this.entity("sensor", "price"));
    const threshold = num(this.entity("number", "price_threshold"));
    const cheap = this.entity("binary_sensor", "price_cheap")?.state === "on";
    if (price !== undefined) {
      facts.push(
        this.fact(
          cheap ? "mdi:cash-check" : "mdi:cash",
          `${price.toFixed(3)} ${threshold === undefined ? "" : `${cheap ? "≤" : ">"} ${threshold.toFixed(3)}`}${cheap ? " · cheap" : ""}`,
          cheap ? "good" : "",
          "Price against threshold",
        ),
      );
    }

    // reasons
    const hold = this.entity("binary_sensor", "battery_hold")?.state === "on";
    const batteryReason = status.attributes.battery_reason as string | null | undefined;
    if (hold) {
      facts.push(
        this.fact(
          "mdi:battery-lock",
          `Battery hold${batteryReason ? ` · ${batteryReason.replace("ev ", "EV ")}` : ""}`,
          "warn",
          "The home battery is not discharging",
        ),
      );
    }
    const limitReason = status.attributes.limit_reason as string | null | undefined;
    if (status.attributes.limited && limitReason) {
      const blocked = status.state.includes("blocked by");
      facts.push(
        this.fact(
          blocked ? "mdi:cancel" : "mdi:speedometer-slow",
          `${blocked ? "Blocked" : "Limited"} · ${limitReason}`,
          "warn",
          "Protection limit",
        ),
      );
    }

    return facts.length ? html`<div class="facts">${facts}</div>` : nothing;
  }

  private fact(icon: string, text: string, tone: "" | "good" | "warn" | "info", title = "") {
    return html`<span class="fact ${tone}" title=${title}
      ><ha-icon .icon=${icon}></ha-icon>${text}</span
    >`;
  }

  static styles = css`
    ha-card {
      padding: 16px;
      position: relative;
    }
    .title {
      font-size: 1.2rem;
      font-weight: 500;
      margin-bottom: 8px;
    }
    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    ha-icon {
      --mdc-icon-size: 18px;
    }

    /* top row: mode and phase chips, active badge */
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      padding: 5px 4px 5px 10px;
      border-radius: 18px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color, transparent);
      font-weight: 500;
    }
    .chip.open,
    .chip:focus-visible {
      border-color: var(--primary-color);
      outline: none;
    }
    .chip .chevron {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      white-space: nowrap;
    }
    .badge ha-icon {
      --mdc-icon-size: 16px;
    }
    .badge.active {
      color: var(--success-color, #43a047);
      background: color-mix(in srgb, var(--success-color, #43a047) 15%, transparent);
    }
    .badge.shadow {
      color: var(--warning-color, #ffa600);
      background: color-mix(in srgb, var(--warning-color, #ffa600) 15%, transparent);
    }

    /* menu */
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 4;
    }
    .menu {
      position: absolute;
      z-index: 5;
      min-width: 180px;
      padding: 4px 0;
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
    .menu button {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: none;
      text-align: left;
    }
    .menu button:hover,
    .menu button:focus-visible {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
      outline: none;
    }
    .menu button.selected {
      color: var(--primary-color);
      font-weight: 500;
    }
    .menu .check {
      margin-left: auto;
    }

    /* headline: state and details on one line */
    .headline {
      margin: 10px 0 2px;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: 10px;
    }
    .headline .state {
      font-size: 1.15rem;
      font-weight: 500;
      line-height: 1.3;
    }
    .headline.charging .state {
      color: var(--success-color, #43a047);
    }
    .headline.muted .state {
      color: var(--secondary-text-color);
    }
    .headline .sub {
      color: var(--secondary-text-color);
      font-size: 0.9rem;
    }

    /* flow diagram */
    .flow {
      container-type: inline-size;
      position: relative;
      width: 100%;
      max-width: 480px;
      margin: 10px auto 0;
    }
    .flow > svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .pipe {
      fill: none;
      stroke-linecap: butt;
    }
    .pulse {
      fill: none;
      stroke: var(--primary-text-color, #212121);
      stroke-opacity: 0.45;
      stroke-linecap: round;
      stroke-dasharray: 0.1 18;
    }
    .battery {
      fill: var(--card-background-color, #fff);
      stroke-width: 2;
    }
    .side {
      position: absolute;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      line-height: 1.25;
    }
    .side .value {
      font-weight: 500;
    }
    .side ha-icon {
      /* a shrink-to-fit label can otherwise collapse the icon to zero width */
      --mdc-icon-size: 28px;
      flex: none;
      width: 28px;
      height: 28px;
    }
    .battery-label {
      position: absolute;
      transform: translate(-50%, -50%);
      text-align: center;
      white-space: nowrap;
      line-height: 1.15;
      pointer-events: auto;
    }
    .battery-label .value {
      font-size: 0.85rem;
      font-weight: 500;
    }
    .battery-label .node-sub {
      font-size: 0.68rem;
    }
    .node-sub {
      font-size: 0.78rem;
      color: var(--secondary-text-color);
    }
    .hold {
      color: var(--warning-color, #ffa600);
    }

    @container (max-width: 360px) {
      .side {
        gap: 6px;
      }
      .side ha-icon {
        --mdc-icon-size: 24px;
        width: 24px;
        height: 24px;
      }
      .side .car .bar {
        width: 20px;
      }
      .battery-label .value {
        font-size: 0.78rem;
      }
      .battery-label .node-sub {
        font-size: 0.62rem;
      }
    }

    /* cars: the plugged-in one at the charger, the others in the bottom row */
    .car {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.78rem;
    }
    .car b,
    .vehicle b {
      font-weight: 500;
    }
    .bar {
      flex: none;
      width: 30px;
      height: 5px;
      border-radius: 3px;
      background: var(--divider-color, #e0e0e0);
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--success-color, #43a047);
    }
    .vehicle .bar span {
      background: var(--secondary-text-color);
    }
    .vehicle .vname {
      color: var(--secondary-text-color);
    }

    /* facts: next action, price, reasons */
    .facts {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .fact {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px 3px 8px;
      border-radius: 12px;
      font-size: 0.82rem;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
    }
    .fact ha-icon {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
    }
    .fact.good {
      color: var(--success-color, #43a047);
      background: color-mix(in srgb, var(--success-color, #43a047) 12%, transparent);
    }
    .fact.warn {
      color: var(--warning-color, #ffa600);
      background: color-mix(in srgb, var(--warning-color, #ffa600) 12%, transparent);
    }
    .fact.info {
      color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    }
    .fact.good ha-icon,
    .fact.warn ha-icon,
    .fact.info ha-icon {
      color: inherit;
    }
    .warning {
      color: var(--error-color);
    }
  `;
}

// --- visual editor ----------------------------------------------------------

define("charging-coordinator-card-editor", simpleEditor([TITLE_FIELD, PREFIX_FIELD], SLOTS));
define("charging-coordinator-card", ChargingCoordinatorCard);
registerCard(
  "charging-coordinator-card",
  "Charging Coordinator",
  "Energy flow, charging state, vehicles and controls of the Charging Coordinator",
);
