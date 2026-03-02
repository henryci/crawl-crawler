/**
 * Header extractor for DCSS morgue files.
 *
 * Extracts information from the header section (first ~30 lines):
 * - Version and platform info
 * - Game seed
 * - Score and player info
 * - Game duration and dates
 * - Runes and gems collected
 * - Branch visit summary
 */

import { PATTERNS, durationToSeconds, parseIntSafe, parseRaceBackground } from '../utils.js';

export interface HeaderData {
  version: string | null;
  isWebtiles: boolean | null;
  gameSeed: string | null;
  score: number | null;
  playerName: string | null;
  title: string | null;
  race: string | null;
  background: string | null;
  characterLevel: number | null;
  startDate: string | null;
  endDate: string | null;
  gameDuration: string | null;
  gameDurationSeconds: number | null;
  totalTurns: number | null;
  runesCollected: number | null;
  runesList: string[] | null;
  gemsCollected: number | null;
  gemsList: string[] | null;
  branchesVisitedCount: number | null;
  levelsSeenCount: number | null;
  /** Whether the game was a win (escaped with the Orb) */
  isWin: boolean | null;
}

/**
 * Extract header information from a morgue file.
 *
 * The header contains version info, player details, score, dates,
 * and game summary statistics.
 *
 * @param content - Full morgue file content as a string
 * @returns Object with extracted header fields. Missing fields are null.
 *
 * @remarks
 * Version Notes:
 * - Game seed: Added around version 0.19
 * - Gems: Added in version 0.32+
 */
export function extractHeader(content: string): HeaderData {
  const result: HeaderData = {
    version: null,
    isWebtiles: null,
    gameSeed: null,
    score: null,
    playerName: null,
    title: null,
    race: null,
    background: null,
    characterLevel: null,
    startDate: null,
    endDate: null,
    gameDuration: null,
    gameDurationSeconds: null,
    totalTurns: null,
    runesCollected: null,
    runesList: null,
    gemsCollected: null,
    gemsList: null,
    branchesVisitedCount: null,
    levelsSeenCount: null,
    isWin: null,
  };

  const lines = content.split('\n');

  // Extract version and platform from first few lines
  extractVersionInfo(lines, result);

  // Extract game seed (may not be present in older versions)
  extractGameSeed(lines, result);

  // Extract score and player info
  extractScoreAndPlayer(lines, result);

  // Extract dates and began as info
  extractDatesAndBackground(lines, result);

  // Extract win status from header
  extractWinStatus(lines, result);

  // Extract game duration
  extractDuration(content, result);

  // Extract runes
  extractRunes(content, result);

  // Extract gems (0.32+ only)
  extractGems(content, result);

  // Extract branch visit summary
  extractBranchSummary(content, result);

  // When endDate is missing but startDate is present, the game ended on the same
  // calendar day it started (DCSS omits the date when it would match startDate).
  if (!result.endDate && result.startDate) {
    result.endDate = result.startDate;
  }

  return result;
}

/**
 * Extract version and platform from the first few lines.
 */
function extractVersionInfo(lines: string[], result: HeaderData): void {
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;

    const match = PATTERNS.version.exec(line);
    if (match) {
      result.version = match[1] ?? null;
      const platform = match[2];
      if (platform) {
        result.isWebtiles = platform.toLowerCase() === 'webtiles';
      } else {
        result.isWebtiles = false;
      }
      return;
    }
  }
}

/**
 * Extract game seed from early lines (0.19+).
 */
function extractGameSeed(lines: string[], result: HeaderData): void {
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;

    const match = PATTERNS.gameSeed.exec(line);
    if (match) {
      result.gameSeed = match[1] ?? null;
      return;
    }
  }
}

/**
 * Extract score, player name, title, and character level.
 *
 * Format: "12163156 Charly the Archmage (level 27, 258/258 HPs)"
 */
