/**
 * Cross-slot legality rules that go beyond per-slot capacity.
 *
 * Currently:
 *   - Two-handed weapons block the offhand slot (universal in DCSS).
 *     Override per species via `rules.twoHanderBlocksOffhand` (Formicid
 *     sets this to false because they can wield 2h weapons one-handed).
 *
 * Future:
 *   - Tower shield + caster build (informational; not strictly illegal)
 *   - Form-specific restrictions (deferred to Phase 5)
 */

import type { ParsedItem, SpeciesEquipmentRules } from 'dcss-game-data';

import { checkCapacity } from './capacity.js';

/**
 * Check all loadout-level legality rules. Returns the combined list of
 * violations from capacity + cross-slot rules.
 */
export function checkLegality(
  items: ParsedItem[],
  rules: SpeciesEquipmentRules,
): string[] {
  const violations: string[] = [];
  violations.push(...checkCapacity(items, rules));
  violations.push(...checkTwoHanderConflict(items, rules));
  return violations;
}

/**
 * If a two-handed weapon is wielded, the offhand slot cannot also be
 * filled — unless the species explicitly waives this rule (Formicid).
 */
function checkTwoHanderConflict(
  items: ParsedItem[],
  rules: SpeciesEquipmentRules,
): string[] {
  if (!rules.twoHanderBlocksOffhand) return [];

  const hasTwoHander = items.some(
    (i) => i.category === 'weapon' && 'hands' in i.baseType && i.baseType.hands === 2,
  );
  const hasOffhand = items.some((i) => i.slots.includes('offhand'));

  if (hasTwoHander && hasOffhand) {
    return ['Two-handed weapon wielded but offhand slot is also filled.'];
  }
  return [];
}
