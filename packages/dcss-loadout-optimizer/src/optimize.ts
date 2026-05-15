/**
 * Public API for the loadout optimizer.
 *
 * The `optimize(...)` entrypoint is the high-level call: give it
 * inventory items, species rules, and an objective, and get back the
 * best legal loadout with its score.
 *
 * Individual pieces (`scoreLoadout`, `checkLegality`, `evaluateObjective`)
 * are also exported for callers who want to evaluate specific loadouts
 * (e.g., comparing the player's current equipment vs. the optimizer's
 * recommendation in the UI).
 */

import type {
  ContributionMap,
  ItemSlot,
  ParsedItem,
  PropertyKey,
  SpeciesEquipmentRules,
} from 'dcss-game-data';

import { evaluateObjective, scoreLoadout } from './score.js';
import { searchLoadouts } from './search.js';
import type { Objective, OptimizerInputs, OptimizerResult } from './types.js';

/**
 * Default "fill" properties: anything a player typically wants more of.
 * Used as a tie-breaker so the optimizer fills empty slots with
 * helpful items even when those items don't affect the primary
 * objective.
 */
export const DEFAULT_FILL_PROPS: PropertyKey[] = [
  // Resistances
  'rF', 'rC', 'rN', 'rPois', 'rElec', 'rCorr', 'rMut',
  // Defenses
  'AC', 'EV', 'SH', 'Will', 'Stlth',
  // Offense
  'Slay',
  // Stats
  'Str', 'Int', 'Dex',
  // Pools / regen
  'HP', 'MP', 'Regen', 'RegenMP',
  // Useful utility booleans
  'SInv', 'Fly', '+Blink', 'Reflect', 'Spirit',
];

/**
 * Find the loadout that maximizes the given objective.
 *
 * Brute-force search over all legal loadouts. Performance scales with
 * inventory size and species ring slot count; typical late-game runs
 * complete in well under a second.
 */
export function optimize(inputs: OptimizerInputs): OptimizerResult {
  const { items, rules, objective, baseline } = inputs;
  const fillProps = inputs.fillProps ?? DEFAULT_FILL_PROPS;
  const lockedItems = inputs.lockedItems ?? [];
  const lockedSet = new Set(lockedItems);

  // Reduce the rules' capacity by the locked items' slot occupation
  // and exclude locked items from the candidate pool.
  const lockedUsage = computeSlotUsageInternal(lockedItems);
  const adjustedRules: SpeciesEquipmentRules = {
    ...rules,
    capacity: subtractCapacity(rules.capacity, lockedUsage),
  };
  const availableItems = items.filter((item) => !lockedSet.has(item));

  // ─── Phase 1: optimize for the primary objective only ──────────────
  //
  // Prune to items relevant to the primary objective; run the
  // combinatorial search on that small set. This is the fast
  // optimization that's been in place since Phase 3.
  const primaryRelevant = relevantProperties(objective);
  const primaryItems = availableItems.filter((item) =>
    itemIsRelevant(item, primaryRelevant),
  );

  const { best, bestScore, evaluated } = searchLoadouts(primaryItems, adjustedRules, (loadout) => {
    // Score the combined loadout: locked items + search candidate.
    // We use the unmodified `rules` here so legality (e.g., 2h blocks
    // offhand) catches conflicts between locked and searched items.
    const fullLoadout = [...lockedItems, ...loadout];
    const score = scoreLoadout(fullLoadout, rules, baseline);
    return evaluateObjective(score, objective, []);
  });

  let phase1Loadout: ParsedItem[] =
    bestScore === Number.NEGATIVE_INFINITY ? [] : [...lockedItems, ...best];

  // ─── Phase 2: greedy-fill empty slots with helpful items ───────────
  //
  // For each slot the phase-1 loadout doesn't fill, pick the candidate
  // single-slot item that:
  //   (a) doesn't reduce the primary objective's score
  //   (b) doesn't introduce a legality violation
  //   (c) maximizes the fill score (sum of fillProps' totals)
  //
  // Locked items already in the loadout are respected automatically —
  // greedyFillEmptySlots counts them when computing remaining slot
  // capacity.
  const finalLoadout =
    fillProps.length > 0
      ? greedyFillEmptySlots(phase1Loadout, availableItems, rules, baseline, objective, fillProps)
      : phase1Loadout;

  const finalScore = scoreLoadout(finalLoadout, rules, baseline);

  return {
    best: { items: finalLoadout },
    score: finalScore,
    loadoutsEvaluated: evaluated,
  };
}

function computeSlotUsageInternal(items: ParsedItem[]): Record<string, number> {
  const usage: Record<string, number> = {};
  for (const item of items) {
    for (const slot of item.slots) {
      usage[slot] = (usage[slot] ?? 0) + 1;
    }
  }
  return usage;
}

