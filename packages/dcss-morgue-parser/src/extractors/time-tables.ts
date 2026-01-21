/**
 * Time tables extractor for DCSS morgue files.
 *
 * Extracts time/turns statistics by branch and top levels by time.
 *
 * Newer format (0.25+) - uses decaauts:
 *     Table legend: (Time is in decaauts)
 *                        A        B        C        D        E      F       G
 *                    +--------+--------+--------+--------+--------+-----+--------+
 *              Total | 133914 | 115491 |  18423 |  18305 |  78584 | 111 | 1206.4 |
 *            Dungeon |  28023 |  21614 |   6409 |   3866 |  14136 |  15 | 1868.2 |
 *
 * Older format - uses percentages:
 *                        A       B       C       D       E               F
 *                    +-------+-------+-------+-------+-------+----------------------
 *              Total | 100.0 | 100.0 |   0.7 |  12.3 |   4.3 |         822.0
 *
 * Top levels by time (0.29+):
 *     Top non-repeatable levels by time:
 *         D:13: 5166 daAuts
 *        Elf:3: 4616 daAuts
 *     Vaults:4: 3700 daAuts
 */

import type { BranchTimeStats, TopLevelTime } from '../types.js';
import { parseFloatSafe, parseIntSafe } from '../utils.js';

export interface TimeTablesData {
  timeByBranch: Record<string, BranchTimeStats> | null;
  topLevelsByTime: TopLevelTime[] | null;
}

/**
 * Extract time/turns statistics from the morgue file.
 *
 * @param content - Full morgue file content as a string
 * @returns Object with time_by_branch and top_levels_by_time
 *
 * @remarks
 * Version Notes:
 * - Time table with decaauts: 0.25+
 * - Older versions use percentages
 * - Top levels by time: 0.29+
 */
export function extractTimeTables(content: string): TimeTablesData {
  const result: TimeTablesData = {
    timeByBranch: null,
    topLevelsByTime: null,
  };

  // Extract time by branch table
  result.timeByBranch = extractTimeByBranch(content);

  // Extract top levels by time
  result.topLevelsByTime = extractTopLevels(content);

  return result;
}

/**
 * Extract time statistics by branch.
 *
 * @returns Object mapping branch names to time statistics
 */
function extractTimeByBranch(content: string): Record<string, BranchTimeStats> | null {
  // Look for time table - only match specific time-related markers
  // IMPORTANT: Do NOT match generic "Table legend:" as that can match
  // the XP/Vault statistics table which has percentage columns
  const tableMarkers = [
    'Time is in decaauts',
    'Time is in auts',
    'Table legend: (Time is in decaauts)',
    'Table legend: (Time is in auts)',
  ];

  let tableStart = -1;

  // Try string markers first
  for (const marker of tableMarkers) {
    const idx = content.indexOf(marker);
    if (idx !== -1) {
      tableStart = idx;
      break;
    }
  }

  // Try regex pattern for time table header with column descriptions
  // This matches lines like "A = Elapsed time spent in this place."
  if (tableStart === -1) {
    const regexMatch = /A = Elapsed time spent/m.exec(content);
    if (regexMatch) {
      // Find the start of the table legend before this line
      const legendMatch = content.lastIndexOf('Table legend:', regexMatch.index);
      if (legendMatch !== -1 && regexMatch.index - legendMatch < 200) {
        tableStart = legendMatch;
      }
    }
  }

  if (tableStart === -1) {
    return null;
  }

  // Find the table section
  let tableEnd = content.length;
  const endMarkers = ['\nTop non-repeatable', '\nTop 10 ', '\n\n\n'];

  for (const marker of endMarkers) {
    const idx = content.indexOf(marker, tableStart);
    if (idx !== -1 && idx < tableEnd) {
      tableEnd = idx;
    }
  }

  const tableSection = content.slice(tableStart, tableEnd);

  return parseTimeTable(tableSection);
}

/**
 * Parse the time/turns table.
 *
 * @returns Object mapping branch names to column values
 */
function parseTimeTable(section: string): Record<string, BranchTimeStats> | null {
  const timeData: Record<string, BranchTimeStats> = {};
  const lines = section.split('\n');

  // Find data rows (lines with | separators and branch names)
  for (const line of lines) {
    if (!line.includes('|')) {
      continue;
    }

    // Parse row: "       Dungeon |  28023 |  21614 |   6409 | ..."
    const parts = line.split('|');
    if (parts.length < 3) {
      continue;
    }

    // First part is branch name
    const branchName = parts[0]?.trim();
    if (!branchName) {
      continue;
    }

    // Skip header/separator rows
    if (branchName.startsWith('-') || branchName.startsWith('+')) {
      continue;
    }
    if (branchName === 'A' || branchName === 'B' || branchName === 'C') {
      continue;
    }

    // Parse values
    const values = parts.slice(1);
    const branchData = parseTimeRowValues(values);

    if (branchData && Object.keys(branchData).length > 0) {
      timeData[branchName] = branchData;
    }
  }

  return Object.keys(timeData).length > 0 ? timeData : null;
}

/**
 * Column names for time table values.
 */
const COLUMN_NAMES = [
  'elapsed',
  'nonTravel',
  'interLevelTravel',
  'resting',
  'autoexplore',
  'levels',
  'meanPerLevel',
] as const;

/**
 * Parse the column values for a time table row.
 *
 * Maps values to column names (elapsed, nonTravel, etc.)
 */
function parseTimeRowValues(values: string[]): BranchTimeStats {
  const result: BranchTimeStats = {
    elapsed: null,
    nonTravel: null,
    interLevelTravel: null,
    resting: null,
    autoexplore: null,
    levels: null,
    meanPerLevel: null,
  };

  for (let i = 0; i < values.length && i < COLUMN_NAMES.length; i++) {
    const val = values[i]?.trim();
    if (!val) {
      continue;
    }

    const colName = COLUMN_NAMES[i];
    if (!colName) {
      break;
    }

    // Parse value (could be int or float)
    let parsed: number | null;
    if (val.includes('.')) {
      parsed = parseFloatSafe(val);
    } else {
      parsed = parseIntSafe(val);
    }

    if (parsed !== null) {
      result[colName] = parsed;
    }
  }

  return result;
}

/**
 * Extract top levels by time (0.29+).
 *
 * Format:
 *     Top non-repeatable levels by time:
 *         D:13: 5166 daAuts
 *        Elf:3: 4616 daAuts
 */
function extractTopLevels(content: string): TopLevelTime[] | null {
  // Look for top levels section
  const topMatch = /Top (?:non-repeatable )?levels by time:/.exec(content);
  if (!topMatch) {
    return null;
  }

  const start = topMatch.index + topMatch[0].length;

  // Find end of section
  let end = content.length;
  const endMarkers = ['\n\n\n', '\nAction', '\nSkill'];
  for (const marker of endMarkers) {
    const idx = content.indexOf(marker, start);
    if (idx !== -1 && idx < end) {
      end = idx;
    }
  }

  const section = content.slice(start, end);

  // Parse level entries
  const topLevels: TopLevelTime[] = [];

  // Pattern: "D:13: 5166 daAuts" or "Elf:3: 4616"
  const pattern = /(\S+:\d+):\s*(\d+)/g;

  let match;
  while ((match = pattern.exec(section)) !== null) {
    const level = match[1];
    const time = parseIntSafe(match[2]);
    if (level && time !== null) {
      topLevels.push({ level, time });
    }
  }

  return topLevels.length > 0 ? topLevels : null;
}

