import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getSpeciesEquipmentRules } from 'dcss-game-data';
import { parseMorgueData } from 'dcss-morgue-parser';
import { optimize } from '../src/optimize.js';
import { evaluateObjective, scoreLoadout } from '../src/score.js';
import { makeItem, resetFixtureIds } from './fixtures.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_DIR = resolve(__dirname, '..', '..', 'sample_morgues');

describe('optimize — priorities ladder (advanced mode)', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('higher-tier priority dominates even at the cost of lower-tier', () => {
    // Tier 1: rF. Tier 2: Dex.
    // Item A: rF+1, Dex+0
    // Item B: rF+0, Dex+5
    // For the body slot (cap 1), A must win because rF is the higher tier.
    const armorRF = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'rF armor',
    });
    const armorDex = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { Dex: 5 },
      displayName: 'Dex armor',
    });

    const result = optimize({
      items: [armorRF, armorDex],
      rules: human,
      objective: {
        kind: 'priorities',
        priorities: [{ prop: 'rF' }, { prop: 'Dex' }],
      },
    });

    expect(result.best.items[0]!.baseType.displayName).toBe('rF armor');
  });

  it('second priority breaks ties when first is equal', () => {
    // Two body armors, both contributing rF+1, but one also Dex+3.
    const armorBoth = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1, Dex: 3 },
      displayName: 'rF + Dex armor',
    });
    const armorRF = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'rF armor',
    });

    const result = optimize({
      items: [armorBoth, armorRF],
      rules: human,
      objective: {
        kind: 'priorities',
        priorities: [{ prop: 'rF' }, { prop: 'Dex' }],
      },
    });

    expect(result.best.items[0]!.baseType.displayName).toBe('rF + Dex armor');
  });

  it('caps the primary tier so redundant items break ties on the secondary', () => {
    // Capacity 2 rings. Goal: max rF (cap 3 from equipment).
    // Items: A rF+1, B rF+1, C rF+1, D rF+0 Dex+5
    // Best loadout: A+B (rF=2, can't reach 3 with cap 2 rings) — but if
    // A+B fully maxes rF (which it can't since cap is 3 and we only
    // have 2 ring slots), tiebreak should prefer C if it adds rF, NOT D.
    // Adjusted test: priorities = [rF, Dex]. With cap=2 rings, best is
    // A+B (rF=2) — no Dex. If we pick A+D, rF=1 < rF=2, so A+B still
    // wins.
    const ringRF1 = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'ring rF 1',
    });
    const ringRF2 = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'ring rF 2',
    });
    const ringDex = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { Dex: 5 },
      displayName: 'ring Dex',
    });

    const result = optimize({
      items: [ringRF1, ringRF2, ringDex],
      rules: human,
      objective: {
        kind: 'priorities',
        priorities: [{ prop: 'rF' }, { prop: 'Dex' }],
      },
    });

    // Both rF rings selected; Dex ring loses despite having higher fill score.
    const names = result.best.items.map((i) => i.baseType.displayName);
    expect(names).toContain('ring rF 1');
    expect(names).toContain('ring rF 2');
    expect(names).not.toContain('ring Dex');
  });

  it('avoids over-stacking a capped primary in favor of the secondary', () => {
    // Goal: max rF (caps at +3), then max Dex.
    // Player has 3 rF+ rings AND a Dex+5 ring; baseline rF=2 already (from species).
    // After equipping 1 rF ring → rF total = 3 (capped). Additional rF rings are wasted.
    // The optimizer should equip 1 rF ring + 1 Dex ring, not 2 rF rings.
    const rfRingA = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'rF ring A',
    });
    const rfRingB = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'rF ring B',
    });
    const dexRing = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { Dex: 5 },
      displayName: 'Dex ring',
    });

    const result = optimize({
      items: [rfRingA, rfRingB, dexRing],
      rules: human,
      objective: {
        kind: 'priorities',
        priorities: [{ prop: 'rF' }, { prop: 'Dex' }],
      },
      baseline: { rF: 2 },
    });

    const names = result.best.items.map((i) => i.baseType.displayName);
    // One rF ring fully maxes rF (2 base + 1 = 3 capped). Second slot
    // should go to Dex, not redundant rF.
    expect(names.filter((n) => n.startsWith('rF ring')).length).toBe(1);
    expect(names).toContain('Dex ring');
  });
});

