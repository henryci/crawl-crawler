/**
 * Weapon base-type registry, derived from Weapon_prop[] in item-prop.cc.
 *
 * Most of this is mechanical translation from the extracted data; the
 * one piece of judgment is mapping `min_1h_size` to a single
 * `hands` value (1 or 2). DCSS computes this per player at runtime,
 * but for the optimizer's default scoring we assume a SIZE_MEDIUM
 * player (the common case). The optimizer overrides for non-medium
 * species at scoring time.
 */

import type { WeaponBaseType } from './types.js';
import { WEAPON_ENTRIES, type ExtractedWeaponEntry } from './generated/weapon-type.js';

/** DCSS size_type order, smallest first. */
const SIZE_ORDER: Record<string, number> = {
  SIZE_TINY: 0,
  SIZE_LITTLE: 1,
  SIZE_SMALL: 2,
  SIZE_MEDIUM: 3,
  SIZE_LARGE: 4,
  SIZE_BIG: 5,
  SIZE_GIANT: 6,
  NUM_SIZE_LEVELS: 99,
};

const DEFAULT_PLAYER_SIZE = 'SIZE_MEDIUM';

/**
 * Compute handedness for a player of the given size. If the player can
 * wield the weapon one-handed (their size >= min_1h_size), it's 1h;
 * otherwise 2h.
 */
export function getWeaponHands(
  weapon: ExtractedWeaponEntry,
  playerSize: string = DEFAULT_PLAYER_SIZE,
): 1 | 2 {
  const playerRank = SIZE_ORDER[playerSize] ?? SIZE_ORDER[DEFAULT_PLAYER_SIZE]!;
  const min1hRank = SIZE_ORDER[weapon.min1hSize] ?? 99;
  return playerRank >= min1hRank ? 1 : 2;
}

function buildWeapon(extracted: ExtractedWeaponEntry): WeaponBaseType {
  return {
    key: enumNameToKey(extracted.enumName),
    displayName: extracted.displayName,
    hands: getWeaponHands(extracted),
    skill: extracted.skill.replace(/^SK_/, '').toLowerCase(),
  };
}

function enumNameToKey(enumName: string): string {
  return enumName.replace(/^WPN_/, '').toLowerCase();
}

/**
 * Weapon base types keyed by lowercase identifier (e.g. 'long_sword',
 * 'demon_trident'). Non-legacy entries only.
 */
export const WEAPON_BASE_TYPES: Record<string, WeaponBaseType> = (() => {
  const out: Record<string, WeaponBaseType> = {};
  for (const extracted of WEAPON_ENTRIES) {
    if (extracted.legacy) continue;
    const weapon = buildWeapon(extracted);
    if (out[weapon.key]) {
      throw new Error(
        `Duplicate weapon key '${weapon.key}' from ${extracted.enumName}`,
      );
    }
    out[weapon.key] = weapon;
  }
  return out;
})();

/** Weapon base types indexed by DCSS WPN_* enum name. */
export const WEAPONS_BY_WPN: Map<string, WeaponBaseType> = new Map(
  WEAPON_ENTRIES
    .filter((e) => !e.legacy)
    .map((e) => [e.enumName, buildWeapon(e)]),
);

/**
 * Lookup by display name (lowercase) — useful for matching morgue item
 * text to a base type.
 */
export const WEAPONS_BY_DISPLAY_NAME: Map<string, WeaponBaseType> = new Map(
  WEAPON_ENTRIES
    .filter((e) => !e.legacy)
    .map((e) => [e.displayName.toLowerCase(), buildWeapon(e)]),
);
