import { css, html, nothing, type TemplateResult } from "lit";
import {
  CoordinatorCard,
  PREFIX_FIELD,
  TITLE_FIELD,
  baseStyles,
  define,
  formatPower,
  num,
  readVehicles,
  registerCard,
  simpleEditor,
  type BaseConfig,
  type EntitySlot,
  type Vehicle,
} from "./common";

/**
 * The cars set up in the integration: picture, state of charge with its target, range
 * and whether each one is plugged in. Each car follows its own connected template, so
 * when two of them report a cable at once, both show as connected.
 */
type Layout = "tiles" | "rows" | "spotlight";

interface VehicleCardConfig extends BaseConfig {
  layout?: Layout;
}

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: "tiles", label: "Tiles: one tile per car" },
  { value: "rows", label: "Rows: one compact row per car" },
  { value: "spotlight", label: "Spotlight: the connected car large" },
];

/** Every entity the card uses; each can be mapped in the card's `entities`. */
const SLOTS: EntitySlot[] = [
  { key: "connected_vehicle", domain: "sensor", label: "Connected vehicle (lists the cars)" },
  { key: "vehicle_connected", domain: "binary_sensor", label: "Cable at the charger" },
  { key: "charger_power", domain: "sensor", label: "Charger power" },
];

const CHARGING_MIN = 100; // W from which a connected car counts as charging

type Status = "charging" | "plugged" | "off";

interface CarView extends Vehicle {
  status: Status;
}

class ChargingCoordinatorVehicleCard extends CoordinatorCard<VehicleCardConfig> {
  getCardSize(): number {
    return this._config?.layout === "rows" ? 2 : 3;
  }

  getGridOptions(): Record<string, number> {
    return { columns: 12, min_columns: 6 };
  }

  static getStubConfig(): Partial<VehicleCardConfig> {
    return { layout: "tiles" };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("charging-coordinator-vehicle-card-editor");
  }

  setConfig(config: VehicleCardConfig): void {
    if (config.layout !== undefined && !LAYOUTS.some((l) => l.value === config.layout)) {
      throw new Error("layout must be tiles, rows or spotlight");
    }
    super.setConfig(config);
  }

  private cars(): CarView[] {
    if (!this.hass) return [];
    // without a cable at the charger, a car's template is stale: nothing is plugged in
    const cable = this.entity("binary_sensor", "vehicle_connected")?.state !== "off";
    const charging = (num(this.entity("sensor", "charger_power")) ?? 0) >= CHARGING_MIN;
    return readVehicles(this.hass, this.entity("sensor", "connected_vehicle"), () =>
      this.requestUpdate(),
    ).map((v) => ({
      ...v,
      status: v.connected && cable ? (charging ? "charging" : "plugged") : "off",
    }));
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    const sensor = this.entity("sensor", "connected_vehicle");
    if (!sensor) return this.renderMissing("connected_vehicle");
    const cars = this.cars();
    const layout = this._config.layout ?? "tiles";
    let body: TemplateResult;
    if (!cars.length) {
      body = html`<p class="empty">
        No cars set up yet. Add one in Settings → Devices &amp; services → Charging Coordinator →
        Add vehicle.
      </p>`;
    } else if (layout === "rows") {
      body = html`<div class="rows">${cars.map((c) => this.renderRow(c))}</div>`;
    } else if (layout === "spotlight") {
      body = this.renderSpotlight(cars, sensor.state);
    } else {
      body = html`<div class="tiles">${cars.map((c) => this.renderTile(c))}</div>`;
    }
    return html`<ha-card class="layout-${layout}">
      ${this._config.title ? html`<div class="title">${this._config.title}</div>` : nothing}
      ${body}
    </ha-card>`;
  }

  // --- parts --------------------------------------------------------------------

  private renderImage(car: Vehicle): TemplateResult {
    return car.image
      ? html`<img class="pic" src=${car.image} alt="" loading="lazy" />`
      : html`<div class="pic placeholder"><ha-icon .icon=${"mdi:car-side"}></ha-icon></div>`;
  }

  private renderStatus(car: CarView): TemplateResult {
    const power = num(this.entity("sensor", "charger_power"));
    const [icon, text] =
      car.status === "charging"
        ? ["mdi:lightning-bolt", `Charging · ${formatPower(power)}`]
        : car.status === "plugged"
          ? ["mdi:power-plug", "Plugged in"]
          : ["mdi:power-plug-off-outline", "Not connected"];
    return html`<span class="status ${car.status}"><ha-icon .icon=${icon}></ha-icon>${text}</span>`;
  }