describe('optimize — locked items', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('keeps a locked item even when a better one exists', () => {
    const sentimentalRing = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'sentimental ring',
    });
    const betterRing = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'better ring',
    });

    const result = optimize({
      items: [sentimentalRing, betterRing],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF' },
      lockedItems: [sentimentalRing],
    });

    const names = result.best.items.map((i) => i.baseType.displayName);
    expect(names).toContain('sentimental ring');
    // The optimizer still gets to pick the second ring slot.
    expect(result.best.items.length).toBe(2);
  });

  it('reduces slot capacity by locked-item occupation', () => {
    const lockedBody = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'locked robe',
    });
    const otherBody = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 2 },
      displayName: 'better robe',
    });

    const result = optimize({
      items: [lockedBody, otherBody],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF' },
      lockedItems: [lockedBody],
    });

    // Only the locked one ends up in body_armour; otherBody is rejected
    // because the slot's effective capacity is 0.
    const names = result.best.items.map((i) => i.baseType.displayName);
    expect(names).toContain('locked robe');
    expect(names).not.toContain('better robe');
  });

  it('locked 2h weapon prevents the optimizer from picking an offhand', () => {
    const lockedGreatMace = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      contributions: { Slay: 5 },
      hands: 2,
      displayName: 'locked great mace',
    });
    const shield = makeItem({
      category: 'shield',
      slots: ['offhand'],
      contributions: { AC: 3 },
      displayName: 'shield',
    });

    const result = optimize({
      items: [lockedGreatMace, shield],
      rules: human,
      objective: { kind: 'maximize', prop: 'AC' },
      lockedItems: [lockedGreatMace],
    });

    const names = result.best.items.map((i) => i.baseType.displayName);
    expect(names).toContain('locked great mace');
    expect(names).not.toContain('shield');
  });
});

describe('optimize — floors on any objective', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('maximize with rN+3 floor: picks 3 rN sources before maximizing rF', () => {
    const rfRing = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'ring of rF',
    });
    const rnAmulet = makeItem({
      category: 'jewelry',
      slots: ['amulet'],
      contributions: { rN: 1 },
      displayName: 'amulet of rN',
    });
    const rnRobe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rN: 2 },
      displayName: 'robe of rN++',
    });

    const result = optimize({
      items: [rfRing, rnAmulet, rnRobe],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF', floors: { rN: 3 } },
    });

    expect(result.score.totals.rN).toBeGreaterThanOrEqual(3);
    expect(result.score.totals.rF).toBeGreaterThanOrEqual(1);
  });

  it('maximize_sum with floor: total resistances maximized while floor holds', () => {
    const rfRobe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'robe of rF',
    });
    const rcRobe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rC: 1 },
      displayName: 'robe of rC',
    });
    const rnAmulet = makeItem({
      category: 'jewelry',
      slots: ['amulet'],
      contributions: { rN: 2 },
      displayName: 'amulet of rN+2',
    });

    const result = optimize({
      items: [rfRobe, rcRobe, rnAmulet],
      rules: human,
      objective: {
        kind: 'maximize_sum',
        props: ['rF', 'rC'],
        floors: { rN: 2 },
      },
    });

    expect(result.score.totals.rN).toBeGreaterThanOrEqual(2);
    // Should still pick one of the rF/rC robes to maximize the sum.
    const names = result.best.items.map((i) => i.baseType.displayName);
    expect(names).toContain('amulet of rN+2');
    expect(names.some((n) => n.includes('robe'))).toBe(true);
  });

  it('floor infeasible: returns empty loadout', () => {
    const rfRobe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'robe of rF',
    });

    const result = optimize({
      items: [rfRobe],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF', floors: { rN: 3 } },
    });

    // No rN item available; floor unreachable.
    expect(result.best.items.length).toBe(0);
  });
});

