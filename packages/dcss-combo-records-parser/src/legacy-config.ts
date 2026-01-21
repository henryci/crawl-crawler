/**
 * Legacy configuration for DCSS combo records.
 *
 * This module re-exports game data from the centralized dcss-game-data package
 * and provides backwards-compatible interfaces for existing code.
 */

// Re-export types
export type { LegacyConfig, ReusedCode } from 'dcss-game-data';

// Re-export reused code data
export {
  REUSED_SPECIES_CODES as reusedSpeciesCodes,
  REUSED_BACKGROUND_CODES as reusedBackgroundCodes,
} from 'dcss-game-data';

// Re-export version utilities
export { compareVersions, isVersionBefore } from 'dcss-game-data';

// Import the actual functions from dcss-game-data
import {
  getSpeciesName as getSpeciesNameImpl,
  getBackgroundName as getBackgroundNameImpl,
  isSpeciesRemoved as isSpeciesRemovedImpl,
  isBackgroundRemoved as isBackgroundRemovedImpl,
  isRecordLegacy as isRecordLegacyImpl,
  isComboRestricted as isComboRestrictedUtil,
  buildLegacyConfig,
} from 'dcss-game-data';
import type { LegacyConfig } from 'dcss-game-data';

/**
 * Get species name from code.
 * Backwards-compatible wrapper that accepts optional config parameter.
 *
 * @param code - Species code (e.g., "Mi")
 * @param _configOrVersion - LegacyConfig (ignored) or version string
 * @param version - Game version (optional)
 */
export function getSpeciesName(
  code: string,
  _configOrVersion?: LegacyConfig | string,
  version?: string
): string {
  // If second arg is a string, it's the version (2-arg call)
  // If second arg is an object and third arg exists, third arg is version (3-arg call)
  const actualVersion = typeof _configOrVersion === 'string' ? _configOrVersion : version;
  return getSpeciesNameImpl(code, actualVersion);
}

/**
 * Get background name from code.
 * Backwards-compatible wrapper that accepts optional config parameter.
 *
 * @param code - Background code (e.g., "Fi")
 * @param _configOrVersion - LegacyConfig (ignored) or version string
 * @param version - Game version (optional)
 */
export function getBackgroundName(
  code: string,
  _configOrVersion?: LegacyConfig | string,
  version?: string
): string {
  const actualVersion = typeof _configOrVersion === 'string' ? _configOrVersion : version;
  return getBackgroundNameImpl(code, actualVersion);
}

/**
 * Check if a species is removed.
 * Backwards-compatible wrapper that accepts optional config parameter.
 *
 * @param code - Species code
 * @param _configOrVersion - LegacyConfig (ignored) or version string
 * @param version - Game version (optional)
 */
export function isSpeciesRemoved(
  code: string,
  _configOrVersion?: LegacyConfig | string,
  version?: string
): boolean {
  const actualVersion = typeof _configOrVersion === 'string' ? _configOrVersion : version;
  return isSpeciesRemovedImpl(code, actualVersion);
}

/**
 * Check if a background is removed.
 * Backwards-compatible wrapper that accepts optional config parameter.
 *
 * @param code - Background code
 * @param _configOrVersion - LegacyConfig (ignored) or version string
 * @param version - Game version (optional)
 */
export function isBackgroundRemoved(
  code: string,
  _configOrVersion?: LegacyConfig | string,
  version?: string
): boolean {
  const actualVersion = typeof _configOrVersion === 'string' ? _configOrVersion : version;
  return isBackgroundRemovedImpl(code, actualVersion);
}

/**
 * Check if a record is legacy (removed species, background, or restricted combo).
 * Backwards-compatible wrapper that accepts optional config parameter.
 *
 * @param speciesCode - Species code
 * @param backgroundCode - Background code
 * @param _configOrVersion - LegacyConfig (ignored) or version string
 * @param version - Game version (optional)
 */
export function isRecordLegacy(
  speciesCode: string,
  backgroundCode: string,
  _configOrVersion?: LegacyConfig | string,
  version?: string
): boolean {
  const actualVersion = typeof _configOrVersion === 'string' ? _configOrVersion : version;
  return isRecordLegacyImpl(speciesCode, backgroundCode, actualVersion);
}

/**
 * Check if a specific combo is restricted.
 * Backwards-compatible wrapper that accepts optional config parameter.
 *
 * @param comboOrSpecies - The combo code (e.g., "DgBe") or species code
 * @param background - Optional background code (if species provided separately)
 * @param _config - Ignored, kept for backwards compatibility
 */
export function isComboRestricted(
  comboOrSpecies: string,
  background?: string,
  _config?: LegacyConfig
): boolean {
  if (background) {
    return isComboRestrictedUtil(comboOrSpecies, background);
  }
  // If no background provided, assume it's a combo code (e.g., "DgBe")
  // Split it: first 2 chars are species, rest is background
  if (comboOrSpecies.length >= 4) {
    const species = comboOrSpecies.slice(0, 2);
    const bg = comboOrSpecies.slice(2);
    return isComboRestrictedUtil(species, bg);
  }
  return false;
}

/**
 * Default legacy configuration for DCSS species and backgrounds.
 * Built from the centralized dcss-game-data package.
 */
export const defaultLegacyConfig: LegacyConfig = buildLegacyConfig();
