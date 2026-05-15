/**
 * Type definitions for DCSS equipment data.
 *
 * These types are the foundation of the equipment optimizer feature.
 * See EQUIPMENT_OPTIMIZER_DESIGN.md for the conceptual model.
 *
 * Conventions:
 *   - All property values are signed integers in storage. Pips and bools
 *     are display concerns handled by `Property.rendering`.
 *   - Items expose a pre-computed `contributions` map after parsing, so
 *     the optimizer treats every item identically.
 *   - Source-of-truth references (`artpEnum`, `spwpnEnum`, `sparmEnum`)
 *     point back to DCSS C++ enums so the verify script can detect drift.
 */

/**
 * Canonical key for an item property as it appears in morgue braces.
 *
 * Examples: 'rF', 'rC', 'Str', 'Slay', 'SInv', 'Fly', '+Blink', '^Fragile'.
 *
 * Keys match the abbreviation strings emitted by DCSS's `artp_name()`
 * (artefact.cc) verbatim, including any leading sigil ('+', '^', '*', '-').
 */
export type PropertyKey = string;

/**
 * Semantic grouping of properties for UI organization and optimizer
 * objectives. Unrelated to DCSS internals — this is our taxonomy.
 */
export type PropertyCategory =
  /** rF, rC, rN, rPois, rElec, rCorr, rMut */
  | 'resistance'
  /** Str, Int, Dex */
  | 'stat'
  /** AC, EV, SH */
  | 'defense'
  /** Slay, BaseAcc, BaseDam */
  | 'offense'
  /** HP, MP */
  | 'pool'
  /** Regen, RegenMP */
  | 'regen'
  /** Stlth, Will, SInv, Fly, +Blink, Harm, Acrobat, Rampage, Clar, etc. */
  | 'utility'
  /** Conj, Hexes, Summ, Necro, Tloc, Fire, Ice, Air, Earth, Alch, Forge */
  | 'spell_school'
  /** Wiz, Archmagi */
  | 'wizardry'
  /** Drain, Slow, Angry, Fragile, Contam, NoPotionHeal, Ponderous, etc. */
  | 'downside';

/**
 * How a property value is displayed in morgue braces, and therefore how
 * the parser tokenizes it.
 *
 * DCSS uses `prop_note` for this (describe.cc): numeral, symbolic, plain.
 */
export type PropertyRendering =
  /** Explicit signed number, e.g. 'Str+3', 'Slay-2', 'AC+4'. */
  | 'int'
  /** Pip indicators, e.g. 'rF+', 'rC++', 'Will-'. Each pip = ±1. */
  | 'pip'
  /** Presence only, no value, e.g. 'SInv', 'Fly', '+Blink'. */
  | 'bool';

/**
 * The set of value semantics DCSS allows for a property.
 * Mirrors `ARTP_VAL_*` in artefact.cc.
 */
export type PropertyValueType =
  /** Signed integer (positive or negative). */
  | 'any'
  /** Strictly boolean (0 or 1). */
  | 'bool'
  /** Positive integer only. */
  | 'positive'
  /** Holds a brand reference, not a value (only ARTP_BRAND). */
  | 'brand';

export interface Property {
  /** Canonical abbreviation as it appears in morgue braces, e.g. 'rF'. */
  key: PropertyKey;
  /** Human-readable name, e.g. 'Fire Resistance'. */
  displayName: string;
  /** Semantic category for UI grouping. */
  category: PropertyCategory;
  /** How the property is rendered in morgue text and parsed. */
  rendering: PropertyRendering;
  /** Whether the property can take negative values. */
  bipolar: boolean;
  /** Aggregation cap from equipment alone (mirrors DCSS runtime caps). */
  cap?: { min?: number; max?: number };
  /** ARTP_* enum name in DCSS, if this property maps to an ARTP. */
  artpEnum?: string;
  /** DCSS source location for traceability. */
  source?: { file: string; line: number };
  /**
   * True if the property is only kept for save-file compat with old major
   * versions (DCSS TAG_MAJOR_VERSION == 34 guard). Modern morgues won't
   * include these; the optimizer ignores them.
   */
  legacy?: boolean;
  /** Brief in-game description (useful for UI tooltips). */
  description?: string;
}

/**
 * A single property contribution from a brand, ego, base type, or
 * artefact's `{...}` block.
 */
export type Contribution =
  /** Fixed value, e.g. `{ prop: 'rF', value: 1 }` for SPARM_FIRE_RESISTANCE. */
  | { prop: PropertyKey; value: number }
  /**
   * Value comes from the item's enchantment (`plus`) at parse time.
   * Examples: ring of evasion, ring of slaying, ring of protection.
   */
  | { prop: PropertyKey; fromEnchant: 'plus' };

/**
 * A weapon brand (mutually exclusive per weapon).
 * One of ~25 values defined by `enum brand_type` in item-prop-enum.h.
 */
export interface WeaponBrand {
  /** Lowercase key as it appears as the leading token in artefact braces. */
  key: string;
  /** DCSS C++ enum name, e.g. 'SPWPN_FLAMING'. */
  spwpnEnum: string;
  /** Display name, e.g. 'flaming'. */
  displayName: string;
  /**
   * Property contributions, if any. Most brands have purely on-hit
   * behaviors that don't aggregate cleanly; those go in `notes`.
   */
  contributions: Contribution[];
  /** Human-readable note for behaviors that aren't pure contributions. */
  notes?: string;
  legacy?: boolean;
}

/**
 * An armor ego (mutually exclusive per armor piece).
 * One of 47 values defined by `enum special_armour_type` in item-prop-enum.h.
 */
