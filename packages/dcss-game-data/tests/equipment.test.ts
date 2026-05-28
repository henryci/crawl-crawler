import { describe, it, expect } from 'vitest';

import {
  PROPERTIES,
  PROPERTIES_BY_ARTP,
  ARTP_ENTRIES,
  CURATED_ARTP_KEYS,
  WEAPON_BRANDS,
  CURATED_BRAND_KEYS,
  ARMOR_EGOS,
  EGO_ENTRIES,
  getUncoveredEgos,
  WEAPON_BASE_TYPES,
  ARMOR_BASE_TYPES,
  SHIELD_BASE_TYPES,
  JEWELRY_BASE_TYPES,
  STAFF_BASE_TYPES,
  CURATED_JEWELRY_KEYS,
  CURATED_STAFF_KEYS,
  JEWELRY_ENTRIES,
  STAFF_ENTRIES,
  BRAND_ENTRIES,
  UNRAND_ENTRIES,
  UNRAND_BY_NAME,
  MULTI_SLOT_UNRANDS,
  getMultiSlotOccupation,
  getGrantedSlots,
  effectiveCapacity,
  getSpeciesEquipmentRules,
  getSlotCapacity,
  DEFAULT_CAPACITY,
} from '../src/equipment/index.js';
import type { ParsedItem } from '../src/equipment/index.js';

describe('properties registry', () => {
  it('covers every non-legacy ARTP', () => {
    const uncovered = ARTP_ENTRIES
      .filter((e) => !e.legacy)
      .filter((e) => !CURATED_ARTP_KEYS.has(e.enumName))
      .map((e) => e.enumName);
    expect(uncovered).toEqual([]);
  });

  it('rF has the expected shape', () => {
    const rF = PROPERTIES.rF;
    expect(rF).toBeDefined();
    expect(rF!.category).toBe('resistance');
    expect(rF!.rendering).toBe('pip');
    expect(rF!.bipolar).toBe(true);
    expect(rF!.cap).toEqual({ min: -3, max: 3 });
    expect(rF!.artpEnum).toBe('ARTP_FIRE');
  });

  it('SInv is bool-rendered, not bipolar', () => {
    const sInv = PROPERTIES.SInv;
    expect(sInv).toBeDefined();
    expect(sInv!.rendering).toBe('bool');
    expect(sInv!.bipolar).toBe(false);
  });

  it('Str is int-rendered and bipolar', () => {
    const str = PROPERTIES.Str;
    expect(str!.rendering).toBe('int');
    expect(str!.bipolar).toBe(true);
  });

  it('downside properties have the correct category', () => {
    expect(PROPERTIES['^Fragile']!.category).toBe('downside');
    expect(PROPERTIES['*Slow']!.category).toBe('downside');
    expect(PROPERTIES['^Drain']!.category).toBe('downside');
  });

  it('PROPERTIES_BY_ARTP allows lookup by enum name', () => {
    const rF = PROPERTIES_BY_ARTP.get('ARTP_FIRE');
    expect(rF?.key).toBe('rF');
  });
});

describe('weapon brands', () => {
  it('covers every real brand', () => {
    const realBrands = BRAND_ENTRIES.filter((e) => e.realBrand).map((e) => e.enumName);
    for (const enumName of realBrands) {
      expect(CURATED_BRAND_KEYS.has(enumName)).toBe(true);
    }
  });

  it('uses terse names as keys', () => {
    expect(WEAPON_BRANDS.flame).toBeDefined();
    expect(WEAPON_BRANDS.flame!.spwpnEnum).toBe('SPWPN_FLAMING');
    expect(WEAPON_BRANDS.drain!.spwpnEnum).toBe('SPWPN_DRAINING');
  });

  it('brands have empty contributions (on-hit effects don\'t aggregate)', () => {
    for (const brand of Object.values(WEAPON_BRANDS)) {
      expect(brand.contributions).toEqual([]);
    }
  });
});