function extractScoreAndPlayer(lines: string[], result: HeaderData): void {
  for (let i = 0; i < Math.min(40, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;

    const match = PATTERNS.scoreLine.exec(line);
    if (match) {
      result.score = parseIntSafe(match[1]);
      result.playerName = match[2] ?? null;
      result.title = match[3] ?? null;
      result.characterLevel = parseIntSafe(match[4]);
      return;
    }
  }

  // Fallback for very old format (0.2.x) where player name and level are on separate lines
  // Format: "dpeg the Annihilator" followed later by "Level      :      27"
  extractOldFormatPlayerAndLevel(lines, result);
}

/**
 * Extract player info from very old morgue format (0.2.x).
 *
 * Old format has:
 * - Player name on a line like "dpeg the Annihilator"
 * - Level on a line like "Level      :      27"
 * - Race on a line like "Race       : Grey Elf"
 * - Class on a line like "Class      : Air Elementalist"
 */
function extractOldFormatPlayerAndLevel(lines: string[], result: HeaderData): void {
  // Look for "Level      :      XX" pattern
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;

    const levelMatch = /^Level\s*:\s*(\d+)/i.exec(line);
    if (levelMatch) {
      result.characterLevel = parseIntSafe(levelMatch[1]);
    }

    // Also try to extract race and background (class) from old format
    const raceMatch = /^Race\s*:\s*(.+?)(?:\s{2,}|$)/i.exec(line);
    if (raceMatch && !result.race) {
      result.race = raceMatch[1]?.trim() ?? null;
    }

    const classMatch = /^Class\s*:\s*(.+?)(?:\s{2,}|$)/i.exec(line);
    if (classMatch && !result.background) {
      result.background = classMatch[1]?.trim() ?? null;
    }

    // Extract player name from "Name the Title" pattern (line 3 usually in old format)
    // Must come after version line and be in format "name the title"
    if (i >= 2 && i < 5 && !result.playerName) {
      const nameMatch = /^(\S+)\s+the\s+(.+?)\s*$/.exec(line.trim());
      if (nameMatch) {
        result.playerName = nameMatch[1] ?? null;
        result.title = nameMatch[2] ?? null;
      }
    }
  }
}

/**
 * Extract race, background, start date, end date from header.
 *
 * Formats:
 * - "Began as a Demigod Earth Elementalist on Apr 26, 2025."
 * - "... and 15 runes on Apr 28, 2025!"
 * - "Was a Demigod Earth Elementalist." (older format)
 */
