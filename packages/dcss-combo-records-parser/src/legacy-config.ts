import type { LegacyConfig } from './types.js';

/**
 * Version-aware species/background mapping for codes that were reused.
 * The key is the code, and the value contains version cutoffs.
 */
export interface ReusedCode {
  /** Name used before the cutoff version */
  oldName: string;
  /** Name used from the cutoff version onwards */
  newName: string;
  /** Version where the code changed (exclusive - versions before this use oldName) */
  cutoffVersion: string;
  /** Whether the old usage is removed from the game */
  oldIsRemoved: boolean;
}

/**
 * Codes that were reused for different species over time.
 * Key is the species code.
 */
export const reusedSpeciesCodes: Record<string, ReusedCode> = {
  'Gn': {
    oldName: 'Gnome',
    newName: 'Gnoll',
    cutoffVersion: '0.14', // Gnoll added in 0.14, Gnome removed much earlier
    oldIsRemoved: true,
  },
};

/**
 * Codes that were reused for different backgrounds over time.
 * Key is the background code.
 */
export const reusedBackgroundCodes: Record<string, ReusedCode> = {
  // Add any reused background codes here
  // Example:
  // 'Wn': {
  //   oldName: 'Wanderer (old)',
  //   newName: 'Wanderer',
  //   cutoffVersion: '0.15',
  //   oldIsRemoved: false,
  // },
};

/**
 * Compare two version strings.
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
export function compareVersions(a: string, b: string): number {
  // Handle versions like "0.32.1", "0.32-a0", "0.32"
  // Extract the numeric parts
  const parseVersion = (v: string): number[] => {
    // Remove suffixes like "-a0", "-b1"
    const clean = v.replace(/-.*$/, '');
    return clean.split('.').map(n => parseInt(n, 10) || 0);
  };

  const aParts = parseVersion(a);
  const bParts = parseVersion(b);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal !== bVal) return aVal - bVal;
  }
  return 0;
}

/**
 * Check if a version is before a cutoff version.
 */
export function isVersionBefore(version: string, cutoff: string): boolean {
  return compareVersions(version, cutoff) < 0;
}

/**
 * Default legacy configuration for DCSS species and backgrounds.
 * This includes removed species/backgrounds from older versions of the game.
 */
