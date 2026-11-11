import { css, html, nothing, type TemplateResult } from "lit";
import {
  CHARGE_MODES,
  CoordinatorCard,
  PREFIX_FIELD,
  TITLE_FIELD,
  baseStyles,
  define,
  formatPrice,
  num,
  registerCard,
  simpleEditor,
  type BaseConfig,
  type EntitySlot,
} from "./common";

/**
 * Charging control: the charge mode and the price limit, plus max grid power while it
 * applies. `compact: true` shows the same controls in two rows without explanations.
 */
interface ControlConfig extends BaseConfig {
  compact?: boolean;
}

/** Every entity the card uses; each can be mapped in the card's `entities`. */
const SLOTS: EntitySlot[] = [
  { key: "charge_mode", domain: "select", label: "Charge mode" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "grid_charge_max_power", domain: "number", label: "Max grid power" },
  { key: "block_battery_on_cheap_price", domain: "switch", label: "Battery hold at a cheap price" },
];

const LIMIT_STEP = 0.01;
const GRID_STEP = 500; // W

class ChargingCoordinatorControlCard extends CoordinatorCard<ControlConfig> {
  getCardSize(): number {
    return this._config?.compact ? 2 : 5;
  }

  getGridOptions(): Record<string, number> {
    return { columns: 12, min_columns: 6 };
  }

  static getStubConfig(): Partial<ControlConfig> {
    return {};
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("charging-coordinator-control-card-editor");
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    const modeEntity = this.entity("select", "charge_mode");
    if (!modeEntity) return this.renderMissing("charge_mode");
    const mode = modeEntity.state;
    return html`<ha-card>
      ${this._config.title ? html`<div class="title">${this._config.title}</div>` : nothing}
      ${this._config.compact ? this.renderCompact(mode) : this.renderFull(mode)}
    </ha-card>`;
  }

  // --- full -------------------------------------------------------------------

  private renderFull(mode: string): TemplateResult {
    const current = CHARGE_MODES.find((m) => m.value === mode);
    return html`
      <div class="modes" role="group" aria-label="Charge mode">
        ${CHARGE_MODES.map((m) => {
          const on = m.value === mode;
          return html`<button
            class="mode"
            style="--accent: ${m.color}"
            aria-pressed=${on ? "true" : "false"}
            @click=${() => this.selectOption("charge_mode", m.value)}
          >
            <span class="glyph" style=${on ? `color: ${m.color}` : ""}>
              ${m.icons.map((icon) => html`<ha-icon .icon=${icon}></ha-icon>`)}
            </span>
            <span>${m.label}</span>
          </button>`;
        })}
      </div>
      <p class="description">${current?.description ?? "Unknown mode."}</p>
      ${this.renderLimit(mode)} ${mode === "pv_grid" ? this.renderGridMax() : nothing}
    `;
  }

  private renderLimit(mode: string): TemplateResult {
    const limit = this.numberValue("price_threshold");
    const price = num(this.entity("sensor", "price"));
    const cheap = price !== undefined && limit !== undefined && price <= limit;
    const holdOnCheap = this.entity("switch", "block_battery_on_cheap_price")?.state === "on";

    let note: string;
    if (price === undefined) {
      note = "No current price.";
    } else if (mode === "pv_grid") {
      note = cheap
        ? `Now ${formatPrice(price)}, at or below your limit: also charging from the grid.`
        : `Now ${formatPrice(price)}, above your limit: grid charging waits.`;
    } else {
      note = holdOnCheap
        ? `Now ${formatPrice(price)}. The limit applies in PV + grid mode and to the battery hold.`
        : `Now ${formatPrice(price)}. The limit only applies in PV + grid mode.`;
    }
    const applies = mode === "pv_grid" || holdOnCheap;

    return html`<div class="section ${applies ? "" : "inactive"}">
      <div class="spread">
        <div>
          <div class="label">Price limit</div>
          <div class="hint">Grid charging only at or below</div>
        </div>
        <div class="row">
          <span class="value">${formatPrice(limit)}</span>
          ${this.renderStepper("Price limit", (d) =>
            limit === undefined ? undefined : this.setNumber("price_threshold", round3(limit + d * LIMIT_STEP)),
          )}
        </div>
      </div>
      ${limit === undefined ? nothing : this.renderRuler(limit, price)}
      <div class="note ${cheap && mode === "pv_grid" ? "good" : ""}">${note}</div>
    </div>`;
  }

