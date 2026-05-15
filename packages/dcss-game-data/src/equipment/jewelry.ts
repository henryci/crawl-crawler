/**
 * Curated jewelry (ring + amulet) registry.
 *
 * Unlike weapons and armor, jewelry's innate effects aren't encoded in
 * regular data tables — DCSS implements them imperatively across many
 * source files (item-use.cc, melee-attack.cc, etc.). So this file is
 * fully hand-curated.
 *
 * Verify-script contract: every non-legacy entry in JEWELRY_ENTRIES
 * (from generated/jewellery-type.ts) must have a curated entry here,
 * even if its `innateContributions` is empty (e.g. amulet of nothing).
 */

import type { Contribution, JewelryBaseType, PropertyKey } from './types.js';
import { JEWELRY_ENTRIES, type ExtractedJewelryEntry } from './generated/jewellery-type.js';

interface CuratedJewelryMeta {
  /** Human-readable display name. */
  displayName: string;
  innateContributions: Contribution[];
  /** Free-form note for UI tooltips. */
  notes?: string;
}

const CURATED_JEWELRY: Record<string, CuratedJewelryMeta> = {
  // ─── Rings ───
  RING_PROTECTION: {
    displayName: 'ring of protection',
    innateContributions: [{ prop: 'AC', fromEnchant: 'plus' }],
    notes: '+N AC where N is the enchantment.',
  },
  RING_PROTECTION_FROM_FIRE: {
    displayName: 'ring of protection from fire',
    innateContributions: [{ prop: 'rF', value: 1 }],
  },
  RING_POISON_RESISTANCE: {
    displayName: 'ring of poison resistance',
    innateContributions: [{ prop: 'rPois', value: 1 }],
  },
  RING_PROTECTION_FROM_COLD: {
    displayName: 'ring of protection from cold',
    innateContributions: [{ prop: 'rC', value: 1 }],
  },
  RING_STRENGTH: {
    displayName: 'ring of strength',
    innateContributions: [{ prop: 'Str', fromEnchant: 'plus' }],
  },
  RING_SLAYING: {
    displayName: 'ring of slaying',
    innateContributions: [{ prop: 'Slay', fromEnchant: 'plus' }],
  },
  RING_SEE_INVISIBLE: {
    displayName: 'ring of see invisible',
    innateContributions: [{ prop: 'SInv', value: 1 }],
  },
  RING_RESIST_CORROSION: {
    displayName: 'ring of resist corrosion',
    innateContributions: [{ prop: 'rCorr', value: 1 }],
  },
  RING_EVASION: {
    displayName: 'ring of evasion',
    innateContributions: [{ prop: 'EV', fromEnchant: 'plus' }],
  },
  RING_STEALTH: {
    displayName: 'ring of stealth',
    innateContributions: [{ prop: 'Stlth', value: 1 }],
  },
  RING_DEXTERITY: {
    displayName: 'ring of dexterity',
    innateContributions: [{ prop: 'Dex', fromEnchant: 'plus' }],
  },
  RING_INTELLIGENCE: {
    displayName: 'ring of intelligence',
    innateContributions: [{ prop: 'Int', fromEnchant: 'plus' }],
  },
  RING_WIZARDRY: {
    displayName: 'ring of wizardry',
    innateContributions: [{ prop: 'Wiz', value: 1 }],
  },
  RING_MAGICAL_POWER: {
    displayName: 'ring of magical power',
    innateContributions: [{ prop: 'MP', value: 9 }],
  },
  RING_FLIGHT: {
    displayName: 'ring of flight',
    innateContributions: [{ prop: 'Fly', value: 1 }],
  },
  RING_POSITIVE_ENERGY: {
    displayName: 'ring of positive energy',
    innateContributions: [{ prop: 'rN', value: 1 }],
  },
  RING_WILLPOWER: {
    displayName: 'ring of willpower',
    innateContributions: [{ prop: 'Will', value: 1 }],
  },

  // ─── Amulets ───
  AMU_ACROBAT: {
    displayName: 'amulet of the acrobat',
    innateContributions: [{ prop: 'Acrobat', value: 1 }],
  },
  AMU_MANA_REGENERATION: {
    displayName: 'amulet of magic regeneration',
    innateContributions: [{ prop: 'RegenMP', value: 1 }],
  },
  AMU_NOTHING: {
    displayName: 'amulet of nothing',
    innateContributions: [],
    notes: 'No effect.',
  },
  AMU_GUARDIAN_SPIRIT: {
    displayName: 'amulet of guardian spirit',
    innateContributions: [{ prop: 'Spirit', value: 1 }],
    notes: 'Damage taken drains MP before HP.',
  },
  AMU_FAITH: {
    displayName: 'amulet of faith',
    innateContributions: [],
    notes: 'God-related effect. No aggregable property.',
  },
  AMU_REFLECTION: {
    displayName: 'amulet of reflection',
    innateContributions: [
      { prop: 'Reflect', value: 1 },
      { prop: 'SH', value: 5 },
    ],
    notes: 'Reflects ranged attacks; +5 SH.',
  },
  AMU_REGENERATION: {
    displayName: 'amulet of regeneration',
    innateContributions: [{ prop: 'Regen', value: 1 }],
  },
  AMU_WILDSHAPE: {
    displayName: 'amulet of the wildshape',
    innateContributions: [],
    notes: 'Form/transformation related. No aggregable property.',
  },
  AMU_CHEMISTRY: {
    displayName: 'amulet of chemistry',
    innateContributions: [{ prop: 'Chemistry', value: 1 }],
    notes: 'Amulet effect related to potions / chemistry.',
  },
  AMU_DISSIPATION: {
    displayName: 'amulet of dissipation',
    innateContributions: [{ prop: 'Dissipation', value: 1 }],
    notes: 'Amulet effect related to dissipation.',
  },
};

