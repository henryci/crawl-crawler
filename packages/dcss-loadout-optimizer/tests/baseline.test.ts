import { describe, it, expect } from 'vitest';
import { getSpeciesEquipmentRules } from 'dcss-game-data';

import { computeBaseline } from '../src/baseline.js';
import { optimize } from '../src/optimize.js';
import { scoreLoadout } from '../src/score.js';
import { makeItem } from './fixtures.js';

describe('computeBaseline', () => {
  it('returns empty map when runtimeTotals is empty', () => {
    expect(computeBaseline({}, [])).toEqual({});
  });

  it('subtracts equipped contributions from runtime totals', () => {
    const ring = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
    });
    // Runtime says rF: 3, equipped ring gives rF: 1 → baseline rF: 2
    expect(computeBaseline({ rF: 3 }, [ring])).toEqual({ rF: 2 });
  });

  it('returns zero (not negative) when equipment exceeds runtime', () => {
    const ring = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 5 },
    });
    // Equipped gives rF: 5 but runtime caps at 3 → baseline = max(0, 3-5) = 0
    expect(computeBaseline({ rF: 3 }, [ring])).toEqual({ rF: 0 });
  });

  it('preserves properties not contributed by equipment', () => {
    const ring = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
    });
    // Runtime has rPois: 1 but no equipment gives rPois → baseline rPois: 1
    expect(computeBaseline({ rF: 2, rPois: 1 }, [ring])).toEqual({
      rF: 1,
      rPois: 1,
    });
  });
});

describe('scoreLoadout with baseline', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('adds baseline to totals', () => {
    const ring = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
    });
    const score = scoreLoadout([ring], human, { rF: 1 });
    expect(score.totals.rF).toBe(2);
    expect(score.equipmentTotals.rF).toBe(1);
    expect(score.baseline.rF).toBe(1);
  });

  it('caps combined totals (baseline + equipment)', () => {
    const ring = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 3 },
    });
    const score = scoreLoadout([ring], human, { rF: 2 });
    // Uncapped 5, capped at 3.
    expect(score.totals.rF).toBe(3);
    expect(score.uncappedTotals.rF).toBe(5);
  });

  it('omits baseline when undefined', () => {
    const ring = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
    });
    const score = scoreLoadout([ring], human);
    expect(score.baseline).toEqual({});
    expect(score.totals.rF).toBe(1);
  });
});

describe('optimize with baseline', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('factors baseline into objective evaluation', () => {
    const ringRF1 = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'ring of rF',
    });
    const ringRC1 = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rC: 1 },
      displayName: 'ring of rC',
    });

    // Maximize rF: ring of rF wins, total rF = 1 (no baseline).
    const noBaseline = optimize({
      items: [ringRF1, ringRC1],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF' },
    });
    expect(noBaseline.score.totals.rF).toBe(1);

    // With baseline rF: 2, the optimizer still picks ring of rF
    // to get total 3 (capped). But it also shouldn't pick ring of rC
    // since neither ring helps rC for an rF objective.
    const withBaseline = optimize({
      items: [ringRF1, ringRC1],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF' },
      baseline: { rF: 2 },
    });
    expect(withBaseline.score.totals.rF).toBe(3);
    expect(withBaseline.score.baseline.rF).toBe(2);
  });

  it('respects floor that requires baseline contribution', () => {
    const ringRF = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 0, EV: 5 },
      displayName: 'ring of EV',
    });

    // Maximize EV with rF+2 floor. Without baseline, no item provides
    // any rF, so the floor is unreachable (optimizer returns empty).
    const noBaseline = optimize({
      items: [ringRF],
      rules: human,
      objective: { kind: 'maximize_with_floor', prop: 'EV', floors: { rF: 2 } },
    });
    expect(noBaseline.best.items.length).toBe(0);

    // With baseline rF: 2, the floor is satisfied even without an rF
    // item, so the EV ring is selected.
    const withBaseline = optimize({
      items: [ringRF],
      rules: human,
      objective: { kind: 'maximize_with_floor', prop: 'EV', floors: { rF: 2 } },
      baseline: { rF: 2 },
    });
    expect(withBaseline.best.items.length).toBe(1);
    expect(withBaseline.score.totals.EV).toBe(5);
    expect(withBaseline.score.totals.rF).toBe(2);
  });
});
