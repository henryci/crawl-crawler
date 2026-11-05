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
import { PATTERNS, parseIntSafe, findNotesSection, cleanGodName, parseRaceBackground } from '../utils.js';

// Re-use the beganAs pattern from PATTERNS for consistency
const BEGAN_AS_PATTERN = PATTERNS.beganAs;

/**
 * Background classes that start with a god.
 * Includes both current and removed backgrounds for historical morgue support.
 */
const BACKGROUND_STARTING_GODS: Record<string, string> = {
  // Current backgrounds
  Berserker: 'Trog',
  'Chaos Knight': 'Xom',
  'Abyssal Knight': 'Lugonu',
  'Cinder Acolyte': 'Ignis',
  // Removed backgrounds (for historical morgues)
  Healer: 'Elyvilon', // Removed in 0.14
  Priest: 'Zin', // Removed in 0.8
  Paladin: 'the Shining One', // Removed in 0.8
  'Death Knight': 'Yredelemnul', // Removed in 0.8
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

  // Check if character started with a god based on background
  const startingGod = detectStartingGod(content);
  const currentGodFromHeader = detectCurrentGod(content);
  const explicitlyGodless = currentGodFromHeader === '';

  let currentGod: string | null = startingGod;
  let currentGodStartTurn: number | null = startingGod ? 0 : null;
  let currentGodStartLocation: string | null = startingGod ? 'D:1' : null;

  // Parse notes for god-related events
  const notesSection = findNotesSection(content);
  if (notesSection) {
    const lines = notesSection.split('\n');
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
        const godName = cleanGodName(worshipMatch[1]?.trim() ?? '');

        // Newer morgues note "Reached * piety under X" just before
        // "Became a worshipper of X" on the same turn. The piety note
        // already started tracking X as an inferred starting god (turn 0);
        // this is the real start, so correct it rather than recording a
        // phantom turn-0 worship of the same god.
        if (currentGod === godName && gods.length === 0 && currentGodStartTurn === 0 && !startingGod) {
          currentGodStartTurn = turn;
          currentGodStartLocation = location;
          continue;
        }

        // If we had a previous god, record when they ended
        if (currentGod) {
          gods.push({
            god: currentGod,
            startedTurn: currentGodStartTurn,
            startedLocation: currentGodStartLocation,
            endedTurn: turn,
          });
        }

        // Start tracking new god (cleanGodName drops epithets like "the Destroyer")
        currentGod = godName;
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
      const championMatch = /Became the Champion of\s+(.+)/.exec(message);
      if (championMatch && !currentGod) {
        // Started worship without a "Became a worshipper" message
        currentGod = cleanGodName(championMatch[1]?.trim() ?? '');
        currentGodStartTurn = turn;
        currentGodStartLocation = location;
      }

      // Check for piety notes that indicate starting god (e.g., "Reached ** piety under Trog")
      // This helps detect starting gods for backgrounds we might not know about
      const pietyMatch = /Reached \*+ piety under\s+(.+)/.exec(message);
      if (pietyMatch && !currentGod && gods.length === 0) {
        currentGod = cleanGodName(pietyMatch[1]?.trim() ?? '');
        currentGodStartTurn = 0;
        currentGodStartLocation = 'D:1';
      }
    }
  }

  if (!currentGod && currentGodFromHeader && currentGodFromHeader !== '') {
    currentGod = cleanGodName(currentGodFromHeader);
    currentGodStartTurn = 0;
    currentGodStartLocation = 'D:1';
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

  if (gods.length === 0 && explicitlyGodless) {
    return [];
  }

  return gods.length > 0 ? gods : null;
}

/**
 * Detect starting god based on background class.
 */
function detectStartingGod(content: string): string | null {
  // Look for "Began as a X Background" line - reuse pattern from utils
  const beganMatch = BEGAN_AS_PATTERN.exec(content);
  if (beganMatch) {
    const raceBackground = beganMatch[1]?.trim() ?? '';
    // Use parseRaceBackground to correctly split multi-word races like "Deep Dwarf"
    const parsed = parseRaceBackground(raceBackground);
    if (parsed.background) {
      const startingGod = BACKGROUND_STARTING_GODS[parsed.background];
      if (startingGod) {
        return startingGod;
      }
    }
  }
  return null;
}

