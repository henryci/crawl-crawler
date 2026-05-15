/**
 * Curated semantic metadata for every DCSS artefact property (ARTP_*).
 *
 * The mechanical data (enum names, abbreviations, value types, descriptions)
 * comes from `./generated/artp.ts` which is auto-extracted from the pinned
 * DCSS source. This file adds the semantic layer the optimizer needs:
 *
 *   - category (resistance / stat / defense / etc.)
 *   - cap (max value from equipment alone)
 *   - human display name
 *   - whether to hide from the optimizer entirely (internal flags)
 *
 * Adding a new ARTP_* in DCSS: re-run extract, then add a curated entry
 * here for the new enum name. The verify script will fail until you do.
 */

import type {
  Property,
  PropertyCategory,
  PropertyKey,
  PropertyRendering,
} from './types.js';
import { ARTP_ENTRIES, type ExtractedArtpEntry } from './generated/artp.js';

/**
 * Curated semantics keyed by ARTP_* enum name. The key (PropertyKey) used
 * in PROPERTIES is the extracted abbreviation, so it matches morgue braces
 * directly — but the curated table is keyed by enum name because enum
 * names are stable across DCSS versions while abbreviations sometimes
 * change cosmetically.
 */
interface CuratedArtpMeta {
  category: PropertyCategory;
  displayName: string;
  /**
   * Aggregation cap from equipment alone, mirroring DCSS runtime caps.
   * Omit for properties with no equipment cap (e.g. AC, Str, Slay).
   */
  cap?: { min?: number; max?: number };
  /**
   * If true, the property exists in DCSS but isn't useful for the
   * optimizer (internal flags, references). Built into PROPERTIES anyway
   * so the parser can tokenize it without warnings, but the optimizer
   * filters it out.
   */
  hideFromOptimizer?: boolean;
  /**
   * Override the rendering hint from describe.cc. Only set if the
   * extracted hint is wrong for our purposes.
   */
  renderingOverride?: PropertyRendering;
}

/**
 * Curated metadata for every non-legacy ARTP. Legacy ARTPs are accepted
 * but get a stub `legacy: true` entry built into PROPERTIES so the parser
 * can tokenize old morgues without warnings.
 */
