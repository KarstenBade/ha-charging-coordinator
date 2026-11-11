import { LitElement, css, html, nothing, type TemplateResult } from "lit";

// --- Home Assistant types (only what the cards use) ------------------------

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface Hass {
  states: Record<string, HassEntity | undefined>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
  callWS?<T>(message: Record<string, unknown>): Promise<T>;
}

export interface BaseConfig {
  type: string;
  title?: string;
  prefix?: string;
  // slot -> entity id, for entities other than the coordinator's own
  entities?: Record<string, string>;
}

/** An entity a card reads or controls; defaults to `<domain>.<prefix>_<key>`. */
export interface EntitySlot {
  key: string;
  domain: string;
  label: string;
}

// entity types a slot accepts, so helpers can stand in for the integration's entities
const SLOT_DOMAINS: Record<string, string[]> = {
  sensor: ["sensor", "input_number"],
  binary_sensor: ["binary_sensor", "input_boolean"],
  select: ["select", "input_select"],
  number: ["number", "input_number"],
  switch: ["switch", "input_boolean"],
  forecast: ["sensor"], // any sensor whose attributes hold the prices
};

function domainOf(entityId: string): string {
  return entityId.split(".")[0];
}

export interface Option {
  value: string;
  label: string;
  icon: string;
}

export interface ModeOption extends Option {
  icons: string[]; // icons for the large mode buttons
  color: string;
  description: string;
}

export const CHARGE_MODES: ModeOption[] = [
  {
    value: "off",
    label: "Off",
    icon: "mdi:power",
    icons: ["mdi:power"],
    color: "var(--secondary-text-color, #727272)",
    description: "The car doesn't charge.",
  },
  {
    value: "smart",
    label: "Smart",
    icon: "mdi:auto-fix",
    icons: ["mdi:auto-fix"],
    color: "var(--primary-color, #03a9f4)",
    description: "Charges only when it's worth it. Pick which reasons count.",
  },
  {
    value: "now",
    label: "Now",
    icon: "mdi:lightning-bolt",
    icons: ["mdi:lightning-bolt"],
    color: "var(--error-color, #db4437)",
    description: "Charges at full power right away, from PV, battery and grid alike.",
  },
];

export interface SmartSource {
  key: "smart_pv" | "smart_price";
  label: string;
  icon: string;
  color: string;
  description: string;
}

/** What smart mode may charge from; each is a switch of the integration. */
export const SMART_SOURCES: SmartSource[] = [
  {
    key: "smart_pv",
    label: "PV surplus",
    icon: "mdi:solar-power",
    color: "var(--energy-solar-color, #ff9800)",
    description: "Charge with power that would otherwise be exported.",
  },
  {
    key: "smart_price",
    label: "Cheap price",
    icon: "mdi:tag",
    color: "var(--success-color, #43a047)",
    description: "Also charge from the grid while the price is at or below the limit.",
  },
];

