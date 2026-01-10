/**
 * DCSS Morgue File Parser
 *
 * Main entry point for parsing Dungeon Crawl Stone Soup morgue files
 * and converting them to structured data.
 *
 * This module is framework-agnostic and side-effect free, suitable for
 * use in both browser and Node.js environments.
 */

import type { MorgueData, ParseResult } from './types.js';
import {
  extractHeader,
  extractStats,
  extractEquipment,
  extractSkills,
  extractSpells,
  extractGods,
  extractBranches,
  extractNotes,
  buildSkillsByXlFromNotes,
  extractActions,
  extractTimeTables,
} from './extractors/index.js';

/**
 * Library version.
 */
export const VERSION = '1.0.0';

/**
 * Parse a morgue file and extract all available data.
 *
 * This is a pure function with no side effects. It accepts raw text
 * and returns structured data without performing any I/O.
 *
 * @param content - Full morgue file content as a string
 * @returns ParseResult containing the parsed data and success status
 *
 * @example
 * ```typescript
 * import { parseMorgue } from 'dcss-morgue-parser';
 *
 * const morgueText = fs.readFileSync('morgue.txt', 'utf-8');
 * const result = parseMorgue(morgueText);
 *
 * if (result.success) {
 *   console.log(`${result.data.playerName} the ${result.data.title}`);
 *   console.log(`Score: ${result.data.score}`);
 * }
 * ```
 */
export function parseMorgue(content: string): ParseResult {
  const result: MorgueData = {
    parserVersion: VERSION,
    parseErrors: [],

    // Header fields
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
    runesPossible: null,
    runesList: null,
    gemsCollected: null,
    gemsList: null,
    branchesVisitedCount: null,
    levelsSeenCount: null,

    // Detailed sections
    endingStats: null,
    equipment: null,
    endingSkills: null,
    skillsByXl: null,
    endingSpells: null,
    godsWorshipped: null,
    branches: null,
    xpProgression: null,
    actions: null,
    timeByBranch: null,
    topLevelsByTime: null,
  };

  // Extract header information (version, score, player info, dates, runes, gems)
  try {
    const header = extractHeader(content);
    result.version = header.version;
    result.isWebtiles = header.isWebtiles;
    result.gameSeed = header.gameSeed;
    result.score = header.score;
    result.playerName = header.playerName;
    result.title = header.title;
    result.race = header.race;
    result.background = header.background;
    result.characterLevel = header.characterLevel;
    result.startDate = header.startDate;
    result.endDate = header.endDate;
    result.gameDuration = header.gameDuration;
    result.gameDurationSeconds = header.gameDurationSeconds;
    result.totalTurns = header.totalTurns;
    result.runesCollected = header.runesCollected;
    result.runesPossible = header.runesPossible;
    result.runesList = header.runesList;
    result.gemsCollected = header.gemsCollected;
    result.gemsList = header.gemsList;
    result.branchesVisitedCount = header.branchesVisitedCount;
    result.levelsSeenCount = header.levelsSeenCount;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`header: ${message}`);
  }

  // Extract stats
  try {
    result.endingStats = extractStats(content);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`stats: ${message}`);
  }

  // Extract equipment
  try {
    result.equipment = extractEquipment(content);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`equipment: ${message}`);
  }

  // Extract skills
  try {
    const skills = extractSkills(content);
    result.endingSkills = Object.keys(skills.endingSkills).length > 0 ? skills.endingSkills : null;
    result.skillsByXl = skills.skillsByXl;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`skills: ${message}`);
  }

  // Extract spells
  try {
    result.endingSpells = extractSpells(content);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`spells: ${message}`);
  }

  // Extract gods
  try {
    result.godsWorshipped = extractGods(content);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`gods: ${message}`);
  }

  // Extract branches
  try {
    result.branches = extractBranches(content);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`branches: ${message}`);
  }

  // Extract notes (XP progression and skill level events)
  try {
    const notes = extractNotes(content);
    result.xpProgression =
      Object.keys(notes.xpProgression).length > 0 ? notes.xpProgression : null;

    // If we didn't get skillsByXl from the table format (older morgues),
    // try to build it from notes section skill level events
    if (!result.skillsByXl && notes.skillLevelEvents.length > 0 && result.xpProgression) {
      result.skillsByXl = buildSkillsByXlFromNotes(notes.skillLevelEvents, result.xpProgression);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`notes: ${message}`);
  }

  // Extract actions
  try {
    result.actions = extractActions(content);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`actions: ${message}`);
  }

  // Extract time tables
  try {
    const timeTables = extractTimeTables(content);
    result.timeByBranch = timeTables.timeByBranch;
    result.topLevelsByTime = timeTables.topLevelsByTime;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    result.parseErrors.push(`time_tables: ${message}`);
  }

  return {
    success: result.parseErrors.length === 0,
    data: result,
  };
}

/**
 * Parse a morgue file and return only the data.
 *
 * This is a convenience function that returns just the MorgueData object.
 * Use `parseMorgue` if you need to check for parse errors.
 *
 * @param content - Full morgue file content as a string
 * @returns Parsed morgue data
 *
 * @example
 * ```typescript
 * import { parseMorgueData } from 'dcss-morgue-parser';
 *
 * const data = parseMorgueData(morgueText);
 * console.log(`Player: ${data.playerName}`);
 * ```
 */
export function parseMorgueData(content: string): MorgueData {
  return parseMorgue(content).data;
}

