/**
 * Trade-off frontier.
 *
 * `optimize(...)` answers "what's the single best loadout for this
 * objective?". The frontier answers the question that comes before it:
 * "across every legal loadout, what combinations of these quantities
 * are even achievable — and which combinations are strictly better
 * than others?".
 *
 * The explored space is defined by `dims`: each dimension is a single
 * property or a group of properties whose post-cap totals are summed
 * (matching how sum-based objectives like "Total Elemental
 * Resistances" are scored). A typical Stat Explorer request is
 *
 *     dims: [['rF','rC','rN','rPois','rElec','rCorr'], ['Str'], ['Int'], ['Dex']]
 *
 * so the frontier exposes not just stat-vs-stat trades but what a stat
 * demand costs in resistances. A point is on the frontier when no
 * legal loadout beats it on one dimension without losing ground on
 * another.
 *
 * Constraints mirror `optimize`:
 *   - `floors` are hard requirements (e.g. rF ≥ 2) every point must
 *     satisfy.
 *   - `lockedItems` stay equipped in every candidate loadout.
 *   - `baseline` is added before caps/floors/values are read, so
 *     values are in the units the player sees (final Str, not
 *     equipment ΔStr) when the caller provides base stats.
 *
 * The search space is pruned to items relevant to the dims or floors
 * (plus multi-slot items, two-handers, and slot-granters). Because a
 * resistance dimension pulls every resistance item into the pool,
 * enumeration can reach tens of millions of loadouts on stacked
 * late-game inventories — so the hot loop scores each loadout with
 * precomputed per-item vectors instead of the general `scoreLoadout`,
 * and only candidates about to enter the Pareto set pay for a full
 * score + legality verification.
 */

import {
  PROPERTIES,
  type ContributionMap,
  type ItemSlot,
  type ParsedItem,
  type PropertyKey,
  type SpeciesEquipmentRules,
} from 'dcss-game-data';

import { rulesWithLockedItems } from './capacity.js';
import { itemIsRelevant } from './optimize.js';
import { scoreLoadout } from './score.js';
import { searchLoadouts } from './search.js';

export interface FrontierInputs {
  items: ParsedItem[];
  rules: SpeciesEquipmentRules;
  /**
   * Dimensions of the trade-off space, in output order. Each dimension
   * is one or more properties; its value is the sum of their post-cap
   * totals (so `['rF','rC']` counts rF at most 3, matching objective
   * scoring). A single property is a 1-element array.
   */
  dims: PropertyKey[][];
  /**
   * Hard requirements every frontier point must meet
   * (`totals[prop] >= value`). Intended for properties the caller is
   * NOT exploring — a floor on an explored dimension just truncates
   * the frontier, which the caller can do more cheaply by filtering
   * points.
   */
  floors?: Partial<Record<PropertyKey, number>>;
  /** Non-equipment contributions added to every loadout (see OptimizerInputs). */
  baseline?: ContributionMap;
  /** Items pinned into every candidate loadout (see OptimizerInputs). */
  lockedItems?: ParsedItem[];
}

export interface FrontierPoint {
  /**
   * Post-cap totals (baseline included) for each of
   * `FrontierInputs.dims`, in the same order.
   */
  values: number[];
  /**
   * A minimal loadout achieving these values, locked items included:
   * removing any single non-locked item would change the values,
   * break a floor, or break legality. Slots irrelevant to the explored
   * dims are left empty — callers that equip a point should fill the
   * rest via `optimize` with floors pinning the point's values.
   */
  items: ParsedItem[];
}

export interface FrontierResult {
  /**
   * Pareto-optimal points, sorted by descending value sum (ties broken
   * by descending values in dim order). Never empty when a legal
   * loadout exists: with no floors the empty loadout always qualifies.
   */
  points: FrontierPoint[];
  /** Number of loadouts enumerated, for performance debugging. */
  loadoutsEvaluated: number;
}

/**
 * Map the Pareto frontier of achievable `dims` combinations across all
 * legal loadouts.
 */
