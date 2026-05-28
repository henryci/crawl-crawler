/**
 * Talisman base-type registry.
 *
 * DCSS talismans (death, dragon, beast, serpent, statue, storm, ...)
 * grant a transformation when worn. v1 surfaces them in the optimizer
 * as read-only items — the user must change them in-game and re-dump
 * to swap forms. The base-type record carries just enough for the UI
 * to label the row; the brace properties (parsed from the morgue) are
 * what flow into resistance totals.
 *
 * The list below covers the forms emitted by DCSS 0.34. New forms
 * belong here; unknown talismans fall through to a generic display.
 */

import type { TalismanBaseType } from './types.js';

const TALISMAN_KEYS = [
  'beast',
  'blade',
  'death',
  'dragon',
  'flux',
  'inert',
  'maw',
  'rimeheart',
  'scarab',
  'serpent',
  'statue',
  'storm',
  'vampire',
  'werefox',
] as const;

function make(form: string): TalismanBaseType {
  return {
    key: `TALISMAN_${form.toUpperCase()}`,
    displayName: `talisman of ${form}`,
    slots: [],
    innateContributions: [],
  };
}

export const TALISMAN_BASE_TYPES: Record<string, TalismanBaseType> = Object.fromEntries(
  TALISMAN_KEYS.map((form) => [`TALISMAN_${form.toUpperCase()}`, make(form)]),
);

export const TALISMANS_BY_DISPLAY_NAME: Map<string, TalismanBaseType> = new Map(
  Object.values(TALISMAN_BASE_TYPES).map((t) => [t.displayName.toLowerCase(), t]),
);

/**
 * Fallback used by the parser when a talisman's form name doesn't match
 * any known entry — keeps unknown talismans visible in the UI instead
 * of silently dropping them.
 */
export const TALISMAN_GENERIC: TalismanBaseType = {
  key: 'TALISMAN_UNKNOWN',
  displayName: 'talisman',
  slots: [],
  innateContributions: [],
};