function subtractCapacity(
  base: SpeciesEquipmentRules['capacity'],
  usage: Record<string, number>,
): SpeciesEquipmentRules['capacity'] {
  const out: SpeciesEquipmentRules['capacity'] = { ...base };
  for (const [slot, used] of Object.entries(usage)) {
    const key = slot as keyof typeof base;
    const current = out[key] ?? 0;
    out[key] = Math.max(0, current - used);
  }
  return out;
}

/**
 * Walk every slot in the species' capacity. For each remaining slot,
 * pick the unequipped single-slot item that maximizes fillProps without
 * reducing the primary objective score or breaking legality.
 */
function greedyFillEmptySlots(
  current: ParsedItem[],
  allItems: ParsedItem[],
  rules: SpeciesEquipmentRules,
  baseline: ContributionMap | undefined,
  objective: Objective,
  fillProps: PropertyKey[],
): ParsedItem[] {
  const loadout = [...current];
  const equipped = new Set(loadout);

  const slotOrder: ItemSlot[] = [
    'weapon',
    'offhand',
    'body_armour',
    'helmet',
    'cloak',
    'gloves',
    'boots',
    'barding',
    'amulet',
    'ring',
    'gizmo',
  ];

  for (const slot of slotOrder) {
    const cap = rules.capacity[slot] ?? 0;
    if (cap === 0) continue;

    while (countSlotUsage(loadout, slot) < cap) {
      const candidates = allItems.filter(
        (item) =>
          !equipped.has(item) &&
          item.slots.length === 1 &&
          item.slots[0] === slot &&
          hasAnyContribution(item, fillProps),
      );
      if (candidates.length === 0) break;

      const currentScore = scoreLoadout(loadout, rules, baseline);
      const currentPrimary = evaluateObjective(currentScore, objective, []);
      // If the current loadout can't satisfy the primary objective
      // (e.g., a floor it can't reach), don't pollute it with fill —
      // the caller will see an empty loadout indicating "infeasible".
      if (currentPrimary === Number.NEGATIVE_INFINITY) return loadout;

      let bestItem: ParsedItem | null = null;
      let bestFill = Number.NEGATIVE_INFINITY;
      for (const candidate of candidates) {
        const testLoadout = [...loadout, candidate];
        const testScore = scoreLoadout(testLoadout, rules, baseline);
        if (testScore.violations.length > 0) continue;
        const testPrimary = evaluateObjective(testScore, objective, []);
        if (testPrimary === Number.NEGATIVE_INFINITY) continue;
        if (testPrimary < currentPrimary) continue;
        const fillSum = sumFillProps(testScore.totals, fillProps);
        if (fillSum > bestFill) {
          bestFill = fillSum;
          bestItem = candidate;
        }
      }

      if (!bestItem) break;
      loadout.push(bestItem);
      equipped.add(bestItem);
    }
  }

  return loadout;
}

function countSlotUsage(loadout: ParsedItem[], slot: ItemSlot): number {
  let n = 0;
  for (const item of loadout) {
    if (item.slots.includes(slot)) n++;
  }
  return n;
}

function hasAnyContribution(item: ParsedItem, props: PropertyKey[]): boolean {
  for (const p of props) {
    const v = item.contributions[p];
    if (v !== undefined && v !== 0) return true;
  }
  return false;
}

function sumFillProps(totals: ContributionMap, props: PropertyKey[]): number {
  let n = 0;
  for (const p of props) n += totals[p] ?? 0;
  return n;
}

/**
 * The set of PropertyKeys that affect the objective's fitness. Items
 * with zero contribution to any of these are equivalent to the empty
 * slot for the optimizer's purposes. Also useful for UI highlighting:
 * which items in the inventory are relevant to the current objective.
 */
export function relevantProperties(objective: Objective): Set<PropertyKey> {
  const set = new Set<PropertyKey>();
  switch (objective.kind) {
    case 'maximize':
    case 'maximize_with_floor':
      set.add(objective.prop);
      break;
    case 'maximize_sum':
      for (const p of objective.props) set.add(p);
      break;
  }
  if ('floors' in objective && objective.floors) {
    for (const p of Object.keys(objective.floors)) set.add(p);
  }
  return set;
}

function itemIsRelevant(item: ParsedItem, relevant: Set<PropertyKey>): boolean {
  // Always retain 2h weapons — they block offhand and might still be
  // chosen if the alternative (1h + shield) doesn't beat them on the
  // objective, but the search needs to consider them.
  if (item.category === 'weapon' && 'hands' in item.baseType && item.baseType.hands === 2) {
    return true;
  }
  // Multi-slot items occupy multiple slots; retain so legality still
  // sees them even if they don't contribute to the objective directly.
  if (item.slots.length > 1) return true;
  for (const prop of Object.keys(item.contributions)) {
    if (relevant.has(prop)) {
      const value = item.contributions[prop];
      if (value !== undefined && value !== 0) return true;
    }
  }
  return false;
}
