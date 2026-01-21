/**
 * God definitions for DCSS.
 *
 * This is the canonical source for all god data including:
 * - Current gods
 * - Removed gods
 * - Version history
 */

import type { God } from './types.js';

/**
 * All gods in DCSS, including removed ones.
 */
export const GODS: God[] = [
  // Current gods (as of 0.33+)
  { name: 'Ashenzari', epithet: 'the Shackled' },
  { name: 'Beogh', epithet: 'the Shepherd', addedInVersion: '0.4' },
  { name: 'Cheibriados', epithet: 'the Contemplative', addedInVersion: '0.6' },
  { name: 'Dithmenos', epithet: 'the Shadowed', addedInVersion: '0.14' },
  { name: 'Elyvilon', epithet: 'the Healer' },
  { name: 'Fedhas', shortName: 'Fedhas', epithet: 'Madash', addedInVersion: '0.5' },
  { name: 'Gozag', epithet: 'Ym Sagoz the Greedy', addedInVersion: '0.16' },
  { name: 'Hepliaklqana', shortName: 'Hep', epithet: 'the Forgotten', addedInVersion: '0.20' },
  { name: 'Ignis', epithet: 'the Dying Flame', addedInVersion: '0.29' },
  { name: 'Jiyva', epithet: 'the Shapeless', addedInVersion: '0.6' },
  { name: 'Kikubaaqudgha', shortName: 'Kiku' },
  { name: 'Lugonu', epithet: 'the Unformed' },
  { name: 'Makhleb', epithet: 'the Destroyer' },
  { name: 'Nemelex Xobeh', shortName: 'Nemelex' },
  { name: 'Okawaru', epithet: 'the Warmaster' },
  { name: 'Qazlal', epithet: 'Stormbringer', addedInVersion: '0.16' },
  { name: 'Ru', epithet: 'the Awakened', addedInVersion: '0.17' },
  { name: 'Sif Muna', shortName: 'Sif', epithet: 'the Loreminder' },
  { name: 'the Shining One', shortName: 'TSO' },
  { name: 'Trog', epithet: 'the Wrathful' },
  { name: 'Uskayaw', epithet: 'the Reveler', addedInVersion: '0.21' },
  { name: 'Vehumet' },
  { name: 'Wu Jian', addedInVersion: '0.22' },
  { name: 'Xom', epithet: 'the Unpredictable' },
  { name: 'Yredelemnul', shortName: 'Yred', epithet: 'the Dark' },
  { name: 'Zin', epithet: 'the Law-giver' },

  // Removed gods
  { name: 'Pakellas', addedInVersion: '0.18', removedInVersion: '0.23' },
];

/**
 * Map of god name (lowercase) to God object for fast lookup.
 * Includes short names and common variations.
 */
export const GODS_BY_NAME: Map<string, God> = new Map(
  GODS.flatMap(g => {
    const entries: [string, God][] = [[g.name.toLowerCase(), g]];
    if (g.shortName) {
      entries.push([g.shortName.toLowerCase(), g]);
    }
    // Add common variations
    if (g.name === 'the Shining One') {
      entries.push(['shining one', g]);
      entries.push(['tso', g]);
    }
    if (g.name === 'Wu Jian') {
      entries.push(['wu jian council', g]);
      entries.push(['the wu jian council', g]);
    }
    return entries;
  })
);

/**
 * God title prefixes that appear before the god name.
 * e.g., "Warmaster Okawaru" -> title is "Warmaster"
 */
export const GOD_TITLE_PREFIXES = new Set([
  'the shackled',      // Ashenzari
  'the shepherd',      // Beogh
  'the contemplative', // Cheibriados
  'the shadowed',      // Dithmenos
  'the healer',        // Elyvilon
  'madash',            // Fedhas
  'ym sagoz the greedy', // Gozag
  'ym sagoz',          // Gozag (shorter form)
  'the forgotten',     // Hepliaklqana
  'the dying flame',   // Ignis
  'the shapeless',     // Jiyva
  'the unformed',      // Lugonu
  'the destroyer',     // Makhleb
  'the warmaster',     // Okawaru
  'warmaster',         // Okawaru (without "the")
  'stormbringer',      // Qazlal
  'the awakened',      // Ru
  'the loreminder',    // Sif Muna
  'the wrathful',      // Trog
  'the reveler',       // Uskayaw
  'the unpredictable', // Xom
  'the dark',          // Yredelemnul
  'the law-giver',     // Zin
]);

/**
 * List of all god names for parsing.
 */
export const KNOWN_GOD_NAMES: readonly string[] = GODS.map(g => g.name);
