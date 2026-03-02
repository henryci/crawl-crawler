/**
 * Utility functions and patterns for DCSS morgue file parsing.
 *
 * Contains regex patterns, type conversions, and helper functions
 * used across multiple extractors.
 */

/**
 * Pre-compiled regex patterns used across extractors.
 * Using RegExp objects for reusability and performance.
 */
export const PATTERNS = {
  /**
   * Version line: " Dungeon Crawl Stone Soup version 0.34-a0-3-g68670cc5b6 (webtiles) character file."
   * Also handles older formats like "0.2.7 (crawl-ref)" where platform contains hyphens.
   */
  version: /Dungeon Crawl Stone Soup version ([^\s]+)\s*(?:\(([^)]+)\))?\s*character file/,

  /**
   * Game seed: "Game seed: 333194901430686732" or "Game seed: 123, levelgen mode: deterministic"
   */
  gameSeed: /Game seed:\s*(\d+)(?:,\s*levelgen mode:\s*(\w+))?/,

  /**
   * Score line: "12163156 Charly the Archmage (level 27, 258/258 HPs)"
   * Also handles drained HP format like "54894 PigKeeper the Thaumaturge (level 14, -4/74 (81) HPs)"
   * where (81) is the undrained max HP.
   */
  scoreLine: /^\s*(\d+)\s+(\S+)\s+the\s+(.+?)\s+\(level\s+(\d+),\s*(-?\d+)\/(\d+)(?:\s+\(\d+\))?\s+HPs?\)/,

  /**
   * Began as: "Began as a Demigod Earth Elementalist on Apr 26, 2025."
   * Captures the full "Race Background" string for further parsing.
   */
  beganAs: /Began as an?\s+(.+?)\s+on\s+(.+?)\./,

  /**
   * Was a (older format): "Was a Demigod Earth Elementalist."
   * Captures the full "Race Background" string for further parsing.
   */
  wasA: /Was an?\s+(.+?)\./,

  /**
   * Escaped with runes: "... and 15 runes on Apr 28, 2025!"
   */
  escapedRunes: /and\s+(\d+)\s+runes?\s+on\s+(.+?)!/,

  /**
   * Game duration: "The game lasted 10:20:02 (133072 turns)."
   * Also handles multi-day: "1day13:58:37", "1day 12:40:25", "1 day 03:29:14"
   * Also handles server prefix: "Dgl's game lasted ..."
   */
  gameDuration: /game lasted\s+((?:\d+\s*days?\s*)?\d[\d:]+)\s+\((\d+)\s+turns?\)/,

  // Stats patterns - newer format (0.23+)
  statsHealth: /Health:\s*(-?\d+)\/(\d+)/,
  statsMagic: /Magic:\s*(\d+)\/(\d+)/,
  statsGold: /Gold:?\s*(\d+)/,
  statsAc: /AC:?\s*(\d+)/,
  statsEv: /EV:?\s*(\d+)/,
  statsSh: /SH:?\s*(\d+)/,
  statsStr: /Str:?\s*(\d+)/,
  statsInt: /Int:?\s*(\d+)/,
  statsDex: /Dex:?\s*(\d+)/,
  statsXl: /XL:?\s*(\d+)/,
  statsGod: /God:\s*(.+?)(?:\s+\[([*]+)\])?(?:\s|$)/,

  // Stats patterns - older format (pre-0.17)
  statsHpOld: /HP:?\s+(-?\d+)\/(\d+)/,
  statsMpOld: /MP\s+(\d+)\/(\d+)/,

  /**
   * Runes line: "}: 15/15 runes: decaying, serpentine, slimy, ..."
   * The prefix character varies by version (}, ∞, or other Unicode glyphs).
   */
  runes: /^.{1,4}:\s*(\d+)\/(\d+)\s+runes?:\s*(.+)/m,

  /**
   * Gems line: "$: 3/3 gems: glittering amethyst, ..."
   */
  gems: /\$:\s*(\d+)\/(\d+)\s+gems?:\s*(.+)/,

  /**
   * Branch visits summary: "You visited 17 branches of the dungeon, and saw 87 of its levels."
   * Handles both singular "branch" and plural "branches".
   */
  branchesVisited: /You visited\s+(\d+)\s+branch(?:es)?.+?saw\s+(\d+)\s+of its levels/,

  /**
   * Notes section line: "  5822 | Temple   | Became a worshipper of..."
   */
  noteLine: /^\s*(\d+)\s+\|\s+(\S+)\s+\|\s+(.+)$/,

  /**
   * XP level reached: "Reached XP level 5"
   */
  xpReached: /Reached XP level\s+(\d+)/,

  /**
   * Skill level reached: "Reached skill level 5 in Fighting" (newer) or "Reached skill 5 in Fighting" (older)
   */
  skillReached: /Reached skill(?: level)?\s+(\d+)\s+in\s+(.+)/,

  /**
   * God worship: "Became a worshipper of Makhleb the Destroyer"
   */
  becameWorshipper: /Became a worshipper of\s+(.+?)(?:\s+the|\s*$)/,

  /**
   * Fell from grace: "Fell from the grace of Makhleb"
   */
  fellFromGrace: /Fell from the grace of\s+(\S+)/,

  /**
   * Abandoned god: "Abandoned Makhleb"
   */
  abandoned: /Abandoned\s+(\S+)/,

  /**
   * Entered branch: "Entered Level 1 of the Snake Pit"
   */
  enteredBranch: /Entered (?:Level \d+ of )?(?:the )?(.+)/,

  /**
   * Skill line (simple format): " + Level 22.5 Fighting"
   */
  skillSimple: /^\s*([+\-O*])\s+Level\s+([\d.]+)\s+(.+?)\s*$/,
} as const;