export interface ArmorEgo {
  /** Internal key, e.g. 'fire_resistance'. */
  key: string;
  /** DCSS C++ enum name, e.g. 'SPARM_FIRE_RESISTANCE'. */
  sparmEnum: string;
  /** Display name as it appears in item descriptions. */
  displayName: string;
  /** Slots this ego can appear on. Empty = any armor slot. */
  validSlots: ItemSlot[];
  contributions: Contribution[];
  legacy?: boolean;
}

/** The set of equipment slots, mapped from DCSS's `equipment-slot.h`. */
export type ItemSlot =
  | 'weapon'
  | 'offhand'
  | 'body_armour'
  | 'helmet'
  | 'gloves'
  | 'boots'
  | 'barding'
  | 'cloak'
  | 'ring'
  | 'amulet'
  | 'gizmo';

export interface WeaponBaseType {
  key: string;
  displayName: string;
  /** 1 for one-handed, 2 for two-handed. */
  hands: 1 | 2;
  /** Weapon skill (long_blades, axes, etc.) for future scoring. */
  skill: string;
}

export interface ArmorBaseType {
  key: string;
  displayName: string;
  /**
   * Normally a single slot. Multi-slot unrands (e.g. Lear's Hauberk)
   * list all occupied slots.
   */
  slots: ItemSlot[];
  baseAC: number;
}

export interface ShieldBaseType {
  key: string;
  displayName: string;
  /** Always ['offhand']. */
  slots: ['offhand'];
  baseSH: number;
  /**
   * Built-in contributions like tower-shield spell-success penalty.
   * Modeled as a negative-valued Contribution on a curated property;
   * the optimizer doesn't special-case shields.
   */
  innateContributions?: Contribution[];
}

export interface JewelryBaseType {
  key: string;
  displayName: string;
  slots: ['ring'] | ['amulet'];
  innateContributions: Contribution[];
}

export interface StaffBaseType {
  key: string;
  displayName: string;
  slots: ['weapon'];
  hands: 1;
  innateContributions: Contribution[];
}

/** Per-slot capacity for a species. Slots not listed default to 0. */
export type SlotCapacity = Partial<Record<ItemSlot, number>>;

export interface SpeciesEquipmentRules {
  /** Two-letter species code, matching `Species.code`. */
  speciesCode: string;
  /** Slot capacities. */
  capacity: SlotCapacity;
  /** Universal: a two-handed weapon blocks the offhand slot. */
  twoHanderBlocksOffhand: boolean;
  /** Free-form note (Coglin gizmo logic, etc.). */
  notes?: string;
}

/**
 * Multi-slot unrand registry entry. The parser overrides the item's
 * `slots` based on this lookup when it identifies a multi-slot unrand.
 */
export interface MultiSlotUnrand {
  unrandKey: string;
  displayName: string;
  occupiedSlots: ItemSlot[];
  /** Optional override of the base type's innate contributions. */
  innateContributions?: Contribution[];
}

/** Top-level category for a parsed equipment item. */
export type ItemCategory = 'weapon' | 'armor' | 'shield' | 'jewelry' | 'staff';

/**
 * Aggregated property map keyed by morgue-brace abbreviation. Sparse —
 * only properties actually contributed by the item appear here. All
 * values are signed integers (rendering is a display concern).
 */
export type ContributionMap = Partial<Record<PropertyKey, number>>;

/**
 * Artefact metadata for a parsed item.
 */
export interface ParsedItemArtefact {
  /** Artefact name if explicit, e.g. 'Hiorororua' or 'Lear's hauberk'. */
  name?: string;
  /** Properties from the `{...}` braces (excluding the weapon brand). */
  properties: ContributionMap;
  /** True for fixed unrandarts; false for randomly generated randarts. */
  isUnrand: boolean;
  /** UNRAND_* key when isUnrand is true. */
  unrandKey?: string;
}

/**
 * A parsed inventory item with pre-computed contributions. The
 * optimizer treats every item identically through this shape —
 * `contributions` is the canonical sum of base-type innate effects,
 * brand/ego contributions, and artefact properties.
 */
export interface ParsedItem {
  /** Inventory letter, e.g. 'a', 'B'. */
  id: string;
  /** First-line raw text from the morgue (without indentation). */
  rawText: string;
  category: ItemCategory;
  /** Looked up against the relevant base-type registry. */
  baseType:
    | WeaponBaseType
    | ArmorBaseType
    | ShieldBaseType
    | JewelryBaseType
    | StaffBaseType;
  /**
   * Slots occupied when equipped. Copy of baseType.slots for typical
   * items; overridden for multi-slot unrands like Lear's hauberk.
   */
  slots: ItemSlot[];
  /** Enchantment value parsed from '+N' prefix; 0 if unenchantable. */
  enchant: number;
  /**
   * True when this item is currently equipped (per the morgue's
   * `(worn)`, `(weapon)`, `(left hand)`, `(right hand)`, `(around neck)`
   * markers). Used by callers that want to derive the player's
   * non-equipment baseline by subtracting equipped contributions from
   * runtime totals.
   */
  isEquipped: boolean;
  /** Weapon brand key (mutually exclusive with ego). */
  brand?: string;
  /** Armor ego key (mutually exclusive with brand). */
  ego?: string;
  artefact?: ParsedItemArtefact;
  /**
   * Pre-computed sum of baseType.innateContributions, brand/ego
   * contributions (with enchant scaling), and artefact properties.
   */
  contributions: ContributionMap;
}
