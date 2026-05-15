/**
 * Curated armor ego registry (`SPARM_*`).
 *
 * Many ego terse names from DCSS source decode directly into property
 * contributions (e.g. `"rF+"` → `{rF: 1}`, `"Str+3"` → `{Str: 3}`). For
 * those, `parseTerseToContributions` extracts the contributions
 * automatically from the generated data. Egos with non-parseable terse
 * names (e.g. `"Ponderous"`, `"Reflect"`, `"Infuse"`) are curated manually.
 *
 * Verify-script contract: every `realEgo` from generated/sparm.ts must
 * have an entry here (either an entry in CURATED_EGO_META, OR an
 * auto-parsed terse name).
 */

import type { ArmorEgo, Contribution, ItemSlot, PropertyKey } from './types.js';
import { EGO_ENTRIES, type ExtractedEgoEntry } from './generated/sparm.js';
import { parseTerseToContributions } from './braces.js';

interface CuratedEgoMeta {
  /**
   * Override the auto-parsed contributions. Use when:
   *   - The terse name doesn't parse (e.g. 'Ponderous', 'Reflect').
   *   - The terse name parses incorrectly for our model.
   * Set to `[]` for egos that have no aggregable contribution (the
   * mechanical effect doesn't map to any of our properties).
   */
  contributions?: Contribution[];
  /** Restrict to specific armor slots. Empty/omit = any armor slot. */
  validSlots?: ItemSlot[];
  /** Free-form description for tooltips. */
  notes?: string;
  /**
   * Override the display name from extracted verboseName. Rarely needed.
   */
  displayNameOverride?: string;
}

/**
 * Curated overrides keyed by SPARM_* enum name. Only egos whose terse
 * name DOESN'T parse cleanly need entries here. Auto-parsed egos still
 * appear in ARMOR_EGOS with empty curated meta.
 */
const CURATED_EGO_META: Record<string, CuratedEgoMeta> = {
  // ─── Auto-parses but worth annotating ───
  SPARM_FIRE_RESISTANCE: { notes: 'Grants resistance to fire (rF+).' },
  SPARM_COLD_RESISTANCE: { notes: 'Grants resistance to cold (rC+).' },
  SPARM_POISON_RESISTANCE: { notes: 'Grants resistance to poison.' },
  SPARM_CORROSION_RESISTANCE: { notes: 'Grants resistance to corrosion.' },
  SPARM_SEE_INVISIBLE: { notes: 'Lets the wearer see invisible enemies.' },
  SPARM_INVISIBILITY: { notes: 'Lets the wearer turn invisible (evokable).' },
  SPARM_STRENGTH: { notes: '+3 Strength.' },
  SPARM_DEXTERITY: { notes: '+3 Dexterity.' },
  SPARM_INTELLIGENCE: { notes: '+3 Intelligence.' },
  SPARM_FLYING: { notes: 'Grants flight.' },
  SPARM_WILLPOWER: { notes: '+1 willpower pip.' },
  SPARM_PROTECTION: { notes: '+3 AC.' },
  SPARM_STEALTH: { notes: '+1 stealth pip.' },
  SPARM_RESISTANCE: { notes: 'Grants both rF+ and rC+.' },
  SPARM_POSITIVE_ENERGY: { notes: '+1 negative energy resistance pip.' },
  SPARM_ARCHMAGI: { notes: 'Increases spellpower.' },
  SPARM_HARM: { notes: 'Increases damage dealt and taken.' },
  SPARM_RAMPAGING: { notes: 'Take an extra step when moving toward enemies.' },

  // Spell-school egos (auto-parse as enhancer + 1 of that school)
  SPARM_FIRE: { notes: 'Enhances Fire spells. Body armor only.' },
  SPARM_ICE: { notes: 'Enhances Ice spells. Body armor only.' },
  SPARM_AIR: { notes: 'Enhances Air spells. Body armor only.' },
  SPARM_EARTH: { notes: 'Enhances Earth spells. Body armor only.' },

  // ─── Manual: terse name doesn't parse to a known property ───
  SPARM_PONDEROUSNESS: {
    // Auto-parses from terse name "Ponderous" → {Ponderous: 1}.
    notes: 'Makes the wearer move slower.',
  },
  SPARM_REFLECTION: {
    // Auto-parses from terse name "Reflect" → {Reflect: 1}.
    notes: 'Shield ego: reflects ranged attacks back. Shields only.',
    validSlots: ['offhand'],
  },
  SPARM_SPIRIT_SHIELD: {
    // Auto-parses from terse name "Spirit" → {Spirit: 1}.
    notes: 'Damage taken drains MP before HP. Body armor.',
  },
  // The following all auto-parse from their terse names against the
  // non-ARTP property flags in properties.ts (Hurl, Repulsion, Shadows,
  // Infuse, Light, *Rage→ARTP_ANGRY, Mayhem, ...). Curation here is just
  // notes + slot restrictions.
  SPARM_HURLING: {
    notes: 'Bonus to thrown weapons / hurled rocks. Gloves only.',
    validSlots: ['gloves'],
  },
  SPARM_REPULSION: {
    notes: 'Reduces accuracy of ranged attacks against the wearer.',
  },
  SPARM_SHADOWS: { notes: 'Body armor: summons a shadow companion.' },
  SPARM_INFUSION: { notes: 'Melee attacks spend MP for extra damage.' },
  SPARM_LIGHT: { notes: 'Illuminates surroundings; harder to be stealthy.' },
  SPARM_RAGE: {
    notes: 'Melee attacks may trigger berserk. Auto-parses to ARTP_ANGRY (*Rage).',
  },
  SPARM_MAYHEM: { notes: 'Killing enemies may frenzy adjacent foes.' },
  SPARM_GUILE: { notes: 'Reduces enemy willpower for your spells.' },
  SPARM_ENERGY: { notes: 'Spells sometimes cost no MP.' },
  SPARM_SNIPING: {
    notes: 'Helmet ego: bonus to ranged attacks. Helmet only.',
    validSlots: ['helmet'],
  },
  SPARM_ARCHERY: { notes: 'Bonus to bow/crossbow attacks.' },
  SPARM_COMMAND: { notes: 'Allied creatures fight better.' },
  SPARM_DEATH: { notes: 'Necromancy-themed body armor ego.' },
  SPARM_RESONANCE: { notes: 'Resonance ego (newer).' },
  SPARM_PARRYING: { notes: 'Chance to parry attacks.' },
  SPARM_GLASS: { notes: 'High AC bonus but fragile.' },
  SPARM_PYROMANIA: { notes: 'Fire-themed body armor ego.' },
  SPARM_STARDUST: { notes: 'Stardust ego (newer).' },
  SPARM_MESMERISM: { notes: 'Mesmerism-related ego.' },
  SPARM_ATTUNEMENT: { notes: 'Attunement ego.' },
};

