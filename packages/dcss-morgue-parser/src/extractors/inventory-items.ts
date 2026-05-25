/**
 * Inventory-items extractor for the equipment optimizer.
 *
 * Walks the Inventory section of a 0.33+ morgue, identifies each item
 * against the dcss-game-data registries, and produces ParsedItem
 * objects with pre-computed property contributions.
 *
 * This is distinct from the existing equipment extractor:
 *   - equipment.ts captures only worn/wielded items as raw text per slot.
 *   - inventory-items.ts captures EVERY item in inventory as a typed
 *     ParsedItem with structured contributions for the optimizer.
 *
 * Version gate: only runs for DCSS 0.33 and later. Older morgues use a
 * different artefact-display format that we don't aim to support here.
 */

import {
  isVersionBefore,
  parseArtefactBraces,
  WEAPON_BRANDS,
  ARMOR_EGOS,
  WEAPONS_BY_WPN,
  WEAPONS_BY_DISPLAY_NAME,
  ARMORS_BY_DISPLAY_NAME,
  JEWELRY_BY_DISPLAY_NAME,
  STAVES_BY_DISPLAY_NAME,
  UNRAND_BY_NAME,
  getMultiSlotOccupation,
  PROPERTIES,
  type ArmorBaseType,
  type Contribution,
  type ContributionMap,
  type ItemCategory,
  type ItemSlot,
  type JewelryBaseType,
  type ParsedItem,
  type ParsedItemArtefact,
  type ShieldBaseType,
  type StaffBaseType,
  type WeaponBaseType,
} from 'dcss-game-data';

/**
 * Minimum DCSS version that emits the structured artefact format the
 * optimizer relies on. Older morgues skip this extractor.
 */
export const MIN_INVENTORY_PARSE_VERSION = '0.33';

/**
 * Categories the inventory section uses as headers (e.g. "Hand Weapons").
 * Only categories the optimizer cares about are mapped here; others
 * (Missiles, Wands, Scrolls, Potions, Books, Miscellaneous, etc.) are
 * detected but their items are skipped.
 */
type RawInventoryCategory =
  | 'Hand Weapons'
  | 'Armour'
  | 'Magical Staves'
  | 'Jewellery'
  | 'OTHER';

/**
 * Parse the inventory section into ParsedItem objects. Returns null for
 * morgues older than MIN_INVENTORY_PARSE_VERSION or when the inventory
 * section is missing.
 */
export function extractInventoryItems(
  content: string,
  version: string | null,
): ParsedItem[] | null {
  if (!version) return null;
  if (isVersionBefore(version, MIN_INVENTORY_PARSE_VERSION)) return null;

  const section = findInventorySection(content);
  if (!section) return null;

  const items: ParsedItem[] = [];
  const lines = section.split('\n');

  let currentCategory: RawInventoryCategory = 'OTHER';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Category header lines have no leading whitespace and aren't items.
    if (!/^\s/.test(line) && !/^[a-zA-Z]\s*-\s/.test(trimmed)) {
      currentCategory = recognizeCategory(trimmed);
      continue;
    }

    // Item lines are " a - the foo of bar {...}".
    const itemMatch = /^\s+([a-zA-Z])\s*-\s*(.+?)\s*$/.exec(line);
    if (!itemMatch) continue;
    const id = itemMatch[1]!;
    const rawText = itemMatch[2]!;

    // Indented lines following an item line are description continuations
    // (origin note, property descriptions, "[staff of X]" marker, etc.).
    // We may need the [staff of X] marker for artefact staff identification.
    const continuation = collectContinuation(lines, i + 1);

    if (currentCategory === 'OTHER') continue;

    const parsed = parseItemLine(id, rawText, currentCategory, continuation);
    if (parsed) items.push(parsed);
  }

  return items;
}

/**
 * Find the bounds of the Inventory section. Mirrors the logic in
 * equipment.ts but exposed locally for independent evolution.
 */
