import { describe, it, expect, beforeEach } from 'vitest';

import { getSpeciesEquipmentRules } from 'dcss-game-data';

import { computeFrontier } from '../src/frontier.js';
import { optimize } from '../src/optimize.js';
import { makeItem, resetFixtureIds } from './fixtures.js';

const human = getSpeciesEquipmentRules('Hu');

function values(result: ReturnType<typeof computeFrontier>): number[][] {
  return result.points.map((p) => p.values);
}

describe('computeFrontier — Pareto set over stat combinations', () => {
  beforeEach(() => resetFixtureIds());

  it('returns only the empty-loadout point for an empty inventory', () => {
    const result = computeFrontier({
      items: [],
      rules: human,
      dims: [['Str'], ['Int'], ['Dex']],
    });
    expect(values(result)).toEqual([[0, 0, 0]]);
    expect(result.points[0]!.items).toEqual([]);
  });

  it('drops dominated combinations', () => {
    // 2 ring slots; rings Str+6, Str+4, Int+6.
    // {S6,S4} = (10,0); {S6,I6} = (6,6); {S4,I6} = (4,6) is dominated
    // by (6,6), as are all smaller subsets.
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const ringS4 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 4 } });
    const ringI6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Int: 6 } });

    const result = computeFrontier({
      items: [ringS6, ringS4, ringI6],
      rules: human,
      dims: [['Str'], ['Int']],
    });

    // Sorted by descending sum: (6,6) = 12 ahead of (10,0) = 10.
    expect(values(result)).toEqual([
      [6, 6],
      [10, 0],
    ]);
  });

  it('keeps the smallest loadout as the representative for a vector', () => {
    // A Dex+0 amulet adds nothing to the explored dims; the (6,0)
    // vector's representative should be just the Str ring.
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const amuletBlank = makeItem({ category: 'jewelry', slots: ['amulet'], contributions: { rF: 1 } });

    const result = computeFrontier({
      items: [ringS6, amuletBlank],
      rules: human,
      dims: [['Str'], ['Int']],
    });

    expect(values(result)).toEqual([[6, 0]]);
    expect(result.points[0]!.items.map((i) => i.baseType.displayName)).toEqual([
      ringS6.baseType.displayName,
    ]);
  });

  it('honors floors on non-explored properties', () => {
    // One amulet slot: rF+1 amulet vs Str+4 amulet. With a floor of
    // rF >= 1, the Str amulet can never be worn, capping Str at the
    // ring's +6.
    const amuletRF = makeItem({ category: 'jewelry', slots: ['amulet'], contributions: { rF: 1 } });
    const amuletStr = makeItem({ category: 'jewelry', slots: ['amulet'], contributions: { Str: 4 } });
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });

    const unconstrained = computeFrontier({
      items: [amuletRF, amuletStr, ringS6],
      rules: human,
      dims: [['Str']],
    });
    expect(values(unconstrained)).toEqual([[10]]);

    const constrained = computeFrontier({
      items: [amuletRF, amuletStr, ringS6],
      rules: human,
      dims: [['Str']],
      floors: { rF: 1 },
    });
    expect(values(constrained)).toEqual([[6]]);
    // Every point must actually wear the rF amulet to satisfy the floor.
    expect(
      constrained.points[0]!.items.map((i) => i.baseType.displayName),
    ).toContain(amuletRF.baseType.displayName);
  });

  it('adds the baseline so values are in player-visible units', () => {
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });

    const result = computeFrontier({
      items: [ringS6],
      rules: human,
      dims: [['Str'], ['Int'], ['Dex']],
      baseline: { Str: 20, Int: 8, Dex: 12 },
    });

    expect(values(result)).toEqual([[26, 8, 12]]);
  });

  it('keeps locked items in every point and out of the free budget', () => {
    // Lock the Int+6 ring: one ring slot remains, so every point has
    // Int 6 and the only frontier point adds the best Str ring.
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const ringS4 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 4 } });
    const ringI6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Int: 6 } });

    const result = computeFrontier({
      items: [ringS6, ringS4, ringI6],
      rules: human,
      dims: [['Str'], ['Int']],
      lockedItems: [ringI6],
    });

    expect(values(result)).toEqual([[6, 6]]);
    expect(result.points[0]!.items.map((i) => i.baseType.displayName)).toContain(
      ringI6.baseType.displayName,
    );
  });

  it('maps two-hander vs weapon+offhand trade-offs', () => {
    const greatSword = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      hands: 2,
      contributions: { Str: 6 },
    });
    const dagger = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      hands: 1,
      contributions: { Int: 2 },
    });
    const shield = makeItem({
      category: 'armor',
      slots: ['offhand'],
      contributions: { Int: 4 },
    });

    const result = computeFrontier({
      items: [greatSword, dagger, shield],
      rules: human,
      dims: [['Str'], ['Int']],
    });

    // 2h alone = (6,0); dagger+shield = (0,6). 2h+shield is illegal.
    expect(values(result)).toEqual([
      [6, 0],
      [0, 6],
    ]);
  });

  it('rejects offhand candidates when a locked two-hander blocks them', () => {
    const greatSword = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      hands: 2,
      contributions: { Str: 6 },
    });
    const shield = makeItem({
      category: 'armor',
      slots: ['offhand'],
      contributions: { Int: 4 },
    });

    const result = computeFrontier({
      items: [greatSword, shield],
      rules: human,
      dims: [['Str'], ['Int']],
      lockedItems: [greatSword],
    });

    // The shield can never join the locked two-hander.
    expect(values(result)).toEqual([[6, 0]]);
  });

  it('retains contribution-less slot granters so granted slots are explored', () => {
    // Macabre finger necklace has no stat contributions but grants a
    // third ring slot. The frontier must include the 3-ring point.
    const necklace = makeItem({
      category: 'jewelry',
      slots: ['amulet'],
      contributions: {},
      unrandKey: 'UNRAND_FINGER_AMULET',
      displayName: 'macabre finger necklace',
    });
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const ringS5 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 5 } });
    const ringS4 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 4 } });

    const result = computeFrontier({
      items: [necklace, ringS6, ringS5, ringS4],
      rules: human,
      dims: [['Str']],
    });

    expect(values(result)).toEqual([[15]]);
    expect(result.points[0]!.items.map((i) => i.baseType.displayName)).toContain(
      'macabre finger necklace',
    );
  });

  it('returns an empty frontier when floors are unsatisfiable', () => {
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const result = computeFrontier({
      items: [ringS6],
      rules: human,
      dims: [['Str']],
      floors: { rF: 3 },
    });
    expect(result.points).toEqual([]);
  });

  it('returns no points for an empty dims list', () => {
    const result = computeFrontier({ items: [], rules: human, dims: [] });
    expect(result.points).toEqual([]);
  });
});

