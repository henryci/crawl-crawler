/**
 * Multi-slot unrand registry.
 *
 * Two distinct mechanics exist in DCSS:
 *
 * 1. Items that OCCUPY multiple slots when equipped (Lear's hauberk
 *    fills body armor + helmet + gloves + boots simultaneously).
 *
 * 2. Items that GRANT extra slots while equipped (Skull of Zonguldrok
 *    adds a helmet slot, macabre finger necklace adds a ring slot,
 *    etc.).
 *
 * Both are modeled here. For mechanic (1) the parser overrides the
 * item's `slots` to the full occupied set, and the optimizer's
 * capacity check deducts each slot. For mechanic (2), use
 * `effectiveCapacity(rules, items)` to derive the per-slot capacity
 * for the player after applying any equipped slot-granters; callers
 * that previously read `rules.capacity[slot]` directly should switch
 * to that helper so granters are honored everywhere.
 *
 * The list below is intended to be exhaustive for the pinned DCSS
 * source; new entries belong here.
 *
 * Source-of-truth references are in `player-equip.cc::_use_slots(...)`
 * calls and the `BOOL: special` flag in art-data.txt entries.
 */

import type {
  ItemSlot,
  MultiSlotUnrand,
  ParsedItem,
  SlotCapacity,
  SpeciesEquipmentRules,
} from './types.js';

interface MultiSlotEntry extends MultiSlotUnrand {
  /**
   * If set, this unrand doesn't occupy multiple slots but instead grants
   * the wearer +N capacity in a specific slot. Not yet consumed by the
   * optimizer; recorded for future work.
   */
  grantsExtraSlots?: { slot: ItemSlot; count: number };
}

export const MULTI_SLOT_UNRANDS: Record<string, MultiSlotEntry> = {
  // ─── Items that occupy multiple slots ───
  UNRAND_LEAR: {
    unrandKey: 'UNRAND_LEAR',
    displayName: "Lear's hauberk",
    occupiedSlots: ['body_armour', 'helmet', 'gloves', 'boots'],
  },

  // ─── Items that grant extra slots (not yet consumed by optimizer) ───
  UNRAND_SKULL_OF_ZONGULDROK: {
    unrandKey: 'UNRAND_SKULL_OF_ZONGULDROK',
    displayName: 'skull of Zonguldrok',
    occupiedSlots: ['helmet'],
    grantsExtraSlots: { slot: 'helmet', count: 1 },
  },
  UNRAND_FISTICLOAK: {
    unrandKey: 'UNRAND_FISTICLOAK',
    displayName: 'Fisticloak',
    occupiedSlots: ['cloak'],
    grantsExtraSlots: { slot: 'gloves', count: 1 },
  },
  UNRAND_FINGER_AMULET: {
    unrandKey: 'UNRAND_FINGER_AMULET',
    displayName: 'macabre finger necklace',
    occupiedSlots: ['amulet'],
    grantsExtraSlots: { slot: 'ring', count: 1 },
  },
  UNRAND_VAINGLORY: {
    unrandKey: 'UNRAND_VAINGLORY',
    displayName: 'crown of Vainglory',
    occupiedSlots: ['helmet'],
    grantsExtraSlots: { slot: 'ring', count: 2 },
  },
  UNRAND_JUSTICARS_REGALIA: {
    unrandKey: 'UNRAND_JUSTICARS_REGALIA',
    displayName: "Justicar's Regalia",
    occupiedSlots: ['body_armour'],
    grantsExtraSlots: { slot: 'amulet', count: 1 },
  },
};

export const MULTI_SLOT_BY_DISPLAY_NAME: Map<string, MultiSlotEntry> = new Map(
  Object.values(MULTI_SLOT_UNRANDS).map((m) => [m.displayName.toLowerCase(), m]),
);

/**
 * Get the occupied slots for an unrand, or null if it's not a multi-slot
 * unrand (in which case the parser uses the base type's slot).
 */
export function getMultiSlotOccupation(unrandKey: string): ItemSlot[] | null {
  const entry = MULTI_SLOT_UNRANDS[unrandKey];
  if (!entry) return null;
  return entry.occupiedSlots;
}

/**
 * Slots an unrand grants to its wearer (e.g. macabre finger necklace
 * grants `{ slot: 'ring', count: 1 }`). Returns null for unrands that
 * don't grant extra slots and for unknown keys.
 */
export function getGrantedSlots(
  unrandKey: string | undefined,
): { slot: ItemSlot; count: number } | null {
  if (!unrandKey) return null;
  const entry = MULTI_SLOT_UNRANDS[unrandKey];
  return entry?.grantsExtraSlots ?? null;
}

/**
 * Per-slot capacity for a player after applying the bonuses granted by
 * any equipped slot-granting unrands (macabre finger necklace, crown of
 * Vainglory, Fisticloak, skull of Zonguldrok, Justicar's Regalia).
 *
 * Use this everywhere capacity matters — UI rendering, search pruning,
 * legality checks — instead of `rules.capacity[slot]` directly. Pass
 * the items whose granters should count (typically the current loadout
 * or, in the search, the multi-slot/granter subset being considered).
 *
 * The returned map is sparse: only slots present in `rules.capacity`
 * (i.e. with non-zero base capacity for this species) AND slots a
 * granter targets are populated.
 */
export function effectiveCapacity(
  rules: SpeciesEquipmentRules,
  items: ParsedItem[],
): SlotCapacity {
  const out: SlotCapacity = { ...rules.capacity };
  for (const item of items) {
    const grant = getGrantedSlots(item.artefact?.unrandKey);
    if (!grant) continue;
    out[grant.slot] = (out[grant.slot] ?? 0) + grant.count;
  }
  return out;
}