/**
 * Convert a duration string (HH:MM:SS or MM:SS) to seconds.
 *
 * @param durationStr - Duration in format "HH:MM:SS" or "MM:SS"
 * @returns Total seconds, or null if parsing fails
 *
 * @example
 * durationToSeconds("10:20:02") // 37202
 * durationToSeconds("5:30") // 330
 */
export function durationToSeconds(durationStr: string): number | null {
  if (!durationStr) {
    return null;
  }

  try {
    let days = 0;
    let timeStr = durationStr.trim();

    // Handle day prefix: "1day13:58:37", "1day 12:40:25", "1 day 03:29:14"
    // Also handles old "Play time" format: "3, 06:06:42"
    const dayMatch = /^(\d+)\s*(?:days?\s*|,\s*)(.+)$/.exec(timeStr);
    if (dayMatch && dayMatch[1] && dayMatch[2]) {
      days = parseInt(dayMatch[1], 10);
      timeStr = dayMatch[2].trim();
    }

    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts.map(Number);
      if (
        hours === undefined ||
        minutes === undefined ||
        seconds === undefined ||
        isNaN(hours) ||
        isNaN(minutes) ||
        isNaN(seconds)
      ) {
        return null;
      }
      return days * 86400 + hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts.map(Number);
      if (minutes === undefined || seconds === undefined || isNaN(minutes) || isNaN(seconds)) {
        return null;
      }
      return days * 86400 + minutes * 60 + seconds;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely parse a string to an integer.
 *
 * @param value - String to parse
 * @returns Integer value, or null if parsing fails
 */
export function parseIntSafe(value: string | undefined | null): number | null {
  if (!value) {
    return null;
  }
  const cleaned = value.trim().replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Safely parse a string to a float.
 *
 * @param value - String to parse
 * @returns Float value, or null if parsing fails
 */
export function parseFloatSafe(value: string | undefined | null): number | null {
  if (!value) {
    return null;
  }
  const cleaned = value.trim().replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Clean an item string by removing inventory markers.
 *
 * @param itemStr - Raw item string from morgue file
 * @returns Cleaned item name without (worn), (weapon), etc.
 *
 * @example
 * cleanItemName("a - the +3 Elemental Staff (weapon) {ele, rElec}")
 * // "+3 Elemental Staff {ele, rElec}"
 */
export function cleanItemName(itemStr: string): string {
  let result = itemStr;

  // Remove common markers
  result = result.replace(/\s*\(worn\)/g, '');
  result = result.replace(/\s*\(weapon\)/g, '');
  result = result.replace(/\s*\(left hand\)/g, '');
  result = result.replace(/\s*\(right hand\)/g, '');
  result = result.replace(/\s*\(around neck\)/g, '');
  result = result.replace(/\s*\(quivered\)/g, '');

  // Remove inventory letter prefix (e.g., "a - ")
  result = result.replace(/^[a-zA-Z]\s+-\s+/, '');

  // Remove "the " or "a " or "an " prefix (after removing inventory letter)
  result = result.replace(/^(the|an?)\s+/i, '');

  return result.trim();
}

/**
 * Spell school abbreviation to full name mapping.
 */
const SCHOOL_MAP: Record<string, string> = {
  Conj: 'Conjurations',
  Hex: 'Hexes',
  Summ: 'Summonings',
  Necr: 'Necromancy',
  Tloc: 'Translocations',
  Trmt: 'Transmutations',
  Tmut: 'Transmutations',
  Fire: 'Fire',
  Ice: 'Ice',
  Air: 'Air',
  Erth: 'Earth',
  Alch: 'Alchemy',
  Pois: 'Poison',
  Frge: 'Forgecraft', // Added in 0.33
  Ench: 'Enchantments', // Older versions
  Chrm: 'Charms', // Older versions
};

/**
 * Expand spell school abbreviations to full names.
 *
 * @param abbrev - Abbreviated school name (e.g., "Conj", "Erth")
 * @returns Full school name
 */
export function expandSchoolAbbreviation(abbrev: string): string {
  return SCHOOL_MAP[abbrev] ?? abbrev;
}

/**
 * Find a section of the morgue file between markers.
 *
 * @param content - Full morgue file content
 * @param startMarker - String that marks the start of the section
 * @param endMarkers - List of strings that could mark the end (uses first found)
 * @returns Section content, or null if not found
 */
export function findSection(
  content: string,
  startMarker: string,
  endMarkers?: string[]
): string | null {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    return null;
  }

  if (!endMarkers || endMarkers.length === 0) {
    return content.slice(startIdx);
  }

  // Find the earliest end marker after start
  let endIdx = content.length;
  for (const marker of endMarkers) {
    const idx = content.indexOf(marker, startIdx + startMarker.length);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  return content.slice(startIdx, endIdx);
}

/**
 * Find the Notes section in the morgue file.
 *
 * @param content - Full morgue file content
 * @returns The Notes section text, or null if not found
 */
export function findNotesSection(content: string): string | null {
  const notesMatch = /^Notes:?$/m.exec(content);
  if (!notesMatch) {
    return null;
  }

  const start = notesMatch.index;

  // Find end - next major section
  const endMarkers = ['\nVanquished Creatures', '\nAction', '\nSkill', '\n\n\n'];

  let end = content.length;
  for (const marker of endMarkers) {
    const idx = content.indexOf(marker, start);
    if (idx !== -1 && idx < end) {
      end = idx;
    }
  }

  return content.slice(start, end);
}

/**
 * Count piety stars from a string like "[******]".
 *
 * @param pietyStr - Piety string with asterisks
 * @returns Number of stars (0-6), or null if not found
 */
export function countPietyStars(pietyStr: string | undefined | null): number | null {
  if (!pietyStr) {
    return null;
  }
  const match = /\[([*]+)\]/.exec(pietyStr);
  if (match?.[1]) {
    return match[1].length;
  }
  return null;
}

// Re-export god utilities from centralized package
export { GODS_BY_NAME as KNOWN_GODS, cleanGodName } from 'dcss-game-data';

// Re-export branch utilities from centralized package
export { BRANCH_ALIASES, getCanonicalBranchName } from 'dcss-game-data';

// Re-export species/race utilities from centralized package
export { KNOWN_SPECIES_NAMES as KNOWN_RACES, parseRaceBackground } from 'dcss-game-data';

