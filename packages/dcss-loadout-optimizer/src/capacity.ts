/**
 * Slot capacity checks for loadouts.
 *
 * Each ParsedItem carries `slots: ItemSlot[]` — usually length 1 but
 * up to 4 for multi-slot unrands like Lear's hauberk. A loadout's
 * "slot usage" is the per-slot count from walking the items list:
 *
 *   for each item in loadout:
 *     for each slot in item.slots:
 *       usage[slot] += 1
 *
 * Capacity check: usage[slot] ≤ rules.capacity[slot] for every slot.
 */

import type {
  ItemSlot,
  ParsedItem,
  SlotCapacity,
  SpeciesEquipmentRules,
} from 'dcss-game-data';

/**
 * Tally per-slot occupation across the items in a loadout. Slots with
 * zero usage are omitted (sparse map).
 */
export function computeSlotUsage(items: ParsedItem[]): SlotCapacity {
  const usage: SlotCapacity = {};
  for (const item of items) {
    for (const slot of item.slots) {
      usage[slot] = (usage[slot] ?? 0) + 1;
    }
  }
  return usage;
}

/**
 * Check that no slot's usage exceeds its capacity. Returns a list of
 * human-readable violation messages (empty when legal).
 */
export function checkCapacity(
  items: ParsedItem[],
  rules: SpeciesEquipmentRules,
): string[] {
  const violations: string[] = [];
  const usage = computeSlotUsage(items);
  for (const [slot, used] of Object.entries(usage)) {
    if (used === undefined) continue;
    const cap = rules.capacity[slot as ItemSlot] ?? 0;
    if (used > cap) {
      violations.push(
        `Too many items in slot '${slot}': ${used} used, capacity ${cap} for species ${rules.speciesCode}`,
      );
    }
  }
  return violations;
}

/**
 * Compute remaining capacity after a base usage is subtracted. Used by
 * the search to figure out how many more single-slot items can fit
 * after multi-slot items are placed.
 */
export function remainingCapacity(
  rules: SpeciesEquipmentRules,
  usage: SlotCapacity,
): SlotCapacity {
  const remaining: SlotCapacity = {};
  const allSlots = new Set<ItemSlot>([
    ...(Object.keys(rules.capacity) as ItemSlot[]),
    ...(Object.keys(usage) as ItemSlot[]),
  ]);
  for (const slot of allSlots) {
    const cap = rules.capacity[slot] ?? 0;
    const used = usage[slot] ?? 0;
    remaining[slot] = Math.max(0, cap - used);
  }
  return remaining;
}
