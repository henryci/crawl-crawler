/**
 * Branch definitions for DCSS.
 *
 * This is the canonical source for all branch data including:
 * - Main dungeon branches
 * - Portal vaults
 * - Hell branches
 * - Removed branches
 */

import type { Branch } from './types.js';

/**
 * All branches in DCSS, including removed ones.
 */
export const BRANCHES: Branch[] = [
  // Main branches
  { name: 'Dungeon', shortName: 'D', isPortal: false },
  { name: 'Temple', shortName: 'Temple', isPortal: false },
  { name: 'Lair', shortName: 'Lair', isPortal: false },
  { name: 'Orcish Mines', shortName: 'Orc', isPortal: false },
  { name: 'Elven Halls', shortName: 'Elf', isPortal: false },
  { name: 'Swamp', shortName: 'Swamp', isPortal: false },
  { name: 'Snake Pit', shortName: 'Snake', isPortal: false },
  { name: 'Shoals', shortName: 'Shoals', isPortal: false },
  { name: 'Spider Nest', shortName: 'Spider', isPortal: false },
  { name: 'Slime Pits', shortName: 'Slime', isPortal: false },
  { name: 'Vaults', shortName: 'Vaults', isPortal: false },
  { name: 'Crypt', shortName: 'Crypt', isPortal: false },
  { name: 'Tomb', shortName: 'Tomb', isPortal: false },
  { name: 'Depths', shortName: 'Depths', isPortal: false, addedInVersion: '0.14' },
  { name: 'Zot', shortName: 'Zot', isPortal: false },

  // Hell branches
  { name: 'Hell', shortName: 'Hell', isPortal: false },
  { name: 'Dis', shortName: 'Dis', isPortal: false },
  { name: 'Gehenna', shortName: 'Geh', isPortal: false },
  { name: 'Cocytus', shortName: 'Coc', isPortal: false },
  { name: 'Tartarus', shortName: 'Tar', isPortal: false },

  // Other extended
  { name: 'Abyss', shortName: 'Abyss', isPortal: false },
  { name: 'Pandemonium', shortName: 'Pan', isPortal: false },
  { name: 'Ziggurat', shortName: 'Zig', isPortal: false },

  // Portal vaults
  { name: 'Sewer', shortName: 'Sewer', isPortal: true },
  { name: 'Ossuary', shortName: 'Ossuary', isPortal: true },
  { name: 'Bailey', shortName: 'Bailey', isPortal: true },
  { name: 'Ice Cave', shortName: 'IceCv', isPortal: true },
  { name: 'Volcano', shortName: 'Volcano', isPortal: true },
  { name: 'Wizard Laboratory', shortName: 'WizLab', isPortal: true },
  { name: 'Gauntlet', shortName: 'Gauntlet', isPortal: true, addedInVersion: '0.24' },
  { name: 'Bazaar', shortName: 'Bazaar', isPortal: true },
  { name: 'Trove', shortName: 'Trove', isPortal: true },
  { name: 'Desolation', shortName: 'Desolation', isPortal: true, addedInVersion: '0.19' },
  { name: 'Arena', shortName: 'Arena', isPortal: true },
  { name: 'Labyrinth', shortName: 'Lab', isPortal: true },

  // Removed branches
  { name: 'Hive', shortName: 'Hive', isPortal: false, removedInVersion: '0.13' },
  { name: 'Hall of Blades', shortName: 'Blade', isPortal: false, removedInVersion: '0.17' },
];

/**
 * Map of branch name (lowercase) to Branch object for fast lookup.
 */
export const BRANCHES_BY_NAME: Map<string, Branch> = new Map(
  BRANCHES.map(b => [b.name.toLowerCase(), b])
);

/**
 * Map of branch short name (lowercase) to Branch object for fast lookup.
 */
export const BRANCHES_BY_SHORT_NAME: Map<string, Branch> = new Map(
  BRANCHES.map(b => [b.shortName.toLowerCase(), b])
);

/**
 * Branch name aliases mapping short/display names to canonical names.
 */
export const BRANCH_ALIASES: Record<string, string> = {
  // Standard aliases
  D: 'Dungeon',
  Orc: 'Orcish Mines',
  Elf: 'Elven Halls',
  Snake: 'Snake Pit',
  Spider: 'Spider Nest',
  Slime: 'Slime Pits',
  Vault: 'Vaults', // Older format
  Pan: 'Pandemonium',
  Geh: 'Gehenna',
  Coc: 'Cocytus',
  Tar: 'Tartarus',
  Zig: 'Ziggurat',
  IceCv: 'Ice Cave',
  'Ice Cave': 'Ice Cave',
  WizLab: 'Wizard Laboratory',
  Lab: 'Labyrinth',
  Blade: 'Hall of Blades',
  // Direct mappings for canonical names
  ...Object.fromEntries(BRANCHES.map(b => [b.name, b.name])),
  ...Object.fromEntries(BRANCHES.map(b => [b.shortName, b.name])),
};

/**
 * Get canonical branch name from an alias or short name.
 */
export function getCanonicalBranchName(name: string): string {
  return BRANCH_ALIASES[name] ?? name;
}

/**
 * List of portal branch names.
 */
export const PORTAL_BRANCHES: readonly string[] = BRANCHES
  .filter(b => b.isPortal)
  .map(b => b.name);