function detectCurrentGod(content: string): string | null {
  const godLine = extractGodLine(content);
  if (godLine) {
    return godLine.god ?? '';
  }

  const youWorshipLine = /^You worship(?:ped)?\s+(.+?)\./mi.exec(content);
  if (youWorshipLine?.[1]) {
    const value = youWorshipLine[1].trim();
    if (!value || /^no god$/i.test(value)) {
      return '';
    }
    return cleanGodName(value);
  }

  return null;
}

export interface GodLineValue {
  /** Canonical god name, or null when the line says no god. */
  god: string | null;
  /** Number of filled piety stars (0-6), or null when no piety is shown. */
  piety: number | null;
}

/**
 * Find the character header's god line and parse it. Modern morgues print
 * it mid-line ("Magic: 43/43  EV: 14  Int: 6  God:    Lugonu [......]");
 * older ones start a line with it ("God       : Trog"), or use "Worship:". An empty value
 * ("God:" with nothing after it) means no god. Returns null when there is
 * no god line at all.
 */
export function extractGodLine(text: string): GodLineValue | null {
  const godLine = /\bGod[ \t]*:[ \t]*([^\n]*)/.exec(text) ?? /^Worship[ \t]*:[ \t]*([^\n]*)/m.exec(text);
  return godLine ? parseGodLineValue(godLine[1] ?? '') : null;
}

/**
 * Parse the value after "God:" in the character header, e.g.
 * "Sif Muna [***...]", "The Shining One ******", "No God", "Gozag".
 */
function parseGodLineValue(rawValue: string): GodLineValue {
  const value = sanitizeGodLineValue(rawValue);
  if (!value || /^no god$/i.test(value)) {
    return { god: null, piety: null };
  }
  return { god: cleanGodName(value), piety: parsePiety(rawValue) };
}

/** Piety as "[****..]" (filled stars, unfilled dots) or legacy bare "****" (sometimes glued to the name). */
function parsePiety(rawValue: string): number | null {
  const bracketed = /\[([*.]+)\]/.exec(rawValue);
  if (bracketed) return (bracketed[1]!.match(/\*/g) ?? []).length;
  const bare = /(\*+)(?=\s|$)/.exec(rawValue);
  return bare ? bare[1]!.length : null;
}

function sanitizeGodLineValue(rawValue: string): string {
  let value = rawValue.trim();
  // Remove piety markers: "[******]", "[***...]", or bare legacy "******".
  // Two spaces keep the column gap when stars are glued to a spilled
  // column ("The Shining****** Life Prot.: . . .").
  value = value.replace(/\[[*.]+\]/g, '  ').replace(/\*+/g, '  ').trim();
  // Old fixed-width morgues can spill into right-hand resistance columns,
  // even when the god column is empty ("Worship    :     Life Prot.: . . .").
  value = value.replace(/\s{2,}[A-Za-z][A-Za-z .'-]*\s*:\s*.*$/u, '');
  value = value.replace(
    /(?:^|\s+)(?:Life Prot\.?|Conserve|Res\.[A-Za-z]+|See Invis\.?|Warding|Acc\.)\s*:\s*.*$/iu,
    ''
  );
  value = value.replace(/[.,;:]+$/g, '').replace(/\s+/g, ' ').trim();

  // Legacy narrow-column rendering can truncate some multi-word god names.
  if (/^no$/i.test(value)) {
    return 'no god';
  }
  if (/^the$/i.test(value) || /^the shining$/i.test(value)) {
    return 'the Shining One';
  }
  if (/^sif$/i.test(value)) {
    return 'Sif Muna';
  }
  if (/^wu$/i.test(value)) {
    return 'Wu Jian';
  }

  return value;
}