function buildJewelry(
  extracted: ExtractedJewelryEntry,
  curated: CuratedJewelryMeta,
): JewelryBaseType {
  return {
    key: extracted.enumName.replace(/^(RING_|AMU_)/, '').toLowerCase(),
    displayName: curated.displayName,
    slots: extracted.kind === 'ring' ? ['ring'] : ['amulet'],
    innateContributions: curated.innateContributions,
  };
}

/** Jewelry base types keyed by lowercase identifier. Non-legacy only. */
export const JEWELRY_BASE_TYPES: Record<string, JewelryBaseType> = (() => {
  const out: Record<string, JewelryBaseType> = {};
  for (const extracted of JEWELRY_ENTRIES) {
    if (extracted.legacy) continue;
    const curated = CURATED_JEWELRY[extracted.enumName];
    if (!curated) continue; // verify will flag this
    const jewel = buildJewelry(extracted, curated);
    if (out[jewel.key]) {
      throw new Error(`Duplicate jewelry key '${jewel.key}' from ${extracted.enumName}`);
    }
    out[jewel.key] = jewel;
  }
  return out;
})();

export const JEWELRY_BY_ENUM: Map<string, JewelryBaseType> = new Map(
  JEWELRY_ENTRIES
    .filter((e) => !e.legacy && CURATED_JEWELRY[e.enumName])
    .map((e) => [e.enumName, buildJewelry(e, CURATED_JEWELRY[e.enumName]!)]),
);

export const JEWELRY_BY_DISPLAY_NAME: Map<string, JewelryBaseType> = new Map(
  Object.values(JEWELRY_BASE_TYPES).map((j) => [j.displayName.toLowerCase(), j]),
);

export const CURATED_JEWELRY_KEYS: ReadonlySet<string> = new Set(
  Object.keys(CURATED_JEWELRY),
);

/** Property keys referenced in curated jewelry contributions, for verify. */
export function getCuratedJewelryPropertyRefs(): PropertyKey[] {
  const refs = new Set<PropertyKey>();
  for (const meta of Object.values(CURATED_JEWELRY)) {
    for (const c of meta.innateContributions) refs.add(c.prop);
  }
  return [...refs];
}