function findInventorySection(content: string): string | null {
  const invMatch = /^\s*Inventory:?\s*$/m.exec(content);
  if (!invMatch) return null;
  const start = invMatch.index;

  const endMarkers = [
    '\nSkills:',
    '\n   Skills:',
    '\nYou had ',
    '\nYou knew ',
    '\nDungeon Overview',
    '\nMessage History',
    '\nNotes',
    '\nVanquished Creatures',
  ];

  let end = content.length;
  for (const marker of endMarkers) {
    const idx = content.indexOf(marker, start);
    if (idx !== -1 && idx < end) end = idx;
  }
  return content.slice(start, end);
}

function recognizeCategory(header: string): RawInventoryCategory {
  if (/^Hand Weapons$/i.test(header)) return 'Hand Weapons';
  if (/^Armour$/i.test(header)) return 'Armour';
  if (/^Magical Staves$/i.test(header)) return 'Magical Staves';
  if (/^Jewellery$/i.test(header)) return 'Jewellery';
  return 'OTHER';
}

/**
 * Read indented description lines after an item line, up to but not
 * including the next item or category header. Lines are trimmed of
 * leading whitespace.
 */
function collectContinuation(lines: string[], startIdx: number): string[] {
  const collected: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() === '') {
      // Blank lines can separate description blocks within an item;
      // keep going until we see a non-indented line or another item.
      continue;
    }
    if (!/^\s/.test(line)) break; // category header
    if (/^\s+[a-zA-Z]\s*-\s/.test(line)) break; // next item
    collected.push(line.trim());
  }
  return collected;
}

/**
 * Top-level dispatch: identify the item against the appropriate
 * registry, build a ParsedItem.
 */
function parseItemLine(
  id: string,
  rawText: string,
  category: RawInventoryCategory,
  continuation: string[],
): ParsedItem | null {
  const { stripped, enchant, braces, isArtefact, articleStripped, isEquipped } = preparseItem(rawText);

  // Unrand fast-path: match against the unrand registry by name.
  const unrand = lookupUnrand(stripped);

  switch (category) {
    case 'Hand Weapons':
      return parseWeaponItem(id, rawText, stripped, articleStripped, enchant, braces, isArtefact, isEquipped, unrand);
    case 'Magical Staves':
      return parseStaffItem(id, rawText, stripped, articleStripped, enchant, braces, isArtefact, isEquipped, unrand, continuation);
    case 'Armour':
      return parseArmorItem(id, rawText, stripped, articleStripped, enchant, braces, isArtefact, isEquipped, unrand);
    case 'Jewellery':
      return parseJewelryItem(id, rawText, stripped, articleStripped, enchant, braces, isArtefact, isEquipped, unrand, continuation);
  }
  return null;
}

interface PreparseResult {
  /**
   * Item name with leading article ('the ', 'a ', 'an ') stripped,
   * enchantment number removed, AND braces removed. Used for base-type
   * matching against display-name maps.
   */
  stripped: string;
  /**
   * Same as `stripped` but retains the descriptive 'of X' suffix; used
   * to extract egos/brands by name.
   */
  articleStripped: string;
  enchant: number;
  /** Brace contents (without `{` `}`), null if no braces. */
  braces: string | null;
  isArtefact: boolean;
  /** Quoted artefact name when present (e.g. 'Cryptic Augurer'). */
  artefactQuotedName?: string;
  /**
   * True if the morgue marked this item as currently equipped via a
   * `(worn)`, `(weapon)`, `(left hand)`, `(right hand)`, or
   * `(around neck)` suffix. False for items in inventory but not worn.
   */
  isEquipped: boolean;
}

/** Slot markers that indicate an item is currently equipped. */
const EQUIPPED_MARKERS = /\((worn|weapon|left hand|right hand|around neck|on left finger|on right finger|on left tentacle|on right tentacle|on \w+ finger|on \w+ tentacle|installed)\)/i;