const CURATED_ARTP_META: Record<string, CuratedArtpMeta> = {
  // ─── Brand (special: holds a brand reference, not a value) ───
  ARTP_BRAND: { category: 'utility', displayName: 'Brand', hideFromOptimizer: true },

  // ─── Defense ───
  ARTP_AC: { category: 'defense', displayName: 'AC' },
  ARTP_EVASION: { category: 'defense', displayName: 'EV' },
  ARTP_SHIELDING: { category: 'defense', displayName: 'SH' },

  // ─── Stats ───
  ARTP_STRENGTH: { category: 'stat', displayName: 'Strength' },
  ARTP_INTELLIGENCE: { category: 'stat', displayName: 'Intelligence' },
  ARTP_DEXTERITY: { category: 'stat', displayName: 'Dexterity' },

  // ─── Offense ───
  ARTP_SLAYING: { category: 'offense', displayName: 'Slaying' },
  ARTP_BASE_ACC: { category: 'offense', displayName: 'Base Accuracy', hideFromOptimizer: true },
  ARTP_BASE_DAM: { category: 'offense', displayName: 'Base Damage', hideFromOptimizer: true },
  ARTP_BASE_DELAY: { category: 'offense', displayName: 'Base Delay', hideFromOptimizer: true },

  // ─── Resistances ───
  // rF, rC, rN cap at +3 from all sources; equipment can contribute up to +3.
  ARTP_FIRE: { category: 'resistance', displayName: 'Fire Resistance', cap: { min: -3, max: 3 } },
  ARTP_COLD: { category: 'resistance', displayName: 'Cold Resistance', cap: { min: -3, max: 3 } },
  ARTP_NEGATIVE_ENERGY: { category: 'resistance', displayName: 'Negative Energy Resistance', cap: { max: 3 } },
  // Binary resistances: have or don't have.
  ARTP_POISON: { category: 'resistance', displayName: 'Poison Resistance', cap: { max: 1 } },
  ARTP_ELECTRICITY: { category: 'resistance', displayName: 'Electricity Resistance', cap: { max: 1 } },
  ARTP_RCORR: { category: 'resistance', displayName: 'Corrosion Resistance', cap: { max: 1 } },
  ARTP_RMUT: { category: 'resistance', displayName: 'Mutation Resistance', cap: { max: 1 } },

  // ─── Utility ───
  // Willpower caps at +5 (Will+++++).
  ARTP_WILLPOWER: { category: 'utility', displayName: 'Willpower', cap: { min: -3, max: 5 } },
  ARTP_STEALTH: { category: 'utility', displayName: 'Stealth' },
  ARTP_SEE_INVISIBLE: { category: 'utility', displayName: 'See Invisible', cap: { max: 1 } },
  ARTP_INVISIBLE: { category: 'utility', displayName: 'Invisibility', cap: { max: 1 } },
  ARTP_FLY: { category: 'utility', displayName: 'Flight', cap: { max: 1 } },
  ARTP_BLINK: { category: 'utility', displayName: 'Blink', cap: { max: 1 } },
  ARTP_CLARITY: { category: 'utility', displayName: 'Clarity', cap: { max: 1 } },
  ARTP_RMSL: { category: 'utility', displayName: 'Repel Missiles', cap: { max: 1 } },
  ARTP_HARM: { category: 'utility', displayName: 'Harm', cap: { max: 1 } },
  ARTP_RAMPAGING: { category: 'utility', displayName: 'Rampaging', cap: { max: 1 } },
  ARTP_ACROBAT: { category: 'utility', displayName: 'Acrobat', cap: { max: 1 } },

  // ─── Pools ───
  ARTP_HP: { category: 'pool', displayName: 'HP' },
  ARTP_MAGICAL_POWER: { category: 'pool', displayName: 'MP' },

  // ─── Regen ───
  ARTP_REGENERATION: { category: 'regen', displayName: 'HP Regeneration' },
  ARTP_MANA_REGENERATION: { category: 'regen', displayName: 'MP Regeneration' },

  // ─── Spell schools ───
  ARTP_ENHANCE_CONJ: { category: 'spell_school', displayName: 'Conjurations Enhancer' },
  ARTP_ENHANCE_HEXES: { category: 'spell_school', displayName: 'Hexes Enhancer' },
  ARTP_ENHANCE_SUMM: { category: 'spell_school', displayName: 'Summonings Enhancer' },
  ARTP_ENHANCE_NECRO: { category: 'spell_school', displayName: 'Necromancy Enhancer' },
  ARTP_ENHANCE_TLOC: { category: 'spell_school', displayName: 'Translocations Enhancer' },
  ARTP_ENHANCE_FIRE: { category: 'spell_school', displayName: 'Fire Enhancer' },
  ARTP_ENHANCE_ICE: { category: 'spell_school', displayName: 'Ice Enhancer' },
  ARTP_ENHANCE_AIR: { category: 'spell_school', displayName: 'Air Enhancer' },
  ARTP_ENHANCE_EARTH: { category: 'spell_school', displayName: 'Earth Enhancer' },
  ARTP_ENHANCE_ALCHEMY: { category: 'spell_school', displayName: 'Alchemy Enhancer' },
  ARTP_ENHANCE_FORGECRAFT: { category: 'spell_school', displayName: 'Forgecraft Enhancer' },

  // ─── Wizardry ───
  ARTP_WIZARDRY: { category: 'wizardry', displayName: 'Wizardry', cap: { max: 1 } },
  ARTP_ARCHMAGI: { category: 'wizardry', displayName: 'Archmagi', cap: { max: 1 } },

  // ─── Downsides ───
  ARTP_NOISE: { category: 'downside', displayName: 'Noise' },
  ARTP_PREVENT_SPELLCASTING: { category: 'downside', displayName: 'Prevents Spellcasting', cap: { max: 1 } },
  ARTP_PREVENT_TELEPORTATION: { category: 'downside', displayName: 'Prevents Teleportation', cap: { max: 1 } },
  ARTP_ANGRY: { category: 'downside', displayName: 'Angry' },
  ARTP_CONTAM: { category: 'downside', displayName: 'Contamination', cap: { max: 1 } },
  ARTP_CORRODE: { category: 'downside', displayName: 'Corrode', cap: { max: 1 } },
  ARTP_DRAIN: { category: 'downside', displayName: 'Drain', cap: { max: 1 } },
  ARTP_SLOW: { category: 'downside', displayName: 'Slow', cap: { max: 1 } },
  ARTP_FRAGILE: { category: 'downside', displayName: 'Fragile', cap: { max: 1 } },
  ARTP_SILENCE: { category: 'downside', displayName: 'Silence', cap: { max: 1 } },
  ARTP_BANE: { category: 'downside', displayName: 'Bane', cap: { max: 1 } },

  // ─── Internal / hidden ───
  ARTP_NO_UPGRADE: { category: 'utility', displayName: 'No Upgrade', hideFromOptimizer: true },
};

