/**
 * Background (class) definitions for DCSS.
 *
 * This is the canonical source for all background data including:
 * - Current playable backgrounds
 * - Removed/legacy backgrounds
 * - Version history
 */

import type { Background, ReusedCode } from './types.js';

/**
 * All backgrounds in DCSS, including removed ones.
 * Sorted by code for easy lookup.
 */
export const BACKGROUNDS: Background[] = [
  // Current backgrounds (as of 0.33+)
  { code: 'AE', name: 'Air Elementalist' },
  { code: 'Al', name: 'Alchemist', addedInVersion: '0.28' },
  { code: 'Ar', name: 'Artificer', addedInVersion: '0.14' },
  { code: 'Be', name: 'Berserker' },
  { code: 'Br', name: 'Brigand', addedInVersion: '0.19' },
  { code: 'CA', name: 'Cinder Acolyte', addedInVersion: '0.27' },
  { code: 'CK', name: 'Chaos Knight' },
  { code: 'Cj', name: 'Conjurer' },
  { code: 'De', name: 'Delver', addedInVersion: '0.25' },
  { code: 'EE', name: 'Earth Elementalist' },
  { code: 'En', name: 'Enchanter' },
  { code: 'FE', name: 'Fire Elementalist' },
  { code: 'Fi', name: 'Fighter' },
  { code: 'Fw', name: 'Forgewright', addedInVersion: '0.33' },
  { code: 'Gl', name: 'Gladiator' },
  { code: 'Hs', name: 'Hexslinger', addedInVersion: '0.27' },
  { code: 'HW', name: 'Hedge Wizard', addedInVersion: '0.23' },
  { code: 'Hn', name: 'Hunter' },
  { code: 'IE', name: 'Ice Elementalist' },
  { code: 'Mo', name: 'Monk' },
  { code: 'Ne', name: 'Necromancer' },
  { code: 'Sh', name: 'Shapeshifter', addedInVersion: '0.31' },
  { code: 'Su', name: 'Summoner' },
  { code: 'Wn', name: 'Wanderer' },
  { code: 'Wr', name: 'Warper', addedInVersion: '0.14' },
  { code: 'Wz', name: 'Wizard' },

  // Removed backgrounds
  { code: 'Ab', name: 'Abyssal Knight', removedInVersion: '0.12', aliases: ['AK'] },
  { code: 'AK', name: 'Abyssal Knight', addedInVersion: '0.12', removedInVersion: '0.28' },
  { code: 'AM', name: 'Arcane Marksman', addedInVersion: '0.14', removedInVersion: '0.24' },
  { code: 'As', name: 'Assassin', removedInVersion: '0.24' },
  { code: 'Cr', name: 'Crusader', removedInVersion: '0.9' },
  { code: 'DK', name: 'Death Knight', removedInVersion: '0.12' },
  { code: 'He', name: 'Healer', removedInVersion: '0.20' },
  { code: 'Je', name: 'Jester', removedInVersion: '0.8' },
  { code: 'Pa', name: 'Paladin', removedInVersion: '0.9' },
  { code: 'Pr', name: 'Priest', removedInVersion: '0.9' },
  { code: 'Re', name: 'Reaver', removedInVersion: '0.12' },
  { code: 'SA', name: 'Sloth Apostle', addedInVersion: '0.33', removedInVersion: '0.33' }, // Never in stable
  { code: 'Sk', name: 'Skald', removedInVersion: '0.27' },
  { code: 'St', name: 'Stalker', removedInVersion: '0.15' },
  { code: 'Th', name: 'Thief', removedInVersion: '0.9' },
  { code: 'Tm', name: 'Transmuter', removedInVersion: '0.27' },
  { code: 'VM', name: 'Venom Mage', removedInVersion: '0.28' },
  { code: 'Wp', name: 'Warper', removedInVersion: '0.14' }, // Old code before Wr
];

/**
 * Codes that were reused for different backgrounds over time.
 */
export const REUSED_BACKGROUND_CODES: Record<string, ReusedCode> = {
  // Currently no reused background codes
};

/**
 * Map of background code to Background object for fast lookup.
 */
export const BACKGROUNDS_BY_CODE: Map<string, Background> = new Map(
  BACKGROUNDS.map(b => [b.code, b])
);

/**
 * Map of background name (lowercase) to Background object for fast lookup.
 */
export const BACKGROUNDS_BY_NAME: Map<string, Background> = new Map(
  BACKGROUNDS.flatMap(b => {
    const entries: [string, Background][] = [[b.name.toLowerCase(), b]];
    if (b.aliases) {
      for (const alias of b.aliases) {
        entries.push([alias.toLowerCase(), b]);
      }
    }
    return entries;
  })
);

/**
 * Simple code-to-name mapping for all backgrounds.
 */
export const BACKGROUND_NAMES: Record<string, string> = Object.fromEntries(
  BACKGROUNDS.map(b => [b.code, b.name])
);

/**
 * Simple name-to-code mapping for all backgrounds.
 */
export const BACKGROUND_CODES: Record<string, string> = Object.fromEntries(
  BACKGROUNDS.flatMap(b => {
    const entries: [string, string][] = [[b.name, b.code]];
    if (b.aliases) {
      for (const alias of b.aliases) {
        entries.push([alias, b.code]);
      }
    }
    return entries;
  })
);

/**
 * List of all known background names (for parsing).
 * Multi-word backgrounds are listed first to ensure correct matching.
 */
export const KNOWN_BACKGROUND_NAMES: readonly string[] = [
  // Multi-word backgrounds (check these first)
  'Abyssal Knight',
  'Air Elementalist',
  'Arcane Marksman',
  'Chaos Knight',
  'Cinder Acolyte',
  'Death Knight',
  'Earth Elementalist',
  'Fire Elementalist',
  'Hedge Wizard',
  'Ice Elementalist',
  'Sloth Apostle',
  'Venom Mage',
  // Single-word backgrounds (alphabetical)
  ...BACKGROUNDS.filter(b => !b.name.includes(' ')).map(b => b.name).sort(),
];

/**
 * Codes for backgrounds that have been removed from the game.
 */
export const REMOVED_BACKGROUND_CODES: readonly string[] = BACKGROUNDS
  .filter(b => b.removedInVersion)
  .map(b => b.code);

/**
 * Names of backgrounds that have been removed from the game (legacy backgrounds).
 */
export const LEGACY_BACKGROUND_NAMES: readonly string[] = BACKGROUNDS
  .filter(b => b.removedInVersion)
  .map(b => b.name);

/**
 * Names of backgrounds that are currently playable (not removed).
 */
export const CURRENT_BACKGROUND_NAMES: readonly string[] = BACKGROUNDS
  .filter(b => !b.removedInVersion)
  .map(b => b.name);