/**
 * Strip leading article, enchantment, and braces from an item line.
 *
 * Examples:
 *   "the +5 quarterstaff of Hiorororua {rebuke, rC+ ...}"
 *     → stripped: "quarterstaff of Hiorororua"
 *       articleStripped: "+5 quarterstaff of Hiorororua"
 *       enchant: 5, braces: "rebuke, rC+ ...", isArtefact: true
 *
 *   "a +3 leather armour of fire resistance"
 *     → stripped: "leather armour of fire resistance"
 *       enchant: 3, braces: null, isArtefact: false
 *
 *   "a +0 pair of gloves of fire"
 *     → stripped: "pair of gloves of fire"
 *       enchant: 0, braces: null, isArtefact: false
 */
function preparseItem(rawText: string): PreparseResult {
  let text = rawText.trim();

  // Extract and strip braces.
  let braces: string | null = null;
  const braceMatch = /\{([^}]*)\}/.exec(text);
  if (braceMatch) {
    braces = braceMatch[1] ?? '';
    text = text.replace(braceMatch[0], '').trim();
  }

  // "the " prefix marks artefacts (named items); peel it off.
  let isArtefact = braces !== null;
  if (/^the\s+/i.test(text)) {
    text = text.replace(/^the\s+/i, '');
    isArtefact = true;
  } else if (/^a\s+/i.test(text)) {
    text = text.replace(/^a\s+/i, '');
  } else if (/^an\s+/i.test(text)) {
    text = text.replace(/^an\s+/i, '');
  }

  // Strip the "cursed " marker (Ashenzari mechanic; we don't model curse
  // effects, but the marker would otherwise block enchantment parsing).
  text = text.replace(/^cursed\s+/i, '');

  // Detect equipped markers BEFORE stripping them.
  const isEquipped = EQUIPPED_MARKERS.test(text);

  // Drop trailing slot markers like "(worn)", "(weapon)", "(left hand)", etc.
  text = text.replace(/\s*\([^)]+\)\s*$/g, '').trim();

  const articleStripped = text;

  // Extract enchantment.
  let enchant = 0;
  const enchantMatch = /^([+-]\d+)\s+/.exec(text);
  if (enchantMatch) {
    enchant = parseInt(enchantMatch[1]!, 10);
    text = text.replace(enchantMatch[0], '');
  }

  // Extract quoted artefact name (e.g. "Cryptic Augurer"). Without
  // stripping it, base-type lookup against display names would fail.
  let artefactQuotedName: string | undefined;
  const quotedMatch = /"([^"]+)"/.exec(text);
  if (quotedMatch) {
    artefactQuotedName = quotedMatch[1] ?? undefined;
    text = text.replace(quotedMatch[0], '').trim();
    isArtefact = true;
  }

  return {
    stripped: text.trim(),
    articleStripped,
    enchant,
    braces,
    isArtefact,
    artefactQuotedName,
    isEquipped,
  };
}

/**
 * Match an item description against the unrand registry.
 *
 * DCSS unrand names appear as "the X of Y" or "the Z" forms in the
 * morgue. The UNRAND_BY_NAME map is keyed by lowercase name without the
 * "the" prefix.
 */
function lookupUnrand(strippedName: string): ReturnType<typeof UNRAND_BY_NAME.get> | undefined {
  // strippedName has "the" already removed; enchant prefix removed.
  // The name itself may include "of Foo" or be a bare name; the
  // UNRAND_BY_NAME map keys on the exact morgue name in lowercase.
  // First try the full name; then try with leading word removed (some
  // unrand names omit the base type in their morgue display).
  const lc = strippedName.toLowerCase();
  const direct = UNRAND_BY_NAME.get(lc);
  if (direct) return direct;
  return undefined;
}

// ────────────────────────────────────────────────────────────────────────
// Weapons
// ────────────────────────────────────────────────────────────────────────