/**
 * Build a Property from an extracted ARTP entry plus its curated metadata.
 *
 * Used internally and exported for testing / verify-script consumption.
 */
function buildProperty(
  extracted: ExtractedArtpEntry,
  curated: CuratedArtpMeta | undefined,
): Property {
  // Legacy ARTPs may not have curated metadata; we still emit a stub so
  // the parser can tokenize old morgues without throwing.
  const meta = curated ?? {
    category: 'utility' as PropertyCategory,
    displayName: extracted.abbreviation,
    hideFromOptimizer: true,
  };

  const bipolar =
    extracted.valueType === 'any'
    || (extracted.valueType === 'positive' && extracted.renderingHint === 'pip');

  return {
    key: extracted.abbreviation,
    displayName: meta.displayName,
    category: meta.category,
    rendering: meta.renderingOverride ?? extracted.renderingHint,
    bipolar,
    cap: meta.cap,
    artpEnum: extracted.enumName,
    source: {
      file: extracted.sources.artpData.file,
      line: extracted.sources.artpData.line,
    },
    legacy: extracted.legacy || undefined,
    description: extracted.description || undefined,
  };
}

/**
 * Non-ARTP properties — effects that exist on items but don't have a
 * matching `ARTP_*` enum. They appear in morgue braces (e.g.
 * `{Reflect rPois ...}` on a randart amulet of reflection) and on
 * specific ego/jewelry types, so the parser needs to tokenize them and
 * the optimizer's aggregator needs to count them.
 *
 * Keep this list small. Anything DCSS exposes as an ARTP belongs in
 * CURATED_ARTP_META above.
 */
