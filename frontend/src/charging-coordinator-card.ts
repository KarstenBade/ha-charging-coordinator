import { LitElement, css, html, nothing, svg, type SVGTemplateResult, type TemplateResult } from "lit";

// --- Home Assistant types (only what the card uses) -------------------------

interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

interface Hass {
  states: Record<string, HassEntity | undefined>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
}

interface VehicleConfig {
  name?: string;
  soc?: string; // entity id of the vehicle's state of charge, e.g. from Tibber
}

interface CardConfig {
  type: string;
  title?: string;
  prefix?: string;
  vehicles?: VehicleConfig[];
}

interface Option {
  value: string;
  label: string;
  icon: string;
}

const CHARGE_MODES: Option[] = [
  { value: "off", label: "Off", icon: "mdi:power" },
  { value: "pv", label: "PV", icon: "mdi:solar-power" },
  { value: "pv_grid", label: "PV + grid", icon: "mdi:transmission-tower-import" },
  { value: "now", label: "Now", icon: "mdi:lightning-bolt" },
];

const PHASE_MODES: Option[] = [
  { value: "auto", label: "Auto", icon: "mdi:sine-wave" },
  { value: "1p", label: "1 phase", icon: "mdi:numeric-1-circle-outline" },
  { value: "3p", label: "3 phases", icon: "mdi:numeric-3-circle-outline" },
];

// --- formatting -------------------------------------------------------------

function num(entity: HassEntity | undefined): number | undefined {
  if (!entity) return undefined;
  const value = Number(entity.state);
  return Number.isFinite(value) ? value : undefined;
}

function formatPower(watts: number | undefined): string {
  if (watts === undefined) return "–";
  const abs = Math.abs(watts);
  return abs >= 1000 ? `${(watts / 1000).toFixed(1)} kW` : `${Math.round(watts)} W`;
}

