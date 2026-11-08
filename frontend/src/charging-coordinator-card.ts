import { LitElement, css, html, nothing, type TemplateResult } from "lit";

interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

interface Hass {
  states: Record<string, HassEntity | undefined>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
}

interface CardConfig {
  type: string;
  title?: string;
  prefix?: string;
}

const CHARGE_MODES: [string, string, string][] = [
  ["off", "Off", "mdi:power"],
  ["pv", "PV", "mdi:solar-power"],
  ["pv_grid", "PV + grid", "mdi:transmission-tower-import"],
  ["now", "Now", "mdi:lightning-bolt"],
];
const PHASE_MODES: [string, string][] = [
  ["auto", "Auto"],
  ["1p", "1p"],
  ["3p", "3p"],
];

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
  if (!seconds) return "";
  const s = Math.round(seconds);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min` : `${s} s`;
}

class ChargingCoordinatorCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  hass?: Hass;
  private _config?: CardConfig;

  setConfig(config: CardConfig): void {
    this._config = { prefix: "charging_coordinator", ...config };
  }

  getCardSize(): number {
    return 6;
  }

  static getStubConfig(): Partial<CardConfig> {
    return {};
  }

  private entity(domain: string, key: string): HassEntity | undefined {
    return this.hass?.states[`${domain}.${this._config?.prefix}_${key}`];
  }

  private async select(key: string, option: string): Promise<void> {
    await this.hass?.callService("select", "select_option", {
      entity_id: `select.${this._config?.prefix}_${key}`,
      option,
    });
  }

  private async toggle(key: string, on: boolean): Promise<void> {
    await this.hass?.callService("switch", on ? "turn_on" : "turn_off", {
      entity_id: `switch.${this._config?.prefix}_${key}`,
    });
  }

  private flowTile(
    icon: string,
    label: string,
    value: string,
    sub: string | TemplateResult = "",
    tone: "" | "in" | "out" | "warn" = "",
  ): TemplateResult {
    return html`
      <div class="tile ${tone}">
        <ha-icon .icon=${icon}></ha-icon>
        <div class="tile-label">${label}</div>
        <div class="tile-value">${value}</div>
        <div class="tile-sub">${sub}</div>
      </div>
    `;
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;

    const status = this.entity("sensor", "status");
    if (!status) {
      return html`<ha-card><div class="warning">Charging Coordinator entities not found
        (prefix "${this._config.prefix}").</div></ha-card>`;
    }

    const active = this.entity("switch", "active_control")?.state === "on";
    const mode = this.entity("select", "charge_mode")?.state;
    const phaseMode = this.entity("select", "phase_mode")?.state;

    const grid = num(this.entity("sensor", "grid_power"));
    const pv =
      (num(this.entity("sensor", "pv_dc_power")) ?? 0) +
      (num(this.entity("sensor", "pv_inverter_power")) ?? 0);
    const battery = num(this.entity("sensor", "battery_power"));
    const soc = num(this.entity("sensor", "battery_soc"));
    const ev = num(this.entity("sensor", "charger_power"));
    const home =
      grid === undefined ? undefined : grid + pv + (battery ?? 0) - (ev ?? 0);
    const hold = this.entity("binary_sensor", "battery_hold")?.state === "on";
    const connected = this.entity("binary_sensor", "vehicle_connected")?.state === "on";

    const current = num(this.entity("sensor", "target_current"));
    const phases = num(this.entity("sensor", "target_phases"));
    const enabled = this.entity("binary_sensor", "target_enabled")?.state === "on";

    const price = num(this.entity("sensor", "price"));
    const threshold = num(this.entity("number", "price_threshold"));
    const cheap = this.entity("binary_sensor", "price_cheap")?.state === "on";

    const pvTimer = this.entity("sensor", "pv_timer_remaining");
    const phaseTimer = this.entity("sensor", "phase_timer_remaining");
    // only show the limit while it actually reduces or blocks charging
    const limitReason = status.attributes.limited
      ? (status.attributes.limit_reason as string | null | undefined)
      : undefined;
    const headroom = num(this.entity("sensor", "fuse_headroom"));
    const unbalance = num(this.entity("sensor", "unbalance"));

    return html`
      <ha-card>
        <div class="header">
          <div class="title">${this._config.title ?? "Charging Coordinator"}</div>
          <button
            class="badge ${active ? "active" : "shadow"}"
            title="Toggle active control"
            @click=${() => this.toggle("active_control", !active)}
          >
            ${active ? "Active" : "Shadow mode"}
          </button>
        </div>
        <div class="status">${status.state}</div>

        <div class="flow">
          ${this.flowTile("mdi:solar-power-variant", "PV", formatPower(pv))}
          ${this.flowTile(
            "mdi:transmission-tower",
            "Grid",
            formatPower(grid === undefined ? undefined : Math.abs(grid)),
            grid === undefined ? "" : grid >= 0 ? "import" : "export",
            grid === undefined ? "" : grid > 50 ? "in" : grid < -50 ? "out" : "",
          )}
          ${this.flowTile(
            hold ? "mdi:battery-lock" : "mdi:home-battery",
            "Battery",
            soc === undefined ? "–" : `${Math.round(soc)} %`,
            html`${formatPower(battery)}${hold ? html` · <b>hold</b>` : nothing}`,
            hold ? "warn" : "",
          )}
          ${this.flowTile("mdi:home", "Home", formatPower(home))}
          ${this.flowTile(
            "mdi:car-electric",
            "Vehicle",
            formatPower(ev),
            connected
              ? enabled
                ? `${current ?? "–"} A · ${phases ?? "–"}p`
                : "connected"
              : "not connected",
            enabled ? "out" : "",
          )}
        </div>

        <div class="row">
          <div class="row-label">Mode</div>
          <div class="segmented">
            ${CHARGE_MODES.map(
              ([value, label, icon]) => html`
                <button
                  class=${mode === value ? "selected" : ""}
                  @click=${() => this.select("charge_mode", value)}
                >
                  <ha-icon .icon=${icon}></ha-icon>${label}
                </button>
              `,
            )}
          </div>
        </div>
        <div class="row">
          <div class="row-label">Phases</div>
          <div class="segmented small">
            ${PHASE_MODES.map(
              ([value, label]) => html`
                <button
                  class=${phaseMode === value ? "selected" : ""}
                  @click=${() => this.select("phase_mode", value)}
                >
                  ${label}
                </button>
              `,
            )}
          </div>
        </div>

        <div class="facts">
          <div>
            <span>Price</span>
            <b class=${cheap ? "good" : ""}>
              ${price === undefined ? "–" : price.toFixed(3)}
              ${threshold === undefined ? "" : html`${cheap ? "≤" : ">"} ${threshold.toFixed(3)}`}
            </b>
          </div>
          ${pvTimer && pvTimer.attributes.action !== "inactive"
            ? html`<div>
                <span>PV ${pvTimer.attributes.action}</span>
                <b>${formatDuration(num(pvTimer))}</b>
              </div>`
            : nothing}
          ${phaseTimer && phaseTimer.attributes.action !== "inactive"
            ? html`<div>
                <span>${phaseTimer.attributes.action}</span>
                <b>${formatDuration(num(phaseTimer))}</b>
              </div>`
            : nothing}
          <div>
            <span>Fuse headroom</span>
            <b>${headroom === undefined ? "–" : `${headroom.toFixed(1)} A`}</b>
          </div>
          <div>
            <span>Unbalance</span>
            <b>${formatPower(unbalance)}</b>
          </div>
          ${limitReason
            ? html`<div><span>Limit</span><b class="warn">${limitReason}</b></div>`
            : nothing}
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    ha-card {
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 500;
    }
    .status {
      color: var(--secondary-text-color);
      margin: 4px 0 12px;
      min-height: 1.2em;
    }
    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    .badge {
      border: none;
      border-radius: 12px;
      padding: 2px 10px;
      font-size: 0.8rem;
    }
    .badge.active {
      background: var(--success-color, #43a047);
      color: #fff;
    }
    .badge.shadow {
      background: var(--warning-color, #ffa600);
      color: #000;
    }
    .flow {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .tile {
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      padding: 8px;
      text-align: center;
    }
    .tile ha-icon {
      color: var(--state-icon-color, var(--secondary-text-color));
    }
    .tile.in ha-icon {
      color: var(--error-color, #db4437);
    }
    .tile.out ha-icon {
      color: var(--success-color, #43a047);
    }
    .tile.warn ha-icon {
      color: var(--warning-color, #ffa600);
    }
    .tile-label,
    .tile-sub {
      font-size: 0.75rem;
      color: var(--secondary-text-color);
    }
    .tile-value {
      font-size: 1.05rem;
      font-weight: 500;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .row-label {
      width: 56px;
      color: var(--secondary-text-color);
      font-size: 0.85rem;
    }
    .segmented {
      display: flex;
      flex: 1;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      overflow: hidden;
    }
    .segmented button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 4px;
      border: none;
      background: transparent;
      font-size: 0.85rem;
    }
    .segmented button + button {
      border-left: 1px solid var(--divider-color);
    }
    .segmented button.selected {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .segmented ha-icon {
      --mdc-icon-size: 18px;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 4px 16px;
      margin-top: 8px;
      font-size: 0.85rem;
    }
    .facts div {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .facts span {
      color: var(--secondary-text-color);
    }
    .good {
      color: var(--success-color, #43a047);
    }
    .warn {
      color: var(--warning-color, #ffa600);
    }
    .warning {
      color: var(--error-color);
    }
  `;
}

customElements.define("charging-coordinator-card", ChargingCoordinatorCard);

(window as unknown as { customCards?: unknown[] }).customCards ??= [];
(window as unknown as { customCards: unknown[] }).customCards.push({
  type: "charging-coordinator-card",
  name: "Charging Coordinator",
  description: "Status and controls of the Charging Coordinator integration",
});
