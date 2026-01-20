/**
 * DCSS Morgue Parser
 *
 * A TypeScript library for parsing Dungeon Crawl Stone Soup morgue files
 * and converting them to structured data.
 *
 * @packageDocumentation
 */

// Main parser functions
export { parseMorgue, parseMorgueData, VERSION } from './parser.js';
export type { ParseOptions } from './parser.js';

// Types
export type {
  MorgueData,
  ParseResult,
  CharacterStats,
  Equipment,
  Spell,
  GodRecord,
  BranchInfo,
  XpProgression,
  Actions,
  ActionCounts,
  BranchTimeStats,
  TopLevelTime,
  SkillProgression,
  SkillsByXlSource,
} from './types.js';

export { ParseError } from './types.js';

// Utilities (exported for advanced usage)
export {
  durationToSeconds,
  parseIntSafe,
  parseFloatSafe,
  cleanItemName,
  expandSchoolAbbreviation,
  findSection,
  findNotesSection,
  cleanGodName,
  getCanonicalBranchName,
  parseRaceBackground,
  KNOWN_GODS,
  BRANCH_ALIASES,
  KNOWN_RACES,
} from './utils.js';

