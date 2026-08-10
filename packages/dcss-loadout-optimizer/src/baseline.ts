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

/**
 * Final Str/Int/Dex as a morgue header reports them (nullable when the
 * header is missing a value). Structurally compatible with the morgue
 * parser's `CharacterStats` — declared here so this package doesn't
 * depend on the parser.
 */
export interface StatSnapshot {
  str: number | null;
  int: number | null;
  dex: number | null;
}

/**
 * Derive base Str/Int/Dex (species + level growth + mutations) from
 * the morgue's final stats by subtracting the equipped items' stat
 * contributions — the stat analogue of `computeBaseline`.
 *
 * Unlike `computeBaseline` this is NOT clamped at zero: a heavily
 * drained stat genuinely can sit below the equipment's contribution,
 * and clamping would misreport every loadout's totals by the drained
 * amount.
 *
 * Returns null when the snapshot has no usable values, in which case
 * callers fall back to equipment-only stat deltas.
 */
export function computeStatBaseline(
  endingStats: StatSnapshot,
  equippedItems: ParsedItem[],
): ContributionMap | null {
  const fromEquipment = sumContributions(equippedItems);
  const out: ContributionMap = {};
  const pairs: [string, number | null][] = [
    ['Str', endingStats.str],
    ['Int', endingStats.int],
    ['Dex', endingStats.dex],
  ];
  for (const [prop, value] of pairs) {
    if (value === null) continue;
    out[prop] = value - (fromEquipment[prop] ?? 0);
  }
  return Object.keys(out).length > 0 ? out : null;
}
