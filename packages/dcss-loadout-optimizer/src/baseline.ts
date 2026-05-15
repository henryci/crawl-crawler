/**
 * Compute the non-equipment baseline contribution for a player.
 *
 * The morgue's defenses block (parsed by dcss-morgue-parser into
 * `runtimeTotals`) shows the player's actual values across resistances,
 * willpower, stealth, regen, etc. These values are the sum of every
 * source: currently-equipped items PLUS species traits, god gifts,
 * mutations, and form effects.
 *
 * To get just the "non-equipment baseline" — what the player has from
 * sources that don't change as they swap gear — subtract the currently-
 * equipped items' contributions from the runtime totals:
 *
 *     baseline[prop] = runtimeTotals[prop] - sum(equippedItems[*].contributions[prop])
 *
 * The result clamps at 0 for properties where runtime > equipment
 * (suggesting the morgue already capped them); negative results would
 * mean the equipment contributes more than the runtime total reports,
 * which indicates either a capping artifact or an item we mis-tokenized.
 */

import type { ContributionMap, ParsedItem } from 'dcss-game-data';

import { sumContributions } from './aggregate.js';

/**
 * Derive the non-equipment baseline contribution from runtime totals
 * and the currently-equipped items.
 *
 * Only properties present in `runtimeTotals` get a baseline value —
 * properties never reported by the morgue's defenses block (Str, Int,
 * AC, EV, etc.) are omitted because we can't infer the baseline for
 * them.
 *
 * Pass `equippedItems = inventoryItems.filter(i => i.isEquipped)`.
 */
export function computeBaseline(
  runtimeTotals: ContributionMap,
  equippedItems: ParsedItem[],
): ContributionMap {
  const equipmentTotals = sumContributions(equippedItems);
  const baseline: ContributionMap = {};
  for (const [prop, total] of Object.entries(runtimeTotals)) {
    if (total === undefined) continue;
    const fromEquipment = equipmentTotals[prop] ?? 0;
    const diff = total - fromEquipment;
    // Clamp to zero — a negative baseline doesn't make physical sense
    // and usually indicates the runtime total was capped by DCSS while
    // our equipment sum was not. Zero is a safe lower bound.
    baseline[prop] = Math.max(0, diff);
  }
  return baseline;
}