function parseWeaponItem(
  id: string,
  rawText: string,
  stripped: string,
  articleStripped: string,
  enchant: number,
  braces: string | null,
  _isArtefact: boolean,
  isEquipped: boolean,
  unrand: ReturnType<typeof UNRAND_BY_NAME.get>,
): ParsedItem | null {
  // For artefacts, we need to find the base weapon type. Strategy:
  //   - If unrand: use unrand.subType (e.g. WPN_DOUBLE_SWORD) →
  //     WEAPONS_BY_WPN. (We pull base by enum since the morgue text
  //     contains the artefact name, not the base type display.)
  //   - Otherwise: parse the "X of Y" pattern, where X may be a base
  //     weapon name and Y may be a brand.
  let baseType: WeaponBaseType | undefined;
  let brand: string | undefined;

  if (unrand?.objectClass === 'OBJ_WEAPONS') {
    baseType = lookupWeaponByEnum(unrand.subType);
  } else {
    const { base, suffix } = splitOfSuffix(stripped);
    baseType = WEAPONS_BY_DISPLAY_NAME.get(base.toLowerCase());
    if (suffix && WEAPON_BRANDS[suffix.toLowerCase()]) {
      brand = suffix.toLowerCase();
    } else if (suffix) {
      // Try the verbose ("flaming" → SPWPN_FLAMING). Need a reverse lookup.
      brand = lookupBrandByVerbose(suffix);
    }
  }

  // Randart fallback: stripped may include the artefact name (no quotes
  // form like 'falchion of Cryptic Augurer'). Scan for any known weapon
  // display name as a substring.
  if (!baseType) {
    baseType = findBaseBySubstring(stripped, WEAPONS_BY_DISPLAY_NAME);
  }

  if (!baseType) return null;

  const artefact = braces ? buildArtefact(braces, true, unrand) : undefined;
  if (artefact?.brand && !brand) {
    // Brand may have come from the brace leading token (e.g. {rebuke, ...}).
    brand = artefact.brand;
  }

  // Weapons always occupy the 'weapon' slot; WeaponBaseType doesn't carry it.
  const slots: ItemSlot[] = unrand
    ? (getMultiSlotOccupation(unrand.enumName) ?? ['weapon'])
    : ['weapon'];
  const contributions = aggregate(baseType, enchant, brand, undefined, artefact);
  applyEnchantContribution(contributions, enchant, 'weapon');

  void articleStripped; // currently unused but kept for symmetry
  return {
    id,
    rawText,
    category: 'weapon',
    baseType,
    slots,
    enchant,
    isEquipped,
    brand,
    artefact: artefact ? toParsedArtefact(artefact, unrand) : undefined,
    contributions,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Staves (magical)
// ────────────────────────────────────────────────────────────────────────

function parseStaffItem(
  id: string,
  rawText: string,
  stripped: string,
  _articleStripped: string,
  enchant: number,
  braces: string | null,
  _isArtefact: boolean,
  isEquipped: boolean,
  unrand: ReturnType<typeof UNRAND_BY_NAME.get>,
  continuation: string[],
): ParsedItem | null {
  let baseType: StaffBaseType | undefined;

  // Artefact staves have a [staff of X] marker on a description line.
  for (const desc of continuation) {
    const m = /^\[staff of (\w+)\]/i.exec(desc);
    if (m) {
      const stype = `staff of ${m[1]!.toLowerCase()}`;
      baseType = STAVES_BY_DISPLAY_NAME.get(stype);
      break;
    }
  }

  if (!baseType) {
    baseType = STAVES_BY_DISPLAY_NAME.get(stripped.toLowerCase());
  }
  if (!baseType && unrand?.objectClass === 'OBJ_STAVES') {
    baseType = STAVES_BY_DISPLAY_NAME.get(`staff of ${unrand.subType.replace(/^STAFF_/, '').toLowerCase()}`);
  }

  if (!baseType) return null;

  const artefact = braces ? buildArtefact(braces, true, unrand) : undefined;
  const brand = artefact?.brand;

  const contributions = aggregate(baseType, enchant, brand, undefined, artefact);
  applyEnchantContribution(contributions, enchant, 'staff');

  return {
    id,
    rawText,
    category: 'staff',
    baseType,
    slots: baseType.slots,
    enchant,
    isEquipped,
    brand,
    artefact: artefact ? toParsedArtefact(artefact, unrand) : undefined,
    contributions,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Armor (including shields)
// ────────────────────────────────────────────────────────────────────────

function parseArmorItem(
  id: string,
  rawText: string,
  stripped: string,
  _articleStripped: string,
  enchant: number,
  braces: string | null,
  _isArtefact: boolean,
  isEquipped: boolean,
  unrand: ReturnType<typeof UNRAND_BY_NAME.get>,
): ParsedItem | null {
  let baseType: ArmorBaseType | ShieldBaseType | undefined;
  let ego: string | undefined;

  if (unrand?.objectClass === 'OBJ_ARMOUR') {
    baseType = ARMORS_BY_DISPLAY_NAME.get(armorSubTypeToDisplayName(unrand.subType));
  } else {
    const { base, suffix } = splitOfSuffix(stripped);
    baseType = ARMORS_BY_DISPLAY_NAME.get(base.toLowerCase());
    if (suffix) {
      ego = lookupEgoByVerbose(suffix);
    }
  }

  // Randart fallback for armor.
  if (!baseType) {
    baseType = findBaseBySubstring(stripped, ARMORS_BY_DISPLAY_NAME);
  }

  if (!baseType) return null;

  const artefact = braces ? buildArtefact(braces, false, unrand) : undefined;

  const isShield = 'baseSH' in baseType;
  const category: ItemCategory = isShield ? 'shield' : 'armor';
  const slots: ItemSlot[] = unrand
    ? (getMultiSlotOccupation(unrand.enumName) ?? baseType.slots)
    : baseType.slots;
  const contributions = aggregate(baseType, enchant, undefined, ego, artefact);
  applyEnchantContribution(contributions, enchant, category);

  return {
    id,
    rawText,
    category,
    baseType,
    slots,
    enchant,
    isEquipped,
    ego,
    artefact: artefact ? toParsedArtefact(artefact, unrand) : undefined,
    contributions,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Jewelry
// ────────────────────────────────────────────────────────────────────────

function parseJewelryItem(
  id: string,
  rawText: string,
  stripped: string,
  _articleStripped: string,
  enchant: number,
  braces: string | null,
  _isArtefact: boolean,
  isEquipped: boolean,
  unrand: ReturnType<typeof UNRAND_BY_NAME.get>,
  continuation: string[],
): ParsedItem | null {
  let baseType: JewelryBaseType | undefined;

  // Randart jewelry has the base type revealed by an indented marker:
  //   c - the ring of Optimism {rPois rF+ rCorr}
  //      [ring of poison resistance]
  for (const desc of continuation) {
    const m = /^\[(ring|amulet)\s+of\s+(.+?)\]/i.exec(desc);
    if (m) {
      const display = `${m[1]!.toLowerCase()} of ${m[2]!.toLowerCase()}`;
      const candidate = JEWELRY_BY_DISPLAY_NAME.get(display);
      if (candidate) {
        baseType = candidate;
        break;
      }
    }
  }

  if (!baseType) {
    if (unrand?.objectClass === 'OBJ_JEWELLERY') {
      // Subtype is e.g. RING_FIRE; need to find matching base.
      const display = jewelrySubTypeToDisplayName(unrand.subType);
      if (display) baseType = JEWELRY_BY_DISPLAY_NAME.get(display.toLowerCase());
    } else {
      baseType = JEWELRY_BY_DISPLAY_NAME.get(stripped.toLowerCase());
    }
  }

  // Final fallback: substring scan against jewelry display names.
  if (!baseType) {
    baseType = findBaseBySubstring(stripped, JEWELRY_BY_DISPLAY_NAME);
  }

  if (!baseType) return null;

  const artefact = braces ? buildArtefact(braces, false, unrand) : undefined;
  // For randart jewelry, DCSS prints the *total* property values in the
  // brace (the base ring's innate effect is rolled in), so adding the
  // base type's innate contributions on top would double-count. Trust
  // the brace as authoritative when present.
  const contributions = artefact
    ? aggregate(baseType, enchant, undefined, undefined, artefact, { skipInnate: true })
    : aggregate(baseType, enchant, undefined, undefined, undefined);

  return {
    id,
    rawText,
    category: 'jewelry',
    baseType,
    slots: baseType.slots,
    enchant,
    isEquipped,
    artefact: artefact ? toParsedArtefact(artefact, unrand) : undefined,
    contributions,
  };
}

/**
 * Apply the item's enchantment (`+N` prefix) as a modifier on the
 * relevant property:
 *
 *   - Armor → AC + N
 *   - Shield → SH + N
 *   - Weapon → Slay + N (proxy for the per-weapon to-hit/damage bonus)
 *   - Staff → Slay + N (used as a melee weapon)
 *   - Jewelry → no implicit contribution (rings of evasion / slaying /
 *     protection / etc. already model this via `fromEnchant: 'plus'`
 *     contributions in jewelry.ts; rings whose enchant has no effect
 *     contribute nothing).
 */
function applyEnchantContribution(
  contributions: ContributionMap,
  enchant: number,
  category: ItemCategory,
): void {
  if (enchant === 0) return;
  switch (category) {
    case 'armor':
      contributions.AC = (contributions.AC ?? 0) + enchant;
      break;
    case 'shield':
      contributions.SH = (contributions.SH ?? 0) + enchant;
      break;
    case 'weapon':
    case 'staff':
      contributions.Slay = (contributions.Slay ?? 0) + enchant;
      break;
    case 'jewelry':
      break;
  }
}

// ────────────────────────────────────────────────────────────────────────
// Aggregation
// ────────────────────────────────────────────────────────────────────────

/**
 * Sum baseType.innateContributions + brand/ego contributions (with
 * enchantment scaling) + artefact properties into a single sparse map.
 */
function aggregate(
  baseType:
    | WeaponBaseType
    | ArmorBaseType
    | ShieldBaseType
    | JewelryBaseType
    | StaffBaseType,
  enchant: number,
  brand: string | undefined,
  ego: string | undefined,
  artefact: ArtefactInfo | undefined,
  options: { skipInnate?: boolean } = {},
): ContributionMap {
  const out: ContributionMap = {};

  // Base type innate contributions (jewelry, staves, some shields).
  if (!options.skipInnate) {
    const innate = baseTypeContributions(baseType);
    for (const c of innate) addContribution(out, c, enchant);
  }

  if (brand && WEAPON_BRANDS[brand]) {
    for (const c of WEAPON_BRANDS[brand]!.contributions) addContribution(out, c, enchant);
  }
  if (ego && ARMOR_EGOS[ego]) {
    for (const c of ARMOR_EGOS[ego]!.contributions) addContribution(out, c, enchant);
  }
  if (artefact) {
    for (const [prop, value] of Object.entries(artefact.properties)) {
      out[prop] = (out[prop] ?? 0) + value;
    }
  }

  return out;
}

function baseTypeContributions(
  baseType:
    | WeaponBaseType
    | ArmorBaseType
    | ShieldBaseType
    | JewelryBaseType
    | StaffBaseType,
): Contribution[] {
  if ('innateContributions' in baseType && baseType.innateContributions) {
    return baseType.innateContributions;
  }
  return [];
}

function addContribution(out: ContributionMap, c: Contribution, enchant: number): void {
  const delta = 'value' in c ? c.value : enchant;
  out[c.prop] = (out[c.prop] ?? 0) + delta;
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

interface ArtefactInfo {
  brand?: string;
  properties: Record<string, number>;
  unknownTokens: string[];
}

function buildArtefact(
  braceContents: string,
  expectBrand: boolean,
  _unrand: ReturnType<typeof UNRAND_BY_NAME.get>,
): ArtefactInfo {
  const parsed = parseArtefactBraces(braceContents, expectBrand);
  // Drop properties that map to legacy/hidden tokens we don't want to
  // contribute (currently none; PROPERTIES gates handle this).
  const properties: Record<string, number> = {};
  for (const [prop, value] of Object.entries(parsed.properties)) {
    if (value === undefined) continue;
    if (!PROPERTIES[prop]) continue;
    properties[prop] = value;
  }
  return {
    brand: parsed.brand,
    properties,
    unknownTokens: parsed.unknownTokens,
  };
}

function toParsedArtefact(
  info: ArtefactInfo,
  unrand: ReturnType<typeof UNRAND_BY_NAME.get>,
): ParsedItemArtefact {
  return {
    name: unrand?.name,
    properties: info.properties,
    isUnrand: !!unrand,
    unrandKey: unrand?.enumName,
  };
}

/**
 * Split "X of Y" into base name X and suffix Y. Returns suffix as
 * undefined if there's no " of " separator. Handles multiple " of "
 * sequences by greedy left split (e.g. "pair of gloves of fire" →
 * base "pair of gloves", suffix "fire").
 */
function splitOfSuffix(text: string): { base: string; suffix: string | undefined } {
  // Greedy: prefer the last " of " as the ego/brand separator.
  const lastOf = text.lastIndexOf(' of ');
  if (lastOf === -1) return { base: text, suffix: undefined };
  const base = text.slice(0, lastOf).trim();
  const suffix = text.slice(lastOf + 4).trim();
  // If base is something like "pair", we likely got "pair of gloves" — try
  // splitting again to find the real base.
  // For simplicity, accept the split and let base-type lookup fail if wrong.
  return { base, suffix };
}

function lookupWeaponByEnum(wpnEnum: string): WeaponBaseType | undefined {
  return WEAPONS_BY_WPN.get(wpnEnum);
}

/**
 * Find the longest base-type display name that occurs as a substring of
 * `text`. Used as a fallback for randart items where the artefact name
 * (e.g. 'of Ignis's Reproof', '"Cryptic Augurer"') is mixed with the
 * base type and a direct map lookup fails.
 */
function findBaseBySubstring<T>(
  text: string,
  byDisplayName: Map<string, T>,
): T | undefined {
  const lc = text.toLowerCase();
  let bestKey: string | undefined;
  let bestType: T | undefined;
  for (const [name, value] of byDisplayName) {
    if (lc.includes(name) && (!bestKey || name.length > bestKey.length)) {
      bestKey = name;
      bestType = value;
    }
  }
  return bestType;
}

function armorSubTypeToDisplayName(armEnum: string): string {
  // Quick mapping: ARM_PLATE_ARMOUR → "plate armour".
  // For dragon armors the morgue name differs ("fire dragon scales"); for
  // v1 we accept misses and fall back gracefully.
  return armEnum
    .replace(/^ARM_/, '')
    .toLowerCase()
    .replace(/_/g, ' ');
}

function jewelrySubTypeToDisplayName(jewEnum: string): string | null {
  // RING_PROTECTION_FROM_FIRE → 'ring of protection from fire'
  // AMU_REFLECTION → 'amulet of reflection'
  if (jewEnum.startsWith('RING_')) {
    return `ring of ${jewEnum.replace(/^RING_/, '').toLowerCase().replace(/_/g, ' ')}`;
  }
  if (jewEnum.startsWith('AMU_')) {
    return `amulet of ${jewEnum.replace(/^AMU_/, '').toLowerCase().replace(/_/g, ' ')}`;
  }
  return null;
}

function lookupBrandByVerbose(verbose: string): string | undefined {
  // Match the verboseName field on each brand. Linear scan is fine — ~25 brands.
  const lower = verbose.toLowerCase();
  for (const b of Object.values(WEAPON_BRANDS)) {
    if (b.displayName.toLowerCase() === lower) return b.key;
  }
  return undefined;
}

function lookupEgoByVerbose(verbose: string): string | undefined {
  const lower = verbose.toLowerCase();
  for (const e of Object.values(ARMOR_EGOS)) {
    if (e.displayName.toLowerCase() === lower) return e.key;
  }
  return undefined;
}