function extractDatesAndBackground(lines: string[], result: HeaderData): void {
  for (let i = 0; i < Math.min(40, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;

    // Look for "Began as" line (primary source for race/background in modern morgues)
    const beganMatch = PATTERNS.beganAs.exec(line);
    if (beganMatch) {
      const raceBackground = beganMatch[1]?.trim() ?? '';
      const parsed = parseRaceBackground(raceBackground);
      result.race = parsed.race;
      result.background = parsed.background;
      result.startDate = beganMatch[2] ?? null;
      continue;
    }

    // Look for "Was a" line (older format without date)
    const wasMatch = PATTERNS.wasA.exec(line);
    if (wasMatch && !result.race) {
      const raceBackground = wasMatch[1]?.trim() ?? '';
      const parsed = parseRaceBackground(raceBackground);
      result.race = parsed.race;
      result.background = parsed.background;
    }

    // Look for runes and end date
    const runesMatch = PATTERNS.escapedRunes.exec(line);
    if (runesMatch) {
      result.runesCollected = parseIntSafe(runesMatch[1]);
      result.endDate = runesMatch[2] ?? null;
      continue;
    }

    // Look for death date or other end conditions
    // "... on Apr 28, 2025." at end of line
    const endDateMatch = /on\s+(\w+\s+\d+,\s+\d+)[.!]?\s*$/.exec(line);
    if (endDateMatch && !result.endDate) {
      // Only use if it's not the start date line
      if (!line.includes('Began as')) {
        result.endDate = endDateMatch[1] ?? null;
      }
    }
  }
}

/**
 * Extract win status from the header.
 *
 * A win is indicated by "Escaped with the Orb" in the header section.
 * Deaths have various messages like "Slain by...", "Killed by...", etc.
 * If neither is found, isWin remains null.
 */
function extractWinStatus(lines: string[], result: HeaderData): void {
  for (let i = 0; i < Math.min(40, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;

    // Definitive win: "Escaped with the Orb" in the header summary
    if (/Escaped with the Orb/i.test(line)) {
      result.isWin = true;
      return;
    }

    // Non-win escape: player left the dungeon without the Orb (v0.14+)
    if (/Got out of the dungeon alive/i.test(line)) {
      result.isWin = false;
      return;
    }
  }

  // If we found score/player info but no escape message, it's a death
  if (result.score !== null) {
    result.isWin = false;
  }

  // Fallback for very old format (v0.1-v0.2) where score is absent and
  // there's no "Escaped with the Orb" line — "You escaped." is the win indicator
  if (result.isWin === null) {
    for (let i = 0; i < Math.min(40, lines.length); i++) {
      const line = lines[i];
      if (!line) continue;
      if (/^You escaped[.!]?\s*$/i.test(line)) {
        result.isWin = true;
        return;
      }
      if (/^(?:Slain by|Killed by|Mangled by|Annihilated by|Blown up by)/i.test(line.trim())) {
        result.isWin = false;
        return;
      }
      if (/^You (?:are|were) on level\s+\d+/i.test(line.trim())) {
        result.isWin = false;
        return;
      }
    }
  }
}

/**
 * Extract game duration and total turns.
 *
 * Handles two formats:
 * - Modern: "The game lasted 10:20:02 (133072 turns)." (including multi-day variants)
 * - Old (v0.1-v0.2): "Play time  :   19:17:38" and "Turns      :     155150"
 */
function extractDuration(content: string, result: HeaderData): void {
  const match = PATTERNS.gameDuration.exec(content);
  if (match) {
    result.gameDuration = match[1] ?? null;
    result.gameDurationSeconds = match[1] ? durationToSeconds(match[1]) : null;
    result.totalTurns = parseIntSafe(match[2]);
    return;
  }

  // Fallback for old format (v0.1-v0.2)
  const playTimeMatch = /^Play time\s*:\s*(.+)/m.exec(content);
  if (playTimeMatch) {
    const raw = playTimeMatch[1]?.trim();
    if (raw) {
      const durationOnly = raw.split(/\s{2,}/)[0]?.trim();
      if (durationOnly) {
        result.gameDuration = durationOnly;
        result.gameDurationSeconds = durationToSeconds(durationOnly);
      }
    }
  }
  const turnsMatch = /^Turns\s{2,}:\s*(\d+)/m.exec(content);
  if (turnsMatch) {
    result.totalTurns = parseIntSafe(turnsMatch[1]);
  }
}

/**
 * Extract rune information from the runes line.
 *
 * Formats:
 * - Modern: "}: 15/15 runes: decaying, serpentine, slimy, ..."
 * - Older: "... and 15 runes (of 15 types) on Apr 26, 2010!"
 *
 * May span multiple lines. Continuation lines contain just rune names.
 */
function extractRunes(content: string, result: HeaderData): void {
  // Try modern format first: "}: 15/15 runes: ..."
  const match = PATTERNS.runes.exec(content);
  if (match) {
    result.runesCollected = parseIntSafe(match[1]);

    // Get lines starting from the runes line (use match index, not a fixed prefix)
    const lines = content.slice(match.index).split('\n');
    const runesLines: string[] = [];

    if (lines[0]) {
      runesLines.push(lines[0]); // First line always included
    }

    // Check for continuation lines
    // Continuation lines contain comma-separated lowercase words (rune names)
    const runeContinuationPattern = /^[a-z, ]+$/;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const stripped = line.trim();

      // Stop at blank line
      if (!stripped) {
        break;
      }

      // Stop at section markers
      if (
        stripped.startsWith('$:') ||
        stripped.startsWith('You ') ||
        stripped.startsWith('Dungeon') ||
        stripped.startsWith('Action') ||
        stripped.startsWith('Notes') ||
        stripped.startsWith('Health') ||
        stripped.startsWith('HP ')
      ) {
        break;
      }

      // Check if this looks like a rune continuation (lowercase words with commas)
      if (runeContinuationPattern.test(stripped)) {
        runesLines.push(line);
      } else if (line[0] === ' ' || line[0] === '\t') {
        // Also accept indented continuation lines
        if (stripped) {
          runesLines.push(line);
        }
      } else {
        break;
      }
    }

    // Join all rune lines and extract rune names
    const fullRunesText = runesLines.join(' ');
    const runesMatchFull = /runes?:\s*(.+)/.exec(fullRunesText);
    if (runesMatchFull?.[1]) {
      const runesText = runesMatchFull[1].replace(/\s+/g, ' ');
      const runesList = runesText
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);
      result.runesList = runesList;
    }
    return;
  }

  // Try older format: "... and 15 runes (of 15 types) on ..."
  const olderMatch = /and\s+(\d+)\s+runes?\s*\(of\s+(\d+)\s+types?\)/i.exec(content);
  if (olderMatch) {
    result.runesCollected = parseIntSafe(olderMatch[1]);
    // Runes list will be extracted from Inventory section in older format
    // Look for "rune of Zot" items in inventory
    extractRunesFromInventory(content, result);
    return;
  }

  // Also check for just the "and X runes on" format without (of Y types)
  const simpleMatch = /and\s+(\d+)\s+runes?\s+on/i.exec(content);
  if (simpleMatch && !result.runesCollected) {
    result.runesCollected = parseIntSafe(simpleMatch[1]);
    extractRunesFromInventory(content, result);
    return;
  }

  // Fallback: v0.2.x files have no rune summary line —
  // runes only appear as inventory items ("A - an iron rune of Zot")
  extractRunesFromInventory(content, result);

  // Final fallback: v0.5-v0.8 files may not list runes in inventory either —
  // extract from Notes entries ("Got a serpentine rune of Zot")
  if (!result.runesList) {
    extractRunesFromNotes(content, result);
  }
}

