/**
 * Combo restrictions for DCSS.
 *
 * Some species/background combinations are restricted even though
 * both the species and background exist in the game.
 */

import type { ComboRestriction } from './types.js';

/**
 * Restricted combos - species/background combinations that are not allowed.
 */
export const RESTRICTED_COMBOS: ComboRestriction[] = [
  // Demigod restrictions - Demigods can't worship gods
  { species: 'Dg', background: 'Be', reason: 'Demigods cannot worship gods (Berserker worships Trog)' },
  { species: 'Dg', background: 'CK', reason: 'Demigods cannot worship gods (Chaos Knight worships Xom)' },
  { species: 'Dg', background: 'CA', reason: 'Demigods cannot worship gods (Cinder Acolyte worships Ignis)' },
  { species: 'Dg', background: 'AK', reason: 'Demigods cannot worship gods (Abyssal Knight worships Lugonu)' },

  // Felid restrictions - Felids can't use weapons/armor
  { species: 'Fe', background: 'Hn', reason: 'Felids cannot use ranged weapons', removedInVersion: '0.24' },
  { species: 'Fe', background: 'Gl', reason: 'Felids cannot use weapons effectively' },
  { species: 'Fe', background: 'Br', reason: 'Felids cannot use weapons effectively' },
  { species: 'Fe', background: 'Ar', reason: 'Felids cannot use wands/evocables effectively' },
];

/**
 * Set of restricted combo codes for fast lookup.
 * Format: "XxYy" where Xx is species code and Yy is background code.
 */
export const RESTRICTED_COMBO_CODES: Set<string> = new Set(
  RESTRICTED_COMBOS
    .filter(c => !c.removedInVersion) // Only include currently restricted
    .map(c => c.species + c.background)
);

/**
 * All restricted combo codes including historical ones.
 */
export const ALL_RESTRICTED_COMBO_CODES: Set<string> = new Set(
  RESTRICTED_COMBOS.map(c => c.species + c.background)
);

/**
 * Check if a combo is restricted.
 *
 * @param speciesCode - Species code (e.g., "Dg")
 * @param backgroundCode - Background code (e.g., "Be")
 * @param includeHistorical - Whether to include historically restricted combos
 * @returns True if the combo is restricted
 */
export function isComboRestricted(
  speciesCode: string,
  backgroundCode: string,
  includeHistorical = false
): boolean {
  const comboCode = speciesCode + backgroundCode;
  return includeHistorical
    ? ALL_RESTRICTED_COMBO_CODES.has(comboCode)
    : RESTRICTED_COMBO_CODES.has(comboCode);
}