export const defaultLegacyConfig: LegacyConfig = {
  // Species that have been removed from the game (codes that are NOT reused)
  removedSpecies: [
    'Ce', // Centaur (removed in 0.25)
    'DD', // Deep Dwarf (removed in 0.27)
    'HO', // Hill Orc (removed in 0.27)
    'Hf', // Halfling (removed in 0.26)
    'HD', // High Elf (removed in 0.24)
    'SE', // Sludge Elf (removed very early)
    'Og', // Ogre (removed in 0.26)
    'LO', // Lava Orc (removed)
    'MD', // Mountain Dwarf (removed)
    'GE', // Grey Elf (removed)
    'OM', // Ogre Mage (removed)
    'Ke', // Kenku (removed, replaced by Tengu)
    'Sa', // Satyr (removed)
    'El', // Elf (removed very early)
    'Gh', // Ghoul
    'HE', // High Elf
    'HD', // Hill Dwarf
    'Pa', // Palentonga ?
    'Vp', // Vampire
    'Me', // Meteoran (removed)
    'My', // Mayflytaur (Never included in stable)
    'Bu', // Bultungin (no idea what its history is)
    // Note: 'Gn' is NOT here because it was reused (Gnome -> Gnoll)
  ],

  // Backgrounds that have been removed from the game
  removedBackgrounds: [
    'AM', // Arcane Marksman (removed)
    'As', // Assassin (removed in 0.24)
    'Pr', // Priest (removed, merged into others)
    'Pa', // Paladin (removed very early)
    'Re', // Reaver (removed)
    'St', // Stalker (removed in 0.26)
    'Th', // Thief (removed)
    'Cr', // Crusader (removed)
    'DK', // Death Knight (removed)
    'Ab', // Abyssal Knight (old code, now AK)
    'He', // Healer (removed in 0.20)
    'Jr', // Jester (removed)
    'Je', // Jester (removed) (not sure this is right)
    'Wn', // Wanderer (old code)
    'VM', // Venom Mage (old code)
    'Tm', // Transmuter (removed)
    'AK', // Abyssal Knight (removed)
    'Sk', // Skald (removed)
  ],

  // Human-readable species names (for non-reused codes)
  speciesNames: {
    // Current species (as of 0.32+)
    'At': 'Armataur',
    'Ba': 'Barachi',
    'Co': 'Coglin',
    'DE': 'Deep Elf',
    'Dg': 'Demigod',
    'Dj': 'Djinni',
    'Dr': 'Draconian',
    'Ds': 'Demonspawn',
    'Fe': 'Felid',
    'Fo': 'Formicid',
    'Gn': 'Gnoll', // Default to current name; version-aware lookup will override
    'Gr': 'Gargoyle',
    'Hu': 'Human',
    'Ko': 'Kobold',
    'Md': 'Moundtain Dwarf',
    'Mi': 'Minotaur',
    'Mf': 'Merfolk',
    'Mu': 'Mummy',
    'Na': 'Naga',
    'On': 'Oni',
    'Op': 'Octopode',
    'Po': 'Poltergeiest',
    'Re': 'Revenant',
    'Sp': 'Spriggan',
    'Te': 'Tengu',
    'Tr': 'Troll',
    'VS': 'Vine Stalker',
    // Removed species
    'Ce': 'Centaur',
    'DD': 'Deep Dwarf',
    'Gh': 'Ghoul',
    'HE': 'High Elf',
    'HO': 'Hill Orc',
    'Hf': 'Halfling',
    'HD': 'Hill Dwarf',
    'SE': 'Sludge Elf',
    'Og': 'Ogre',
    'Pa': 'Palentonga',
    'LO': 'Lava Orc',
    'MD': 'Mountain Dwarf',
    'GE': 'Grey Elf',
    'OM': 'Ogre Mage',
    'Ke': 'Kenku',
    'Sa': 'Satyr',
    'El': 'Elf',
    'Vp': 'Vampire',
    'Me': 'Meteoran',
    'My': 'Mayflytaur',
    'Bu': 'Bultungin',
  },

  // Combos that are restricted even though both species and background still exist
  // These are typically "unwinnable" or joke combos that were later blocked
  restrictedCombos: [
    'DGBe', // This one is bug in the official records.
    'DgBe', // Demigod Berserker - Demigods can't worship gods
    'DgCK', // Demigod Chaos Knight
    'DgCA', // Demigod Cinder Acolyte
    'FeHu', // Felid Hunter - removed due to balance
    'FeGl',
    'FeBr',
  ],

  // Human-readable background names
  backgroundNames: {
    // Current backgrounds (as of 0.32+)
    'AE': 'Air Elementalist',
    'Al': 'Alchemist',
    'Ar': 'Artificer',
    'Be': 'Berserker',
    'Br': 'Brigand',
    'CA': 'Cinder Acolyte',
    'CK': 'Chaos Knight',
    'Cj': 'Conjurer',
    'De': 'Delver',
    'EE': 'Earth Elementalist',
    'En': 'Enchanter',
    'FE': 'Fire Elementalist',
    'Fi': 'Fighter',
    'Fw': 'Forgewright',
    'Gl': 'Gladiator',
    'Hs': 'Hedge Slinger',
    'Hu': 'Hunter',
    'HW': 'Hedge Wizard',
    'IE': 'Ice Elementalist',
    'Mo': 'Monk',
    'Ne': 'Necromancer',
    'Sh': 'Shapeshifter',
    'Su': 'Summoner',
    'Wn': 'Wanderer',
    'Wr': 'Warper',
    'Wz': 'Wizard',
    // Removed backgrounds
    'AM': 'Arcane Marksman',
    'As': 'Assassin',
    'Pr': 'Priest',
    'Pa': 'Paladin',
    'St': 'Stalker',
    'Th': 'Thief',
    'Cr': 'Crusader',
    'DK': 'Death Knight',
    'Ab': 'Abyssal Knight',
    'He': 'Healer',
    'Je': 'Jester', // (not sure this is right)
    'Jr': 'Jester',
    'Tm': 'Transmuter',
    'VM': 'Venom Mage',
    'AK': 'Abyssal Knight',
    'Sk': 'Skald',
    'Re': 'Reaver',
  },
};

