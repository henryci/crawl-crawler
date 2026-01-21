/**
 * dcss-game-data
 *
 * Centralized game data definitions for Dungeon Crawl Stone Soup.
 * This package provides canonical data for species, backgrounds, gods,
 * branches, and related game configuration.
 *
 * @example
 * ```typescript
 * import {
 *   getSpeciesName,
 *   getBackgroundCode,
 *   isSpeciesRemoved,
 *   SPECIES,
 *   BACKGROUNDS,
 * } from 'dcss-game-data';
 *
 * // Get species name from code
 * const name = getSpeciesName('Mi'); // "Minotaur"
 *
 * // Get background code from name
 * const code = getBackgroundCode('Fighter'); // "Fi"
 *
 * // Check if species is removed
 * const removed = isSpeciesRemoved('Ce'); // true (Centaur)
 * ```
 */

// Types
export type {
  Species,
  Background,
  God,
  Branch,
  ComboRestriction,
  LegacyConfig,
  ReusedCode,
} from './types.js';

// Species data
export {
  SPECIES,
  SPECIES_BY_CODE,
  SPECIES_BY_NAME,
  SPECIES_NAMES,
  SPECIES_CODES,
  REUSED_SPECIES_CODES,
  DRACONIAN_COLORS,
  KNOWN_SPECIES_NAMES,
  REMOVED_SPECIES_CODES,
  LEGACY_SPECIES_NAMES,
  CURRENT_SPECIES_NAMES,
} from './species.js';

// Background data
export {
  BACKGROUNDS,
  BACKGROUNDS_BY_CODE,
  BACKGROUNDS_BY_NAME,
  BACKGROUND_NAMES,
  BACKGROUND_CODES,
  REUSED_BACKGROUND_CODES,
  KNOWN_BACKGROUND_NAMES,
  REMOVED_BACKGROUND_CODES,
  LEGACY_BACKGROUND_NAMES,
  CURRENT_BACKGROUND_NAMES,
} from './backgrounds.js';

// God data
export {
  GODS,
  GODS_BY_NAME,
  GOD_TITLE_PREFIXES,
  KNOWN_GOD_NAMES,
} from './gods.js';

// Branch data
export {
  BRANCHES,
  BRANCHES_BY_NAME,
  BRANCHES_BY_SHORT_NAME,
  BRANCH_ALIASES,
  getCanonicalBranchName,
  PORTAL_BRANCHES,
} from './branches.js';

// Combo restrictions
export {
  RESTRICTED_COMBOS,
  RESTRICTED_COMBO_CODES,
  ALL_RESTRICTED_COMBO_CODES,
} from './combos.js';

// Utility functions
export {
  // Version utilities
  compareVersions,
  isVersionBefore,
  parseVersion,
  // Species utilities
  getSpeciesByCode,
  getSpeciesByName,
  getSpeciesName,
  getSpeciesCode,
  isSpeciesRemoved,
  normalizeSpeciesName,
  parseRaceBackground,
  // Background utilities
  getBackgroundByCode,
  getBackgroundByName,
  getBackgroundName,
  getBackgroundCode,
  isBackgroundRemoved,
  // God utilities
  cleanGodName,
  // Combo utilities
  isComboRestricted,
  isRecordLegacy,
  // Legacy config
  buildLegacyConfig,
} from './utils.js';
