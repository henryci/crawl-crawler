/**
 * Species (race) definitions for DCSS.
 *
 * This is the canonical source for all species data including:
 * - Current playable species
 * - Removed/legacy species
 * - Draconian color variants
 * - Version history
 */

import type { Species, ReusedCode } from './types.js';

/**
 * All species in DCSS, including removed ones.
 * Sorted by code for easy lookup.
 */
export const SPECIES: Species[] = [
  // Current species (as of 0.32+)
  { code: 'At', name: 'Armataur', addedInVersion: '0.28' },
  { code: 'Ba', name: 'Barachi', addedInVersion: '0.19' },
  { code: 'Cg', name: 'Coglin', addedInVersion: '0.31' },
  { code: 'DE', name: 'Deep Elf' },
  { code: 'Dg', name: 'Demigod' },
  { code: 'Dj', name: 'Djinni', addedInVersion: '0.28' },
  { code: 'Dr', name: 'Draconian' },
  { code: 'Ds', name: 'Demonspawn' },
  { code: 'Fe', name: 'Felid', addedInVersion: '0.8' },
  { code: 'Fo', name: 'Formicid', addedInVersion: '0.14' },
  { code: 'Gn', name: 'Gnoll', addedInVersion: '0.14', previousCode: { name: 'Gnome', reassignedInVersion: '0.14' } },
  { code: 'Gr', name: 'Gargoyle', addedInVersion: '0.14' },
  { code: 'Gt', name: 'Grotesk', addedInVersion: '0.32' },
  { code: 'Hu', name: 'Human' },
  { code: 'Ko', name: 'Kobold' },
  { code: 'Mf', name: 'Merfolk' },
  { code: 'Mi', name: 'Minotaur' },
  { code: 'Mu', name: 'Mummy' },
  { code: 'Na', name: 'Naga' },
  { code: 'On', name: 'Oni', addedInVersion: '0.14' },
  { code: 'Op', name: 'Octopode', addedInVersion: '0.11' },
  { code: 'Po', name: 'Poltergeist', addedInVersion: '0.33' },
  { code: 'Re', name: 'Revenant', addedInVersion: '0.33' },
  { code: 'Sp', name: 'Spriggan' },
  { code: 'Te', name: 'Tengu', aliases: ['Kenku'] },
  { code: 'Tr', name: 'Troll' },
  { code: 'VS', name: 'Vine Stalker', addedInVersion: '0.16' },

  // Removed species
  { code: 'Bu', name: 'Bultungin', addedInVersion: '0.32', removedInVersion: '0.33' },
  { code: 'Ce', name: 'Centaur', removedInVersion: '0.25' },
  { code: 'DD', name: 'Deep Dwarf', removedInVersion: '0.27' },
  { code: 'El', name: 'Elf', removedInVersion: '0.3' },
  { code: 'GE', name: 'Grey Elf', removedInVersion: '0.6' },
  { code: 'Gh', name: 'Ghoul', removedInVersion: '0.28' },
  { code: 'Ha', name: 'Halfling', removedInVersion: '0.26' },
  { code: 'HD', name: 'Hill Dwarf', removedInVersion: '0.10' },
  { code: 'HE', name: 'High Elf', removedInVersion: '0.24' },
  { code: 'HO', name: 'Hill Orc', removedInVersion: '0.27' },
  { code: 'Ke', name: 'Kenku', removedInVersion: '0.10', aliases: ['Tengu'] },
  { code: 'LO', name: 'Lava Orc', addedInVersion: '0.14', removedInVersion: '0.15' },
  { code: 'MD', name: 'Mountain Dwarf', removedInVersion: '0.10' },
  { code: 'Me', name: 'Meteoran', addedInVersion: '0.30', removedInVersion: '0.32' },
  { code: 'My', name: 'Mayflytaur', addedInVersion: '0.32', removedInVersion: '0.32' }, // Never in stable
  { code: 'Og', name: 'Ogre', removedInVersion: '0.26' },
  { code: 'OM', name: 'Ogre Mage', removedInVersion: '0.5' },
  { code: 'Pa', name: 'Palentonga', addedInVersion: '0.26', removedInVersion: '0.31' },
  { code: 'Sa', name: 'Satyr', removedInVersion: '0.4' },
  { code: 'SE', name: 'Sludge Elf', removedInVersion: '0.14' },
  { code: 'Vp', name: 'Vampire', removedInVersion: '0.28' },
];