  /** The limit on a price scale, with the current price as a dot. */
  private renderRuler(limit: number, price: number | undefined): TemplateResult {
    const values = price === undefined ? [limit] : [limit, price];
    const step = Math.max(...values) - Math.min(...values) > 0.25 ? 0.1 : 0.05;
    const lo = Math.floor((Math.min(...values) - step) / step) * step;
    const hi = Math.ceil((Math.max(...values) + step) / step) * step;
    const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%`;
    const ticks: number[] = [];
    for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(t);
    const cheap = price !== undefined && price <= limit;
    return html`<div class="ruler" aria-hidden="true">
      <div class="ticks">
        ${ticks.map((t) => html`<span style="left: ${pos(t)}">${t.toFixed(2)}</span>`)}
      </div>
      <div class="track"><div class="cheap" style="width: ${pos(limit)}"></div></div>
      <div class="limit" style="left: ${pos(limit)}"></div>
      ${price === undefined
        ? nothing
        : html`<div class="now ${cheap ? "good" : ""}" style="left: ${pos(price)}"></div>`}
    </div>`;
  }

  private renderGridMax(): TemplateResult {
    const max = this.numberValue("grid_charge_max_power");
    return html`<div class="section">
      <div class="spread">
        <div>
          <div class="label">Max grid power</div>
          <div class="hint">Cap on total grid import while charging</div>
        </div>
        <div class="row">
          <span class="value">${max === undefined ? "–" : `${(max / 1000).toFixed(1)} kW`}</span>
          ${this.renderStepper("Max grid power", (d) =>
            max === undefined ? undefined : this.setNumber("grid_charge_max_power", max + d * GRID_STEP),
          )}
        </div>
      </div>
    </div>`;
  }

  // --- compact ----------------------------------------------------------------

  private renderCompact(mode: string): TemplateResult {
    const limit = this.numberValue("price_threshold");
    const price = num(this.entity("sensor", "price"));
    const cheap = price !== undefined && limit !== undefined && price <= limit;
    return html`
      <div class="segments" role="group" aria-label="Charge mode">
        ${CHARGE_MODES.map((m) => {
          const on = m.value === mode;
          return html`<button
            style="--accent: ${m.color}"
            aria-pressed=${on ? "true" : "false"}
            @click=${() => this.selectOption("charge_mode", m.value)}
          >
            <ha-icon .icon=${m.icon} style=${on ? `color: ${m.color}` : ""}></ha-icon>
            <span>${m.label}</span>
          </button>`;
        })}
      </div>
      <div class="compact-limit">
        <span class="label">Price limit</span>
        <span class="value">${formatPrice(limit)}</span>
        ${this.renderStepper("Price limit", (d) =>
          limit === undefined ? undefined : this.setNumber("price_threshold", round3(limit + d * LIMIT_STEP)),
        )}
        ${price === undefined
          ? nothing
          : html`<span class="pill ${cheap ? "good" : ""}" title="Current price">
              <ha-icon .icon=${cheap ? "mdi:cash-check" : "mdi:cash"}></ha-icon>now
              ${formatPrice(price)}
            </span>`}
      </div>
    `;
  }

  static styles = [
    baseStyles,
    css`
      .modes {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
      }
      .mode {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        min-width: 0;
        padding: 10px 4px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: var(--secondary-background-color, transparent);
        color: var(--secondary-text-color);
      }
      .mode span:last-child {
        font-weight: 500;
        font-size: 0.86rem;
        white-space: nowrap;
      }
      .mode .glyph {
        display: flex;
        gap: 2px;
      }
      .mode[aria-pressed="true"] {
        color: var(--primary-text-color);
        border-color: var(--accent);
        background: color-mix(in srgb, var(--accent) 16%, var(--card-background-color, #fff));
      }
      .description {
        margin: 10px 2px 0;
        min-height: 2.6em;
        font-size: 0.9rem;
      }
      .section.inactive .ruler,
      .section.inactive .value {
        opacity: 0.55;
      }
      .ruler {
        position: relative;
        height: 36px;
        margin: 10px 0 4px;
      }
      .ruler .ticks span {
        position: absolute;
        top: 0;
        transform: translateX(-50%);
        font-size: 0.7rem;
        color: var(--secondary-text-color);
      }
      .ruler .ticks span:first-child {
        transform: none;
      }
      .ruler .ticks span:last-child {
        transform: translateX(-100%);
      }
      .ruler .track {
        position: absolute;
        left: 0;
        right: 0;
        top: 20px;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        background: color-mix(in srgb, var(--secondary-text-color) 30%, var(--card-background-color, #fff));
      }
      .ruler .cheap {
        height: 100%;
        background: color-mix(in srgb, var(--success-color, #43a047) 60%, var(--card-background-color, #fff));
      }
      .ruler .limit {
        position: absolute;
        top: 12px;
        width: 4px;
        height: 24px;
        margin-left: -2px;
        border-radius: 2px;
        background: var(--primary-text-color);
      }
      .ruler .now {
        position: absolute;
        top: 16px;
        width: 16px;
        height: 16px;
        margin-left: -8px;
        border-radius: 50%;
        border: 3px solid var(--card-background-color, #fff);
        background: var(--primary-text-color);
        box-sizing: border-box;
      }
      .ruler .now.good {
        background: var(--success-color, #43a047);
      }
      .note {
        font-size: 0.86rem;
      }
      .note.good {
        color: var(--success-color, #43a047);
      }

      .segments {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border: 1px solid var(--divider-color);
        border-radius: 18px;
        overflow: hidden;
      }
      .segments button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 0;
        padding: 7px 4px;
        border: none;
        background: var(--secondary-background-color, transparent);
        color: var(--secondary-text-color);
        font-weight: 500;
        font-size: 0.85rem;
        white-space: nowrap;
      }
      .segments button + button {
        border-left: 1px solid var(--divider-color);
      }
      .segments button[aria-pressed="true"] {
        color: var(--primary-text-color);
        background: color-mix(in srgb, var(--accent) 22%, var(--card-background-color, #fff));
      }
      .segments ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .compact-limit {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 10px;
        margin-top: 10px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-left: auto;
        padding: 3px 10px 3px 8px;
        border-radius: 12px;
        font-size: 0.82rem;
        background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
      }
      .pill ha-icon {
        --mdc-icon-size: 16px;
        color: var(--secondary-text-color);
      }
      .pill.good {
        color: var(--success-color, #43a047);
        background: color-mix(in srgb, var(--success-color, #43a047) 12%, transparent);
      }
      .pill.good ha-icon {
        color: inherit;
      }
    `,
  ];
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

define(
  "charging-coordinator-control-card-editor",
  simpleEditor([
    TITLE_FIELD,
    { name: "compact", label: "Compact (two rows, no explanations)", selector: { boolean: {} } },
    PREFIX_FIELD,
  ], SLOTS),
);
define("charging-coordinator-control-card", ChargingCoordinatorControlCard);
registerCard(
  "charging-coordinator-control-card",
  "Charging Coordinator control",
  "Charge mode and price limit, optionally compact",
);
