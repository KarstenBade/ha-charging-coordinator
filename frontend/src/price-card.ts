import { css, html, nothing, svg, type TemplateResult } from "lit";
import {
  COLORS,
  CoordinatorCard,
  PREFIX_FIELD,
  TITLE_FIELD,
  baseStyles,
  define,
  formatPrice,
  num,
  pipeColor,
  registerCard,
  simpleEditor,
  type BaseConfig,
  type EntitySlot,
  type Hass,
} from "./common";

/**
 * Prices against the limit: today's (and, once published, tomorrow's) prices as bars,
 * the limit as a line, the hours that allow grid charging in green. The forecast is
 * read from the attributes of the source price sensor, which the coordinator's price
 * sensor names in its `source` attribute. Without a forecast, today's recorded prices
 * are shown instead.
 */

interface PricePoint {
  start: number; // ms
  end: number; // ms
  price: number;
}

/** Every entity the card uses; each can be mapped in the card's `entities`. */
const SLOTS: EntitySlot[] = [
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  // defaults to the sensor named in the price sensor's `source` attribute
  { key: "price_forecast", domain: "forecast", label: "Sensor with the price forecast" },
];

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const LIMIT_STEP = 0.01;
const HISTORY_REFRESH = 5 * 60_000;

// --- reading forecasts from common price integrations -----------------------

const TIME_KEYS = ["start", "start_time", "startsAt", "starts_at", "time", "from", "datetime", "hour"];
const END_KEYS = ["end", "end_time", "endsAt", "ends_at", "till", "to"];
const VALUE_KEYS = ["value", "price", "total", "price_per_kwh", "price_eur_per_kwh", "marketprice"];

function toTime(value: unknown): number | undefined {
  if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
  if (typeof value !== "string") return undefined;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : undefined;
}

function pick(item: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (item[k] !== undefined && item[k] !== null) return item[k];
  return undefined;
}

/**
 * Collects price points from any attribute that is a list of {start, value}-like
 * objects (Nord Pool `raw_today`/`raw_tomorrow`, ENTSO-e `prices`, EPEX Spot `data`,
 * Tibber-style `today`/`tomorrow`), or Nord Pool's plain `today`/`tomorrow` number
 * lists spread evenly over the day.
 */
function parseForecast(attributes: Record<string, unknown>): PricePoint[] {
  const byStart = new Map<number, PricePoint>();
  const add = (start: number, end: number | undefined, price: number) => {
    if (!byStart.has(start)) byStart.set(start, { start, end: end ?? NaN, price });
  };

  for (const [name, value] of Object.entries(attributes)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    if (value.every((v) => typeof v === "number")) {
      const offset = name === "today" ? 0 : name === "tomorrow" ? DAY : undefined;
      if (offset === undefined) continue;
      const midnight = new Date().setHours(0, 0, 0, 0) + offset;
      const slot = DAY / value.length;
      value.forEach((p: number, i) => add(midnight + i * slot, midnight + (i + 1) * slot, p));
      continue;
    }
    for (const item of value) {
      if (typeof item !== "object" || item === null) continue;
      const record = item as Record<string, unknown>;
      const start = toTime(pick(record, TIME_KEYS));
      const price = Number(pick(record, VALUE_KEYS));
      if (start === undefined || !Number.isFinite(price)) continue;
      add(start, toTime(pick(record, END_KEYS)), price);
    }
  }
  return closeIntervals([...byStart.values()]);
}

/** Sorts points and fills missing ends with the next start (or a typical slot). */
function closeIntervals(points: PricePoint[]): PricePoint[] {
  const sorted = points.sort((a, b) => a.start - b.start);
  const gaps = sorted.slice(1).map((p, i) => p.start - sorted[i].start).filter((g) => g > 0);
  const slot = gaps.length ? Math.min(...gaps) : HOUR;
  return sorted.map((p, i) => ({
    ...p,
    end: Number.isFinite(p.end) ? p.end : (sorted[i + 1]?.start ?? p.start + slot),
  }));
}

