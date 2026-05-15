/**
 * Curated staff registry.
 *
 * Each staff type enhances spell power for one school and may grant
 * resistance. Effects come from DCSS source (item-use.cc, spl-cast.cc,
 * fight.cc — staves also do bonus elemental damage in melee).
 *
 * Modeled in the optimizer as weapons (slot: 'weapon', hands: 1) with
 * `innateContributions` carrying the spell-school enhancer + resistance.
 *
 * Verify-script contract: every non-legacy entry in STAFF_ENTRIES must
 * have a curated entry here.
 */

import type { Contribution, PropertyKey, StaffBaseType } from './types.js';
import { STAFF_ENTRIES, type ExtractedStaffEntry } from './generated/stave-type.js';

interface CuratedStaffMeta {
  displayName: string;
  innateContributions: Contribution[];
  notes?: string;
}

const CURATED_STAVES: Record<string, CuratedStaffMeta> = {
  STAFF_FIRE: {
    displayName: 'staff of fire',
    innateContributions: [
      { prop: 'Fire', value: 1 },
      { prop: 'rF', value: 1 },
    ],
    notes: 'Enhances Fire spells; grants rF+. Bonus fire damage in melee.',
  },
  STAFF_COLD: {
    displayName: 'staff of cold',
    innateContributions: [
      { prop: 'Ice', value: 1 },
      { prop: 'rC', value: 1 },
    ],
    notes: 'Enhances Ice spells; grants rC+. Bonus cold damage in melee.',
  },
  STAFF_ALCHEMY: {
    displayName: 'staff of alchemy',
    innateContributions: [{ prop: 'Alch', value: 1 }],
    notes: 'Enhances Alchemy spells.',
  },
  STAFF_NECROMANCY: {
    displayName: 'staff of necromancy',
    innateContributions: [{ prop: 'Necro', value: 1 }],
    notes: 'Enhances Necromancy spells.',
  },
  STAFF_CONJURATION: {
    displayName: 'staff of conjuration',
    innateContributions: [{ prop: 'Conj', value: 1 }],
    notes: 'Enhances Conjurations spells.',
  },
  STAFF_AIR: {
    displayName: 'staff of air',
    innateContributions: [{ prop: 'Air', value: 1 }],
    notes: 'Enhances Air spells. Bonus electric damage in melee.',
  },
  STAFF_EARTH: {
    displayName: 'staff of earth',
    innateContributions: [{ prop: 'Earth', value: 1 }],
    notes: 'Enhances Earth spells. Bonus crushing damage in melee.',
  },
};

function buildStaff(
  extracted: ExtractedStaffEntry,
  curated: CuratedStaffMeta,
): StaffBaseType {
  return {
    key: extracted.enumName.replace(/^STAFF_/, '').toLowerCase(),
    displayName: curated.displayName,
    slots: ['weapon'],
    hands: 1,
    innateContributions: curated.innateContributions,
  };
}

/** Staff base types keyed by lowercase identifier. Non-legacy only. */
export const STAFF_BASE_TYPES: Record<string, StaffBaseType> = (() => {
  const out: Record<string, StaffBaseType> = {};
  for (const extracted of STAFF_ENTRIES) {
    if (extracted.legacy) continue;
    const curated = CURATED_STAVES[extracted.enumName];
    if (!curated) continue;
    const staff = buildStaff(extracted, curated);
    out[staff.key] = staff;
  }
  return out;
})();

export const STAVES_BY_ENUM: Map<string, StaffBaseType> = new Map(
  STAFF_ENTRIES
    .filter((e) => !e.legacy && CURATED_STAVES[e.enumName])
    .map((e) => [e.enumName, buildStaff(e, CURATED_STAVES[e.enumName]!)]),
);

export const STAVES_BY_DISPLAY_NAME: Map<string, StaffBaseType> = new Map(
  Object.values(STAFF_BASE_TYPES).map((s) => [s.displayName.toLowerCase(), s]),
);

export const CURATED_STAFF_KEYS: ReadonlySet<string> = new Set(
  Object.keys(CURATED_STAVES),
);

export function getCuratedStaffPropertyRefs(): PropertyKey[] {
  const refs = new Set<PropertyKey>();
  for (const meta of Object.values(CURATED_STAVES)) {
    for (const c of meta.innateContributions) refs.add(c.prop);
  }
  return [...refs];
}