/**
 * Extract rune names from the inventory section (for older morgue formats).
 *
 * Only searches within the Inventory section to avoid matching runes
 * mentioned elsewhere (e.g., Message History, Notes).
 */
function extractRunesFromInventory(content: string, result: HeaderData): void {
  if (result.runesList) {
    return;
  }

  const inventorySection = findInventorySection(content);
  if (!inventorySection) {
    return;
  }

  // Matches "a - an iron rune of Zot" and "D - 2 demonic runes of Zot"
  const runePattern = /[a-zA-Z] - (?:(?:an?|\d+) )?(\w+) runes? of Zot/g;
  const runes: string[] = [];

  let runeMatch;
  while ((runeMatch = runePattern.exec(inventorySection)) !== null) {
    if (runeMatch[1]) {
      runes.push(runeMatch[1]);
    }
  }

  if (runes.length > 0) {
    result.runesList = runes;
    if (!result.runesCollected) {
      result.runesCollected = runes.length;
    }
  }
}

/**
 * Extract rune names from Notes entries (for v0.5-v0.8 morgue formats
 * where runes don't appear in the inventory or rune summary line).
 *
 * Matches "Got a serpentine rune of Zot" / "Got an abyssal rune of Zot".
 */
function extractRunesFromNotes(content: string, result: HeaderData): void {
  const runePattern = /Got (?:a|an) (\w+) rune of Zot/g;
  const runes: string[] = [];

  let match;
  while ((match = runePattern.exec(content)) !== null) {
    if (match[1] && !runes.includes(match[1])) {
      runes.push(match[1]);
    }
  }

  if (runes.length > 0) {
    result.runesList = runes;
    if (!result.runesCollected) {
      result.runesCollected = runes.length;
    }
  }
}