describe('optimize — fill-objective behavior', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('fills other slots with defensive items even when only one item helps the primary objective', () => {
    // Only one EV-contributing item, but many defensively-useful items
    // in other slots. The optimizer should equip the EV item AND fill
    // the body / cloak / etc. with the defensive items.
    const evRing = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { EV: 5 },
      displayName: 'ring of EV',
    });
    const rfRobe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'robe of fire resistance',
    });
    const willCloak = makeItem({
      category: 'armor',
      slots: ['cloak'],
      contributions: { Will: 1 },
      displayName: 'cloak of willpower',
    });
    const irrelevantPotionScroll = makeItem({
      // Hypothetical item with no defensive contribution.
      category: 'armor',
      slots: ['gloves'],
      contributions: {},
      displayName: 'plain gloves',
    });

    const result = optimize({
      items: [evRing, rfRobe, willCloak, irrelevantPotionScroll],
      rules: human,
      objective: { kind: 'maximize', prop: 'EV' },
    });

    // EV objective still satisfied
    expect(result.score.totals.EV).toBe(5);
    // But other slots filled with defensive items
    const equippedNames = result.best.items.map((i) => i.baseType.displayName);
    expect(equippedNames).toContain('ring of EV');
    expect(equippedNames).toContain('robe of fire resistance');
    expect(equippedNames).toContain('cloak of willpower');
    // Items contributing nothing don't get picked
    expect(equippedNames).not.toContain('plain gloves');
  });

  it('primary objective still dominates: better rF wins even if alternative has more fill props', () => {
    const rfRobe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 2 },
      displayName: 'robe of fire resistance',
    });
    const acRobe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { AC: 10, Stlth: 1 },
      displayName: 'plate with stealth',
    });

    const result = optimize({
      items: [rfRobe, acRobe],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF' },
    });

    // rfRobe wins despite acRobe having more total contributions.
    expect(result.best.items.length).toBe(1);
    expect(result.best.items[0]!.baseType.displayName).toBe('robe of fire resistance');
  });

  it('disabling fillProps reverts to primary-only behavior', () => {
    const evRing = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { EV: 5 },
      displayName: 'ring of EV',
    });
    const rfRobe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'robe of fire resistance',
    });

    const result = optimize({
      items: [evRing, rfRobe],
      rules: human,
      objective: { kind: 'maximize', prop: 'EV' },
      fillProps: [], // disabled
    });

    // With fill disabled, only the EV item is picked; body slot empty.
    expect(result.best.items.length).toBe(1);
    expect(result.best.items[0]!.baseType.displayName).toBe('ring of EV');
  });
});

describe('optimize — synthetic fixtures', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('picks the higher-rF body armor when maximizing rF', () => {
    resetFixtureIds();
    const robeRF1 = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'robe of fire resistance',
    });
    const robeRC1 = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rC: 1 },
      displayName: 'robe of cold resistance',
    });

    const result = optimize({
      items: [robeRF1, robeRC1],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF' },
    });

    expect(result.best.items.map((i) => i.baseType.displayName)).toContain('robe of fire resistance');
    expect(result.score.totals.rF).toBe(1);
  });

  it('combines two rings to reach rF+2', () => {
    const ringA = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'ring of fire resist A',
    });
    const ringB = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rF: 1 },
      displayName: 'ring of fire resist B',
    });
    const ringC = makeItem({
      category: 'jewelry',
      slots: ['ring'],
      contributions: { rC: 1 },
      displayName: 'ring of cold resist',
    });

    const result = optimize({
      items: [ringA, ringB, ringC],
      rules: human,
      objective: { kind: 'maximize', prop: 'rF' },
    });

    expect(result.score.totals.rF).toBe(2);
    expect(result.best.items.length).toBe(2);
  });

  it('respects floor constraints', () => {
    const helmetRF = makeItem({
      category: 'armor',
      slots: ['helmet'],
      contributions: { rF: 1, EV: 0 },
      displayName: 'helmet of rF',
    });
    const helmetEV = makeItem({
      category: 'armor',
      slots: ['helmet'],
      contributions: { rF: 0, EV: 5 },
      displayName: 'helmet of EV',
    });

    // Maximize EV with rF+1 floor — must pick the rF helmet (which has EV=0)
    // since the EV helmet has rF=0 and would violate the floor.
    const result = optimize({
      items: [helmetRF, helmetEV],
      rules: human,
      objective: {
        kind: 'maximize_with_floor',
        prop: 'EV',
        floors: { rF: 1 },
      },
    });

    expect(result.best.items.length).toBe(1);
    expect(result.best.items[0]!.baseType.displayName).toBe('helmet of rF');
  });

  it('handles Octopode 8-ring slot correctly', () => {
    const octopode = getSpeciesEquipmentRules('Op');
    const rings = Array.from({ length: 5 }, (_, i) =>
      makeItem({
        category: 'jewelry',
        slots: ['ring'],
        contributions: { rF: 1, Slay: i },
        displayName: `ring ${i}`,
      }),
    );
    const result = optimize({
      items: rings,
      rules: octopode,
      objective: { kind: 'maximize', prop: 'rF' },
    });
    // 5 rings ≤ 8 slots, so all 5 fit (rF capped at +3 from equipment).
    expect(result.best.items.length).toBe(5);
    expect(result.score.totals.rF).toBe(3); // capped
    expect(result.score.uncappedTotals.rF).toBe(5);
  });

  it('two-hander beats one-handed + shield when objective demands it', () => {
    const sword = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      contributions: { Slay: 2 },
      hands: 1,
      displayName: '1h sword',
    });
    const shield = makeItem({
      category: 'shield',
      slots: ['offhand'],
      contributions: { Slay: 1 },
      displayName: 'shield',
    });
    const greatMace = makeItem({
      category: 'weapon',
      slots: ['weapon'],
      contributions: { Slay: 5 },
      hands: 2,
      displayName: '2h great mace',
    });

    const result = optimize({
      items: [sword, shield, greatMace],
      rules: human,
      objective: { kind: 'maximize', prop: 'Slay' },
    });

    // sword + shield = 3 Slay; great mace alone = 5. Best should be great mace.
    expect(result.score.totals.Slay).toBe(5);
    expect(result.best.items.length).toBe(1);
    expect(result.best.items[0]!.baseType.displayName).toBe('2h great mace');
  });

  it('multi-slot Lear-like unrand is handled', () => {
    const lear = makeItem({
      category: 'armor',
      slots: ['body_armour', 'helmet', 'gloves', 'boots'],
      contributions: { AC: 18, Stlth: -1 },
      displayName: 'Lear-like hauberk',
    });
    const robe = makeItem({
      category: 'armor',
      slots: ['body_armour'],
      contributions: { rF: 1 },
      displayName: 'robe of fire resistance',
    });
    const helmet = makeItem({
      category: 'armor',
      slots: ['helmet'],
      contributions: { Int: 2 },
      displayName: 'helmet of int',
    });

    // Maximize AC — lear (18 AC, no other slots usable) should win.
    const result = optimize({
      items: [lear, robe, helmet],
      rules: human,
      objective: { kind: 'maximize', prop: 'AC' },
    });

    expect(result.score.totals.AC).toBe(18);
    expect(result.best.items.length).toBe(1);
    expect(result.best.items[0]!.baseType.displayName).toBe('Lear-like hauberk');
  });
});

