import { describe, it, expect } from 'vitest';
import { getSpeciesEquipmentRules } from 'dcss-game-data';
import { checkLegality } from '../src/legality.js';
import { makeItem } from './fixtures.js';

describe('checkLegality — two-hander rule', () => {
  const human = getSpeciesEquipmentRules('Hu');
  const formicid = getSpeciesEquipmentRules('Fo');

  it('one-handed weapon + shield is legal', () => {
    const sword = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      contributions: {},
      hands: 1,
    });
    const shield = makeItem({
      category: 'shield',
      slots: ['offhand'],
      contributions: {},
    });
    expect(checkLegality([sword, shield], human)).toEqual([]);
  });

  it('two-handed weapon + shield is illegal for Human', () => {
    const greatMace = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      contributions: {},
      hands: 2,
    });
    const shield = makeItem({
      category: 'shield',
      slots: ['offhand'],
      contributions: {},
    });
    const v = checkLegality([greatMace, shield], human);
    expect(v.length).toBe(1);
    expect(v[0]).toContain('Two-handed');
  });

  it('two-handed weapon + shield is legal for Formicid', () => {
    const greatMace = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      contributions: {},
      hands: 2,
    });
    const shield = makeItem({
      category: 'shield',
      slots: ['offhand'],
      contributions: {},
    });
    expect(checkLegality([greatMace, shield], formicid)).toEqual([]);
  });
});