/**
 * Find the Inventory section in the morgue file.
 *
 * The Inventory section typically starts with "Inventory:" and ends
 * at the next major section (Skills, Spells, Notes, etc.).
 */
function findInventorySection(content: string): string | null {
  // Look for "Inventory:" header (may have leading whitespace in older formats)
  const inventoryMatch = /^\s*Inventory:?\s*$/m.exec(content);
  if (!inventoryMatch) {
    return null;
  }

  const start = inventoryMatch.index;

  // Find end - next major section
  // These are common section headers that come after Inventory
  const endMarkers = [
    '\nYou had ',          // "You had X experience left" or "You had X spell levels left"
    '\n   Skills:',        // Skills section
    '\nSkills:',           // Skills section (alternate format)
    '\nYou knew the following spells:', // Spells section
    '\nYour Spells',       // Spells section (alternate format)
    '\nDungeon Overview',  // Dungeon overview section
    '\nNotes',             // Notes section
    '\nAction',            // Action counts section
    '\nMessage History',   // Message history section
  ];

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
 * Extract gem information (0.32+ only).
 *
 * Formats:
 * - Modern: "$: 3/3 gems: glittering amethyst, scintillating tourmaline, ..."
 * - Header: "... and 1 gem on Jan 10, 2026!"
 */
function extractGems(content: string, result: HeaderData): void {
  // Try modern format first: "$: X/Y gems: ..."
  const match = PATTERNS.gems.exec(content);
  if (match) {
    result.gemsCollected = parseIntSafe(match[1]);
    const gemsText = match[3];
    if (gemsText) {
      const cleanedText = gemsText.replace(/\s+/g, ' ');
      const gemsList = cleanedText
        .split(',')
        .map((g) => g.trim())
        .filter((g) => g.length > 0);
      result.gemsList = gemsList;
    }
    return;
  }

  // Try header format: "... and X gem(s) on DATE!"
  const headerGemMatch = /\.\.\.\s+and\s+(\d+)\s+gems?\s+on\s+(.+?)!/i.exec(content);
  if (headerGemMatch) {
    result.gemsCollected = parseIntSafe(headerGemMatch[1]);
    // Extract gem names from Notes section
    extractGemsFromNotes(content, result);
  }
}

/**
 * Extract gem names from the Notes section.
 *
 * Format: "115442 | Slime:5  | Got a starry gem with 179 turns to spare"
 */
function extractGemsFromNotes(content: string, result: HeaderData): void {
  // Look for "Got a X gem" entries in the Notes section
  const gemPattern = /Got (?:a |an )?(.+?)\s+gem(?:\s+with|\s*$)/gi;
  const gems: string[] = [];

  let gemMatch;
  while ((gemMatch = gemPattern.exec(content)) !== null) {
    if (gemMatch[1]) {
      // Clean up the gem name (e.g., "starry" -> "starry gem")
      const gemName = gemMatch[1].trim();
      if (gemName && !gems.includes(gemName)) {
        gems.push(gemName);
      }
    }
  }

  if (gems.length > 0) {
    result.gemsList = gems;
  }
}

/**
 * Extract branch visit summary.
 *
 * Format: "You visited 17 branches of the dungeon, and saw 87 of its levels."
 */
function extractBranchSummary(content: string, result: HeaderData): void {
  const match = PATTERNS.branchesVisited.exec(content);
  if (match) {
    result.branchesVisitedCount = parseIntSafe(match[1]);
    result.levelsSeenCount = parseIntSafe(match[2]);
  }
}