/**
 * Get species name from code, accounting for version-based reuse.
 * @param code Species code (e.g., "Gn")
 * @param version Game version of the record (e.g., "0.32.1")
 * @param config Legacy config
 */
export function getSpeciesName(
  code: string,
  config: LegacyConfig = defaultLegacyConfig,
  version?: string
): string {
  // Check if this is a reused code
  const reused = reusedSpeciesCodes[code];
  if (reused && version) {
    if (isVersionBefore(version, reused.cutoffVersion)) {
      return reused.oldName;
    }
    return reused.newName;
  }

  return config.speciesNames[code] || code;
}

/**
 * Get background name from code, accounting for version-based reuse.
 * @param code Background code (e.g., "Fi")
 * @param version Game version of the record (e.g., "0.32.1")
 * @param config Legacy config
 */
export function getBackgroundName(
  code: string,
  config: LegacyConfig = defaultLegacyConfig,
  version?: string
): string {
  // Check if this is a reused code
  const reused = reusedBackgroundCodes[code];
  if (reused && version) {
    if (isVersionBefore(version, reused.cutoffVersion)) {
      return reused.oldName;
    }
    return reused.newName;
  }

  return config.backgroundNames[code] || code;
}

/**
 * Check if species is removed, accounting for version-based reuse.
 * @param code Species code
 * @param version Game version of the record
 * @param config Legacy config
 */
export function isSpeciesRemoved(
  code: string,
  config: LegacyConfig = defaultLegacyConfig,
  version?: string
): boolean {
  // Check if this is a reused code
  const reused = reusedSpeciesCodes[code];
  if (reused && version) {
    // If version is before cutoff, check if old version is removed
    if (isVersionBefore(version, reused.cutoffVersion)) {
      return reused.oldIsRemoved;
    }
    // Otherwise it's the new (current) version - not removed
    return false;
  }

  return config.removedSpecies.includes(code);
}

/**
 * Check if background is removed, accounting for version-based reuse.
 * @param code Background code
 * @param version Game version of the record
 * @param config Legacy config
 */
export function isBackgroundRemoved(
  code: string,
  config: LegacyConfig = defaultLegacyConfig,
  version?: string
): boolean {
  // Check if this is a reused code
  const reused = reusedBackgroundCodes[code];
  if (reused && version) {
    if (isVersionBefore(version, reused.cutoffVersion)) {
      return reused.oldIsRemoved;
    }
    return false;
  }

  return config.removedBackgrounds.includes(code);
}

/**
 * Check if a specific combo is restricted (even if species and background are both current).
 * @param combo The combo code (e.g., "DgBe") or species + background separately
 * @param config Legacy config
 */
export function isComboRestricted(
  comboOrSpecies: string,
  background?: string,
  config: LegacyConfig = defaultLegacyConfig
): boolean {
  const combo = background ? comboOrSpecies + background : comboOrSpecies;
  return config.restrictedCombos.includes(combo);
}

/**
 * Check if a record is legacy (removed species, background, or restricted combo).
 * This is a convenience function that checks all three conditions.
 * @param species Species code
 * @param background Background code
 * @param version Game version
 * @param config Legacy config
 */
export function isRecordLegacy(
  species: string,
  background: string,
  config: LegacyConfig = defaultLegacyConfig,
  version?: string
): boolean {
  return (
    isSpeciesRemoved(species, config, version) ||
    isBackgroundRemoved(background, config, version) ||
    isComboRestricted(species, background, config)
  );
}
