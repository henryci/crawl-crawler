/**
 * Brute-force loadout search.
 *
 * Strategy (factors the search space, doesn't enumerate all subsets):
 *   1. Separate items into multi-slot (occupies 2+ slots) and single-slot.
 *   2. For each subset of multi-slot items whose combined occupation
 *      doesn't overflow capacity:
 *      a. Compute remaining per-slot capacity.
 *      b. Group remaining single-slot items by their slot.
 *      c. For each slot, enumerate all combinations of items in that
 *         slot, sized 0..remainingCapacity[slot].
 *      d. Cartesian product across slot choices.
 *      e. For each resulting loadout, score it and track the best.
 *
 * Complexity is roughly:
 *   sum over multi-slot subsets ×
 *     product over slots of (sum_{k=0..cap} C(N_slot, k))
 *
 * For typical late-game inventories (~30 items) this is in the
 * 10^5..10^6 range, which evaluates in well under a second. Octopode
 * with many rings is the worst case; if it exceeds budget, pruning
 * (e.g. "pick the K rings that maximize the objective individually") is
 * the next step. Not yet implemented.
 */

import type { ItemSlot, ParsedItem, SpeciesEquipmentRules } from 'dcss-game-data';

import { computeSlotUsage, remainingCapacity } from './capacity.js';

export interface SearchResult {
  best: ParsedItem[];
  bestScore: number;
  evaluated: number;
}

/**
 * Enumerate every legal loadout and return the one maximizing
 * `evaluate(loadout)`. Returns -Infinity score if no legal loadout
 * exists (which shouldn't happen — even the empty loadout is legal).
 */
export function searchLoadouts(
  items: ParsedItem[],
  rules: SpeciesEquipmentRules,
  evaluate: (loadout: ParsedItem[]) => number,
): SearchResult {
  const multiSlot = items.filter((i) => i.slots.length > 1);
  const singleSlot = items.filter((i) => i.slots.length === 1);

  // Group single-slot items by their slot.
  const bySlot = new Map<ItemSlot, ParsedItem[]>();
  for (const item of singleSlot) {
    const slot = item.slots[0]!;
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot)!.push(item);
  }

  let best: ParsedItem[] = [];
  let bestScore = Number.NEGATIVE_INFINITY;
  let evaluated = 0;

  // For every subset of multi-slot items...
  for (const multiSubset of powerSet(multiSlot)) {
    const multiUsage = computeSlotUsage(multiSubset);
    // Bail if the multi-slot subset already overflows capacity.
    if (overflowsCapacity(multiUsage, rules)) continue;

    const remaining = remainingCapacity(rules, multiUsage);

    // For each slot that has remaining capacity > 0 AND single-slot
    // items available, enumerate item combinations.
    const slots: ItemSlot[] = [];
    const slotOptions: ParsedItem[][][] = [];
    for (const [slot, slotItems] of bySlot.entries()) {
      const cap = remaining[slot] ?? 0;
      if (cap === 0) {
        slotOptions.push([[]]); // only the empty selection is legal here
      } else {
        slotOptions.push(combinationsUpToSize(slotItems, cap));
      }
      slots.push(slot);
    }

    // Cartesian product over slot choices. Iterates with a generator so
    // we don't materialize the whole product (can be millions of entries
    // on a full late-game inventory).
    for (const combo of iterateCartesian(slotOptions)) {
      const loadout = [...multiSubset];
      for (const slotChoice of combo) {
        for (const item of slotChoice) loadout.push(item);
      }
      evaluated++;
      const score = evaluate(loadout);
      if (score > bestScore) {
        bestScore = score;
        best = loadout;
      }
    }
  }

  return { best, bestScore, evaluated };
}

/**
 * Check if a slot-usage map overflows the rules' capacities. Cheaper
 * than running the full legality check when we just need to prune.
 */
function overflowsCapacity(
  usage: Record<string, number | undefined>,
  rules: SpeciesEquipmentRules,
): boolean {
  for (const [slot, used] of Object.entries(usage)) {
    if (used === undefined) continue;
    const cap = rules.capacity[slot as ItemSlot] ?? 0;
    if (used > cap) return true;
  }
  return false;
}

/**
 * All subsets of `items` with size 0..maxSize, inclusive. Order within
 * each subset matches input order (combinations, not permutations).
 */
function combinationsUpToSize<T>(items: T[], maxSize: number): T[][] {
  const out: T[][] = [[]];
  const effectiveMax = Math.min(maxSize, items.length);
  for (let size = 1; size <= effectiveMax; size++) {
    pushCombinations(items, size, 0, [], out);
  }
  return out;
}

function pushCombinations<T>(
  items: T[],
  remaining: number,
  startIdx: number,
  current: T[],
  out: T[][],
): void {
  if (remaining === 0) {
    out.push([...current]);
    return;
  }
  const stop = items.length - remaining;
  for (let i = startIdx; i <= stop; i++) {
    current.push(items[i]!);
    pushCombinations(items, remaining - 1, i + 1, current, out);
    current.pop();
  }
}

/**
 * Power set of an array (all 2^N subsets). Used only for the small set
 * of multi-slot items in the inventory.
 */
function powerSet<T>(items: T[]): T[][] {
  const result: T[][] = [[]];
  for (const item of items) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i]!, item]);
    }
  }
  return result;
}

/**
 * Iterate the cartesian product of an array of "choice sets" without
 * materializing it. Yields each combination in turn; the caller must
 * copy any values it wants to retain after the next iteration since
 * we mutate an internal buffer.
 */
function* iterateCartesian<T>(arrays: T[][]): Generator<T[]> {
  for (const arr of arrays) {
    if (arr.length === 0) return;
  }
  const n = arrays.length;
  if (n === 0) {
    yield [];
    return;
  }
  const indices = new Array<number>(n).fill(0);
  const buffer = new Array<T>(n);
  while (true) {
    for (let i = 0; i < n; i++) {
      buffer[i] = arrays[i]![indices[i]!]!;
    }
    yield buffer;
    // Increment indices like an odometer.
    let i = n - 1;
    while (i >= 0) {
      indices[i]!++;
      if (indices[i]! < arrays[i]!.length) break;
      indices[i] = 0;
      i--;
    }
    if (i < 0) return;
  }
}