describe('armor egos', () => {
  it('covers every real ego (auto-parsed or curated)', () => {
    expect(getUncoveredEgos()).toEqual([]);
  });

  it('auto-parses rF+ as a pip contribution', () => {
    const fr = ARMOR_EGOS.fire_resistance;
    expect(fr!.contributions).toEqual([{ prop: 'rF', value: 1 }]);
  });

  it('auto-parses Str+3 as an int contribution', () => {
    const str = ARMOR_EGOS.strength;
    expect(str!.contributions).toEqual([{ prop: 'Str', value: 3 }]);
  });

  it('auto-parses multi-token terse names (resistance = rC+ rF+)', () => {
    const resistance = ARMOR_EGOS.resistance;
    expect(resistance!.contributions).toEqual([
      { prop: 'rC', value: 1 },
      { prop: 'rF', value: 1 },
    ]);
  });

  it('every real ego now has at least one contribution', () => {
    for (const [key, ego] of Object.entries(ARMOR_EGOS)) {
      expect(ego.contributions.length, `${key} has no contributions`).toBeGreaterThanOrEqual(1);
    }
  });

  it('non-ARTP flag egos auto-parse via curated extra properties', () => {
    expect(ARMOR_EGOS.reflection!.contributions).toEqual([{ prop: 'Reflect', value: 1 }]);
    expect(ARMOR_EGOS.spirit_shield!.contributions).toEqual([{ prop: 'Spirit', value: 1 }]);
    expect(ARMOR_EGOS.ponderousness!.contributions).toEqual([{ prop: 'Ponderous', value: 1 }]);
    expect(ARMOR_EGOS.mayhem!.contributions).toEqual([{ prop: 'Mayhem', value: 1 }]);
    expect(ARMOR_EGOS.guile!.contributions).toEqual([{ prop: 'Guile', value: 1 }]);
    expect(ARMOR_EGOS.sniping!.contributions).toEqual([{ prop: 'Snipe', value: 1 }]);
    expect(ARMOR_EGOS.energy!.contributions).toEqual([{ prop: 'Energy', value: 1 }]);
    expect(ARMOR_EGOS.glass!.contributions).toEqual([{ prop: 'Glass', value: 1 }]);
  });

  it('SPARM_RAGE auto-parses to ARTP_ANGRY (*Rage), not a new property', () => {
    expect(ARMOR_EGOS.rage!.contributions).toEqual([{ prop: '*Rage', value: 1 }]);
  });

  it('counts match expected scale', () => {
    const realCount = EGO_ENTRIES.filter((e) => e.realEgo).length;
    expect(Object.keys(ARMOR_EGOS).length).toBe(realCount);
    expect(realCount).toBeGreaterThanOrEqual(40);
  });
});

describe('weapon base types', () => {
  it('contains common weapons', () => {
    expect(WEAPON_BASE_TYPES.long_sword).toBeDefined();
    expect(WEAPON_BASE_TYPES.demon_trident).toBeDefined();
  });

  it('records the weapon skill', () => {
    const longSword = WEAPON_BASE_TYPES.long_sword;
    expect(longSword!.skill).toContain('long_blades');
  });

  it('two-handed weapons report hands: 2', () => {
    const great_mace = WEAPON_BASE_TYPES.great_mace;
    expect(great_mace!.hands).toBe(2);
  });
});

describe('armor & shield base types', () => {
  it('contains common armors with correct slots', () => {
    expect(ARMOR_BASE_TYPES.plate_armour?.slots).toEqual(['body_armour']);
    expect(ARMOR_BASE_TYPES.cloak?.slots).toEqual(['cloak']);
    expect(ARMOR_BASE_TYPES.helmet?.slots).toEqual(['helmet']);
  });

  it('routes shields to SHIELD_BASE_TYPES', () => {
    expect(SHIELD_BASE_TYPES.buckler).toBeDefined();
    expect(SHIELD_BASE_TYPES.kite_shield).toBeDefined();
    expect(SHIELD_BASE_TYPES.tower_shield).toBeDefined();
    expect(SHIELD_BASE_TYPES.buckler?.slots).toEqual(['offhand']);
  });

  it('plate_armour has the expected base AC', () => {
    expect(ARMOR_BASE_TYPES.plate_armour?.baseAC).toBe(10);
  });
});