describe('optimize — real morgue inventory', () => {
  it('optimizes rF on the 0.34 reference morgue', async () => {
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);
    expect(data.inventoryItems).not.toBeNull();

    // Player race in this morgue is "Deep Elf" (code 'DE')
    const rules = getSpeciesEquipmentRules(data.race === 'Deep Elf' ? 'DE' : 'Hu');
    const result = optimize({
      items: data.inventoryItems!,
      rules,
      objective: { kind: 'maximize', prop: 'rF' },
    });

    // The reference morgue contains multiple rF+ sources, so total
    // should be capped at 3.
    expect(result.score.totals.rF).toBe(3);
    expect(result.best.items.length).toBeGreaterThan(0);
    expect(result.loadoutsEvaluated).toBeGreaterThan(0);
  });

  it('terminates within a reasonable evaluation count', async () => {
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    const rules = getSpeciesEquipmentRules('Hu');
    const result = optimize({
      items: data.inventoryItems!,
      rules,
      objective: { kind: 'maximize_sum', props: ['rF', 'rC', 'rN', 'rPois', 'rElec'] },
    });

    // Should evaluate within reason — flag if we ever exceed this.
    expect(result.loadoutsEvaluated).toBeLessThan(10_000_000);
  });
});

describe('scoreLoadout + evaluateObjective', () => {
  const human = getSpeciesEquipmentRules('Hu');

  it('scoreLoadout reports violations for capacity overflow', () => {
    const a = makeItem({ category: 'armor', slots: ['body_armour'], contributions: {} });
    const b = makeItem({ category: 'armor', slots: ['body_armour'], contributions: {} });
    const result = scoreLoadout([a, b], human);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('evaluateObjective returns -Infinity for violations', () => {
    const a = makeItem({ category: 'armor', slots: ['body_armour'], contributions: { rF: 5 } });
    const b = makeItem({ category: 'armor', slots: ['body_armour'], contributions: { rF: 5 } });
    const score = scoreLoadout([a, b], human);
    const fitness = evaluateObjective(score, { kind: 'maximize', prop: 'rF' });
    expect(fitness).toBe(Number.NEGATIVE_INFINITY);
  });
});
