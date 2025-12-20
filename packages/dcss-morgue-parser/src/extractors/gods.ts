/**
 * Gods extractor for DCSS morgue files.
 *
 * Extracts god worship history from the Notes section.
 *
 * Note formats:
 *     5822 | Temple   | Became a worshipper of Makhleb the Destroyer
 *    15000 | D:10     | Fell from the grace of Makhleb
 *    20000 | Temple   | Became a worshipper of Trog
 *
 * Also checks the God line in stats for the final god.
 */

import type { GodRecord } from '../types.js';
import { PATTERNS, parseIntSafe, findNotesSection, cleanGodName } from '../utils.js';

/**
 * Background classes that start with a god.
 */
const BACKGROUND_STARTING_GODS: Record<string, string> = {
  Berserker: 'Trog',
  'Chaos Knight': 'Xom',
  'Abyssal Knight': 'Lugonu',
  'Cinder Acolyte': 'Ignis',
};

/**
 * Extract god worship history from the morgue file.
 *
 * Parses the Notes section for worship-related events.
 *
 * @param content - Full morgue file content as a string
 * @returns List of god worship records, or null if no gods worshipped.
 */
export function extractGods(content: string): GodRecord[] | null {
  const gods: GodRecord[] = [];

  // Find the Notes section
  const notesSection = findNotesSection(content);
  if (!notesSection) {
    return null;
  }

  // Check if character started with a god based on background
  const startingGod = detectStartingGod(content);

  // Parse notes for god-related events
  const lines = notesSection.split('\n');

  let currentGod: string | null = startingGod;
  let currentGodStartTurn: number | null = startingGod ? 0 : null;
  let currentGodStartLocation: string | null = startingGod ? 'D:1' : null;

  for (const line of lines) {
    // Parse note line: "  5822 | Temple   | Became a worshipper of..."
    const noteMatch = PATTERNS.noteLine.exec(line);
    if (!noteMatch) {
      continue;
    }

    const turn = parseIntSafe(noteMatch[1]);
    const location = noteMatch[2]?.trim() ?? null;
    const message = noteMatch[3]?.trim() ?? '';

    // Check for worship start
    const worshipMatch = PATTERNS.becameWorshipper.exec(message);
    if (worshipMatch) {
      // If we had a previous god, record when they ended
      if (currentGod) {
        gods.push({
          god: currentGod,
          startedTurn: currentGodStartTurn,
          startedLocation: currentGodStartLocation,
          endedTurn: turn,
        });
      }

      // Start tracking new god
      const godName = worshipMatch[1]?.trim() ?? '';
      // Clean up god name (remove epithets like "the Destroyer")
      currentGod = cleanGodName(godName);
      currentGodStartTurn = turn;
      currentGodStartLocation = location;
      continue;
    }

    // Check for falling from grace
    const fellMatch = PATTERNS.fellFromGrace.exec(message);
    if (fellMatch && currentGod) {
      gods.push({
        god: currentGod,
        startedTurn: currentGodStartTurn,
        startedLocation: currentGodStartLocation,
        endedTurn: turn,
      });
      currentGod = null;
      currentGodStartTurn = null;
      currentGodStartLocation = null;
      continue;
    }

    // Check for abandoning
    const abandonMatch = PATTERNS.abandoned.exec(message);
    if (abandonMatch && currentGod) {
      gods.push({
        god: currentGod,
        startedTurn: currentGodStartTurn,
        startedLocation: currentGodStartLocation,
        endedTurn: turn,
      });
      currentGod = null;
      currentGodStartTurn = null;
      currentGodStartLocation = null;
      continue;
    }

    // Check for "Became the Champion of..." or similar advancement
    const championMatch = /Became the Champion of\s+(\S+)/.exec(message);
    if (championMatch && !currentGod) {
      // Started worship without a "Became a worshipper" message
      const godName = championMatch[1] ?? '';
      currentGod = godName;
      currentGodStartTurn = turn;
      currentGodStartLocation = location;
    }

    // Check for piety notes that indicate starting god (e.g., "Reached ** piety under Trog")
    // This helps detect starting gods for backgrounds we might not know about
    const pietyMatch = /Reached \*+ piety under\s+(\S+)/.exec(message);
    if (pietyMatch && !currentGod && gods.length === 0) {
      const godName = pietyMatch[1] ?? '';
      currentGod = godName;
      currentGodStartTurn = 0;
      currentGodStartLocation = 'D:1';
    }
  }

  // If still worshipping a god at game end, add them
  if (currentGod) {
    gods.push({
      god: currentGod,
      startedTurn: currentGodStartTurn,
      startedLocation: currentGodStartLocation,
      endedTurn: null, // Still worshipping at game end
    });
  }

  return gods.length > 0 ? gods : null;
}

/**
 * Detect starting god based on background class.
 */
function detectStartingGod(content: string): string | null {
  // Look for "Began as a X Background" line
  const beganMatch = /Began as an?\s+\S+\s+(.+?)\s+on/.exec(content);
  if (beganMatch) {
    const background = beganMatch[1]?.trim();
    if (background && BACKGROUND_STARTING_GODS[background]) {
      return BACKGROUND_STARTING_GODS[background];
    }
  }
  return null;
}