describe('jewelry', () => {
  it('covers every non-legacy ring/amulet', () => {
    const uncovered = JEWELRY_ENTRIES
      .filter((e) => !e.legacy)
      .filter((e) => !CURATED_JEWELRY_KEYS.has(e.enumName))
      .map((e) => e.enumName);
    expect(uncovered).toEqual([]);
  });

  it('rings of evasion scale with enchantment', () => {
    const ev = JEWELRY_BASE_TYPES.evasion;
    expect(ev!.innateContributions).toEqual([{ prop: 'EV', fromEnchant: 'plus' }]);
  });

  it('rings of fire resistance give rF+', () => {
    const rF = JEWELRY_BASE_TYPES.protection_from_fire;
    expect(rF!.innateContributions).toEqual([{ prop: 'rF', value: 1 }]);
  });

  it('amulet of regeneration grants Regen', () => {
    const regen = JEWELRY_BASE_TYPES.regeneration;
    expect(regen!.innateContributions).toEqual([{ prop: 'Regen', value: 1 }]);
  });

  it('non-ARTP properties (Reflect, Spirit, Chemistry, Dissipation) are recognized', () => {
    expect(PROPERTIES.Reflect?.rendering).toBe('bool');
    expect(PROPERTIES.Spirit?.rendering).toBe('bool');
    expect(PROPERTIES.Chemistry?.rendering).toBe('bool');
    expect(PROPERTIES.Dissipation?.rendering).toBe('bool');
  });

  it('amulet of reflection grants Reflect + SH+5', () => {
    const ref = JEWELRY_BASE_TYPES.reflection;
    expect(ref!.innateContributions).toEqual([
      { prop: 'Reflect', value: 1 },
      { prop: 'SH', value: 5 },
    ]);
  });

  it('amulet of guardian spirit grants Spirit', () => {
    const spirit = JEWELRY_BASE_TYPES.guardian_spirit;
    expect(spirit!.innateContributions).toEqual([{ prop: 'Spirit', value: 1 }]);
  });

  it('newer amulets Chemistry / Dissipation have their flags', () => {
    expect(JEWELRY_BASE_TYPES.chemistry!.innateContributions).toEqual([
      { prop: 'Chemistry', value: 1 },
    ]);
    expect(JEWELRY_BASE_TYPES.dissipation!.innateContributions).toEqual([
      { prop: 'Dissipation', value: 1 },
    ]);
  });
});

describe('staves', () => {
  it('covers every non-legacy staff', () => {
    const uncovered = STAFF_ENTRIES
      .filter((e) => !e.legacy)
      .filter((e) => !CURATED_STAFF_KEYS.has(e.enumName))
      .map((e) => e.enumName);
    expect(uncovered).toEqual([]);
  });

  it('staff of fire gives Fire enhancer and rF+', () => {
    const fire = STAFF_BASE_TYPES.fire;
    expect(fire!.innateContributions).toEqual([
      { prop: 'Fire', value: 1 },
      { prop: 'rF', value: 1 },
    ]);
  });
});

describe('unrands', () => {
  it('extracts a meaningful number of entries', () => {
    expect(UNRAND_ENTRIES.length).toBeGreaterThanOrEqual(100);
  });

  it('looks up famous unrands by name', () => {
    const singing = UNRAND_BY_NAME.get('singing sword');
    expect(singing?.enumName).toBe('UNRAND_SINGING_SWORD');
    expect(singing?.objectClass).toBe('OBJ_WEAPONS');
    expect(singing?.subType).toBe('WPN_DOUBLE_SWORD');
  });

  it("identifies Lear's hauberk", () => {
    const lear = UNRAND_BY_NAME.get("lear's hauberk");
    expect(lear?.enumName).toBe('UNRAND_LEAR');
  });
});

describe('multi-slot unrands', () => {
  it("Lear's hauberk occupies body + helmet + gloves + boots", () => {
    const slots = getMultiSlotOccupation('UNRAND_LEAR');
    expect(slots).toEqual(['body_armour', 'helmet', 'gloves', 'boots']);
  });

  it('returns null for non-multi-slot unrands', () => {
    expect(getMultiSlotOccupation('UNRAND_SINGING_SWORD')).toBeNull();
  });

  it('catalog includes the expected unrands', () => {
    expect(MULTI_SLOT_UNRANDS.UNRAND_LEAR).toBeDefined();
    expect(MULTI_SLOT_UNRANDS.UNRAND_FINGER_AMULET).toBeDefined();
    expect(MULTI_SLOT_UNRANDS.UNRAND_VAINGLORY).toBeDefined();
  });

  it('finger amulet displayName matches the official unrand name', () => {
    // The generated unrand-data prints "macabre finger necklace"; keeping
    // the multi-slot displayName in sync prevents lookup mismatches.
    expect(MULTI_SLOT_UNRANDS.UNRAND_FINGER_AMULET!.displayName).toBe(
      'macabre finger necklace',
    );
  });
});