describe('computeFrontier — objective dimensions (capped sums)', () => {
  beforeEach(() => resetFixtureIds());

  it('exposes the objective-vs-stat trade as a dimension', () => {
    // One amulet slot: rF+1 amulet vs Str+4 amulet. As dims, BOTH
    // choices are Pareto-optimal — the trade is visible instead of
    // silently resolved.
    const amuletRF = makeItem({ category: 'jewelry', slots: ['amulet'], contributions: { rF: 1 } });
    const amuletStr = makeItem({ category: 'jewelry', slots: ['amulet'], contributions: { Str: 4 } });

    const result = computeFrontier({
      items: [amuletRF, amuletStr],
      rules: human,
      dims: [['rF', 'rC'], ['Str']],
    });

    expect(values(result)).toEqual([
      [0, 4],
      [1, 0],
    ]);
  });

  it('caps each property before summing a group dimension', () => {
    // rF caps at +3 from equipment: 2 rings of rF+2 sum to raw 4 but
    // the dimension must report 3 (matching objective scoring).
    const ringRF2a = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { rF: 2 } });
    const ringRF2b = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { rF: 2 } });

    const result = computeFrontier({
      items: [ringRF2a, ringRF2b],
      rules: human,
      dims: [['rF', 'rC']],
    });

    expect(values(result)).toEqual([[3]]);
  });

  it('keeps only the max-objective variant of an identical stat combination', () => {
    // Same Str either way; the rF-carrying ring dominates in the
    // objective dimension, so only that variant survives.
    const ringBoth = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { Str: 6, rF: 1 },
    });
    const ringStr = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });

    const result = computeFrontier({
      items: [ringBoth, ringStr],
      rules: human,
      dims: [['rF', 'rC'], ['Str']],
    });

    // 2 ring slots: both rings = (1, 12) dominates everything else.
    expect(values(result)).toEqual([[1, 12]]);
  });

  it('reports stat-dominated combinations that win on the objective', () => {
    // 1 ring slot. Str+6 vs Str+4/rF+1: in pure stat space the second
    // ring is dominated; with the objective dimension it's a real
    // option again.
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const ringS4rF = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { Str: 4, rF: 1 },
    });
    const oneRing = {
      ...human,
      capacity: { ...human.capacity, ring: 1 },
    };

    const result = computeFrontier({
      items: [ringS6, ringS4rF],
      rules: oneRing,
      dims: [['rF', 'rC'], ['Str']],
    });

    expect(values(result)).toEqual([
      [0, 6],
      [1, 4],
    ]);
  });
});

describe('optimize — slot-granter retention regression', () => {
  beforeEach(() => resetFixtureIds());

  it('equips a contribution-less granter when its granted slot helps the objective', () => {
    const necklace = makeItem({
      category: 'jewelry',
      slots: ['amulet'],
      contributions: {},
      unrandKey: 'UNRAND_FINGER_AMULET',
      displayName: 'macabre finger necklace',
    });
    const ringS6 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const ringS5 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 5 } });
    const ringS4 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 4 } });

    const result = optimize({
      items: [necklace, ringS6, ringS5, ringS4],
      rules: human,
      objective: { kind: 'maximize', prop: 'Str' },
    });

    expect(result.score.totals.Str).toBe(15);
    expect(result.best.items.map((i) => i.baseType.displayName)).toContain(
      'macabre finger necklace',
    );
  });
});
