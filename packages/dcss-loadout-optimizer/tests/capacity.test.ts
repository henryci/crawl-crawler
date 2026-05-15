import { describe, it, expect } from 'vitest';
import { getSpeciesEquipmentRules } from 'dcss-game-data';
import { computeSlotUsage, checkCapacity, remainingCapacity } from '../src/capacity.js';
import { makeItem } from './fixtures.js';

describe('computeSlotUsage', () => {
  it('tallies single-slot items', () => {
    const a = makeItem({ category: 'armor', slots: ['body_armour'], contributions: {} });
    const b = makeItem({ category: 'jewelry', slots: ['ring'], contributions: {} });
    const c = makeItem({ category: 'jewelry', slots: ['ring'], contributions: {} });
    expect(computeSlotUsage([a, b, c])).toEqual({ body_armour: 1, ring: 2 });
  });

  it('tallies multi-slot items across their slots', () => {
    const lear = makeItem({
      category: 'armor',
      slots: ['body_armour', 'helmet', 'gloves', 'boots'],
      contributions: {},
    });
    expect(computeSlotUsage([lear])).toEqual({
      body_armour: 1,
      helmet: 1,
      gloves: 1,
      boots: 1,
    });
  });
});

describe('checkCapacity', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('returns no violations for an empty loadout', () => {
    expect(checkCapacity([], human)).toEqual([]);
  });

  it('returns no violations for a single body armor', () => {
    const item = makeItem({ category: 'armor', slots: ['body_armour'], contributions: {} });
    expect(checkCapacity([item], human)).toEqual([]);
  });

  it('flags overflow when two body armors are equipped', () => {
    const a = makeItem({ category: 'armor', slots: ['body_armour'], contributions: {} });
    const b = makeItem({ category: 'armor', slots: ['body_armour'], contributions: {} });
    const v = checkCapacity([a, b], human);
    expect(v.length).toBe(1);
    expect(v[0]).toContain('body_armour');
  });

  it('Octopode can wear 8 rings, Human only 2', () => {
    const rings = Array.from({ length: 3 }, () =>
      makeItem({ category: 'jewelry', slots: ['ring'], contributions: {} }),
    );
    const op = getSpeciesEquipmentRules('Op');
    expect(checkCapacity(rings, human).length).toBe(1); // 3 > 2 for human
    expect(checkCapacity(rings, op)).toEqual([]);       // 3 ≤ 8 for octopode
  });
});

describe('remainingCapacity', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('returns full capacity when no items are used', () => {
    const r = remainingCapacity(human, {});
    expect(r.ring).toBe(2);
    expect(r.body_armour).toBe(1);
  });

  it('subtracts usage', () => {
    const r = remainingCapacity(human, { ring: 1 });
    expect(r.ring).toBe(1);
  });

  it('clamps negative remaining to zero', () => {
    const r = remainingCapacity(human, { ring: 5 });
    expect(r.ring).toBe(0);
  });
});