  private renderBar(car: Vehicle): TemplateResult {
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    return html`<div
      class="bar"
      role="meter"
      aria-label="${car.name} state of charge"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${car.soc ?? 0}
    >
      <div class="fill" style="width: ${clamp(car.soc ?? 0)}%"></div>
      ${car.target === undefined
        ? nothing
        : html`<div class="goal" style="left: ${clamp(car.target)}%" title="Target ${car.target} %"></div>`}
    </div>`;
  }

  private soc(car: Vehicle): string {
    return car.soc === undefined ? "–" : `${Math.round(car.soc)} %`;
  }

  private range(car: Vehicle): string {
    return car.range === undefined ? "" : `${Math.round(car.range)} ${car.rangeUnit}`;
  }

  private target(car: Vehicle, prefix: string): TemplateResult | typeof nothing {
    return car.target === undefined
      ? nothing
      : html`<span class="target">${prefix}<b>${Math.round(car.target)} %</b></span>`;
  }

  // --- layouts ------------------------------------------------------------------

  private renderTile(car: CarView): TemplateResult {
    return html`<div class="tile ${car.status}">
      ${this.renderImage(car)}
      <div class="head"><span class="name">${car.name}</span>${this.renderStatus(car)}</div>
      <div class="nums">
        <span><span class="soc">${this.soc(car)}</span> ${this.target(car, "→ ")}</span>
        <span class="muted">${this.range(car)}</span>
      </div>
      ${this.renderBar(car)}
    </div>`;
  }

  private renderRow(car: CarView): TemplateResult {
    const range = this.range(car);
    return html`<div class="line ${car.status}">
      ${this.renderImage(car)}
      <div class="who">
        <span class="name">${car.name}${car.status === "off" ? nothing : html`<i class="dot"></i>`}</span>
        ${this.renderStatus(car)}
      </div>
      <div class="gauge">
        <div class="top">
          <span class="soc">${this.soc(car)}</span>
          <span class="muted small nowrap"
            >${range}<span class="wide"
              >${range && car.target !== undefined ? " · " : ""}${this.target(car, "")}</span
            ></span
          >
        </div>
        ${this.renderBar(car)}
      </div>
    </div>`;
  }

  /** The car on the cable large; the others, if any, as quiet lines below. */
  private renderSpotlight(cars: CarView[], picked: string): TemplateResult {
    const connected = cars.filter((c) => c.status !== "off");
    const main = connected.find((c) => c.name === picked) ?? connected[0];
    const rest = cars.filter((c) => c !== main);
    return html`
      ${main
        ? html`<div class="stage">
            ${this.renderImage(main)}
            <div class="info">
              <div class="head"><span class="name">${main.name}</span>${this.renderStatus(main)}</div>
              <div class="big">
                <span class="soc">${this.soc(main)}</span>
                <span class="muted small">${this.target(main, "to ")}${main.range !== undefined && main.target !== undefined ? " · " : ""}${this.range(main)}</span>
              </div>
              ${this.renderBar(main)}
            </div>
          </div>`
        : nothing}
      ${rest.map(
        (c) => html`<div class="aside ${c.status}">
          ${this.renderImage(c)}
          <div class="aside-body">
            <div class="spread">
              <span><span class="name">${c.name}</span> ${this.renderStatus(c)}</span>
              <span class="muted small">${this.soc(c)}${c.range === undefined ? "" : ` · ${this.range(c)}`}</span>
            </div>
            ${this.renderBar(c)}
          </div>
        </div>`,
      )}
    `;
  }

