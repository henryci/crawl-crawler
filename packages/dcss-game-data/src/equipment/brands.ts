/**
 * Curated weapon brand registry (`SPWPN_*`).
 *
 * Weapon brands are almost entirely on-hit behaviors (flaming = extra
 * fire damage on melee hits, vampirism = heal on damage dealt, etc.).
 * They don't grant passive property contributions, so for the optimizer
 * their `contributions` arrays are empty — the notes capture the
 * behavior for tooltips/UI.
 *
 * The only brand DCSS implements as a passive bonus is SPWPN_PROTECTION,
 * which gives a temporary AC buff triggered on attack — still not a
 * constant aura, so we leave its contributions empty too. If the
 * optimizer ever needs to factor in conditional bonuses, this is the
 * single place to revisit.
 *
 * Verify-script contract: every `realBrand` from generated/brand.ts must
 * have a curated entry here, or verify fails.
 */

import type { WeaponBrand } from './types.js';
import { BRAND_ENTRIES, type ExtractedBrandEntry } from './generated/brand.js';

interface CuratedBrandMeta {
  /** Human-readable description of the brand's behavior. */
  notes: string;
  /**
   * Optional passive contributions. Empty for all current brands. Kept
   * here as a hook if DCSS ever adds a brand with a passive bonus.
   */
  contributions?: WeaponBrand['contributions'];
}

/**
 * Curated metadata keyed by SPWPN_* enum name. Covers every real brand;
 * sentinels and non-item brands (acid bite, etc.) are hidden via
 * BRAND_ENTRIES[i].realBrand.
 */
const CURATED_BRAND_META: Record<string, CuratedBrandMeta> = {
  SPWPN_FLAMING: { notes: 'Deals bonus fire damage on melee hit.' },
  SPWPN_FREEZING: { notes: 'Deals bonus cold damage on melee hit.' },
  SPWPN_HOLY_WRATH: { notes: 'Bonus damage against undead and demons.' },
  SPWPN_ELECTROCUTION: { notes: 'Chance to deal lethal electric damage on hit.' },
  SPWPN_VENOM: { notes: 'Poisons enemies on melee hit.' },
  SPWPN_PROTECTION: {
    notes: 'Grants a temporary +7 AC buff when attacked. Not a passive bonus.',
  },
  SPWPN_DRAINING: { notes: 'Drains victims on hit (saps stats / XP).' },
  SPWPN_SPEED: { notes: 'Attacks faster (lower delay per swing).' },
  SPWPN_HEAVY: { notes: 'Higher damage but slower attack speed.' },
  SPWPN_VAMPIRISM: {
    notes: 'Heals the wielder on damage dealt to living enemies.',
  },
  SPWPN_PAIN: {
    notes: 'Extra necromantic damage scaling with Necromancy skill.',
  },
  SPWPN_ANTIMAGIC: {
    notes: 'Drains target MP and reduces wielder MP cap while wielded.',
  },
  SPWPN_DISTORTION: {
    notes: 'Random teleport / banish / abyss effects. Risky to unwield.',
  },
  SPWPN_CHAOS: { notes: 'Random effects on each hit.' },
  SPWPN_PENETRATION: { notes: 'Ranged attacks pierce through enemies.' },
  SPWPN_REAPING: { notes: 'Killed enemies may rise as zombies under your control.' },
  SPWPN_SPECTRAL: { notes: 'Hits may summon a spectral copy of the weapon.' },
  SPWPN_REBUKE: { notes: 'Hits may briefly daze / repulse enemies.' },
  SPWPN_VALOUR: { notes: 'Damage scales with the number of nearby enemies.' },
  SPWPN_ENTANGLING: { notes: 'Hits may entangle enemies in webs.' },
  SPWPN_SUNDERING: { notes: 'Hits may shatter enemy armor / shields.' },
  SPWPN_CONCUSSION: { notes: 'AoE concussive damage on hit.' },
  SPWPN_DEVIOUS: { notes: 'Hits may apply random debilitating status.' },
};

function buildBrand(
  extracted: ExtractedBrandEntry,
  curated: CuratedBrandMeta | undefined,
): WeaponBrand {
  return {
    key: extracted.terseName,
    spwpnEnum: extracted.enumName,
    displayName: extracted.verboseName,
    contributions: curated?.contributions ?? [],
    notes: curated?.notes,
    legacy: extracted.legacy || undefined,
  };
}

/**
 * Real weapon brands keyed by their lowercase terse name (e.g. 'flame',
 * 'drain', 'rebuke') as they appear as the leading comma-separated token
 * in artefact braces.
 */
export const WEAPON_BRANDS: Record<string, WeaponBrand> = (() => {
  const out: Record<string, WeaponBrand> = {};
  for (const extracted of BRAND_ENTRIES) {
    if (!extracted.realBrand) continue;
    const curated = CURATED_BRAND_META[extracted.enumName];
    const brand = buildBrand(extracted, curated);
    if (out[brand.key]) {
      throw new Error(
        `Duplicate brand key '${brand.key}' from ${extracted.enumName}; ` +
        `existing entry from ${out[brand.key]!.spwpnEnum}`,
      );
    }
    out[brand.key] = brand;
  }
  return out;
})();

/** Brands indexed by their DCSS SPWPN_* enum name. */
export const BRANDS_BY_SPWPN: Map<string, WeaponBrand> = new Map(
  Object.values(WEAPON_BRANDS).map((b) => [b.spwpnEnum, b]),
);

/** For verify: which SPWPN_* have curated metadata. */
export const CURATED_BRAND_KEYS: ReadonlySet<string> = new Set(
  Object.keys(CURATED_BRAND_META),
);