const CURATED_EXTRA_PROPERTIES: Property[] = [
  {
    key: 'Reflect',
    displayName: 'Reflection',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Reflects ranged attacks back at attackers.',
  },
  {
    key: 'Spirit',
    displayName: 'Guardian Spirit',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Damage taken drains MP before HP.',
  },
  {
    key: 'Chemistry',
    displayName: 'Chemistry',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Amulet effect related to potions / chemistry.',
  },
  {
    key: 'Dissipation',
    displayName: 'Dissipation',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Amulet effect related to dissipation.',
  },
  {
    key: 'Ponderous',
    displayName: 'Ponderous',
    category: 'downside',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Slows the wearer\'s movement.',
  },

  // ─── Misc ego flags (SPARM_*) without ARTP backing ───
  // Each is a binary presence/absence indicator; categorized loosely as
  // utility unless it's strictly a downside. Order follows the
  // special_armour_type_name terse table in DCSS source.
  {
    key: 'Hurl',
    displayName: 'Hurling',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Bonus to thrown weapons / hurled rocks. Gloves ego.',
  },
  {
    key: 'Repulsion',
    displayName: 'Repulsion',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Reduces accuracy of ranged attacks against the wearer.',
  },
  {
    key: 'Shadows',
    displayName: 'Shadows',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Body armor: summons a shadow companion.',
  },
  {
    key: 'Infuse',
    displayName: 'Infusion',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Melee attacks spend MP for extra damage.',
  },
  {
    key: 'Light',
    displayName: 'Light',
    category: 'downside',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Illuminates the wearer; harder to remain stealthy.',
  },
  {
    key: 'Mayhem',
    displayName: 'Mayhem',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Killing enemies may frenzy adjacent foes.',
  },
  {
    key: 'Guile',
    displayName: 'Guile',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Reduces enemy willpower for your spells.',
  },
  {
    key: 'Energy',
    displayName: 'Energy',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Spells sometimes cost no MP.',
  },
  {
    key: 'Snipe',
    displayName: 'Sniping',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Helmet ego: bonus to ranged attacks.',
  },
  {
    key: 'Archery',
    displayName: 'Archery',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Bonus to bow / crossbow attacks.',
  },
  {
    key: 'Command',
    displayName: 'Command',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Allied creatures fight better.',
  },
  {
    key: 'Death',
    displayName: 'Death',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Necromancy-themed body armor ego.',
  },
  {
    key: 'Resonance',
    displayName: 'Resonance',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Resonance ego (newer).',
  },
  {
    key: 'Parrying',
    displayName: 'Parrying',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Chance to parry incoming attacks.',
  },
  {
    key: 'Glass',
    displayName: 'Glass',
    category: 'downside',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'High AC bonus but fragile under heavy hits.',
  },
  {
    key: 'Pyromania',
    displayName: 'Pyromania',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Fire-themed body armor ego.',
  },
  {
    key: 'Stardust',
    displayName: 'Stardust',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Stardust ego (newer).',
  },
  {
    key: 'Mesmerism',
    displayName: 'Mesmerism',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Mesmerism-related ego.',
  },
  {
    key: 'Attunement',
    displayName: 'Attunement',
    category: 'utility',
    rendering: 'bool',
    bipolar: false,
    cap: { max: 1 },
    description: 'Attunement ego.',
  },
];

/**
 * The canonical PROPERTIES registry, keyed by morgue-brace abbreviation.
 *
 * Includes every ARTP_* from the pinned DCSS source plus a small set of
 * non-ARTP properties (Reflect, Spirit, etc.) that appear in items but
 * lack a DCSS enum counterpart. Legacy entries are present but marked
 * `legacy: true`.
 */
export const PROPERTIES: Record<PropertyKey, Property> = (() => {
  const out: Record<PropertyKey, Property> = {};
  for (const extracted of ARTP_ENTRIES) {
    const curated = CURATED_ARTP_META[extracted.enumName];
    const prop = buildProperty(extracted, curated);
    if (out[prop.key]) {
      throw new Error(
        `Duplicate property key '${prop.key}' (from ${extracted.enumName}); ` +
        `conflicts with existing entry from ${out[prop.key]!.artpEnum ?? 'unknown'}`,
      );
    }
    out[prop.key] = prop;
  }
  for (const extra of CURATED_EXTRA_PROPERTIES) {
    if (out[extra.key]) {
      throw new Error(
        `Extra property '${extra.key}' collides with an existing ARTP-derived entry.`,
      );
    }
    out[extra.key] = extra;
  }
  return out;
})();

/**
 * Properties indexed by their DCSS ARTP enum name, for callers who know
 * the enum-side identity (parser, verify script).
 */
export const PROPERTIES_BY_ARTP: Map<string, Property> = new Map(
  Object.values(PROPERTIES)
    .filter((p): p is Property & { artpEnum: string } => p.artpEnum !== undefined)
    .map((p) => [p.artpEnum, p]),
);

/**
 * Internal export for the verify script: which ARTPs have curated metadata.
 * Used to detect new ARTPs in DCSS source that haven't been mapped here.
 */
export const CURATED_ARTP_KEYS: ReadonlySet<string> = new Set(
  Object.keys(CURATED_ARTP_META),
);
