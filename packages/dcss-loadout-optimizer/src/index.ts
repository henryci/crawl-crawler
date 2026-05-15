/**
 * dcss-loadout-optimizer
 *
 * Given a player's parsed inventory (`ParsedItem[]` from
 * dcss-morgue-parser), species rules, and an objective, find the legal
 * equipment loadout that best satisfies the objective.
 *
 * @example
 * ```typescript
 * import { parseMorgueData } from 'dcss-morgue-parser';
 * import { getSpeciesEquipmentRules } from 'dcss-game-data';
 * import { optimize } from 'dcss-loadout-optimizer';
 *
 * const data = await parseMorgueData(morgueText);
 * if (!data.inventoryItems) throw new Error('Need a 0.33+ morgue');
 *
 * const rules = getSpeciesEquipmentRules('Hu'); // Human, or whatever
 * const { best, score } = optimize({
 *   items: data.inventoryItems,
 *   rules,
 *   objective: { kind: 'maximize', prop: 'rF' },
 * });
 *
 * console.log(`Best rF: ${score.totals.rF ?? 0}`);
 * for (const item of best.items) console.log(`  - ${item.baseType.displayName}`);
 * ```
 */

export type {
  Loadout,
  LoadoutScore,
  Objective,
  OptimizerInputs,
  OptimizerResult,
} from './types.js';

export { optimize, relevantProperties, DEFAULT_FILL_PROPS } from './optimize.js';
export { scoreLoadout, evaluateObjective } from './score.js';
export { checkLegality } from './legality.js';
export { sumContributions, applyCaps } from './aggregate.js';
export { computeSlotUsage, checkCapacity, remainingCapacity } from './capacity.js';
export { searchLoadouts, type SearchResult } from './search.js';
export { computeBaseline } from './baseline.js';
