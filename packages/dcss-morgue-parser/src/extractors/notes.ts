/**
 * Notes extractor for DCSS morgue files.
 *
 * Extracts XP level progression and skill progression from the Notes section.
 *
 * Note format:
 *      0 | D:1      | Reached XP level 1. HP: 14/14 MP: 5/5
 *    452 | D:1      | Reached XP level 2. HP: 23/23 MP: 5/7
 *   2235 | D:3      | Reached XP level 3. HP: 29/29 MP: 5/8
 *   2448 | D:4      | Reached skill level 5 in Fighting
 */

import type { SkillProgression, XpProgression } from '../types.js';
import { PATTERNS, parseIntSafe, findNotesSection } from '../utils.js';

/**
 * A skill level event extracted from notes.
 */
export interface SkillLevelEvent {
  /** Turn when this skill level was reached */
  turn: number;
  /** Skill name */
  skill: string;
  /** Skill level reached */
  level: number;
}

export interface NotesData {
  xpProgression: Record<string, XpProgression>;
  /** Skill level events from notes (for building skillsByXl) */
  skillLevelEvents: SkillLevelEvent[];
}

/**
 * Extract XP progression and other notable events from Notes section.
 *
 * @param content - Full morgue file content as a string
 * @returns Object with xp_progression mapping XL to {turn, location}, and skill level events
 */
export function extractNotes(content: string): NotesData {
  const result: NotesData = {
    xpProgression: {},
    skillLevelEvents: [],
  };

  // Find Notes section
  const notesSection = findNotesSection(content);
  if (!notesSection) {
    return result;
  }

  // Parse notes to extract both XP and skill progression
  const { xpProgression, skillLevelEvents } = parseNotesSection(notesSection);
  result.xpProgression = xpProgression;
  result.skillLevelEvents = skillLevelEvents;

  return result;
}

interface ParsedNotes {
  xpProgression: Record<string, XpProgression>;
  skillLevelEvents: SkillLevelEvent[];
}

/**
 * Parse the notes section to extract XP level progression and skill level events.
 *
 * @returns Object with xpProgression and skillLevelEvents
 */
function parseNotesSection(notesSection: string): ParsedNotes {
  const xpProgression: Record<string, XpProgression> = {};
  const skillLevelEvents: SkillLevelEvent[] = [];

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

    if (turn === null) {
      continue;
    }

    // Check for XP level reached
    const xpMatch = PATTERNS.xpReached.exec(message);
    if (xpMatch?.[1]) {
      const xl = xpMatch[1];
      xpProgression[xl] = {
        turn,
        location,
      };
      continue;
    }

    // Check for skill level reached: "Reached skill level 5 in Fighting"
    const skillMatch = PATTERNS.skillReached.exec(message);
    if (skillMatch) {
      const level = parseIntSafe(skillMatch[1]);
      const skill = skillMatch[2]?.trim();
      if (level !== null && skill) {
        skillLevelEvents.push({
          turn,
          skill,
          level,
        });
      }
    }
  }

  return { xpProgression, skillLevelEvents };
}

/**
 * Build skillsByXl from skill level events and XP progression.
 *
 * For each skill level event, determines which XL the player was at during that turn,
 * and records the skill level at that XL.
 *
 * @param skillLevelEvents - Array of skill level events from notes
 * @param xpProgression - XP progression mapping XL to turn
 * @returns Object mapping skill name to XL -> skill level
 */
export function buildSkillsByXlFromNotes(
  skillLevelEvents: SkillLevelEvent[],
  xpProgression: Record<string, XpProgression>
): Record<string, SkillProgression> | null {
  if (skillLevelEvents.length === 0) {
    return null;
  }

  // Build a sorted list of (turn, xl) pairs for lookup
  const xlByTurn: Array<{ turn: number; xl: number }> = [];
  for (const [xlStr, { turn }] of Object.entries(xpProgression)) {
    const xl = parseIntSafe(xlStr);
    if (xl !== null && turn !== null) {
      xlByTurn.push({ turn, xl });
    }
  }

  // Sort by turn ascending
  xlByTurn.sort((a, b) => a.turn - b.turn);

  if (xlByTurn.length === 0) {
    return null;
  }

  /**
   * Find the XL at a given turn using binary search.
   * Returns the highest XL whose turn is <= the target turn.
   */
  function getXlAtTurn(targetTurn: number): number {
    let left = 0;
    let right = xlByTurn.length - 1;
    let result = xlByTurn[0]?.xl ?? 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const entry = xlByTurn[mid];
      if (!entry) break;

      if (entry.turn <= targetTurn) {
        result = entry.xl;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  const skillsByXl: Record<string, SkillProgression> = {};

  for (const event of skillLevelEvents) {
    const xl = getXlAtTurn(event.turn);

    let skillProgress = skillsByXl[event.skill];
    if (!skillProgress) {
      skillProgress = {};
      skillsByXl[event.skill] = skillProgress;
    }

    // Record the skill level at this XL
    // If multiple skill level events happen at the same XL, keep the highest
    const currentLevel = skillProgress[String(xl)];
    if (currentLevel === undefined || event.level > currentLevel) {
      skillProgress[String(xl)] = event.level;
    }
  }

  return Object.keys(skillsByXl).length > 0 ? skillsByXl : null;
}

