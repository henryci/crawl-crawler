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
 * Capacity check: usage[slot] ≤ effectiveCapacity(rules, items)[slot]
 * for every slot. `effectiveCapacity` includes bonuses from any
 * equipped slot-granting unrands (e.g. macabre finger necklace +1
 * ring) — see dcss-game-data/equipment/multi-slot.ts.
 */

import {
  effectiveCapacity,
  type ItemSlot,
  type ParsedItem,
  type SlotCapacity,
  type SpeciesEquipmentRules,
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
 * Check that no slot's usage exceeds its effective capacity. Returns a
 * list of human-readable violation messages (empty when legal).
 */
export function checkCapacity(
  items: ParsedItem[],
  rules: SpeciesEquipmentRules,
): string[] {
  const violations: string[] = [];
  const usage = computeSlotUsage(items);
  const cap = effectiveCapacity(rules, items);
  for (const [slot, used] of Object.entries(usage)) {
    if (used === undefined) continue;
    const slotCap = cap[slot as ItemSlot] ?? 0;
    if (used > slotCap) {
      violations.push(
        `Too many items in slot '${slot}': ${used} used, capacity ${slotCap} for species ${rules.speciesCode}`,
      );
    }
  }
  return violations;
}

/**
 * Compute remaining capacity after a base usage is subtracted. Used by
 * the search to figure out how many more single-slot items can fit
 * after multi-slot items are placed. Pass the items that should count
 * toward slot-granter bonuses (typically the subset whose usage is
 * being subtracted) so that, e.g., a macabre finger necklace in the
 * subset bumps the available ring count.
 */
export function remainingCapacity(
  rules: SpeciesEquipmentRules,
  usage: SlotCapacity,
  items: ParsedItem[] = [],
): SlotCapacity {
  const cap = effectiveCapacity(rules, items);
  const remaining: SlotCapacity = {};
  const allSlots = new Set<ItemSlot>([
    ...(Object.keys(cap) as ItemSlot[]),
    ...(Object.keys(usage) as ItemSlot[]),
  ]);
  for (const slot of allSlots) {
    const slotCap = cap[slot] ?? 0;
    const used = usage[slot] ?? 0;
    remaining[slot] = Math.max(0, slotCap - used);
  }
  return remaining;
}
