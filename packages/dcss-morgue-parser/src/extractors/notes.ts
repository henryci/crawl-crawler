/**
 * Notes extractor for DCSS morgue files.
 *
 * Extracts XP level progression from the Notes section.
 *
 * Note format:
 *      0 | D:1      | Reached XP level 1. HP: 14/14 MP: 5/5
 *    452 | D:1      | Reached XP level 2. HP: 23/23 MP: 5/7
 *   2235 | D:3      | Reached XP level 3. HP: 29/29 MP: 5/8
 */

import type { XpProgression } from '../types.js';
import { PATTERNS, parseIntSafe, findNotesSection } from '../utils.js';

export interface NotesData {
  xpProgression: Record<string, XpProgression>;
}

/**
 * Extract XP progression and other notable events from Notes section.
 *
 * @param content - Full morgue file content as a string
 * @returns Object with xp_progression mapping XL to {turn, location}
 */
export function extractNotes(content: string): NotesData {
  const result: NotesData = {
    xpProgression: {},
  };

  // Find Notes section
  const notesSection = findNotesSection(content);
  if (!notesSection) {
    return result;
  }

  // Parse XP level progression
  result.xpProgression = extractXpProgression(notesSection);

  return result;
}

/**
 * Extract XP level progression from notes.
 *
 * @returns Object mapping XL (as string) to {turn, location}
 */
function extractXpProgression(notesSection: string): Record<string, XpProgression> {
  const progression: Record<string, XpProgression> = {};

  const lines = notesSection.split('\n');

  for (const line of lines) {
    // Parse note line
    const noteMatch = PATTERNS.noteLine.exec(line);
    if (!noteMatch) {
      continue;
    }

    const turn = parseIntSafe(noteMatch[1]);
    const location = noteMatch[2]?.trim() ?? '';
    const message = noteMatch[3]?.trim() ?? '';

    // Check for XP level reached
    const xpMatch = PATTERNS.xpReached.exec(message);
    if (xpMatch?.[1]) {
      const xl = xpMatch[1];
      progression[xl] = {
        turn,
        location,
      };
    }
  }

  return progression;
}