export function computeFrontier(inputs: FrontierInputs): FrontierResult {
  const { items, rules, dims, floors, baseline } = inputs;
  if (dims.length === 0) {
    return { points: [], loadoutsEvaluated: 0 };
  }

  const lockedItems = inputs.lockedItems ?? [];
  const lockedSet = new Set(lockedItems);
  const adjustedRules = rulesWithLockedItems(rules, lockedItems);
  const availableItems = items.filter((item) => !lockedSet.has(item));

  const relevant = new Set<PropertyKey>(dims.flat());
  for (const prop of Object.keys(floors ?? {})) relevant.add(prop);
  const candidates = availableItems.filter((item) => itemIsRelevant(item, relevant));

  // ─── Precompute the fast scoring path ─────────────────────────────
  //
  // Involved properties get dense indices; every candidate carries a
  // sparse (index, value) list. Per loadout the hot loop then only
  // sums a handful of numbers, clamps them to their caps, and checks
  // floors — no maps, no allocation.
  const props = [...relevant];
  const propIndex = new Map<PropertyKey, number>(props.map((p, i) => [p, i]));
  const capMin = props.map((p) => PROPERTIES[p]?.cap?.min ?? Number.NEGATIVE_INFINITY);
  const capMax = props.map((p) => PROPERTIES[p]?.cap?.max ?? Number.POSITIVE_INFINITY);
  const dimIndices = dims.map((dim) => dim.map((p) => propIndex.get(p)!));
  const floorChecks = Object.entries(floors ?? {})
    .filter((e): e is [string, number] => e[1] !== undefined)
    .map(([prop, min]) => ({ idx: propIndex.get(prop)!, min }));

  // Baseline + locked contributions are constant across the search.
  const baseVec = new Float64Array(props.length);
  for (let i = 0; i < props.length; i++) {
    baseVec[i] = baseline?.[props[i]!] ?? 0;
  }
  for (const item of lockedItems) {
    for (const [prop, value] of Object.entries(item.contributions)) {
      const idx = propIndex.get(prop);
      if (idx !== undefined && value !== undefined) {
        baseVec[idx] = baseVec[idx]! + value;
      }
    }
  }

  interface ItemData {
    pairs: Array<readonly [number, number]>;
    isTwoHander: boolean;
    hasOffhand: boolean;
  }
  const itemData = new Map<ParsedItem, ItemData>();
  for (const item of candidates) {
    const pairs: Array<readonly [number, number]> = [];
    for (const [prop, value] of Object.entries(item.contributions)) {
      const idx = propIndex.get(prop);
      if (idx !== undefined && value !== undefined && value !== 0) {
        pairs.push([idx, value] as const);
      }
    }
    itemData.set(item, {
      pairs,
      isTwoHander: isTwoHander(item),
      hasOffhand: item.slots.includes('offhand'),
    });
  }
  const blocks2h = rules.twoHanderBlocksOffhand;
  const lockedTwoHander = lockedItems.some(isTwoHander);
  const lockedOffhand = lockedItems.some((i) => i.slots.includes('offhand'));

  // Per-slot combination pruning: since the frontier only sees additive
  // contribution vectors, a slot combination whose raw vector is
  // dominated by another combination with the same legality flags can
  // never produce a point the dominator can't match or beat (pre-cap
  // dominance survives the monotone caps). Partitioning by
  // two-hander/offhand flags keeps cross-slot legality intact. This
  // shrinks the cartesian product multiplicatively — the difference
  // between seconds and minutes on ring-stacked inventories.
  const reduceSlotChoices = (
    _slot: ItemSlot,
    choices: ParsedItem[][],
  ): ParsedItem[][] => {
    interface ChoiceData {
      choice: ParsedItem[];
      vec: number[];
    }
    const partitions = new Map<string, Map<string, ChoiceData>>();
    for (const choice of choices) {
      const vec = new Array<number>(props.length).fill(0);
      let twoHander = false;
      let offhand = false;
      for (const item of choice) {
        const data = itemData.get(item)!;
        for (const [idx, value] of data.pairs) vec[idx] = vec[idx]! + value;
        twoHander = twoHander || data.isTwoHander;
        offhand = offhand || data.hasOffhand;
      }
      const partitionKey = `${twoHander}|${offhand}`;
      let byVec = partitions.get(partitionKey);
      if (!byVec) {
        byVec = new Map();
        partitions.set(partitionKey, byVec);
      }
      // Equal vectors are interchangeable: keep the smallest choice.
      const vecKey = vec.join(',');
      const existing = byVec.get(vecKey);
      if (!existing || choice.length < existing.choice.length) {
        byVec.set(vecKey, { choice, vec });
      }
    }
    const out: ParsedItem[][] = [];
    for (const byVec of partitions.values()) {
      for (const kept of paretoMax([...byVec.values()], (d) => d.vec)) {
        out.push(kept.choice);
      }
    }
    return out;
  };

  // One representative loadout per distinct achievable value vector.
  // Dominated vectors are filtered after the search — the map stays
  // small because values are small integers, so distinct vectors stay
  // in the hundreds even when millions of loadouts are enumerated.
  const byVector = new Map<string, FrontierPoint>();

  const acc = new Float64Array(props.length);
  const vector = new Array<number>(dims.length);

  const searchOptions = { reduceSlotChoices };
  const { evaluated } = searchLoadouts(candidates, adjustedRules, (loadout) => {
    // Two-hander vs offhand is the only cross-slot rule; per-slot
    // capacity holds by construction of the search (and is re-verified
    // below for anything that reaches the Pareto set).
    if (blocks2h) {
      let twoHander = lockedTwoHander;
      let offhand = lockedOffhand;
      for (const item of loadout) {
        const data = itemData.get(item)!;
        twoHander = twoHander || data.isTwoHander;
        offhand = offhand || data.hasOffhand;
      }
      if (twoHander && offhand) return 0;
    }

    acc.set(baseVec);
    for (const item of loadout) {
      for (const [idx, value] of itemData.get(item)!.pairs) {
        acc[idx] = acc[idx]! + value;
      }
    }
    for (let i = 0; i < acc.length; i++) {
      const v = acc[i]!;
      acc[i] = v > capMax[i]! ? capMax[i]! : v < capMin[i]! ? capMin[i]! : v;
    }
    for (const { idx, min } of floorChecks) {
      if (acc[idx]! < min) return 0;
    }
    for (let d = 0; d < dimIndices.length; d++) {
      let sum = 0;
      for (const idx of dimIndices[d]!) sum += acc[idx]!;
      vector[d] = sum;
    }

    // Round keys so float noise (fractional baselines like HPRegen)
    // can't split one logical vector into near-duplicate buckets.
    const key = vector.map((v) => Math.round(v * 1e6) / 1e6).join(',');
    const existing = byVector.get(key);
    const totalSize = lockedItems.length + loadout.length;
    if (existing && existing.items.length <= totalSize) return 0;

    // About to enter the Pareto map: verify with the real scorer so
    // recorded points are exactly what `scoreLoadout` reports and any
    // legality condition the fast path doesn't model is enforced.
    // Insertions are rare (one per distinct vector, plus occasional
    // smaller-loadout upgrades), so this stays off the hot path.
    const full = [...lockedItems, ...loadout];
    const score = scoreLoadout(full, rules, baseline);
    if (score.violations.length > 0) return 0;
    const values = dims.map((dim) =>
      dim.reduce((n, p) => n + (score.totals[p] ?? 0), 0),
    );
    byVector.set(key, { values, items: full });
    return 0;
  }, searchOptions);

  const points = paretoMax([...byVector.values()], (p) => p.values);
  // Minimize each representative: the slot pruning compares raw
  // PRE-cap vectors (the only sound basis), so a representative can
  // carry items that stopped mattering once caps and baseline applied
  // (a second rF ring past the cap, a rPois ring a poison-immune
  // species never needed). Strip anything whose removal leaves the
  // values, floors, and legality intact — displayed gear stays honest
  // and equip flows don't lock dead weight into a slot.
  for (const point of points) {
    point.items = minimizeLoadout(point, lockedSet, rules, baseline, dims, floors);
  }
  points.sort(byDescendingSumThenValues);

  return { points, loadoutsEvaluated: evaluated };
}