export const COLORS: Record<string, string> = {
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

/** A color mixed into the card background: opaque, so overlaps leave no seams. */
export function pipeColor(color: string, amount = 55): string {
  return `color-mix(in srgb, ${color} ${amount}%, var(--card-background-color, #fff))`;
}

// --- formatting -------------------------------------------------------------

const POWER_FACTORS: Record<string, number> = { kW: 1000, MW: 1_000_000 };

/** A numeric state; power in kW or MW is converted to W, as the cards expect W. */
export function num(entity: HassEntity | undefined): number | undefined {
  if (!entity) return undefined;
  const value = Number(entity.state);
  if (!Number.isFinite(value)) return undefined;
  const unit = entity.attributes.unit_of_measurement;
  return typeof unit === "string" && unit in POWER_FACTORS ? value * POWER_FACTORS[unit] : value;
}

export function formatPower(watts: number | undefined): string {
  if (watts === undefined) return "–";
  const abs = Math.abs(watts);
  return abs >= 1000 ? `${(watts / 1000).toFixed(1)} kW` : `${Math.round(watts)} W`;
}

export function formatPrice(price: number | undefined): string {
  return price === undefined ? "–" : price.toFixed(3);
}

// --- vehicles -----------------------------------------------------------------

/** A car as set up in the integration, with its current values. */
export interface Vehicle {
  name: string;
  connected: boolean; // its own template, so two cars can both be true
  soc?: number;
  target?: number;
  range?: number;
  rangeUnit?: string;
  image?: string;
  socEntity?: string;
}

interface VehicleAttribute {
  name?: string;
  connected?: boolean;
  soc_entity?: string | null;
  target_soc_entity?: string | null;
  range_entity?: string | null;
  image?: string | null;
}

/** The cars listed in the integration's connected vehicle sensor. */
export function readVehicles(hass: Hass, sensor: HassEntity | undefined): Vehicle[] {
  const list = sensor?.attributes.vehicles;
  if (!Array.isArray(list)) return [];
  const value = (id: string | null | undefined) => (id ? num(hass.states[id]) : undefined);
  return (list as VehicleAttribute[]).map((v, i) => {
    const range = v.range_entity ? hass.states[v.range_entity] : undefined;
    return {
      name: v.name || `Vehicle ${i + 1}`,
      connected: v.connected === true,
      soc: value(v.soc_entity),
      target: value(v.target_soc_entity),
      range: num(range),
      rangeUnit: (range?.attributes.unit_of_measurement as string | undefined) ?? "km",
      image: v.image || undefined,
      socEntity: v.soc_entity || undefined,
    };
  });
}

// --- base card ----------------------------------------------------------------

const PENDING_MS = 4000; // how long a value set in the card wins over a stale state

/**
 * Card bound to the coordinator's entities (`<domain>.<prefix>_<key>`); any of them can
 * be replaced through `entities: {<key>: <entity id>}`. Services are called for the
 * entity's own type, so e.g. an input_number works where a number is expected.
 */
export class CoordinatorCard<C extends BaseConfig = BaseConfig> extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  hass?: Hass;
  protected _config?: C;
  // values set here until Home Assistant reports them, so quick taps add up
  private _pending = new Map<string, { value: number; until: number }>();

  setConfig(config: C): void {
    this._config = { prefix: "charging_coordinator", ...config };
  }

  protected entityId(domain: string, key: string): string {
    return this._config?.entities?.[key] || `${domain}.${this._config?.prefix}_${key}`;
  }

  protected entity(domain: string, key: string): HassEntity | undefined {
    return this.hass?.states[this.entityId(domain, key)];
  }

  /** A number setting, including a value just set in the card. */
  protected numberValue(key: string): number | undefined {
    const state = num(this.entity("number", key));
    const pending = this._pending.get(key);
    if (pending && Date.now() < pending.until && pending.value !== state) return pending.value;
    this._pending.delete(key);
    return state;
  }

  protected async setNumber(key: string, value: number): Promise<void> {
    const entity = this.entity("number", key);
    const min = Number(entity?.attributes.min ?? -Infinity);
    const max = Number(entity?.attributes.max ?? Infinity);
    const clamped = Math.min(max, Math.max(min, value));
    this._pending.set(key, { value: clamped, until: Date.now() + PENDING_MS });
    this.requestUpdate();
    const entityId = this.entityId("number", key);
    await this.hass?.callService(domainOf(entityId), "set_value", {
      entity_id: entityId,
      value: clamped,
    });
  }

  protected async selectOption(key: string, option: string): Promise<void> {
    const entityId = this.entityId("select", key);
    await this.hass?.callService(domainOf(entityId), "select_option", {
      entity_id: entityId,
      option,
    });
  }

  protected async toggle(key: string, on: boolean): Promise<void> {
    const entityId = this.entityId("switch", key);
    await this.hass?.callService(domainOf(entityId), on ? "turn_on" : "turn_off", {
      entity_id: entityId,
    });
  }

  /** Shown instead of the card when the integration's entities are missing. */
  protected renderMissing(key: string): TemplateResult {
    return html`<ha-card>
      <div class="missing">
        Charging Coordinator entities not found (looked for ${this.entityId("…", key)}).
        Check the entity prefix in the card settings.
      </div>
    </ha-card>`;
  }

  protected renderStepper(
    label: string,
    onStep: (direction: -1 | 1) => void,
  ): TemplateResult {
    return html`<span class="stepper" role="group" aria-label=${label}>
      <button aria-label="Lower ${label.toLowerCase()}" @click=${() => onStep(-1)}>
        <ha-icon .icon=${"mdi:minus"}></ha-icon>
      </button>
      <button aria-label="Raise ${label.toLowerCase()}" @click=${() => onStep(1)}>
        <ha-icon .icon=${"mdi:plus"}></ha-icon>
      </button>
    </span>`;
  }
}

export const baseStyles = css`
  ha-card {
    padding: 14px 16px;
  }
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  ha-icon {
    --mdc-icon-size: 20px;
  }
  .title {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 10px;
  }
  .missing {
    color: var(--error-color);
  }
  .muted {
    color: var(--secondary-text-color);
  }
  .label {
    font-weight: 500;
  }
  .hint {
    font-size: 0.82rem;
    color: var(--secondary-text-color);
  }
  .value {
    font-size: 1.15rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .spread {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--divider-color);
  }
  .stepper {
    display: inline-flex;
    flex: none;
    border: 1px solid var(--divider-color);
    border-radius: 18px;
    overflow: hidden;
  }
  .stepper button {
    display: grid;
    place-items: center;
    width: 38px;
    height: 32px;
    border: none;
    background: var(--secondary-background-color, transparent);
  }
  .stepper button + button {
    border-left: 1px solid var(--divider-color);
  }
  .stepper ha-icon {
    --mdc-icon-size: 18px;
  }
  .switch {
    position: relative;
    flex: none;
    width: 36px;
    height: 20px;
    border: none;
    border-radius: 10px;
    background: var(--disabled-color, #9e9e9e);
    opacity: 0.8;
  }
  .switch::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    transition: left 0.15s;
  }
  .switch[aria-checked="true"] {
    background: var(--primary-color);
    opacity: 1;
  }
  .switch[aria-checked="true"]::after {
    left: 18px;
  }
  @media (prefers-reduced-motion: reduce) {
    .switch::after {
      transition: none;
    }
  }
`;

