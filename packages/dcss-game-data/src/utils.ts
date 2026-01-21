/**
 * Utility functions for working with DCSS game data.
 */

import type { Species, Background, LegacyConfig } from './types.js';
import {
  SPECIES_BY_CODE,
  SPECIES_BY_NAME,
  SPECIES_CODES,
  SPECIES_NAMES,
  REUSED_SPECIES_CODES,
  KNOWN_SPECIES_NAMES,
  REMOVED_SPECIES_CODES,
} from './species.js';
import {
  BACKGROUNDS_BY_CODE,
  BACKGROUNDS_BY_NAME,
  BACKGROUND_CODES,
  BACKGROUND_NAMES,
  REUSED_BACKGROUND_CODES,
  REMOVED_BACKGROUND_CODES,
} from './backgrounds.js';
import { GODS_BY_NAME, GOD_TITLE_PREFIXES } from './gods.js';
import { isComboRestricted as isComboRestrictedImpl, ALL_RESTRICTED_COMBO_CODES } from './combos.js';

// ============================================
// Version comparison utilities
// ============================================

/**
 * Compare two version strings.
 * Returns: negative if a < b, 0 if equal, positive if a > b
 *
 * @param a - First version string (e.g., "0.32.1")
 * @param b - Second version string (e.g., "0.31.0")
 * @returns Comparison result
 */
export function compareVersions(a: string | null | undefined, b: string | null | undefined): number {
  // Handle null/undefined - treat as "unknown" which sorts first
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  // Handle versions like "0.32.1", "0.32-a0", "0.32"
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
 * Returns false if version is null/undefined (unknown versions are not considered "before").
 *
 * @param version - Version to check
 * @param cutoff - Cutoff version
 * @returns True if version < cutoff
 */
export function isVersionBefore(version: string | null | undefined, cutoff: string): boolean {
  if (!version) return false;
  return compareVersions(version, cutoff) < 0;
}

/**
 * Parse a version string into components.
 *
 * @param version - Version string (e.g., "0.32-a0-1165-gbb83fb5")
 * @returns Parsed version info
 */
export function parseVersion(version: string): {
  major: number | null;
  minor: number | null;
  patch: number | null;
  isTrunk: boolean;
} {
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?/.exec(version);
  if (match) {
    return {
      major: parseInt(match[1]!, 10),
      minor: parseInt(match[2]!, 10),
      patch: match[3] ? parseInt(match[3], 10) : null,
      isTrunk: version.includes('-a') || version.includes('trunk'),
    };
  }
  return { major: null, minor: null, patch: null, isTrunk: false };
}

// ============================================
// Species utilities
// ============================================

/**
 * Get a species by its code.
 *
 * @param code - Species code (e.g., "Mi")
 * @returns Species object or undefined
 */
export function getSpeciesByCode(code: string): Species | undefined {
  return SPECIES_BY_CODE.get(code);
}

/**
 * Get a species by its name.
 *
 * @param name - Species name (e.g., "Minotaur")
 * @returns Species object or undefined
 */
export function getSpeciesByName(name: string): Species | undefined {
  return SPECIES_BY_NAME.get(name.toLowerCase());
}

/**
 * Get species name from code, accounting for version-based reuse.
 *
 * @param code - Species code (e.g., "Gn")
 * @param version - Game version (optional, for version-aware lookup)
 * @returns Species name
 */
export function getSpeciesName(code: string, version?: string): string {
  // Check if this is a reused code
  const reused = REUSED_SPECIES_CODES[code];
  if (reused && version) {
    if (isVersionBefore(version, reused.cutoffVersion)) {
      return reused.oldName;
    }
    return reused.newName;
  }

  return SPECIES_NAMES[code] ?? code;
}

/**
 * Get species code from name.
 *
 * @param name - Species name (e.g., "Minotaur")
 * @returns Species code or the first two characters if not found
 */
export function getSpeciesCode(name: string): string {
  // Handle draconian colors
  if (name.includes('Draconian')) {
    return 'Dr';
  }
  return SPECIES_CODES[name] ?? name.substring(0, 2).toUpperCase();
}

/**
 * Check if a species is removed, accounting for version-based reuse.
 *
 * @param code - Species code
 * @param version - Game version (optional)
 * @returns True if the species is removed
 */
export function isSpeciesRemoved(code: string, version?: string): boolean {
  // Check if this is a reused code
  const reused = REUSED_SPECIES_CODES[code];
  if (reused && version) {
    if (isVersionBefore(version, reused.cutoffVersion)) {
      return reused.oldIsRemoved;
    }
    return false;
  }

  return REMOVED_SPECIES_CODES.includes(code);
}

/**
 * Normalize a race name (handle draconian colors).
 *
 * @param race - Race name
 * @returns Normalized race name
 */
export function normalizeSpeciesName(race: string): string {
  if (race.includes('Draconian')) {
    return 'Draconian';
  }
  return race;
}

/**
 * Parse a combined "Race Background" string into separate race and background.
 *
 * @param raceBackground - Combined string like "Deep Dwarf Healer"
 * @returns Object with race and background
 */
export function parseRaceBackground(raceBackground: string): {
  race: string | null;
  background: string | null;
} {
  if (!raceBackground) {
    return { race: null, background: null };
  }

  const trimmed = raceBackground.trim();

  // Try to match known species (longest matches first)
  for (const species of KNOWN_SPECIES_NAMES) {
    if (trimmed.startsWith(species + ' ')) {
      const background = trimmed.slice(species.length).trim();
      return { race: species, background: background || null };
    }
    // Also try case-insensitive match
    if (trimmed.toLowerCase().startsWith(species.toLowerCase() + ' ')) {
      const background = trimmed.slice(species.length).trim();
      return { race: species, background: background || null };
    }
  }

  // Fallback: assume first word is race
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return { race: parts[0] ?? null, background: parts.slice(1).join(' ') };
  }

  return { race: trimmed, background: null };
}

