/**
 * Stats extractor for DCSS morgue files.
 *
 * Extracts character stats from the stats block. The format has changed
 * between versions:
 *
 * Newer format (0.23+):
 *     Health: 258/258    AC: 21    Str: 13    XL:     27
 *     Magic:  42/70      EV: 22    Int: 57    God:
 *     Gold:   3019       SH: 10    Dex: 21    Spells: 1/80 levels left
 *
 * Older format (pre-0.17):
 *     HP 254/254       AC 12     Str 13      XL: 27
 *     MP  34/47        EV 27     Int 33      God:
 *     Gold 12489       SH 34     Dex 26      Spells: 18 memorised
 */

import type { CharacterStats } from '../types.js';
import { PATTERNS, parseIntSafe } from '../utils.js';

/**
 * Extract character stats from the morgue file.
 *
 * The stats block appears twice in the file - we use the first occurrence
 * which represents the ending stats.
 *
 * @param content - Full morgue file content as a string
 * @returns Object with stat fields, or null if stats block not found.
 *
 * @remarks
 * Version Notes:
 * - Newer versions (0.23+) use "Health:" and "Magic:" labels
 * - Older versions use "HP" and "MP" labels
 * - God piety shown as "[******]" with 0-6 stars
 */
export function extractStats(content: string): CharacterStats | null {
  const result: CharacterStats = {
    hpCurrent: null,
    hpMax: null,
    mpCurrent: null,
    mpMax: null,
    ac: null,
    ev: null,
    sh: null,
    str: null,
    int: null,
    dex: null,
    gold: null,
    god: null,
    piety: null,
  };

  // Find the stats block - look for Health: or HP pattern
  const statsSection = findStatsSection(content);
  if (!statsSection) {
    return null;
  }

  // Try newer format first (Health:/Magic:)
  if (statsSection.includes('Health:')) {
    extractNewerFormat(statsSection, result);
  } else {
    extractOlderFormat(statsSection, result);
  }

  // Extract common fields that work for both formats
  extractCommonStats(statsSection, result);

  return result;
}

/**
 * Find the stats section in the morgue file.
 *
 * Returns the first occurrence of the stats block.
 */
function findStatsSection(content: string): string | null {
  // Look for newer format marker
  const healthMatch = /Health:\s*-?\d+\/\d+/.exec(content);
  if (healthMatch) {
    // Get a chunk of text around this
    const start = healthMatch.index;
    // Find a reasonable end (next major section or 500 chars)
    const end = Math.min(start + 500, content.length);
    return content.slice(start, end);
  }

  // Look for older format marker
  const hpMatch = /HP\s+-?\d+\/\d+/.exec(content);
  if (hpMatch) {
    const start = hpMatch.index;
    const end = Math.min(start + 500, content.length);
    return content.slice(start, end);
  }

  return null;
}

/**
 * Extract stats from newer format (0.23+).
 */
function extractNewerFormat(section: string, result: CharacterStats): void {
  // Health: 258/258
  const healthMatch = PATTERNS.statsHealth.exec(section);
  if (healthMatch) {
    result.hpCurrent = parseIntSafe(healthMatch[1]);
    result.hpMax = parseIntSafe(healthMatch[2]);
  }

  // Magic: 42/70
  const magicMatch = PATTERNS.statsMagic.exec(section);
  if (magicMatch) {
    result.mpCurrent = parseIntSafe(magicMatch[1]);
    result.mpMax = parseIntSafe(magicMatch[2]);
  }
}

/**
 * Extract stats from older format (pre-0.17).
 */
function extractOlderFormat(section: string, result: CharacterStats): void {
  // HP 254/254
  const hpMatch = PATTERNS.statsHpOld.exec(section);
  if (hpMatch) {
    result.hpCurrent = parseIntSafe(hpMatch[1]);
    result.hpMax = parseIntSafe(hpMatch[2]);
  }

  // MP 34/47
  const mpMatch = PATTERNS.statsMpOld.exec(section);
  if (mpMatch) {
    result.mpCurrent = parseIntSafe(mpMatch[1]);
    result.mpMax = parseIntSafe(mpMatch[2]);
  }
}

/**
 * Extract stats that have consistent format across versions.
 */
function extractCommonStats(section: string, result: CharacterStats): void {
  // AC
  const acMatch = PATTERNS.statsAc.exec(section);
  if (acMatch) {
    result.ac = parseIntSafe(acMatch[1]);
  }

  // EV
  const evMatch = PATTERNS.statsEv.exec(section);
  if (evMatch) {
    result.ev = parseIntSafe(evMatch[1]);
  }

  // SH
  const shMatch = PATTERNS.statsSh.exec(section);
  if (shMatch) {
    result.sh = parseIntSafe(shMatch[1]);
  }

  // Str
  const strMatch = PATTERNS.statsStr.exec(section);
  if (strMatch) {
    result.str = parseIntSafe(strMatch[1]);
  }

  // Int
  const intMatch = PATTERNS.statsInt.exec(section);
  if (intMatch) {
    result.int = parseIntSafe(intMatch[1]);
  }

  // Dex
  const dexMatch = PATTERNS.statsDex.exec(section);
  if (dexMatch) {
    result.dex = parseIntSafe(dexMatch[1]);
  }

  // Gold
  const goldMatch = PATTERNS.statsGold.exec(section);
  if (goldMatch) {
    result.gold = parseIntSafe(goldMatch[1]);
  }

  // God and piety
  // Look for patterns like "God: Makhleb [******]" or "God: Sif Muna [****]"
  // The god name may have spaces, and piety is shown as [*] to [******]
  // First try to match with piety
  const godWithPietyMatch = /God:\s+([A-Za-z][A-Za-z ]+?)\s+\[([*]+)\]/.exec(section);
  if (godWithPietyMatch) {
    const godName = godWithPietyMatch[1]?.trim();
    if (godName) {
      result.god = godName;
      result.piety = godWithPietyMatch[2]?.length ?? null;
    }
  } else {
    // Try without piety (godless or no piety shown)
    const godMatch = /God:\s+([A-Za-z][A-Za-z ]*?)(?:\s|$)/.exec(section);
    if (godMatch) {
      const godName = godMatch[1]?.trim();
      if (godName) {
        result.god = godName;
      }
    }
  }
}

