import { describe, it, expect } from 'vitest';
import { sumContributions, applyCaps } from '../src/aggregate.js';
import { makeItem } from './fixtures.js';

describe('sumContributions', () => {
  it('returns empty map for no items', () => {
    expect(sumContributions([])).toEqual({});
  });

  it('sums contributions across items', () => {
    const a = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1, Str: 2 },
    });
    const b = makeItem({
      category: 'armor',
      slots: ['helmet'],
      contributions: { rF: 1, Int: 3 },
    });
    expect(sumContributions([a, b])).toEqual({ rF: 2, Str: 2, Int: 3 });
  });

  it('handles negative contributions', () => {
    const a = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { Str: 3, Dex: -2 },
    });
    expect(sumContributions([a])).toEqual({ Str: 3, Dex: -2 });
  });
});

describe('applyCaps', () => {
  it('clamps rF to +3 max', () => {
    expect(applyCaps({ rF: 5 })).toEqual({ rF: 3 });
    expect(applyCaps({ rF: 2 })).toEqual({ rF: 2 });
    expect(applyCaps({ rF: -5 })).toEqual({ rF: -3 });
  });

  it('clamps Will to +5 max', () => {
    expect(applyCaps({ Will: 7 })).toEqual({ Will: 5 });
    expect(applyCaps({ Will: 3 })).toEqual({ Will: 3 });
  });

  it('does not clamp uncapped properties (Str, AC, EV)', () => {
    expect(applyCaps({ Str: 20, AC: 100, EV: 50 })).toEqual({
      Str: 20,
      AC: 100,
      EV: 50,
    });
  });

  it('handles binary resistances (rPois caps at +1)', () => {
    expect(applyCaps({ rPois: 3 })).toEqual({ rPois: 1 });
  });
});
