/**
 * Multi-slot unrand registry.
 *
 * Two distinct mechanics exist in DCSS:
 *
 * 1. Items that OCCUPY multiple slots when equipped (Lear's hauberk
 *    fills body armor + helmet + gloves + boots simultaneously).
 *
 * 2. Items that GRANT extra slots while equipped (Skull of Zonguldrok
 *    adds a helmet slot, Finger Amulet adds a ring slot, etc.).
 *
 * For v1 we model only mechanic (1) — the parser overrides the item's
 * `slots` to the full occupied set, and the optimizer's capacity check
 * deducts each slot.
 *
 * Mechanic (2) (`grantsExtraSlots`) is recorded but not yet consumed by
 * the optimizer. The list below is intended to be exhaustive for the
 * pinned DCSS source; new occupied-multiple-slot unrands need to be
 * added here.
 *
 * Source-of-truth references are in `player-equip.cc::_use_slots(...)`
 * calls and the `BOOL: special` flag in art-data.txt entries.
 */

import type { ItemSlot, MultiSlotUnrand } from './types.js';

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
    displayName: 'amulet of the Finger',
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