describe('slot granters', () => {
  // Minimal ParsedItem stub: only the fields effectiveCapacity reads.
  const granterItem = (unrandKey: string): ParsedItem =>
    ({
      id: 'x',
      rawText: '',
      category: 'jewelry',
      baseType: { displayName: 'stub', slots: ['amulet'] } as never,
      slots: ['amulet'],
      enchant: 0,
      isEquipped: true,
      contributions: {},
      artefact: { properties: {}, isUnrand: true, unrandKey },
    }) as ParsedItem;

  it('getGrantedSlots returns the bonus or null', () => {
    expect(getGrantedSlots('UNRAND_FINGER_AMULET')).toEqual({ slot: 'ring', count: 1 });
    expect(getGrantedSlots('UNRAND_VAINGLORY')).toEqual({ slot: 'ring', count: 2 });
    expect(getGrantedSlots('UNRAND_LEAR')).toBeNull();
    expect(getGrantedSlots('UNRAND_SINGING_SWORD')).toBeNull();
    expect(getGrantedSlots(undefined)).toBeNull();
  });

  it('effectiveCapacity matches base capacity with no granters', () => {
    const human = getSpeciesEquipmentRules('Hu');
    expect(effectiveCapacity(human, []).ring).toBe(human.capacity.ring);
  });

  it('macabre finger necklace adds +1 ring', () => {
    const human = getSpeciesEquipmentRules('Hu');
    const cap = effectiveCapacity(human, [granterItem('UNRAND_FINGER_AMULET')]);
    expect(cap.ring).toBe((human.capacity.ring ?? 0) + 1);
    // Other slots untouched.
    expect(cap.amulet).toBe(human.capacity.amulet);
  });

  it('crown of Vainglory adds +2 rings', () => {
    const human = getSpeciesEquipmentRules('Hu');
    const cap = effectiveCapacity(human, [granterItem('UNRAND_VAINGLORY')]);
    expect(cap.ring).toBe((human.capacity.ring ?? 0) + 2);
  });

  it('multiple granters stack', () => {
    const human = getSpeciesEquipmentRules('Hu');
    const cap = effectiveCapacity(human, [
      granterItem('UNRAND_FINGER_AMULET'),
      granterItem('UNRAND_VAINGLORY'),
    ]);
    expect(cap.ring).toBe((human.capacity.ring ?? 0) + 3);
  });

  it('non-granter unrands contribute nothing', () => {
    const human = getSpeciesEquipmentRules('Hu');
    const cap = effectiveCapacity(human, [granterItem('UNRAND_SINGING_SWORD')]);
    expect(cap.ring).toBe(human.capacity.ring);
  });
});

describe('species equipment rules', () => {
  it('Octopode has 8 rings and no body armor', () => {
    const op = getSpeciesEquipmentRules('Op');
    expect(op.capacity.ring).toBe(8);
    expect(op.capacity.body_armour).toBe(0);
    expect(op.capacity.cloak).toBe(0);
  });

  it('Felid has no weapons or armor', () => {
    const fe = getSpeciesEquipmentRules('Fe');
    expect(fe.capacity.weapon).toBe(0);
    expect(fe.capacity.body_armour).toBe(0);
    expect(fe.capacity.helmet).toBe(0);
    // But rings and amulet still work
    expect(fe.capacity.ring).toBe(2);
    expect(fe.capacity.amulet).toBe(1);
  });

  it('Naga wears barding instead of boots', () => {
    const na = getSpeciesEquipmentRules('Na');
    expect(na.capacity.boots).toBe(0);
    expect(na.capacity.barding).toBe(1);
  });

  it('Formicid has 4 rings', () => {
    const fo = getSpeciesEquipmentRules('Fo');
    expect(fo.capacity.ring).toBe(4);
  });

  it('Coglin has a gizmo slot', () => {
    const cg = getSpeciesEquipmentRules('Cg');
    expect(cg.capacity.gizmo).toBe(1);
  });

  it('unknown species falls back to default', () => {
    const x = getSpeciesEquipmentRules('XX');
    expect(x.capacity).toEqual(DEFAULT_CAPACITY);
  });

  it('getSlotCapacity is a convenience accessor', () => {
    expect(getSlotCapacity('Op', 'ring')).toBe(8);
    expect(getSlotCapacity('Hu', 'ring')).toBe(2);
    expect(getSlotCapacity('Fe', 'weapon')).toBe(0);
  });
});