/**
 * Remove every non-locked item whose absence doesn't change the
 * point's dim values, violate a floor, or break legality. Repeats
 * until no single removal is possible.
 */
function minimizeLoadout(
  point: FrontierPoint,
  lockedSet: ReadonlySet<ParsedItem>,
  rules: SpeciesEquipmentRules,
  baseline: ContributionMap | undefined,
  dims: PropertyKey[][],
  floors: Partial<Record<PropertyKey, number>> | undefined,
): ParsedItem[] {
  let items = point.items;
  let removed = true;
  while (removed) {
    removed = false;
    for (const item of items) {
      if (lockedSet.has(item)) continue;
      const without = items.filter((i) => i !== item);
      const score = scoreLoadout(without, rules, baseline);
      if (score.violations.length > 0) continue;
      if (!meetsFloors(score.totals, floors)) continue;
      const values = dims.map((dim) =>
        dim.reduce((n, p) => n + (score.totals[p] ?? 0), 0),
      );
      if (!valuesEqual(values, point.values)) continue;
      items = without;
      removed = true;
      break;
    }
  }
  return items;
}

function meetsFloors(
  totals: ContributionMap,
  floors: Partial<Record<PropertyKey, number>> | undefined,
): boolean {
  if (!floors) return true;
  for (const [prop, min] of Object.entries(floors)) {
    if (min === undefined) continue;
    if ((totals[prop] ?? 0) < min) return false;
  }
  return true;
}

function valuesEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i]! - b[i]!) > 1e-9) return false;
  }
  return true;
}

/**
 * Pareto-maximal subset of `entries` under componentwise dominance of
 * `getVec`. Assumes distinct vectors (dedup beforehand). Sorting by
 * descending sum lets each entry be checked against the accepted
 * frontier only: a dominator always has a strictly larger sum, so it
 * was accepted (or itself dominated by an earlier accept) before the
 * entries it dominates are visited. This keeps the filter near-linear
 * for the shapes we see (thousands of combos → hundreds kept) instead
 * of O(n²).
 */
function paretoMax<T>(entries: T[], getVec: (entry: T) => number[]): T[] {
  const sorted = [...entries].sort(
    (a, b) =>
      getVec(b).reduce((n, v) => n + v, 0) - getVec(a).reduce((n, v) => n + v, 0),
  );
  const accepted: T[] = [];
  const acceptedVecs: number[][] = [];
  for (const entry of sorted) {
    const vec = getVec(entry);
    let dominated = false;
    for (const other of acceptedVecs) {
      if (dominates(other, vec)) {
        dominated = true;
        break;
      }
    }
    if (!dominated) {
      accepted.push(entry);
      acceptedVecs.push(vec);
    }
  }
  return accepted;
}

function isTwoHander(item: ParsedItem): boolean {
  return (
    item.category === 'weapon' && 'hands' in item.baseType && item.baseType.hands === 2
  );
}

/**
 * True when `a` is at least as good as `b` on every axis and strictly
 * better on at least one.
 */
function dominates(a: number[], b: number[]): boolean {
  let strictlyBetter = false;
  for (let i = 0; i < a.length; i++) {
    const av = a[i]!;
    const bv = b[i]!;
    if (av < bv) return false;
    if (av > bv) strictlyBetter = true;
  }
  return strictlyBetter;
}

function byDescendingSumThenValues(a: FrontierPoint, b: FrontierPoint): number {
  const sumA = a.values.reduce((n, v) => n + v, 0);
  const sumB = b.values.reduce((n, v) => n + v, 0);
  if (sumA !== sumB) return sumB - sumA;
  for (let i = 0; i < a.values.length; i++) {
    if (a.values[i] !== b.values[i]) return b.values[i]! - a.values[i]!;
  }
  return 0;
}
