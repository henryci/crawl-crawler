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

// Re-export lookup functions with backwards-compatible names
export {
  getSpeciesName,
  getBackgroundName,
  isSpeciesRemoved,
  isBackgroundRemoved,
  isRecordLegacy,
} from 'dcss-game-data';

// Re-export combo restriction check
import { isComboRestricted as isComboRestrictedUtil } from 'dcss-game-data';
import type { LegacyConfig } from 'dcss-game-data';

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

// Build and export the default legacy config from centralized data
import { buildLegacyConfig } from 'dcss-game-data';

/**
 * Default legacy configuration for DCSS species and backgrounds.
 * Built from the centralized dcss-game-data package.
 */
export const defaultLegacyConfig: LegacyConfig = buildLegacyConfig();