function buildEgo(
  extracted: ExtractedEgoEntry,
  curated: CuratedEgoMeta | undefined,
): ArmorEgo {
  // Try auto-parse first; the curated override wins if present.
  const autoParsed = parseTerseToContributions(extracted.terseName);
  const contributions = curated?.contributions ?? autoParsed ?? [];

  return {
    key: enumNameToKey(extracted.enumName),
    sparmEnum: extracted.enumName,
    displayName: curated?.displayNameOverride ?? extracted.verboseName,
    validSlots: curated?.validSlots ?? [],
    contributions,
    legacy: extracted.legacy || undefined,
  };
}

/** Convert SPARM_FIRE_RESISTANCE → 'fire_resistance'. */
function enumNameToKey(enumName: string): string {
  return enumName.replace(/^SPARM_/, '').toLowerCase();
}

/**
 * Real armor egos keyed by their lowercase identifier (e.g.
 * 'fire_resistance', 'protection'). For lookup by DCSS enum name use
 * EGOS_BY_SPARM.
 */
export const ARMOR_EGOS: Record<string, ArmorEgo> = (() => {
  const out: Record<string, ArmorEgo> = {};
  for (const extracted of EGO_ENTRIES) {
    if (!extracted.realEgo) continue;
    const curated = CURATED_EGO_META[extracted.enumName];
    const ego = buildEgo(extracted, curated);
    if (out[ego.key]) {
      throw new Error(
        `Duplicate ego key '${ego.key}' from ${extracted.enumName}`,
      );
    }
    out[ego.key] = ego;
  }
  return out;
})();

/** Egos indexed by their DCSS SPARM_* enum name. */
export const EGOS_BY_SPARM: Map<string, ArmorEgo> = new Map(
  Object.values(ARMOR_EGOS).map((e) => [e.sparmEnum, e]),
);

/**
 * Real egos that DIDN'T auto-parse and DON'T have a curated entry.
 * Used by the verify script to flag uncovered new egos.
 */
export function getUncoveredEgos(): string[] {
  const uncovered: string[] = [];
  for (const extracted of EGO_ENTRIES) {
    if (!extracted.realEgo) continue;
    const autoParsed = parseTerseToContributions(extracted.terseName);
    const curated = CURATED_EGO_META[extracted.enumName];
    if (!autoParsed && !curated) {
      uncovered.push(extracted.enumName);
    }
  }
  return uncovered;
}

/** Internal: keys of CURATED_EGO_META for verify dead-reference checks. */
export const CURATED_EGO_KEYS: ReadonlySet<string> = new Set(
  Object.keys(CURATED_EGO_META),
);

/** Internal: property-key references mentioned in CURATED_EGO_META, for verify. */
export function getCuratedEgoPropertyRefs(): PropertyKey[] {
  const refs = new Set<PropertyKey>();
  for (const meta of Object.values(CURATED_EGO_META)) {
    for (const c of meta.contributions ?? []) {
      refs.add(c.prop);
    }
  }
  return [...refs];
}
