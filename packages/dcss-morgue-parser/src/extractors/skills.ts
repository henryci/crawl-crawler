/**
 * Skills extractor for DCSS morgue files.
 *
 * Handles two formats:
 *
 * Simple list format (all versions):
 *     Skills:
 *      + Level 22.5 Fighting
 *      - Level 12.1 Staves
 *      O Level 27 Armour
 *
 * Table format (0.23+):
 *     Skill      XL: |  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 |
 *     ---------------+----------------------------------------------------------------------------------+-----
 *     Fighting       |  1  2  3                 5     8  9             10    11    12 13          15 23 | 23.0
 *
 * Prefixes in simple format:
 *     + = focused
 *     - = not focused
 *     O = maxed (level 27)
 *     * = cross-trained bonus
 */

import type { SkillProgression } from '../types.js';
import { PATTERNS, parseFloatSafe } from '../utils.js';

export interface SkillsData {
  endingSkills: Record<string, number>;
  skillsByXl: Record<string, SkillProgression> | null;
}

/**
 * Extract skill information from the morgue file.
 *
 * Attempts to parse both the simple list format and the table format.
 *
 * @param content - Full morgue file content as a string
 * @returns Object with ending_skills and skills_by_xl
 *
 * @remarks
 * Version Notes:
 * - Table format with XL progression: 0.23+
 * - Simple list format: All versions
 */
export function extractSkills(content: string): SkillsData {
  const result: SkillsData = {
    endingSkills: {},
    skillsByXl: null,
  };

  // Try to extract from table format first (more detailed)
  const tableSkills = extractSkillsTable(content);
  if (tableSkills) {
    result.endingSkills = tableSkills.endingSkills;
    result.skillsByXl = tableSkills.skillsByXl;
  }

  // If no table found, try simple list format
  if (Object.keys(result.endingSkills).length === 0) {
    result.endingSkills = extractSkillsList(content);
  }

  return result;
}

/**
 * Extract skills from simple list format.
 *
 * Format:
 *     Skills:
 *      + Level 22.5 Fighting
 *      - Level 12.1 Staves
 *      O Level 27 Armour
 */
function extractSkillsList(content: string): Record<string, number> {
  const skills: Record<string, number> = {};

  // Find the Skills section
  const skillsMatch = /^\s*Skills:/m.exec(content);
  if (!skillsMatch) {
    return skills;
  }

  // Get lines after Skills: header
  const start = skillsMatch.index + skillsMatch[0].length;
  const lines = content.slice(start).split('\n');

  for (const line of lines) {
    // Stop at next section
    if (line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
      if (!line.trim().startsWith('-') && !line.trim().startsWith('+') && 
          !line.trim().startsWith('O') && !line.trim().startsWith('*')) {
        break;
      }
    }

    // Match skill line
    const match = PATTERNS.skillSimple.exec(line);
    if (match) {
      const level = parseFloatSafe(match[2]);
      const skillName = match[3]?.trim();
      if (level !== null && skillName) {
        skills[skillName] = level;
      }
    }
  }

  return skills;
}

/**
 * Extract skills from table format (0.23+).
 *
 * Format:
 *     Skill      XL: |  1  2  3  4  5 ... 27 |
 *     ---------------+------------------------+-----
 *     Fighting       |  1  2  3        5      | 23.0
 *     Stealth        |  2                     |  2.0
 */
function extractSkillsTable(content: string): SkillsData | null {
  // Look for the skills table header
  const headerMatch = /Skill\s+XL:\s*\|(.+?)\|/.exec(content);
  if (!headerMatch) {
    return null;
  }

  const result: SkillsData = {
    endingSkills: {},
    skillsByXl: {},
  };

  // Parse the XL columns from header
  const headerContent = headerMatch[1];
  if (!headerContent) {
    return null;
  }

  const xlColumns: number[] = [];
  const xlMatches = headerContent.matchAll(/\d+/g);
  for (const match of xlMatches) {
    xlColumns.push(parseInt(match[0], 10));
  }

  if (xlColumns.length === 0) {
    return null;
  }
  const maxXl = Math.max(...xlColumns);

  // Find the start of skill rows (after the separator line)
  const tableStart = headerMatch.index + headerMatch[0].length;
  const separatorMatch = /-+\+-+\+-+/.exec(content.slice(tableStart));
  if (!separatorMatch) {
    return null;
  }

  const rowsStart = tableStart + separatorMatch.index + separatorMatch[0].length;

  // Parse each skill row
  const lines = content.slice(rowsStart).split('\n');
  let parsedAnySkillRow = false;

  for (const line of lines) {
    if (!line.trim()) {
      if (parsedAnySkillRow) {
        break;
      }
      continue;
    }
    if (!line.includes('|')) {
      if (parsedAnySkillRow) {
        break;
      }
      continue;
    }

    // Parse skill row: "Fighting       |  1  2  3        5      | 23.0"
    const rowMatch = /^([^|]+)\|([^|]+)\|\s*([\d.]+)?/.exec(line);
    if (!rowMatch) {
      continue;
    }

    const skillName = rowMatch[1]?.trim();
    if (!skillName) {
      continue;
    }
    parsedAnySkillRow = true;

    // Parse final level
    const finalLevelStr = rowMatch[3];
    let finalLevel: number | null = null;
    if (finalLevelStr) {
      finalLevel = parseFloatSafe(finalLevelStr);
      if (finalLevel !== null) {
        result.endingSkills[skillName] = finalLevel;
      }
    }

    // Parse XL progression
    const xlContent = rowMatch[2];
    if (xlContent && result.skillsByXl) {
      const skillProgression = parseXlProgression(xlContent, xlColumns);
      // Always anchor progression at the terminal XL with the canonical final level.
      // This prevents alignment issues in spaced columns from leaving the last value stale.
      if (finalLevel !== null) {
        skillProgression[String(maxXl)] = finalLevel;
      }
      if (Object.keys(skillProgression).length > 0) {
        result.skillsByXl[skillName] = skillProgression;
      }
    }
  }

  return Object.keys(result.endingSkills).length > 0 ? result : null;
}

/**
 * Parse the XL progression values from a skill row.
 *
 * The content is space-separated values aligned with XL columns.
 * Empty spaces mean no training at that XL.
 */
function parseXlProgression(xlContent: string, xlColumns: number[]): SkillProgression {
  const progression: SkillProgression = {};

  // Find all numbers and their positions
  const values: Array<{ pos: number; value: number }> = [];
  const matches = xlContent.matchAll(/\d+/g);
  for (const match of matches) {
    if (match.index !== undefined) {
      values.push({ pos: match.index, value: parseInt(match[0], 10) });
    }
  }

  if (values.length === 0) {
    return progression;
  }

  // Try to map values to XL columns based on position
  // Each column is typically 4 characters wide
  const colWidth = xlContent.length / xlColumns.length;

  for (const { pos, value } of values) {
    // Estimate which column this value belongs to
    const colIdx = Math.floor(pos / colWidth);
    if (colIdx >= 0 && colIdx < xlColumns.length) {
      const xl = xlColumns[colIdx];
      if (xl !== undefined) {
        progression[String(xl)] = value;
      }
    }
  }

  return progression;
}

