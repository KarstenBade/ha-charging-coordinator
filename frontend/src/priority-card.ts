import { css, html, nothing, type TemplateResult } from "lit";
import {
  CoordinatorCard,
  PREFIX_FIELD,
  TITLE_FIELD,
  baseStyles,
  define,
  num,
  registerCard,
  simpleEditor,
  type BaseConfig,
  type EntitySlot,
} from "./common";

/**
 * Battery priority: the home battery as a bar with its current level, styled like the
 * vehicle card's SoC bar (green fill, orange tick), and a triangle on top for `priority_soc`, the level up to which PV surplus charges the
 * battery before the car gets any. Drag the triangle, or focus it and use the arrow keys.
 */
type PriorityConfig = BaseConfig;

/** Every entity the card uses; each can be mapped in the card's `entities`. */
const SLOTS: EntitySlot[] = [
  { key: "priority_soc", domain: "number", label: "Battery first until (priority SoC)" },
  { key: "battery_soc", domain: "sensor", label: "Battery state of charge" },
];

const DRAG_SNAP = 5; // % steps while dragging; the keys move by 1

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

class ChargingCoordinatorPriorityCard extends CoordinatorCard<PriorityConfig> {
  static properties = {
    ...CoordinatorCard.properties,
    _drag: { state: true },
  };

  private _drag: number | null = null; // level while the triangle is dragged

  getCardSize(): number {
    return 1;
  }

  getGridOptions(): Record<string, number> {
    return { columns: 12, min_columns: 4, rows: 1 };
  }

  static getStubConfig(): Partial<PriorityConfig> {
    return {};
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("charging-coordinator-priority-card-editor");
  }

  private set(value: number): void {
    void this.setNumber("priority_soc", clamp(Math.round(value)));
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    const stored = this.numberValue("priority_soc");
    if (stored === undefined) return this.renderMissing("priority_soc");
    const level = clamp(Math.round(this._drag ?? stored));
    const soc = num(this.entity("sensor", "battery_soc"));
    const below = soc !== undefined && soc < level;
    const text =
      soc === undefined
        ? "Battery level unknown"
        : below
          ? `Battery at ${Math.round(soc)} %, below ${level} %: PV charges the battery first`
          : `Battery at ${Math.round(soc)} %: PV surplus can go to the car`;

    return html`<ha-card>
      ${this._config.title ? html`<div class="title">${this._config.title}</div>` : nothing}
      <div class="row" title=${text}>
        <div class="scale">
          ${this.renderHandle(level)}
          <div class="body">
            ${soc === undefined
              ? nothing
              : html`<div class="fill" style="width: ${clamp(soc)}%"></div>`}
            ${level > 0 ? html`<div class="line" style="left: ${level}%"></div>` : nothing}
          </div>
          <div class="nub"></div>
        </div>
        <span class="soc">${soc === undefined ? "–" : `${Math.round(soc)} %`}</span>
      </div>
    </ha-card>`;
  }

  private renderHandle(level: number): TemplateResult {
    const off = level <= 0;
    // keep the value next to the triangle inside the card at both ends
    const align = level < 12 ? "start" : level > 88 ? "end" : "center";
    return html`<div
      class="handle ${align} ${this._drag !== null ? "dragging" : ""}"
      style="left: ${level}%"
      role="slider"
      tabindex="0"
      aria-label="Battery first until"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${level}
      aria-valuetext=${off ? "off" : `${level} %`}
      @keydown=${(ev: KeyboardEvent) => {
        const steps: Record<string, number> = {
          ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10,
        };
        if (ev.key in steps) this.set(level + steps[ev.key]);
        else if (ev.key === "Home") this.set(0);
        else if (ev.key === "End") this.set(100);
        else return;
        ev.preventDefault();
      }}
      @pointerdown=${(ev: PointerEvent) => this.startDrag(ev)}
    >
      <span class="value-label">${off ? "Off" : `${level} %`}</span>
      <svg class="tri" viewBox="0 0 12 8" aria-hidden="true"><path d="M0 0H12L6 8Z" /></svg>
    </div>`;
  }

  private startDrag(ev: PointerEvent): void {
    const handle = ev.currentTarget as HTMLElement;
    const scale = handle.parentElement as HTMLElement;
    handle.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    handle.focus();
    const valueAt = (e: PointerEvent) => {
      const box = scale.getBoundingClientRect();
      const raw = clamp(((e.clientX - box.left) / box.width) * 100);
      return Math.round(raw / DRAG_SNAP) * DRAG_SNAP;
    };
    const move = (e: PointerEvent) => (this._drag = valueAt(e));
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      const value = this._drag;
      this._drag = null;
      if (value !== null) this.set(value);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  static styles = [
    baseStyles,
    css`
      /* the same colors as the vehicle card: green level, orange target */
      :host {
        --level: var(--success-color, #43a047);
        --target: var(--warning-color, #ff9800);
        --track: color-mix(in srgb, var(--secondary-text-color) 30%, var(--card-background-color, #fff));
      }
      ha-card {
        display: block;
        padding: 8px 16px 12px;
      }
      .title {
        margin: 4px 0 2px;
      }
      .row {
        display: flex;
        align-items: flex-end;
        gap: 14px;
      }
      /* the bar's width is the 0..100 % scale; the battery's nub sits outside it */
      .scale {
        position: relative;
        flex: 1;
        min-width: 0;
        margin-right: 6px;
        padding-top: 22px;
      }
      .body {
        position: relative;
        height: 28px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--track);
      }
      .fill {
        position: absolute;
        inset: 0 auto 0 0;
        background: var(--level);
        transition: width 0.3s;
      }
      .line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 3px;
        margin-left: -1.5px;
        background: var(--target);
      }
      /* the level as a number beside the battery, like the vehicle card's SoC */
      .soc {
        flex: none;
        min-width: 3.2em;
        text-align: right;
        font-size: 1.25rem;
        font-weight: 500;
        line-height: 28px;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .nub {
        position: absolute;
        right: -6px;
        bottom: 9px;
        width: 4px;
        height: 10px;
        border-radius: 0 3px 3px 0;
        background: var(--track);
      }

      /* the triangle with its value, dragged along the top edge */
      .handle {
        position: absolute;
        top: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 44px;
        margin-left: -22px;
        padding-bottom: 2px;
        cursor: grab;
        touch-action: none;
        outline: none;
      }
      .handle.dragging {
        cursor: grabbing;
      }
      .value-label {
        color: var(--target);
        font-size: 0.8rem;
        font-weight: 500;
        line-height: 1;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .handle.start .value-label {
        align-self: flex-start;
        margin-left: 16px;
      }
      .handle.end .value-label {
        align-self: flex-end;
        margin-right: 16px;
      }
      .tri {
        width: 14px;
        height: 9px;
        margin-top: 3px;
        fill: var(--target);
      }
      .handle:focus-visible .tri,
      .handle.dragging .tri {
        fill: var(--primary-color);
      }
      .handle:focus-visible .value-label {
        color: var(--primary-color);
      }
      @media (prefers-reduced-motion: reduce) {
        .fill {
          transition: none;
        }
      }
    `,
  ];
}

define(
  "charging-coordinator-priority-card-editor",
  simpleEditor([TITLE_FIELD, PREFIX_FIELD], SLOTS),
);
define("charging-coordinator-priority-card", ChargingCoordinatorPriorityCard);
registerCard(
  "charging-coordinator-priority-card",
  "Charging Coordinator battery priority",
  "Home battery level and the level up to which PV charges it before the car",
);