// --- editor -------------------------------------------------------------------

/** ha-form is loaded lazily by HA; creating a built-in card editor loads it. */
export async function loadHaForm(): Promise<void> {
  if (customElements.get("ha-form")) return;
  const helpers = await (
    window as unknown as {
      loadCardHelpers?: () => Promise<{ createCardElement(c: object): Promise<HTMLElement> }>;
    }
  ).loadCardHelpers?.();
  const card = await helpers?.createCardElement({ type: "entities", entities: [] });
  await (card?.constructor as unknown as { getConfigElement?: () => Promise<unknown> })
    ?.getConfigElement?.();
}

export interface EditorField {
  name: string;
  label: string;
  selector: Record<string, unknown>;
}

/** The collapsible "Entities" part of an editor: one entity picker per slot. */
export function entitiesSchema(slots: EntitySlot[]): Record<string, unknown> {
  return {
    type: "expandable",
    name: "entities",
    title: "Entities",
    schema: slots.map((s) => ({
      name: s.key,
      selector: { entity: { domain: SLOT_DOMAINS[s.domain] ?? [s.domain] } },
    })),
  };
}

/** Label and helper text for the entity pickers. */
export function entityLabels(
  slots: EntitySlot[],
  prefix: string | undefined,
): { label: (name: string) => string | undefined; helper: (name: string) => string | undefined } {
  const bySlot = new Map(slots.map((s) => [s.key, s]));
  return {
    label: (name) => bySlot.get(name)?.label,
    helper: (name) => {
      const slot = bySlot.get(name);
      if (!slot) return undefined;
      if (slot.domain === "forecast") return "Default: the price sensor's source";
      return `Default: ${slot.domain}.${prefix || "charging_coordinator"}_${slot.key}`;
    },
  };
}

/** Drops empty entity slots, and the whole map when nothing is mapped. */
export function cleanEntities(
  value: unknown,
): Record<string, string> | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (e): e is [string, string] => typeof e[1] === "string" && e[1] !== "",
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}

/** A card editor for flat options (title, prefix, switches) and entity slots. */
export function simpleEditor(fields: EditorField[], slots: EntitySlot[] = []): CustomElementConstructor {
  const schema: Record<string, unknown>[] = fields.map(({ name, selector }) => ({ name, selector }));
  if (slots.length) schema.push(entitiesSchema(slots));
  const labels = Object.fromEntries(fields.map((f) => [f.name, f.label]));

  return class extends LitElement {
    static properties = { hass: { attribute: false }, _config: { state: true } };
    hass?: Hass;
    _config?: Record<string, unknown>;

    setConfig(config: Record<string, unknown>): void {
      this._config = config;
    }

    connectedCallback(): void {
      super.connectedCallback();
      void loadHaForm().then(() => this.requestUpdate());
    }

    private changed(ev: CustomEvent<{ value: Record<string, unknown> }>): void {
      const config: Record<string, unknown> = { ...this._config };
      for (const f of fields) {
        const value = ev.detail.value[f.name];
        if (value === undefined || value === "" || value === false) delete config[f.name];
        else config[f.name] = value;
      }
      const entities = cleanEntities(ev.detail.value.entities);
      if (entities) config.entities = entities;
      else delete config.entities;
      this._config = config;
      this.dispatchEvent(
        new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }),
      );
    }

    protected render() {
      if (!this.hass || !this._config) return nothing;
      const slotText = entityLabels(slots, this._config.prefix as string | undefined);
      return html`<ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        .computeLabel=${(s: { name: string }) => labels[s.name] ?? slotText.label(s.name) ?? s.name}
        .computeHelper=${(s: { name: string }) => slotText.helper(s.name)}
        @value-changed=${this.changed}
      ></ha-form>`;
    }
  };
}

export const TITLE_FIELD: EditorField = {
  name: "title",
  label: "Title (optional)",
  selector: { text: {} },
};
export const PREFIX_FIELD: EditorField = {
  name: "prefix",
  label: "Entity prefix (only if you renamed the integration's entities)",
  selector: { text: {} },
};

// --- registration -------------------------------------------------------------

// The bundle may be loaded twice, e.g. by the integration and by a manually added
// dashboard resource. Defining an element twice throws, which would stop this module
// before the rest is registered. So existing ones are kept.
export function define(name: string, element: CustomElementConstructor): void {
  if (customElements.get(name)) {
    console.info(`${name} is already defined, keeping the first loaded version`);
    return;
  }
  customElements.define(name, element);
}

/** Lists a card in the dashboard's card picker. */
export function registerCard(type: string, name: string, description: string): void {
  const cards = ((window as unknown as { customCards?: { type: string }[] }).customCards ??= []);
  if (cards.some((c) => c.type === type)) return;
  cards.push({
    type,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/KarstenBade/ha-charging-coordinator",
  } as { type: string });
}