  static styles = [
    baseStyles,
    css`
      :host {
        --target: var(--warning-color, #ff9800);
        --ev: var(--success-color, #43a047);
      }
      ha-card {
        display: block;
        container-type: inline-size;
        padding: 12px 14px;
      }
      ha-card.layout-tiles {
        padding: 10px;
      }
      .empty {
        margin: 0;
        color: var(--secondary-text-color);
      }
      .name {
        font-weight: 500;
      }
      .small {
        font-size: 0.8rem;
      }
      .soc {
        font-size: 1.25rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .target {
        color: var(--secondary-text-color);
        font-size: 0.8rem;
        white-space: nowrap;
      }
      .target b {
        color: var(--target);
        font-weight: 500;
      }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        font-size: 0.82rem;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .status ha-icon {
        --mdc-icon-size: 16px;
        flex: none;
      }
      .status.charging {
        color: var(--ev);
      }
      .status.plugged {
        color: var(--primary-text-color);
      }

      /* picture: the car's own image, or an icon in its place */
      .pic {
        display: block;
        width: 100%;
        object-fit: contain;
      }
      .pic.placeholder {
        display: grid;
        place-items: center;
        color: var(--secondary-text-color);
      }

      /* SoC bar with the target as a tick */
      .bar {
        position: relative;
        height: 8px;
        border-radius: 4px;
        background: color-mix(in srgb, var(--secondary-text-color) 30%, var(--card-background-color, #fff));
      }
      .bar .fill {
        height: 100%;
        border-radius: 4px;
        background: var(--ev);
      }
      .bar .goal {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 3px;
        margin-left: -1.5px;
        border-radius: 2px;
        background: var(--target);
      }

      /* tiles */
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }
      .tile {
        min-width: 0;
        padding: 8px 10px 10px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: var(--secondary-background-color, transparent);
      }
      .tile:not(.off) {
        border-color: color-mix(in srgb, var(--ev) 70%, transparent);
        background: color-mix(in srgb, var(--ev) 8%, var(--secondary-background-color, transparent));
      }
      .tile .pic {
        height: 84px;
        margin-bottom: 4px;
      }
      .tile .pic.placeholder ha-icon {
        --mdc-icon-size: 56px;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 2px 8px;
        margin-bottom: 6px;
      }
      .nums {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      .nums > span:first-child {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0 6px;
      }
      .nums .muted {
        white-space: nowrap;
      }

      /* rows */
      .line {
        display: grid;
        grid-template-columns: 88px minmax(0, 1fr) minmax(120px, 150px);
        align-items: center;
        gap: 12px;
        padding: 6px 0;
      }
      .line + .line {
        border-top: 1px solid var(--divider-color);
      }
      .line .pic {
        height: 44px;
      }
      .line .pic.placeholder ha-icon {
        --mdc-icon-size: 36px;
      }
      .who {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        margin-left: 7px;
        border-radius: 50%;
        background: var(--ev);
        vertical-align: 2px;
      }
      .gauge {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .gauge .top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
      }
      .gauge .soc {
        font-size: 1.1rem;
      }

      /* spotlight */
      .stage {
        display: grid;
        grid-template-columns: 44% minmax(0, 1fr);
        align-items: center;
        gap: 14px;
      }
      .stage .pic {
        height: 96px;
      }
      .stage .pic.placeholder ha-icon {
        --mdc-icon-size: 64px;
      }
      .info {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .info .head {
        margin: 0;
        justify-content: flex-start;
      }
      .big {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px 10px;
      }
      .big .soc {
        font-size: 1.9rem;
        line-height: 1;
      }
      .aside {
        display: grid;
        grid-template-columns: 64px minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        padding-top: 8px;
      }
      .stage + .aside,
      .aside + .aside {
        margin-top: 10px;
        border-top: 1px solid var(--divider-color);
      }
      .aside .pic {
        height: 30px;
      }
      .aside .pic.placeholder ha-icon {
        --mdc-icon-size: 26px;
      }
      .aside-body {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 0;
      }
      .aside .bar {
        height: 5px;
      }
      .aside .bar .goal {
        top: -3px;
        bottom: -3px;
      }
      .aside .status {
        margin-left: 6px;
      }

      .nowrap {
        white-space: nowrap;
      }

      @container (max-width: 380px) {
        /* the target stays visible as the tick on the bar */
        .line .wide {
          display: none;
        }
        .line {
          grid-template-columns: 60px minmax(0, 1fr) 104px;
          gap: 10px;
        }
        .line .pic {
          height: 32px;
        }
        .stage {
          grid-template-columns: 38% minmax(0, 1fr);
          gap: 10px;
        }
        .stage .pic {
          height: 72px;
        }
        .big .soc {
          font-size: 1.5rem;
        }
      }
    `,
  ];
}

define(
  "charging-coordinator-vehicle-card-editor",
  simpleEditor(
    [
      TITLE_FIELD,
      {
        name: "layout",
        label: "Layout",
        selector: { select: { mode: "dropdown", options: LAYOUTS } },
      },
      PREFIX_FIELD,
    ],
    SLOTS,
  ),
);
define("charging-coordinator-vehicle-card", ChargingCoordinatorVehicleCard);
registerCard(
  "charging-coordinator-vehicle-card",
  "Charging Coordinator vehicles",
  "Your cars with picture, state of charge, target and whether they are plugged in",
);