function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined) return "";
  const s = Math.max(0, Math.round(seconds));
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min` : `${s} s`;
}

function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

// --- flow diagram geometry (SVG user units, the HTML overlay uses the same box) --

const VIEW_W = 320;
const VIEW_H = 300;
const NODE_R = 24;
const HUB = { x: 160, y: 122 };

type NodeKey = "pv" | "grid" | "home" | "battery" | "charger";

const NODES: Record<NodeKey, { x: number; y: number }> = {
  pv: { x: 160, y: 36 },
  grid: { x: 44, y: 122 },
  home: { x: 276, y: 122 },
  battery: { x: 84, y: 206 },
  charger: { x: 236, y: 206 },
};

const COLORS: Record<string, string> = {
  pv: "var(--energy-solar-color, #ff9800)",
  gridIn: "var(--energy-grid-consumption-color, #488fc2)",
  gridOut: "var(--energy-grid-return-color, #8353d1)",
  batteryOut: "var(--energy-battery-out-color, #4db6ac)",
  batteryIn: "var(--energy-battery-in-color, #f06292)",
  home: "var(--secondary-text-color, #727272)",
  charger: "var(--success-color, #43a047)",
  idle: "var(--divider-color, #e0e0e0)",
  hold: "var(--warning-color, #ffa600)",
};

const MIN_FLOW = 30; // W below which a line counts as idle

interface Flow {
  node: NodeKey;
  power: number; // W, absolute
  inbound: boolean; // towards the hub
  color: string;
}

/** Seconds a dot needs from node to hub: faster with more power. */
function dotDuration(power: number): number {
  return Math.min(6, Math.max(0.9, 4000 / (power + 400)));
}

function pct(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

// --- the card ---------------------------------------------------------------

class ChargingCoordinatorCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _menu: { state: true },
  };

  hass?: Hass;
  private _config?: CardConfig;
  private _menu: "mode" | "phase" | null = null;
  private _menuPos = { left: 16, top: 56 };
  private _reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  setConfig(config: CardConfig): void {
    if (config.vehicles !== undefined && !Array.isArray(config.vehicles)) {
      throw new Error("vehicles must be a list of {name, soc}");
    }
    this._config = { prefix: "charging_coordinator", ...config };
  }

  getCardSize(): number {
    return 8;
  }

  getGridOptions(): Record<string, number> {
    return { columns: 12, min_columns: 6 };
  }

  static getStubConfig(): Partial<CardConfig> {
    return { vehicles: [] };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("charging-coordinator-card-editor");
  }

  private entity(domain: string, key: string): HassEntity | undefined {
    return this.hass?.states[`${domain}.${this._config?.prefix}_${key}`];
  }

  private async select(key: string, option: string): Promise<void> {
    this._menu = null;
    await this.hass?.callService("select", "select_option", {
      entity_id: `select.${this._config?.prefix}_${key}`,
      option,
    });
  }

  // --- render ---------------------------------------------------------------

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;

    const status = this.entity("sensor", "status");
    if (!status) {
      return html`<ha-card>
        <div class="warning">
          Charging Coordinator entities not found (prefix "${this._config.prefix}").
        </div>
      </ha-card>`;
    }

    const active = this.entity("switch", "active_control")?.state === "on";
    const mode = CHARGE_MODES.find((o) => o.value === this.entity("select", "charge_mode")?.state);
    const phaseMode = PHASE_MODES.find(
      (o) => o.value === this.entity("select", "phase_mode")?.state,
    );
    const targetPhases = num(this.entity("sensor", "target_phases"));

    return html`
      <ha-card>
        ${this._config.title ? html`<div class="title">${this._config.title}</div>` : nothing}
        <div class="top">
          <div class="chips">
            ${this.renderChip("mode", mode?.icon ?? "mdi:help", mode?.label ?? "–", "Charge mode")}
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
        ${this.renderMenu()} ${this.renderHeadline(status, mode?.value)} ${this.renderFlow()}
        ${this.renderFacts(status)}
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
    const grid = num(this.entity("sensor", "grid_power")) ?? 0;
    const battery = num(this.entity("sensor", "battery_power")) ?? 0;
    const pv =
      (num(this.entity("sensor", "pv_dc_power")) ?? 0) +
      (num(this.entity("sensor", "pv_inverter_power")) ?? 0);

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
      // PV covers the house first; only what's left over counts as charging from PV
      const evPower = ev ?? 0;
      const home = grid + pv + battery - evPower;
      const fromPv = Math.min(evPower, Math.max(0, pv - home));
      const fromGrid = Math.min(evPower - fromPv, Math.max(0, grid));
      const fromBattery = evPower - fromPv - fromGrid;
      const sources = [
        fromPv > 200 ? "PV" : "",
        fromGrid > 200 ? "grid" : "",
        fromBattery > 200 && battery > 200 ? "battery" : "",
      ].filter(Boolean);
      state = `Charging · ${formatPower(ev)}`;
      sub = [
        phases && current ? `${phases}p · ${current} A` : "",
        sources.length ? `from ${sources.join(" + ")}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
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

  private renderFlow() {
    const grid = num(this.entity("sensor", "grid_power"));
    const pvDc = num(this.entity("sensor", "pv_dc_power"));
    const pvAc = num(this.entity("sensor", "pv_inverter_power"));
    const pv = pvDc === undefined && pvAc === undefined ? undefined : (pvDc ?? 0) + (pvAc ?? 0);
    const battery = num(this.entity("sensor", "battery_power"));
    const soc = num(this.entity("sensor", "battery_soc"));
    const ev = num(this.entity("sensor", "charger_power"));
    const hold = this.entity("binary_sensor", "battery_hold")?.state === "on";
    const enabled = this.entity("binary_sensor", "target_enabled")?.state === "on";
    const current = num(this.entity("sensor", "target_current"));
    const phases = num(this.entity("sensor", "target_phases"));
    const connected = this.entity("binary_sensor", "vehicle_connected")?.state === "on";
    const home =
      grid === undefined ? undefined : grid + (pv ?? 0) + (battery ?? 0) - (ev ?? 0);

    const flows: Flow[] = [
      { node: "pv", power: Math.max(0, pv ?? 0), inbound: true, color: COLORS.pv },
      {
        node: "grid",
        power: Math.abs(grid ?? 0),
        inbound: (grid ?? 0) >= 0,
        color: (grid ?? 0) >= 0 ? COLORS.gridIn : COLORS.gridOut,
      },
      {
        node: "battery",
        power: Math.abs(battery ?? 0),
        inbound: (battery ?? 0) >= 0,
        color: (battery ?? 0) >= 0 ? COLORS.batteryOut : COLORS.batteryIn,
      },
      { node: "home", power: Math.max(0, home ?? 0), inbound: false, color: COLORS.home },
      { node: "charger", power: Math.max(0, ev ?? 0), inbound: false, color: COLORS.charger },
    ];

    const batteryColor = hold
      ? COLORS.hold
      : (battery ?? 0) < -MIN_FLOW
        ? COLORS.batteryIn
        : COLORS.batteryOut;
    const chargerColor = (ev ?? 0) > MIN_FLOW ? COLORS.charger : COLORS.idle;

    return html`
      <div class="flow" style="aspect-ratio: ${VIEW_W} / ${VIEW_H}">
        <svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" aria-hidden="true">
          ${flows.map((f) => this.renderLine(f))}
          <circle class="hub" cx=${HUB.x} cy=${HUB.y} r="4"></circle>
          ${this.renderNodeCircle("pv", COLORS.pv)}
          ${this.renderNodeCircle(
            "grid",
            (grid ?? 0) >= 0 ? COLORS.gridIn : COLORS.gridOut,
          )}
          ${this.renderNodeCircle("home", COLORS.home)}
          ${this.renderNodeCircle("battery", batteryColor, soc)}
          ${this.renderNodeCircle("charger", chargerColor)}
        </svg>

        ${this.renderNode("pv", "mdi:solar-power-variant", COLORS.pv, formatPower(pv), "PV", "side")}
        ${this.renderNode(
          "grid",
          "mdi:transmission-tower",
          (grid ?? 0) >= 0 ? COLORS.gridIn : COLORS.gridOut,
          formatPower(grid === undefined ? undefined : Math.abs(grid)),
          grid === undefined ? "Grid" : grid >= 0 ? "Grid import" : "Grid export",
        )}
        ${this.renderNode("home", "mdi:home", COLORS.home, formatPower(home), "Home")}
        ${this.renderNode(
          "battery",
          hold ? "mdi:battery-lock" : "mdi:home-battery",
          batteryColor,
          soc === undefined ? "–" : `${Math.round(soc)} %`,
          html`${formatPower(battery === undefined ? undefined : Math.abs(battery))}
          ${(battery ?? 0) > MIN_FLOW
            ? "out"
            : (battery ?? 0) < -MIN_FLOW
              ? "in"
              : ""}${hold ? html` · <b class="hold">hold</b>` : nothing}`,
        )}
        ${this.renderNode(
          "charger",
          "mdi:ev-station",
          chargerColor,
          formatPower(ev),
          !connected
            ? "No vehicle"
            : enabled && phases && current
              ? `${phases}p · ${current} A`
              : "Paused",
          "below",
          this.renderVehicles(),
        )}
      </div>
    `;
  }

  private renderLine(flow: Flow): SVGTemplateResult {
    const node = NODES[flow.node];
    const dx = HUB.x - node.x;
    const dy = HUB.y - node.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const sx = node.x + ux * (NODE_R + 2);
    const sy = node.y + uy * (NODE_R + 2);
    const ex = HUB.x - ux * 5;
    const ey = HUB.y - uy * 5;
    const path = `M${sx.toFixed(1)},${sy.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`;
    const activeFlow = flow.power > MIN_FLOW;

    if (!activeFlow) {
      return svg`<path class="line idle" d=${path}></path>`;
    }

    if (this._reducedMotion) {
      // static arrow in the middle of the line, pointing in the flow direction
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      const angle = (Math.atan2(uy, ux) * 180) / Math.PI + (flow.inbound ? 0 : 180);
      return svg`
        <path class="line" d=${path} style="stroke: ${flow.color}"></path>
        <polygon points="-4,-4 4,0 -4,4" style="fill: ${flow.color}"
          transform="translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${angle.toFixed(0)})"></polygon>
      `;
    }

    const dur = dotDuration(flow.power);
    const keyPoints = flow.inbound ? "0;1" : "1;0";
    return svg`
      <path class="line" d=${path} style="stroke: ${flow.color}"></path>
      ${[0, 1, 2].map(
        (i) => svg`
          <circle class="dot" r="3" style="fill: ${flow.color}">
            <animateMotion dur="${dur.toFixed(2)}s" repeatCount="indefinite"
              begin="${(-(i * dur) / 3).toFixed(2)}s" path=${path}
              keyPoints=${keyPoints} keyTimes="0;1" calcMode="linear"></animateMotion>
          </circle>`,
      )}
    `;
  }

  private renderNodeCircle(key: NodeKey, color: string, soc?: number): SVGTemplateResult {
    const { x, y } = NODES[key];
    const circumference = 2 * Math.PI * NODE_R;
    return svg`
      <circle class="node" cx=${x} cy=${y} r=${NODE_R}
        style="stroke: ${soc === undefined ? color : COLORS.idle}"></circle>
      ${soc === undefined
        ? nothing
        : svg`<circle class="ring" cx=${x} cy=${y} r=${NODE_R}
            style="stroke: ${color}"
            stroke-dasharray="${((circumference * Math.min(100, Math.max(0, soc))) / 100).toFixed(1)} ${circumference.toFixed(1)}"
            transform="rotate(-90 ${x} ${y})"></circle>`}
    `;
  }

  private renderNode(
    key: NodeKey,
    icon: string,
    color: string,
    value: string,
    sub: string | TemplateResult,
    placement: "below" | "side" = "below",
    extra: TemplateResult | typeof nothing = nothing,
  ) {
    const { x, y } = NODES[key];
    const labelStyle =
      placement === "side"
        ? `left: ${pct(x + NODE_R + 8, VIEW_W)}; top: ${pct(y, VIEW_H)}; transform: translateY(-50%); text-align: left;`
        : `left: ${pct(x, VIEW_W)}; top: ${pct(y + NODE_R + 4, VIEW_H)}; transform: translateX(-50%);`;
    return html`
      <ha-icon
        class="node-icon"
        .icon=${icon}
        style="left: ${pct(x, VIEW_W)}; top: ${pct(y, VIEW_H)}; color: ${color}"
      ></ha-icon>
      <div class="node-label ${key}" style=${labelStyle}>
        <div class="value">${value}</div>
        <div class="node-sub">${sub}</div>
        ${extra}
      </div>
    `;
  }

  private renderVehicles(): TemplateResult | typeof nothing {
    const vehicles = this._config?.vehicles ?? [];
    if (!vehicles.length) return nothing;
    return html`
      <div class="vehicles">
        ${vehicles.map((v, i) => {
          const soc = v.soc ? num(this.hass?.states[v.soc]) : undefined;
          const name = v.name || `Vehicle ${i + 1}`;
          return html`
            <div class="vehicle" title=${v.soc ?? ""}>
              <span class="vname">${name}</span>
              <span class="bar"
                ><span style="width: ${Math.min(100, Math.max(0, soc ?? 0))}%"></span
              ></span>
              <span class="vsoc">${soc === undefined ? "–" : `${Math.round(soc)} %`}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderFacts(status: HassEntity) {
    const facts: TemplateResult[] = [];
    const connected = this.entity("binary_sensor", "vehicle_connected")?.state === "on";

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

    /* headline */
    .headline {
      margin: 14px 0 4px;
    }
    .headline .state {
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.2;
    }
    .headline.charging .state {
      color: var(--success-color, #43a047);
    }
    .headline.muted .state {
      color: var(--secondary-text-color);
    }
    .headline .sub {
      color: var(--secondary-text-color);
      margin-top: 2px;
    }

    /* flow diagram */
    .flow {
      position: relative;
      width: 100%;
      max-width: 440px;
      margin: 0 auto;
    }
    .flow svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .line {
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
    }
    .line.idle {
      stroke: var(--divider-color, #e0e0e0);
    }
    .hub {
      fill: var(--secondary-text-color, #727272);
    }
    .node {
      fill: var(--card-background-color, #fff);
      stroke-width: 2.5;
    }
    .ring {
      fill: none;
      stroke-width: 3.5;
      stroke-linecap: round;
    }
    .node-icon {
      position: absolute;
      transform: translate(-50%, -50%);
      --mdc-icon-size: 24px;
      pointer-events: none;
    }
    .node-label {
      position: absolute;
      text-align: center;
      white-space: nowrap;
      line-height: 1.25;
    }
    .node-label .value {
      font-weight: 500;
    }
    .node-sub {
      font-size: 0.78rem;
      color: var(--secondary-text-color);
    }
    .node-sub .hold {
      color: var(--warning-color, #ffa600);
    }

    /* vehicles under the charger node */
    .vehicles {
      margin-top: 4px;
      display: grid;
      gap: 3px;
      font-size: 0.78rem;
    }
    .vehicle {
      display: grid;
      grid-template-columns: auto 52px auto;
      align-items: center;
      gap: 6px;
    }
    .vname {
      text-align: right;
      color: var(--secondary-text-color);
    }
    .bar {
      height: 6px;
      border-radius: 3px;
      background: var(--divider-color, #e0e0e0);
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--success-color, #43a047);
    }
    .vsoc {
      text-align: left;
      font-weight: 500;
      min-width: 32px;
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

const EDITOR_VEHICLE_SLOTS = 3;

interface FormData {
  title?: string;
  prefix?: string;
  [key: string]: string | undefined;
}

const EDITOR_SCHEMA = [
  { name: "title", selector: { text: {} } },
  ...Array.from({ length: EDITOR_VEHICLE_SLOTS }, (_, i) => ({
    type: "grid",
    name: "",
    schema: [
      { name: `vehicle_${i + 1}_name`, selector: { text: {} } },
      { name: `vehicle_${i + 1}_soc`, selector: { entity: { domain: "sensor" } } },
    ],
  })),
  { name: "prefix", selector: { text: {} } },
];

const EDITOR_LABELS: Record<string, string> = {
  title: "Title (optional)",
  prefix: "Entity prefix (only if you renamed the integration's entities)",
};

class ChargingCoordinatorCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  hass?: Hass;
  private _config?: CardConfig;

  setConfig(config: CardConfig): void {
    this._config = config;
  }

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadHaForm();
  }

  /** ha-form is loaded lazily by HA; creating a built-in card editor loads it. */
  private async loadHaForm(): Promise<void> {
    if (customElements.get("ha-form")) return;
    const helpers = await (
      window as unknown as { loadCardHelpers?: () => Promise<{ createCardElement(c: object): Promise<HTMLElement> }> }
    ).loadCardHelpers?.();
    const card = await helpers?.createCardElement({ type: "entities", entities: [] });
    await (card?.constructor as unknown as { getConfigElement?: () => Promise<unknown> })
      ?.getConfigElement?.();
    this.requestUpdate();
  }

  private get data(): FormData {
    const data: FormData = { title: this._config?.title, prefix: this._config?.prefix };
    (this._config?.vehicles ?? []).slice(0, EDITOR_VEHICLE_SLOTS).forEach((v, i) => {
      data[`vehicle_${i + 1}_name`] = v.name;
      data[`vehicle_${i + 1}_soc`] = v.soc;
    });
    return data;
  }

  private changed(ev: CustomEvent<{ value: FormData }>): void {
    if (!this._config) return;
    const value = ev.detail.value;
    const vehicles: VehicleConfig[] = [];
    for (let i = 1; i <= EDITOR_VEHICLE_SLOTS; i++) {
      const name = value[`vehicle_${i}_name`];
      const soc = value[`vehicle_${i}_soc`];
      if (name || soc) vehicles.push({ ...(name ? { name } : {}), ...(soc ? { soc } : {}) });
    }
    // keep vehicles beyond the editor's slots that were added in YAML
    vehicles.push(...(this._config.vehicles ?? []).slice(EDITOR_VEHICLE_SLOTS));

    const config: CardConfig = { ...this._config, vehicles };
    for (const key of ["title", "prefix"] as const) {
      if (value[key]) config[key] = value[key];
      else delete config[key];
    }
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }),
    );
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this.data}
        .schema=${EDITOR_SCHEMA}
        .computeLabel=${(s: { name: string }) => {
          if (EDITOR_LABELS[s.name]) return EDITOR_LABELS[s.name];
          const m = /^vehicle_(\d)_(name|soc)$/.exec(s.name);
          return m ? `Vehicle ${m[1]} ${m[2] === "name" ? "name" : "SoC sensor"}` : s.name;
        }}
        @value-changed=${this.changed}
      ></ha-form>
    `;
  }
}

// The bundle may be loaded twice, e.g. by the integration and by a manually added
// dashboard resource. Defining an element twice throws, which would stop this module
// before the rest is registered. So the editor comes first and existing ones are kept.
function define(name: string, element: CustomElementConstructor): void {
  if (customElements.get(name)) {
    console.info(`${name} is already defined, keeping the first loaded version`);
    return;
  }
  customElements.define(name, element);
}

define("charging-coordinator-card-editor", ChargingCoordinatorCardEditor);
define("charging-coordinator-card", ChargingCoordinatorCard);

const customCards = ((window as unknown as { customCards?: { type: string }[] }).customCards ??=
  []);
if (!customCards.some((c) => c.type === "charging-coordinator-card")) {
  customCards.push({
    type: "charging-coordinator-card",
    name: "Charging Coordinator",
    description: "Energy flow, charging state, vehicles and controls of the Charging Coordinator",
    preview: true,
    documentationURL: "https://github.com/KarstenBade/ha-charging-coordinator",
  } as { type: string });
}