/**
 * Codes that were reused for different species over time.
 */
export const REUSED_SPECIES_CODES: Record<string, ReusedCode> = {
  'Gn': {
    oldName: 'Gnome',
    newName: 'Gnoll',
    cutoffVersion: '0.14',
    oldIsRemoved: true,
  },
};

/**
 * Draconian color variants - these all use the 'Dr' code but have specific names.
 */
export const DRACONIAN_COLORS = [
  'Black Draconian',
  'Green Draconian',
  'Grey Draconian',
  'Pale Draconian',
  'Purple Draconian',
  'Red Draconian',
  'White Draconian',
  'Yellow Draconian',
] as const;

/**
 * Map of species code to Species object for fast lookup.
 */
export const SPECIES_BY_CODE: Map<string, Species> = new Map(
  SPECIES.map(s => [s.code, s])
);

/**
 * Map of species name (lowercase) to Species object for fast lookup.
 */
export const SPECIES_BY_NAME: Map<string, Species> = new Map(
  SPECIES.flatMap(s => {
    const entries: [string, Species][] = [[s.name.toLowerCase(), s]];
    if (s.aliases) {
      for (const alias of s.aliases) {
        entries.push([alias.toLowerCase(), s]);
      }
    }
    return entries;
  })
);

/**
 * Simple code-to-name mapping for all species.
 */
export const SPECIES_NAMES: Record<string, string> = Object.fromEntries(
  SPECIES.map(s => [s.code, s.name])
);

/**
 * Simple name-to-code mapping for all species.
 */
export const SPECIES_CODES: Record<string, string> = Object.fromEntries(
  SPECIES.flatMap(s => {
    const entries: [string, string][] = [[s.name, s.code]];
    if (s.aliases) {
      for (const alias of s.aliases) {
        entries.push([alias, s.code]);
      }
    }
    // Add draconian colors mapping to 'Dr'
    if (s.code === 'Dr') {
      for (const color of DRACONIAN_COLORS) {
        entries.push([color, 'Dr']);
      }
    }
    return entries;
  })
);

/**
 * List of all known species names (for parsing).
 * Multi-word species are listed first to ensure correct matching.
 */
export const KNOWN_SPECIES_NAMES: readonly string[] = [
  // Multi-word species (check these first)
  'Deep Dwarf',
  'Deep Elf',
  'Grey Elf',
  'High Elf',
  'Hill Dwarf',
  'Hill Orc',
  'Lava Orc',
  'Mountain Dwarf',
  'Ogre Mage',
  'Sludge Elf',
  'Vine Stalker',
  // Draconian colors
  ...DRACONIAN_COLORS,
  // Single-word species (alphabetical)
  ...SPECIES.filter(s => !s.name.includes(' ')).map(s => s.name).sort(),
];

/**
 * Codes for species that have been removed from the game.
 */
export const REMOVED_SPECIES_CODES: readonly string[] = SPECIES
  .filter(s => s.removedInVersion)
  .map(s => s.code);

/**
 * Names of species that have been removed from the game (legacy species).
 */
export const LEGACY_SPECIES_NAMES: readonly string[] = SPECIES
  .filter(s => s.removedInVersion)
  .map(s => s.name);

/**
 * Names of species that are currently playable (not removed).
 */
export const CURRENT_SPECIES_NAMES: readonly string[] = SPECIES
  .filter(s => !s.removedInVersion)
  .map(s => s.name);
