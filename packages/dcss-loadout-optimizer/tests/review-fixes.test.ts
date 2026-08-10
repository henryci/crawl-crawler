/**
 * Regression tests for the code-review findings on the Stat Explorer
 * work: infeasibility contract, locked-overflow capacity accounting,
 * group floors, representative minimization, and the stat baseline.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { getSpeciesEquipmentRules } from 'dcss-game-data';

import { computeStatBaseline } from '../src/baseline.js';
import { computeFrontier } from '../src/frontier.js';
import { optimize } from '../src/optimize.js';
import { makeItem, resetFixtureIds } from './fixtures.js';

const human = getSpeciesEquipmentRules('Hu');
const RESISTS = ['rF', 'rC', 'rN', 'rPois', 'rElec', 'rCorr'] as const;

describe('optimize — infeasible floors keep locked items (finding 1)', () => {
  beforeEach(() => resetFixtureIds());

  it('returns feasible=false and only the locked items when floors are unsatisfiable', () => {
    const lockedRing = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { Int: 6 },
      displayName: 'locked int ring',
    });
    const otherRing = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 4 } });

    const result = optimize({
      items: [lockedRing, otherRing],
      rules: human,
      objective: { kind: 'maximize', prop: 'Str', floors: { Str: 99 } },
      lockedItems: [lockedRing],
    });

    expect(result.feasible).toBe(false);
    expect(result.best.items).toEqual([lockedRing]);
  });

  it('returns feasible=true on a normal run', () => {
    const ring = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 4 } });
    const result = optimize({
      items: [ring],
      rules: human,
      objective: { kind: 'maximize', prop: 'Str' },
    });
    expect(result.feasible).toBe(true);
    expect(result.score.totals.Str).toBe(4);
  });
});

describe('frontier — locked slot overflow paid off by a pool granter (finding 2)', () => {
  beforeEach(() => resetFixtureIds());

  it('keeps legal points when locked rings exceed base capacity and a granter is available', () => {
    // Three plain rings locked (wearable via a granter that has since
    // been unequipped) against a base ring capacity of 2. The crown of
    // Vainglory in the pool grants +2 ring slots: with it worn there
    // is exactly ONE free ring slot, so the best legal point wears the
    // rF+2 ring — not the rF+1+rF+2 pair the buggy accounting used to
    // prefer and then reject.
    const locked1 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: {} });
    const locked2 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: {} });
    const locked3 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: {} });
    const crown = makeItem({
      category: 'armor',
      slots: ['helmet'],
      contributions: {},
      unrandKey: 'UNRAND_VAINGLORY',
      displayName: 'crown of Vainglory',
    });
    const ringRF1 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { rF: 1 } });
    const ringRF2 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { rF: 2 } });

    const result = computeFrontier({
      items: [locked1, locked2, locked3, crown, ringRF1, ringRF2],
      rules: human,
      dims: [['rF', 'rC']],
      lockedItems: [locked1, locked2, locked3],
    });

    expect(result.points.map((p) => p.values)).toEqual([[2]]);
    const names = result.points[0]!.items.map((i) => i.baseType.displayName);
    expect(names).toContain('crown of Vainglory');
    expect(names).toContain(ringRF2.baseType.displayName);
    expect(names).not.toContain(ringRF1.baseType.displayName);
  });
});

describe('optimize — group floors pin capped-sum values (finding 3)', () => {
  beforeEach(() => resetFixtureIds());

  // The review's probe: priorities [resists, Stealth] with an amulet
  // {Stlth+2} and a ring {rF+1, Stlth-2}. The frontier rows are
  // P=(resists 0, Stlth 2) and Q=(resists 1, Stlth 0).
  const setup = () => {
    const amulet = makeItem({
      category: 'jewelry',
      slots: ['amulet'],
      contributions: { Stlth: 2 },
      displayName: 'stealth amulet',
    });
    const ring = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1, Stlth: -2 },
      displayName: 'noisy rF ring',
    });
    return { amulet, ring };
  };

  it('without group floors the ladder abandons the clicked row (documents the bug)', () => {
    const { amulet, ring } = setup();
    const result = optimize({
      items: [amulet, ring],
      rules: human,
      objective: {
        kind: 'priorities',
        priorities: [{ props: [...RESISTS] }, { prop: 'Stlth' }],
      },
      lockedItems: [amulet],
    });
    // Tier 1 (resists) dominates: the noisy ring goes on, Stealth dies.
    expect(result.score.totals.rF ?? 0).toBe(1);
    expect(result.score.totals.Stlth ?? 0).toBe(0);
  });

  it('group floors reproduce the clicked row exactly', () => {
    const { amulet, ring } = setup();
    const result = optimize({
      items: [amulet, ring],
      rules: human,
      objective: {
        kind: 'priorities',
        priorities: [{ props: [...RESISTS] }, { prop: 'Stlth' }],
        groupFloors: [
          { props: [...RESISTS], min: 0 },
          { props: ['Stlth'], min: 2 },
        ],
      },
      lockedItems: [amulet],
    });
    expect(result.feasible).toBe(true);
    expect(result.score.totals.Stlth ?? 0).toBe(2);
    expect(RESISTS.reduce((n, r) => n + (result.score.totals[r] ?? 0), 0)).toBe(0);
    expect(result.best.items.map((i) => i.baseType.displayName)).not.toContain(
      'noisy rF ring',
    );
  });

  it('sums post-cap values (rF past +3 does not satisfy a higher group floor)', () => {
    const ring1 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { rF: 3 } });
    const ring2 = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { rF: 2 } });
    const result = optimize({
      items: [ring1, ring2],
      rules: human,
      objective: {
        kind: 'maximize_sum',
        props: [...RESISTS],
        // Raw rF is 5 but capped is 3 — a group floor of 4 is unmeetable.
        groupFloors: [{ props: [...RESISTS], min: 4 }],
      },
    });
    expect(result.feasible).toBe(false);
  });
});

describe('frontier — representatives are minimal (finding 4)', () => {
  beforeEach(() => resetFixtureIds());

  it('drops a ring that only contributes past the cap', () => {
    const ringRF3 = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 3 },
      displayName: 'rF+3 ring',
    });
    const ringRF1 = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'rF+1 ring',
    });
    const result = computeFrontier({
      items: [ringRF3, ringRF1],
      rules: human,
      dims: [['rF', 'rC'], ['Str']],
    });
    expect(result.points.map((p) => p.values)).toEqual([[3, 0]]);
    expect(result.points[0]!.items.map((i) => i.baseType.displayName)).toEqual([
      'rF+3 ring',
    ]);
  });

  it('drops gear made redundant by the baseline', () => {
    // Poison-immune species baseline: the rPois ring adds nothing.
    const ringPois = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rPois: 1 },
      displayName: 'rPois ring',
    });
    const ringStr = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { Str: 6 },
      displayName: 'str ring',
    });
    const result = computeFrontier({
      items: [ringPois, ringStr],
      rules: human,
      dims: [['rPois', 'rF'], ['Str']],
      baseline: { rPois: 1 },
    });
    expect(result.points.map((p) => p.values)).toEqual([[1, 6]]);
    expect(result.points[0]!.items.map((i) => i.baseType.displayName)).toEqual([
      'str ring',
    ]);
  });

  it('drops gear for a floor the baseline already meets', () => {
    const ringWill = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { Will: 1 },
      displayName: 'will ring',
    });
    const ringStr = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { Str: 6 },
      displayName: 'str ring',
    });
    const result = computeFrontier({
      items: [ringWill, ringStr],
      rules: human,
      dims: [['Str']],
      floors: { Will: 2 },
      baseline: { Will: 2 },
    });
    expect(result.points.map((p) => p.values)).toEqual([[6]]);
    expect(result.points[0]!.items.map((i) => i.baseType.displayName)).toEqual([
      'str ring',
    ]);
  });

  it('never strips locked items even when they contribute nothing', () => {
    const lockedBlank = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: {},
      displayName: 'sentimental ring',
    });
    const ringStr = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const result = computeFrontier({
      items: [lockedBlank, ringStr],
      rules: human,
      dims: [['Str']],
      lockedItems: [lockedBlank],
    });
    expect(result.points[0]!.items.map((i) => i.baseType.displayName)).toContain(
      'sentimental ring',
    );
  });
});

describe('computeStatBaseline (finding 12)', () => {
  beforeEach(() => resetFixtureIds());

  it('subtracts equipped stat contributions from final stats', () => {
    const ring = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6, Int: 2 } });
    const baseline = computeStatBaseline({ str: 24, int: 10, dex: 14 }, [ring]);
    expect(baseline).toEqual({ Str: 18, Int: 8, Dex: 14 });
  });

  it('allows negative base stats (drain below equipment contribution)', () => {
    const ring = makeItem({ category: 'jewelry', slots: ['ring'], contributions: { Str: 6 } });
    const baseline = computeStatBaseline({ str: 3, int: null, dex: null }, [ring]);
    expect(baseline).toEqual({ Str: -3 });
  });

  it('skips null stats and returns null when nothing is usable', () => {
    expect(computeStatBaseline({ str: null, int: null, dex: null }, [])).toBeNull();
    expect(computeStatBaseline({ str: null, int: 12, dex: null }, [])).toEqual({ Int: 12 });
  });
});
