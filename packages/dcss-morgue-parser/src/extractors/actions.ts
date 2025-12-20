/**
 * Actions extractor for DCSS morgue files.
 *
 * Extracts the action table (0.16+).
 *
 * Format:
 *     Action                     |  1- 3 |  4- 6 |  7- 9 | 10-12 | 13-15 | 16-18 | 19-21 | 22-24 | 25-27 || total
 *     ---------------------------+-------+-------+-------+-------+-------+-------+-------+-------+-------++-------
 *       Melee: Dagger            |    18 |     5 |     5 |       |       |       |       |       |       ||    28
 *              Staff             |       |       |       |       |    33 |       |       |    24 |   135 ||   192
 *        Cast: Sandblast         |    47 |    22 |    29 |    31 |       |       |       |       |       ||   129
 */

import type { Actions, ActionCounts } from '../types.js';
import { parseIntSafe } from '../utils.js';

/**
 * Extract the action table from the morgue file.
 *
 * @param content - Full morgue file content as a string
 * @returns Nested object: {category: {action: {xl_range: count, "total": count}}}
 *          Returns null if action table not found.
 *
 * @remarks
 * Version Notes:
 * - Action table added in version 0.16
 * - Format varies slightly between versions
 */
export function extractActions(content: string): Actions | null {
  // Find the action table
  const actionSection = findActionSection(content);
  if (!actionSection) {
    return null;
  }

  return parseActionTable(actionSection);
}

/**
 * Find the Action table section in the morgue file.
 */
function findActionSection(content: string): string | null {
  // Look for Action header line
  const actionMatch = /^Action\s+\|/m.exec(content);
  if (!actionMatch) {
    return null;
  }

  const start = actionMatch.index;

  // Find end - blank line or next major section
  let end = content.length;

  // Look for end of table (multiple blank lines or new section)
  const lines = content.slice(start).split('\n');
  let lineCount = 0;
  let blankCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) {
      blankCount++;
      if (blankCount >= 2) {
        lineCount = i;
        break;
      }
    } else {
      blankCount = 0;
    }
  }

  if (lineCount > 0) {
    end = start + lines.slice(0, lineCount).reduce((sum, l) => sum + l.length + 1, 0);
  }

  return content.slice(start, end);
}

/**
 * Parse the action table into a nested object.
 *
 * @returns {category: {action: {xl_range: count, "total": count}}}
 */
function parseActionTable(section: string): Actions {
  const actions: Actions = {};
  const lines = section.split('\n');

  // Parse header to get column ranges
  if (lines.length === 0) {
    return actions;
  }

  const header = lines[0] ?? '';
  const xlRanges = parseHeaderColumns(header);

  if (xlRanges.length === 0) {
    return actions;
  }

  // Skip header and separator lines
  let dataStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.startsWith('--') || line.startsWith('==')) {
      dataStart = i + 1;
      break;
    }
  }

  let currentCategory: string | null = null;

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (!line.trim()) {
      continue;
    }

    // Parse action row
    const result = parseActionRow(line, xlRanges);
    if (!result) {
      continue;
    }

    const { category, actionName, counts } = result;

    // Update current category if specified
    if (category) {
      currentCategory = category;
    }

    if (!currentCategory) {
      continue;
    }

    // Add to actions dict
    if (!actions[currentCategory]) {
      actions[currentCategory] = {};
    }

    const categoryActions = actions[currentCategory];
    if (categoryActions) {
      categoryActions[actionName] = counts;
    }
  }

  return actions;
}

/**
 * Parse the header line to extract XL range column names.
 *
 * Format: "Action                     |  1- 3 |  4- 6 | ... || total"
 */
function parseHeaderColumns(header: string): string[] {
  const xlRanges: string[] = [];

  // Find all XL range patterns like "1- 3" or "1-3" or "25-27"
  const pattern = /(\d+)\s*-\s*(\d+)/g;

  let match;
  while ((match = pattern.exec(header)) !== null) {
    const start = match[1];
    const end = match[2];
    if (start && end) {
      xlRanges.push(`${start}-${end}`);
    }
  }

  // Add "total" if present
  if (header.toLowerCase().includes('total')) {
    xlRanges.push('total');
  }

  return xlRanges;
}

interface ActionRowResult {
  category: string | null;
  actionName: string;
  counts: ActionCounts;
}

/**
 * Parse a single action row.
 *
 * Format: "  Melee: Dagger            |    18 |     5 |     5 |       |..."
 * or:     "         Staff             |       |       |       |       |    33 |..."
 *
 * @returns {category, actionName, counts} or null if invalid
 */
function parseActionRow(line: string, xlRanges: string[]): ActionRowResult | null {
  // Split by | to get columns
  const parts = line.split('|');
  if (parts.length < 2) {
    return null;
  }

  // First part contains category and/or action name
  const namePart = parts[0]?.trim();
  if (!namePart) {
    return null;
  }

  // Check if this line has a category (e.g., "Melee: Dagger")
  let category: string | null = null;
  let actionName = namePart;

  if (namePart.includes(':')) {
    const catMatch = /(\w+):\s*(.+)/.exec(namePart);
    if (catMatch) {
      category = catMatch[1] ?? null;
      actionName = catMatch[2]?.trim() ?? namePart;
    }
  }

  // Parse value columns
  const counts: ActionCounts = {};
  const valueParts = parts.slice(1);

  // Handle the || separator for total
  // Rejoin and split by || to separate regular columns from total
  const valueStr = valueParts.join('|');
  let regularValues: string[];
  let totalValue: string | null = null;

  if (valueStr.includes('||')) {
    const splitParts = valueStr.split('||');
    regularValues = (splitParts[0] ?? '').split('|');
    totalValue = (splitParts[1] ?? '').trim();
  } else {
    regularValues = valueParts;
  }

  // Map values to XL ranges
  for (let i = 0; i < regularValues.length; i++) {
    const val = regularValues[i]?.trim();
    // -1 because last xlRange is "total"
    if (val && i < xlRanges.length - 1) {
      const count = parseIntSafe(val);
      const xlRange = xlRanges[i];
      if (count !== null && count > 0 && xlRange) {
        counts[xlRange] = count;
      }
    }
  }

  // Add total
  if (totalValue) {
    const totalCount = parseIntSafe(totalValue);
    if (totalCount !== null) {
      counts['total'] = totalCount;
    }
  }

  return Object.keys(counts).length > 0 ? { category, actionName, counts } : null;
}

