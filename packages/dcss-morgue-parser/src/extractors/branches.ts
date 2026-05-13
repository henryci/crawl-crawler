/**
 * Branches extractor for DCSS morgue files.
 *
 * Extracts branch visit information from multiple sources:
 *
 * 1. Notes section - branch entry events:
 *     65941 | Snake:1  | Entered Level 1 of the Snake Pit
 *     85000 | Zot:5    | Entered Level 5 of the Realm of Zot
 *
 * 2. Dungeon Overview section:
 *     Branches:
 *     Dungeon (27/27)            Temple (0/1) D:7             Orc (4/4) D:8
 *         Elf (3/3) Orc:3          Lair (8/8) D:8           Swamp (5/5) Lair:4
 */

import type { BranchInfo } from '../types.js';
import { PATTERNS, parseIntSafe, getCanonicalBranchName } from '../utils.js';

/**
 * Extract branch visit information from the morgue file.
 *
 * Combines data from Notes (entry turns) and Dungeon Overview (levels seen).
 *
 * @param content - Full morgue file content as a string
 * @returns Object mapping branch names to visit info, or null if not found.
 */
export function extractBranches(content: string): Record<string, BranchInfo> | null {
  const branches: Record<string, BranchInfo> = {};

  // Extract from Dungeon Overview
  extractFromOverview(content, branches);
  extractFromLegacyBranchList(content, branches);

  // Extract entry turns from Notes
  extractEntryTurns(content, branches);

  ensureDungeonFromSummary(content, branches);

  // The player always starts on D:1 at turn 0, but the Notes section won't
  // have an "Entered" event for it, so hardcode the entry turn.
  if (branches['Dungeon']) {
    branches['Dungeon'].firstEntryTurn = 0;
  }

  return Object.keys(branches).length > 0 ? branches : null;
}

/**
 * Extract branch info from Dungeon Overview section.
 *
 * Format: "Dungeon (27/27)" or "Temple (0/1) D:7"
 */
function extractFromOverview(content: string, branches: Record<string, BranchInfo>): void {
  // Find Dungeon Overview or Branches section
  const overviewMatch = /(?:Dungeon Overview|Branches:)/.exec(content);
  if (!overviewMatch) {
    return;
  }

  const start = overviewMatch.index;

  // Find end of section
  let end = content.length;
  const endMarkers = ['\nAltars:', '\nShops:', '\nAnnotations:', '\n\n\n'];
  for (const marker of endMarkers) {
    const idx = content.indexOf(marker, start);
    if (idx !== -1 && idx < end) {
      end = idx;
    }
  }

  const section = content.slice(start, end);

  // Parse branch entries: "BranchName (seen/total)"
  // Use a more precise pattern that only matches known branch names or single words
  // The branch name should be preceded by start of line, whitespace, or location like "D:7"
  // Pattern: Capital letter followed by lowercase letters (min 2 chars like "Dis", "Geh")
  // with optional SINGLE space for "Spider Nest" style names (not multiple spaces), then (n/m)
  const pattern = /(?:^|[\s:])([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s*\((\d+)\/(\d+)\)/g;

  let match;
  while ((match = pattern.exec(section)) !== null) {
    const branchName = match[1]?.trim();
    if (!branchName) continue;

    const levelsSeen = parseIntSafe(match[2]);
    const levelsTotal = parseIntSafe(match[3]);

    // Skip if the branch name contains newlines or excessive whitespace
    if (branchName.includes('\n') || branchName.includes('  ')) {
      continue;
    }

    // Normalize branch name
    const canonicalName = getCanonicalBranchName(branchName);

    if (!branches[canonicalName]) {
      branches[canonicalName] = {
        levelsSeen: null,
        levelsTotal: null,
        firstEntryTurn: null,
      };
    }

    const branch = branches[canonicalName];
    if (branch) {
      branch.levelsSeen = levelsSeen;
      branch.levelsTotal = levelsTotal;
    }
  }
}

/**
 * Extract branch entry turns from Notes section.
 *
 * Format: "65941 | Snake:1  | Entered Level 1 of the Snake Pit"
 */
function extractEntryTurns(content: string, branches: Record<string, BranchInfo>): void {
  // Find Notes section
  const notesMatch = /^Notes/m.exec(content);
  if (!notesMatch) {
    return;
  }

  const notesSection = content.slice(notesMatch.index);
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

    // Check for branch entry
    if (message.includes('Entered')) {
      // Extract branch from location (e.g., "Snake:1" -> "Snake")
      const branchAbbrev = location.includes(':') ? location.split(':')[0] : location;
      if (!branchAbbrev) continue;

      const canonicalName = getCanonicalBranchName(branchAbbrev);

      if (!branches[canonicalName]) {
        branches[canonicalName] = {
          levelsSeen: null,
          levelsTotal: null,
          firstEntryTurn: null,
        };
      }

      const branch = branches[canonicalName];
      if (!branch) continue;

      // Only record first entry
      if (branch.firstEntryTurn === null) {
        branch.firstEntryTurn = turn;
      }
    }
  }
}

function extractFromLegacyBranchList(content: string, branches: Record<string, BranchInfo>): void {
  const listHeaderMatch = /^Branches:\s*\(.*\)\s*$/m.exec(content);
  if (!listHeaderMatch) {
    return;
  }
  const lines = content.slice(listHeaderMatch.index + listHeaderMatch[0].length).split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      break;
    }
    if (
      /^Altars:/i.test(trimmed)
      || /^Shops:/i.test(trimmed)
      || /^Portals:/i.test(trimmed)
      || /^Annotations:/i.test(trimmed)
    ) {
      break;
    }
    const branchMatches = trimmed.matchAll(/([A-Za-z][A-Za-z ]*?)\s*:\s*[A-Za-z]+:\d+/g);
    for (const match of branchMatches) {
      const raw = match[1]?.trim();
      if (!raw) continue;
      const canonicalName = getCanonicalBranchName(raw);
      if (!branches[canonicalName]) {
        branches[canonicalName] = {
          levelsSeen: null,
          levelsTotal: null,
          firstEntryTurn: null,
        };
      }
    }
  }
}

function ensureDungeonFromSummary(content: string, branches: Record<string, BranchInfo>): void {
  const summaryMatch = PATTERNS.branchesVisited.exec(content);
  if (!summaryMatch) {
    return;
  }
  const visitedBranches = parseIntSafe(summaryMatch[1]);
  const levelsSeen = parseIntSafe(summaryMatch[2]);
  if (!branches.Dungeon) {
    branches.Dungeon = {
      levelsSeen: visitedBranches === 1 ? levelsSeen : null,
      levelsTotal: null,
      firstEntryTurn: 0,
    };
    return;
  }
  if (branches.Dungeon.firstEntryTurn === null) {
    branches.Dungeon.firstEntryTurn = 0;
  }
  if (branches.Dungeon.levelsSeen === null && visitedBranches === 1) {
    branches.Dungeon.levelsSeen = levelsSeen;
  }
}