// ============================================
// Background utilities
// ============================================

/**
 * Get a background by its code.
 *
 * @param code - Background code (e.g., "Fi")
 * @returns Background object or undefined
 */
export function getBackgroundByCode(code: string): Background | undefined {
  return BACKGROUNDS_BY_CODE.get(code);
}

/**
 * Get a background by its name.
 *
 * @param name - Background name (e.g., "Fighter")
 * @returns Background object or undefined
 */
export function getBackgroundByName(name: string): Background | undefined {
  return BACKGROUNDS_BY_NAME.get(name.toLowerCase());
}

/**
 * Get background name from code, accounting for version-based reuse.
 *
 * @param code - Background code (e.g., "Fi")
 * @param version - Game version (optional)
 * @returns Background name
 */
export function getBackgroundName(code: string, version?: string): string {
  // Check if this is a reused code
  const reused = REUSED_BACKGROUND_CODES[code];
  if (reused && version) {
    if (isVersionBefore(version, reused.cutoffVersion)) {
      return reused.oldName;
    }
    return reused.newName;
  }

  return BACKGROUND_NAMES[code] ?? code;
}

/**
 * Get background code from name.
 *
 * @param name - Background name (e.g., "Fighter")
 * @returns Background code or the first two characters if not found
 */
export function getBackgroundCode(name: string): string {
  return BACKGROUND_CODES[name] ?? name.substring(0, 2);
}

/**
 * Check if a background is removed, accounting for version-based reuse.
 *
 * @param code - Background code
 * @param version - Game version (optional)
 * @returns True if the background is removed
 */
export function isBackgroundRemoved(code: string, version?: string): boolean {
  // Check if this is a reused code
  const reused = REUSED_BACKGROUND_CODES[code];
  if (reused && version) {
    if (isVersionBefore(version, reused.cutoffVersion)) {
      return reused.oldIsRemoved;
    }
    return false;
  }

  return REMOVED_BACKGROUND_CODES.includes(code);
}

// ============================================
// God utilities
// ============================================

/**
 * Clean a god name by removing epithets/titles.
 *
 * @param godStr - Raw god name string (may include epithet/title)
 * @returns Clean canonical god name
 */
export function cleanGodName(godStr: string): string {
  if (!godStr) {
    return godStr;
  }

  const lowerStr = godStr.toLowerCase().trim();

  // Check if any known god name appears in the string
  // Sort by length descending to match longer names first
  const sortedGods = Array.from(GODS_BY_NAME.entries()).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [lowerGod, god] of sortedGods) {
    if (lowerStr.includes(lowerGod)) {
      return god.name;
    }
  }

  // Try to extract by removing known title prefixes
  for (const prefix of GOD_TITLE_PREFIXES) {
    if (lowerStr.startsWith(prefix + ' ')) {
      const remainder = godStr.slice(prefix.length).trim();
      if (remainder) {
        return cleanGodName(remainder);
      }
    }
  }

  // Fallback: remove "the <epithet>" suffix
  const parts = godStr.split(' the ');
  if (parts.length > 1 && parts[0]) {
    return parts[0].trim();
  }

  return godStr.trim();
}

// ============================================
// Combo utilities
// ============================================

/**
 * Check if a combo is restricted.
 *
 * @param speciesCode - Species code
 * @param backgroundCode - Background code
 * @returns True if restricted
 */
export function isComboRestricted(
  speciesCode: string,
  backgroundCode: string
): boolean {
  return isComboRestrictedImpl(speciesCode, backgroundCode);
}

/**
 * Check if a record is legacy (removed species, background, or restricted combo).
 *
 * @param speciesCode - Species code
 * @param backgroundCode - Background code
 * @param version - Game version (optional)
 * @returns True if legacy
 */
export function isRecordLegacy(
  speciesCode: string,
  backgroundCode: string,
  version?: string
): boolean {
  return (
    isSpeciesRemoved(speciesCode, version) ||
    isBackgroundRemoved(backgroundCode, version) ||
    isComboRestricted(speciesCode, backgroundCode)
  );
}

// ============================================
// Legacy config builder
// ============================================

/**
 * Build a LegacyConfig object from the centralized data.
 * This is for backwards compatibility with existing code.
 *
 * @returns LegacyConfig object
 */
export function buildLegacyConfig(): LegacyConfig {
  return {
    removedSpecies: [...REMOVED_SPECIES_CODES],
    removedBackgrounds: [...REMOVED_BACKGROUND_CODES],
    restrictedCombos: [...ALL_RESTRICTED_COMBO_CODES],
    speciesNames: { ...SPECIES_NAMES },
    backgroundNames: { ...BACKGROUND_NAMES },
  };
}
