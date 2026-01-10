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
   */
  version: /Dungeon Crawl Stone Soup version ([^\s]+)\s*(?:\((\w+)\))?\s*character file/,

  /**
   * Game seed: "Game seed: 333194901430686732" or "Game seed: 123, levelgen mode: deterministic"
   */
  gameSeed: /Game seed:\s*(\d+)(?:,\s*levelgen mode:\s*(\w+))?/,

  /**
   * Score line: "12163156 Charly the Archmage (level 27, 258/258 HPs)"
   */
  scoreLine: /^\s*(\d+)\s+(\S+)\s+the\s+(.+?)\s+\(level\s+(\d+),\s*(-?\d+)\/(\d+)\s+HPs?\)/,

  /**
   * Began as: "Began as a Demigod Earth Elementalist on Apr 26, 2025."
   */
  beganAs: /Began as an?\s+(\S+)\s+(.+?)\s+on\s+(.+?)\./,

  /**
   * Was a (older format): "Was a Demigod Earth Elementalist."
   */
  wasA: /Was an?\s+(\S+)\s+(.+?)\./,

  /**
   * Escaped with runes: "... and 15 runes on Apr 28, 2025!"
   */
  escapedRunes: /and\s+(\d+)\s+runes?\s+on\s+(.+?)!/,

  /**
   * Game duration: "The game lasted 10:20:02 (133072 turns)."
   */
  gameDuration: /The game lasted\s+([\d:]+)\s+\((\d+)\s+turns?\)/,

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
  statsHpOld: /HP\s+(-?\d+)\/(\d+)/,
  statsMpOld: /MP\s+(\d+)\/(\d+)/,

  /**
   * Runes line: "}: 15/15 runes: decaying, serpentine, slimy, ..."
   */
  runes: /\}:\s*(\d+)\/(\d+)\s+runes?:\s*(.+)/,

  /**
   * Gems line: "$: 3/3 gems: glittering amethyst, ..."
   */
  gems: /\$:\s*(\d+)\/(\d+)\s+gems?:\s*(.+)/,

  /**
   * Branch visits summary: "You visited 17 branches of the dungeon, and saw 87 of its levels."
   */
  branchesVisited: /You visited\s+(\d+)\s+branches?.+?saw\s+(\d+)\s+of its levels/,

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

  const parts = durationStr.split(':');
  try {
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
      return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts.map(Number);
      if (minutes === undefined || seconds === undefined || isNaN(minutes) || isNaN(seconds)) {
        return null;
      }
      return minutes * 60 + seconds;
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

/**
 * Known DCSS god names (for proper extraction).
 * Using lowercase for case-insensitive matching.
 */
export const KNOWN_GODS = new Map([
  ['ashenzari', 'Ashenzari'],
  ['beogh', 'Beogh'],
  ['cheibriados', 'Cheibriados'],
  ['dithmenos', 'Dithmenos'],
  ['elyvilon', 'Elyvilon'],
  ['fedhas', 'Fedhas'],
  ['gozag', 'Gozag'],
  ['hepliaklqana', 'Hepliaklqana'],
  ['ignis', 'Ignis'],
  ['jiyva', 'Jiyva'],
  ['kikubaaqudgha', 'Kikubaaqudgha'],
  ['lugonu', 'Lugonu'],
  ['makhleb', 'Makhleb'],
  ['nemelex xobeh', 'Nemelex Xobeh'],
  ['okawaru', 'Okawaru'],
  ['pakellas', 'Pakellas'],
  ['qazlal', 'Qazlal'],
  ['ru', 'Ru'],
  ['sif muna', 'Sif Muna'],
  ['the shining one', 'the Shining One'],
  ['shining one', 'the Shining One'],
  ['trog', 'Trog'],
  ['uskayaw', 'Uskayaw'],
  ['vehumet', 'Vehumet'],
  ['wu jian', 'Wu Jian'],
  ['the wu jian council', 'Wu Jian'],
  ['wu jian council', 'Wu Jian'],
  ['xom', 'Xom'],
  ['yredelemnul', 'Yredelemnul'],
  ['zin', 'Zin'],
]);

/**
 * God title prefixes that appear before the god name.
 * e.g., "Warmaster Okawaru" -> title is "Warmaster"
 */
const GOD_TITLE_PREFIXES = new Set([
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
 * Clean a god name by removing epithets/titles.
 *
 * Handles:
 * - Titles before god name: "Warmaster Okawaru" -> "Okawaru"
 * - Epithets after god name: "Makhleb the Destroyer" -> "Makhleb"
 * - Multi-word god names: "Sif Muna", "The Shining One", "Wu Jian Council"
 *
 * @param godStr - Raw god name string (may include epithet/title)
 * @returns Clean canonical god name
 */
export function cleanGodName(godStr: string): string {
  if (!godStr) {
    return godStr;
  }

  const lowerStr = godStr.toLowerCase().trim();

  // First, check if any known god name appears anywhere in the string
  // Sort by length descending to match longer names first (e.g., "Nemelex Xobeh" before "Xobeh")
  const sortedGods = Array.from(KNOWN_GODS.entries()).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [lowerGod, canonicalGod] of sortedGods) {
    if (lowerStr.includes(lowerGod)) {
      return canonicalGod;
    }
  }

  // If no known god found, try to extract by removing known title prefixes
  for (const prefix of GOD_TITLE_PREFIXES) {
    if (lowerStr.startsWith(prefix + ' ')) {
      const remainder = godStr.slice(prefix.length).trim();
      if (remainder) {
        // Recursively clean in case there are multiple prefixes
        return cleanGodName(remainder);
      }
    }
  }

  // Fallback: remove "the <epithet>" suffix
  // Pattern: "Makhleb the Destroyer" -> "Makhleb"
  const parts = godStr.split(' the ');
  if (parts.length > 1 && parts[0]) {
    return parts[0].trim();
  }

  // If nothing matched, return as-is
  return godStr.trim();
}

/**
 * Branch name aliases mapping short/display names to canonical names.
 */
export const BRANCH_ALIASES: Record<string, string> = {
  Dungeon: 'Dungeon',
  D: 'Dungeon',
  Temple: 'Temple',
  Orc: 'Orcish Mines',
  Elf: 'Elven Halls',
  Lair: 'Lair',
  Swamp: 'Swamp',
  Snake: 'Snake Pit',
  Shoals: 'Shoals',
  Spider: 'Spider Nest',
  Slime: 'Slime Pits',
  Vaults: 'Vaults',
  Vault: 'Vaults', // Older format
  Crypt: 'Crypt',
  Tomb: 'Tomb',
  Depths: 'Depths',
  Zot: 'Zot',
  Abyss: 'Abyss',
  Pan: 'Pandemonium',
  Pandemonium: 'Pandemonium',
  Hell: 'Hell',
  Dis: 'Dis',
  Geh: 'Gehenna',
  Gehenna: 'Gehenna',
  Coc: 'Cocytus',
  Cocytus: 'Cocytus',
  Tar: 'Tartarus',
  Tartarus: 'Tartarus',
  Zig: 'Ziggurat',
  Ziggurat: 'Ziggurat',
  Bazaar: 'Bazaar',
  Trove: 'Trove',
  Sewer: 'Sewer',
  Ossuary: 'Ossuary',
  Bailey: 'Bailey',
  IceCv: 'Ice Cave',
  'Ice Cave': 'Ice Cave',
  Volcano: 'Volcano',
  WizLab: 'Wizard Laboratory',
  Gauntlet: 'Gauntlet',
  Arena: 'Arena',
  Desolation: 'Desolation',
  Lab: 'Labyrinth',
  Labyrinth: 'Labyrinth',
  Hive: 'Hive', // Removed branch
  Blade: 'Hall of Blades', // Removed branch
};

/**
 * Get canonical branch name from an alias or short name.
 *
 * @param name - Branch name or alias
 * @returns Canonical branch name
 */
export function getCanonicalBranchName(name: string): string {
  return BRANCH_ALIASES[name] ?? name;
}