/** Today's recorded prices of the coordinator's own price sensor. */
async function fetchHistory(hass: Hass, entityId: string): Promise<PricePoint[]> {
  if (!hass.callWS) return [];
  const midnight = new Date().setHours(0, 0, 0, 0);
  const result = await hass.callWS<Record<string, Record<string, unknown>[]>>({
    type: "history/history_during_period",
    start_time: new Date(midnight).toISOString(),
    entity_ids: [entityId],
    minimal_response: true,
    no_attributes: true,
  });
  const points: PricePoint[] = [];
  for (const row of result[entityId] ?? []) {
    const price = Number(row.s ?? row.state);
    const at = toTime(row.lu ?? row.lc ?? row.last_updated ?? row.last_changed);
    if (at === undefined || !Number.isFinite(price)) continue;
    points.push({ start: Math.max(at, midnight), end: NaN, price });
  }
  const closed = closeIntervals(points);
  if (closed.length) closed[closed.length - 1].end = Date.now();
  return closed;
}

// --- the card -----------------------------------------------------------------

function clock(t: number): string {
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function duration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

class ChargingCoordinatorPriceCard extends CoordinatorCard {
  static properties = {
    ...CoordinatorCard.properties,
    _history: { state: true },
  };

  private _history: PricePoint[] = [];
  private _historyAt = 0;
  private _historyLoading = false;

  getCardSize(): number {
    return 4;
  }

  getGridOptions(): Record<string, number> {
    return { columns: 12, min_columns: 6 };
  }

  static getStubConfig(): Partial<BaseConfig> {
    return {};
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("charging-coordinator-price-card-editor");
  }

  private forecast(): PricePoint[] {
    const source =
      this._config?.entities?.price_forecast || this.entity("sensor", "price")?.attributes.source;
    const sourceEntity = typeof source === "string" ? this.hass?.states[source] : undefined;
    return sourceEntity ? parseForecast(sourceEntity.attributes) : [];
  }

  private maybeLoadHistory(): void {
    if (!this.hass || this._historyLoading || Date.now() - this._historyAt < HISTORY_REFRESH) return;
    this._historyLoading = true;
    fetchHistory(this.hass, this.entityId("sensor", "price"))
      .then((points) => (this._history = points))
      .catch((err) => console.warn("Loading price history failed", err))
      .finally(() => {
        this._historyAt = Date.now();
        this._historyLoading = false;
      });
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    if (!this.entity("number", "price_threshold")) return this.renderMissing("price_threshold");

    const limit = this.numberValue("price_threshold");
    const price = num(this.entity("sensor", "price"));
    const now = Date.now();
    const midnight = new Date().setHours(0, 0, 0, 0);

    let points = this.forecast().filter((p) => p.end > midnight && p.start < midnight + 2 * DAY);
    const hasForecast = points.some((p) => p.end > now);
    if (!hasForecast) {
      this.maybeLoadHistory();
      points = this._history;
    }
    const end = Math.max(midnight + DAY, ...points.map((p) => p.end));
    const tomorrow = end > midnight + DAY;

    return html`<ha-card>
      ${this._config.title ? html`<div class="title">${this._config.title}</div>` : nothing}
      <div class="spread">
        <div>
          <div class="label">${tomorrow ? "Prices today and tomorrow" : "Prices today"}</div>
          <div class="hint">${this.summary(points, limit, price, hasForecast)}</div>
        </div>
        <div class="row">
          <span class="value" title="Price limit">${formatPrice(limit)}</span>
          ${this.renderStepper("Price limit", (d) =>
            limit === undefined
              ? undefined
              : this.setNumber("price_threshold", Math.round((limit + d * LIMIT_STEP) * 1000) / 1000),
          )}
        </div>
      </div>
      ${points.length
        ? this.renderChart(points, limit, midnight, end, now)
        : html`<div class="empty">No prices yet today.</div>`}
      ${hasForecast
        ? nothing
        : html`<div class="hint note">
            Your price sensor doesn't provide a forecast, so only today's prices so far are shown.
          </div>`}
    </ha-card>`;
  }

  private summary(
    points: PricePoint[],
    limit: number | undefined,
    price: number | undefined,
    hasForecast: boolean,
  ): string {
    if (limit === undefined) return "";
    if (price !== undefined && price <= limit) return `Now ${formatPrice(price)}, at or below your limit`;
    if (!hasForecast) return price === undefined ? "" : `Now ${formatPrice(price)}, above your limit`;
    const now = Date.now();
    const next = points.find((p) => p.start >= now && p.price <= limit);
    if (!next) return "No upcoming price at or below your limit";
    let until = next.end;
    for (const p of points) if (p.start === until && p.price <= limit) until = p.end;
    return `At or below your limit from ${clock(next.start)}, for ${duration(until - next.start)}`;
  }

  private renderChart(
    points: PricePoint[],
    limit: number | undefined,
    start: number,
    end: number,
    now: number,
  ): TemplateResult {
    const W = 388;
    const H = 110;
    const prices = points.map((p) => p.price).concat(limit === undefined ? [] : [limit]);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    // start bars from just below the cheapest price so differences show; with negative
    // prices the zero line is the base
    const lo = min < 0 ? min : Math.max(0, min - (max - min) * 0.5 - 0.01);
    const hi = max + (max - lo) * 0.08;
    const base = min < 0 ? 0 : lo;
    const x = (t: number) => ((t - start) / (end - start)) * W;
    const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
    const cheapColor = pipeColor(COLORS.charger, 70);
    const otherColor = pipeColor(COLORS.home, 35);

    const bars = points.map((p) => {
      const x0 = x(Math.max(p.start, start));
      const x1 = x(Math.min(p.end, end));
      const width = Math.max(0.5, x1 - x0 - (x1 - x0 > 3 ? 1 : 0));
      const top = Math.min(y(p.price), y(base));
      const height = Math.max(1, Math.abs(y(p.price) - y(base)));
      const cheap = limit !== undefined && p.price <= limit;
      const current = p.start <= now && now < p.end;
      return svg`<rect class="bar ${p.end <= now ? "past" : ""} ${current ? "current" : ""}"
        x=${x0} y=${top} width=${width} height=${height} rx="1.5"
        style="fill: ${cheap ? cheapColor : otherColor}"
        @click=${() => this.setNumber("price_threshold", Math.round(p.price * 1000) / 1000)}>
        <title>${clock(p.start)} · ${formatPrice(p.price)} · tap to use as limit</title>
      </rect>`;
    });

    const span = end - start;
    const step = span > DAY ? 12 * HOUR : 6 * HOUR;
    const labels: { at: number; text: string }[] = [];
    for (let t = start; t <= end; t += step) {
      const text =
        t >= end ? "24" : t === start + DAY ? "tomorrow" : String(new Date(t).getHours());
      labels.push({ at: t, text });
    }

    return html`<div class="chart">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        ${bars}
        ${span > DAY
          ? svg`<line class="midnight" x1=${x(start + DAY)} x2=${x(start + DAY)} y1="0" y2=${H}></line>`
          : nothing}
        ${limit === undefined
          ? nothing
          : svg`<line class="limit" x1="0" x2=${W} y1=${y(limit)} y2=${y(limit)}></line>`}
      </svg>
      ${limit === undefined
        ? nothing
        : html`<span class="limit-label" style="top: ${(y(limit) / H) * 100}%">limit</span>`}
    </div>
    <div class="axis">
      ${labels.map(
        (l) => html`<span style="left: ${((l.at - start) / span) * 100}%">${l.text}</span>`,
      )}
    </div>`;
  }

  static styles = [
    baseStyles,
    css`
      .chart {
        position: relative;
        height: 110px;
        margin-top: 12px;
      }
      .chart svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .bar {
        cursor: pointer;
      }
      .bar.past {
        opacity: 0.45;
      }
      .bar.current {
        stroke: var(--primary-text-color);
        stroke-width: 1.5;
        vector-effect: non-scaling-stroke;
      }
      .limit {
        stroke: var(--primary-text-color);
        stroke-width: 1.5;
        stroke-dasharray: 4 3;
        vector-effect: non-scaling-stroke;
      }
      .midnight {
        stroke: var(--divider-color);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .limit-label {
        position: absolute;
        right: 0;
        transform: translateY(-120%);
        padding: 0 4px;
        border-radius: 4px;
        font-size: 0.7rem;
        background: var(--card-background-color, #fff);
      }
      .axis {
        position: relative;
        height: 16px;
        margin-top: 4px;
        font-size: 0.7rem;
        color: var(--secondary-text-color);
      }
      .axis span {
        position: absolute;
        transform: translateX(-50%);
        white-space: nowrap;
      }
      .axis span:first-child {
        transform: none;
      }
      .axis span:last-child {
        transform: translateX(-100%);
      }
      .empty {
        margin-top: 12px;
        color: var(--secondary-text-color);
      }
      .note {
        margin-top: 6px;
      }
    `,
  ];
}

define("charging-coordinator-price-card-editor", simpleEditor([TITLE_FIELD, PREFIX_FIELD], SLOTS));
define("charging-coordinator-price-card", ChargingCoordinatorPriceCard);
registerCard(
  "charging-coordinator-price-card",
  "Charging Coordinator prices",
  "Today's prices against the price limit",
);
