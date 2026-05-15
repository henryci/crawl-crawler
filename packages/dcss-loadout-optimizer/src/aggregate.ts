/**
 * Aggregation: sum item contributions into a single map, then apply caps.
 *
 * Caps come from PROPERTIES.cap (e.g., rF clamps to [-3, +3] from
 * equipment alone). The optimizer compares loadouts on post-cap totals
 * for "effective" rank but tracks uncapped totals for tie-breaking and
 * UI display ("you have 4 pips of rF — 1 above cap").
 */

import { PROPERTIES, type ContributionMap, type ParsedItem } from 'dcss-game-data';

/**
 * Sum the `contributions` maps of every item into one sparse map.
 */
export function sumContributions(items: ParsedItem[]): ContributionMap {
  const out: ContributionMap = {};
  for (const item of items) {
    for (const [prop, value] of Object.entries(item.contributions)) {
      if (value === undefined) continue;
      out[prop] = (out[prop] ?? 0) + value;
    }
  }
  return out;
}

/**
 * Clamp each property in `totals` to its registered cap (PROPERTIES.cap).
 * Properties without a cap pass through unchanged.
 */
export function applyCaps(totals: ContributionMap): ContributionMap {
  const out: ContributionMap = {};
  for (const [prop, value] of Object.entries(totals)) {
    if (value === undefined) continue;
    out[prop] = clampToCap(prop, value);
  }
  return out;
}

function clampToCap(prop: string, value: number): number {
  const def = PROPERTIES[prop];
  if (!def?.cap) return value;
  let result = value;
  if (def.cap.max !== undefined && result > def.cap.max) result = def.cap.max;
  if (def.cap.min !== undefined && result < def.cap.min) result = def.cap.min;
  return result;
}
