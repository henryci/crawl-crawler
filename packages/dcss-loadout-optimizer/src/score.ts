/**
 * Loadout scoring against an Objective.
 *
 * Every loadout is scored as a numeric "fitness" by `evaluateObjective`.
 * The search calls this for each candidate and tracks the maximum.
 *
 * Conventions:
 *   - Illegal loadouts (capacity overflow, two-hander conflict)
 *     receive Number.NEGATIVE_INFINITY so they're never chosen.
 *   - For `maximize_with_floor`, candidates that fail any floor are
 *     scored as Number.NEGATIVE_INFINITY.
 *   - Ties are broken by `uncappedTotals` of the same property/properties
 *     (encourages capped loadouts that still have headroom for
 *     mutations/god effects).
 */

import type { ContributionMap, ParsedItem, PropertyKey, SpeciesEquipmentRules } from 'dcss-game-data';

import { applyCaps, sumContributions } from './aggregate.js';
import { checkLegality } from './legality.js';
import type { LoadoutScore, Objective } from './types.js';

/**
 * Score a loadout against species rules, optionally adding a
 * non-equipment baseline that's included in totals.
 */
export function scoreLoadout(
  items: ParsedItem[],
  rules: SpeciesEquipmentRules,
  baseline?: ContributionMap,
): LoadoutScore {
  const equipmentTotals = sumContributions(items);
  const combinedUncapped = sumMaps(equipmentTotals, baseline ?? {});
  const totals = applyCaps(combinedUncapped);
  const violations = checkLegality(items, rules);
  return {
    totals,
    uncappedTotals: combinedUncapped,
    equipmentTotals,
    baseline: baseline ?? {},
    violations,
  };
}

function sumMaps(a: ContributionMap, b: ContributionMap): ContributionMap {
  const out: ContributionMap = { ...a };
  for (const [prop, value] of Object.entries(b)) {
    if (value === undefined) continue;
    out[prop] = (out[prop] ?? 0) + value;
  }
  return out;
}

/**
 * Convert a LoadoutScore to a numeric fitness for the given Objective.
 * Higher is better. Returns -Infinity for illegal or floor-violating
 * loadouts.
 *
 * The fitness has three tiers that never disturb each other (each
 * scaled 1000x smaller than the next):
 *
 *   - primary:       the objective's actual value (capped per cap)
 *   - uncapped:      same value before cap (`+4 rF` beats `+3 rF`
 *                    when both cap at 3)
 *   - fill:          sum of fillProps' values (fills empty slots with
 *                    helpful items when the primary doesn't care)
 *
 * Pass `fillProps = []` to disable the fill tier entirely.
 */
export function evaluateObjective(
  score: LoadoutScore,
  objective: Objective,
  fillProps: PropertyKey[] = [],
): number {
  if (score.violations.length > 0) return Number.NEGATIVE_INFINITY;
  if (!checkFloors(score, getFloors(objective))) return Number.NEGATIVE_INFINITY;

  const fillScore = sumValues(score.totals, fillProps);

  switch (objective.kind) {
    case 'maximize':
    case 'maximize_with_floor':
      return layeredScore(
        getValue(score.totals, objective.prop),
        getValue(score.uncappedTotals, objective.prop),
        fillScore,
      );

    case 'maximize_sum': {
      const primary = sumValues(score.totals, objective.props);
      const tiebreak = sumValues(score.uncappedTotals, objective.props);
      return layeredScore(primary, tiebreak, fillScore);
    }
  }
}

function getFloors(
  objective: Objective,
): Partial<Record<PropertyKey, number>> | undefined {
  return 'floors' in objective ? objective.floors : undefined;
}

function checkFloors(
  score: LoadoutScore,
  floors: Partial<Record<PropertyKey, number>> | undefined,
): boolean {
  if (!floors) return true;
  for (const [prop, floor] of Object.entries(floors)) {
    if (floor === undefined) continue;
    if (getValue(score.totals, prop) < floor) return false;
  }
  return true;
}

function getValue(map: ContributionMap, prop: PropertyKey): number {
  return map[prop] ?? 0;
}

function sumValues(map: ContributionMap, props: PropertyKey[]): number {
  let acc = 0;
  for (const p of props) acc += getValue(map, p);
  return acc;
}

/**
 * Combine three tiers (primary > uncapped > fill) so each can break
 * ties at the next level down without ever disturbing the level above.
 */
function layeredScore(primary: number, uncapped: number, fill: number): number {
  return primary + uncapped * 1e-3 + fill * 1e-6;
}
