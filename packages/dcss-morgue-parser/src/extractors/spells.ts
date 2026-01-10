/**
 * Spells extractor for DCSS morgue files.
 *
 * Extracts memorized spells from the spells section.
 *
 * Format (newer - without Hunger):
 *     Your Spells              Type           Power        Failure   Level
 *     a - Sandblast             Conj/Erth      #######      1%          1
 *     b - Stone Arrow           Conj/Erth      ########     1%          3
 *
 * Format (older - with Hunger):
 *     Your Spells              Type           Power        Failure   Level  Hunger
 *     a - Sandblast             Conj/Erth      #######      1%          1    None
 */

import type { Spell } from '../types.js';
import { expandSchoolAbbreviation, parseIntSafe } from '../utils.js';

/**
 * Extract memorized spells from the morgue file.
 *
 * @param content - Full morgue file content as a string
 * @returns List of spell objects, or null if no spells section found.
 *
 * @remarks
 * Version Notes:
 * - Older versions include a "Hunger" column
 * - School abbreviations vary slightly between versions
 */
export function extractSpells(content: string): Spell[] | null {
  // Find the spells section
  const spellsSection = findSpellsSection(content);
  if (!spellsSection) {
    return null;
  }

  const spells: Spell[] = [];
  const lines = spellsSection.split('\n');

  for (const line of lines) {
    const spell = parseSpellLine(line);
    if (spell) {
      spells.push(spell);
    }
  }

  return spells.length > 0 ? spells : null;
}

/**
 * Find the spells section in the morgue file.
 *
 * Looks for "You knew the following spells:" or "Your Spells" header.
 */
function findSpellsSection(content: string): string | null {
  // Look for spells header
  const markers = ['You knew the following spells:', 'Your Spells'];

  let start = -1;
  for (const marker of markers) {
    const idx = content.indexOf(marker);
    if (idx !== -1) {
      start = idx;
      break;
    }
  }

  if (start === -1) {
    return null;
  }

  // Find the end - next major section
  const endMarkers = [
    '\nYour spell library',
    '\nDungeon Overview',
    '\nMessage History',
    '\nNotes',
    '\nVanquished Creatures',
    '\nAction',
    '\n\n\n', // Multiple blank lines often separate sections
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
 * Parse a single spell line.
 *
 * Format (0.33+ with Damage): "a - Sandblast             Erth           100%       2d20      0%          1"
 * Format (newer): "a - Sandblast             Conj/Erth      #######      1%          1"
 * Format (older): "b - Lehudib's Crystal Sp  Erth/Conj      #########.     Excellent   8"
 *
 * @returns Spell object or null if not a valid spell line
 */
function parseSpellLine(line: string): Spell | null {
  // Match spell line pattern
  // slot - name    schools    power    [damage]    failure/success    level    [hunger]
  // The failure/success field can be:
  // - Percentage like "1%" or "N/A"
  // - Word like "Excellent", "Perfect", "Great", "Good", "Poor", "Very Poor", "Terrible"
  // The power field can be:
  // - Hash marks like "#######" or "####."
  // - Percentage like "100%" or "70%"
  // - N/A

  // Try 0.33+ format with Damage column (power is percentage)
  // slot - name    schools    power%    damage    failure%    level
  const damageFormatPattern =
    /^([a-zA-Z])\s+-\s+(.+?)\s{2,}([\w/]+)\s+(\d+%|N\/A)\s+(\S+)\s+(\d+%|N\/A)\s+(\d+)/;
  let match = damageFormatPattern.exec(line.trim());

  if (match) {
    const slot = match[1];
    const name = match[2]?.trim();
    const schoolsStr = match[3];
    // match[4] is power, match[5] is damage
    const failure = match[6];
    const level = parseIntSafe(match[7]);

    if (!slot || !name || !schoolsStr || !failure) {
      return null;
    }

    const schoolAbbrevs = schoolsStr.split('/');
    const schools = schoolAbbrevs.map((s) => expandSchoolAbbreviation(s.trim()));

    return {
      slot,
      name,
      schools,
      level,
      failure,
    };
  }

  // Try newer format (percentage failure, hash power)
  const newerPattern =
    /^([a-zA-Z])\s+-\s+(.+?)\s{2,}([\w/]+)\s+([#.]+|N\/A)\s+(\d+%|N\/A)\s+(\d+)/;
  match = newerPattern.exec(line.trim());

  if (!match) {
    // Try older format (word-based success)
    const olderPattern =
      /^([a-zA-Z])\s+-\s+(.+?)\s{2,}([\w/]+)\s+([#.]+|N\/A)\s+(\w+(?:\s+\w+)?)\s+(\d+)/;
    match = olderPattern.exec(line.trim());
  }

  if (!match) {
    return null;
  }

  const slot = match[1];
  const name = match[2]?.trim();
  const schoolsStr = match[3];
  const failure = match[5];
  const level = parseIntSafe(match[6]);

  if (!slot || !name || !schoolsStr || !failure) {
    return null;
  }

  // Parse schools (e.g., "Conj/Erth" -> ["Conjurations", "Earth"])
  const schoolAbbrevs = schoolsStr.split('/');
  const schools = schoolAbbrevs.map((s) => expandSchoolAbbreviation(s.trim()));

  return {
    slot,
    name,
    schools,
    level,
    failure,
  };
}

