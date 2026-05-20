/**
 * Type definitions for the loadout optimizer.
 *
 * Inputs:
 *   - items: a player's full inventory as ParsedItem[] (from the parser).
 *   - rules: SpeciesEquipmentRules (from dcss-game-data).
 *   - objective: what to optimize for.
 *
 * Output:
 *   - best: the highest-scoring legal loadout.
 *   - score: total property values + violations.
 */

import type {
  ContributionMap,
  ParsedItem,
  PropertyKey,
  SpeciesEquipmentRules,
} from 'dcss-game-data';

/**
 * A flat list of items chosen for a loadout. Order doesn't matter for
 * scoring; the list is used as a set with potential duplicates only on
 * multi-count slots like rings.
 */
export interface Loadout {
  items: ParsedItem[];
}

/**
 * Score returned for a loadout. `totals` is post-cap (mirroring DCSS
 * runtime caps from PROPERTIES); `uncappedTotals` is the raw sum and
 * is used to break ties (e.g., +4 rF beats +3 rF for ranking, but both
 * cap at +3 for actual effect).
 *
 * When a baseline is provided to the optimizer, `totals` reflects
 * (equipment + baseline) post-cap. `equipmentTotals` separately
 * exposes the equipment-only contribution (uncapped) for UI breakdown.
 */
export interface LoadoutScore {
  totals: ContributionMap;
  uncappedTotals: ContributionMap;
  /**
   * Equipment-only contributions, without baseline added. Empty when
   * the loadout has no items. Useful for UI that shows "from equipment"
   * vs "from species/god/mutations" breakdown.
   */
  equipmentTotals: ContributionMap;
  /**
   * The baseline that was added to compute totals. Echoes back what the
   * caller passed in OptimizerInputs.baseline, or {} when none was set.
   */
  baseline: ContributionMap;
  /**
   * Empty when the loadout is legal. Otherwise each entry is a human-
   * readable explanation of why the loadout is illegal (slot overflow,
   * two-hander conflict, etc.). Illegal loadouts get worst-case scores
   * so they're never picked by the optimizer.
   */
  violations: string[];
}

/**
 * Optimizer objective.
 *
 *   - `maximize`:     maximize a single property's total.
 *   - `maximize_sum`: maximize the sum of multiple properties.
 *   - `maximize_with_floor`: legacy alias for `maximize` with floors —
 *                            kept for backward compat; new code should
 *                            use `maximize` and set `floors` directly.
 *
 * Any kind can attach optional `floors`: a constraint that requires
 * `totals[prop] >= value` for each entry. A loadout that fails any
 * floor is treated as illegal (score = -Infinity).
 */
export type Objective =
  | {
      kind: 'maximize';
      prop: PropertyKey;
      floors?: Partial<Record<PropertyKey, number>>;
    }
  | {
      kind: 'maximize_sum';
      props: PropertyKey[];
      floors?: Partial<Record<PropertyKey, number>>;
    }
  | {
      kind: 'maximize_with_floor';
      prop: PropertyKey;
      floors: Partial<Record<PropertyKey, number>>;
    }
  | {
      /**
       * Lexicographic priority ladder: each entry is strictly more
       * important than the next. The optimizer first maximizes the
       * first priority, then breaks ties on the second, and so on. Use
       * for "max elemental resistances, then max Dex, then max EV"
       * style objectives.
       *
       * Each priority is either a single-property maximize or a sum.
       * Capped totals are used at each tier — items contributing past
       * a cap don't break ties.
       */
      kind: 'priorities';
      priorities: Array<
        | { prop: PropertyKey }
        | { props: PropertyKey[] }
      >;
      floors?: Partial<Record<PropertyKey, number>>;
    };

export interface OptimizerInputs {
  items: ParsedItem[];
  rules: SpeciesEquipmentRules;
  objective: Objective;
  /**
   * Optional non-equipment contributions to add to every loadout.
   *
   * Represents what the player gets from species, god, mutations, and
   * form — sources that don't change as you swap equipment. When set,
   * the optimizer scores loadouts as (baseline + equipment) so its
   * totals match what DCSS would actually show with that loadout
   * equipped.
   *
   * Derive from a parsed morgue via `computeBaseline(runtimeTotals,
   * equippedItems)`.
   */
  baseline?: ContributionMap;
  /**
   * Properties used to break ties and fill slots that don't matter to
   * the primary objective.
   *
   * Without this, "maximize EV" would equip the one EV item and leave
   * everything else empty (since nothing else affects EV). With it,
   * the optimizer also picks items contributing to these fill
   * properties — at a low enough weight that the primary objective
   * still dominates, but high enough that empty slots get filled with
   * something useful.
   *
   * Defaults to a standard "defensive + offensive + utility" set. Pass
   * an empty array to disable filling entirely.
   */
  fillProps?: PropertyKey[];
  /**
   * Items the player wants to keep equipped regardless of what the
   * optimizer would pick. They occupy their slots in the final loadout
   * and are removed from the candidate pool for the search.
   *
   * Slot conflicts among locked items themselves still apply (e.g., two
   * locked body-armour items would produce an illegal loadout). The
   * caller should ensure locked items themselves form a legal set.
   */
  lockedItems?: ParsedItem[];
}

export interface OptimizerResult {
  best: Loadout;
  score: LoadoutScore;
  /**
   * Number of legal loadouts enumerated. Useful for performance
   * debugging — if this grows past a few million, brute force may need
   * pruning.
   */
  loadoutsEvaluated: number;
}
