/**
 * Type definitions for DCSS morgue file parsing.
 *
 * These types represent the structured data extracted from morgue files.
 * All types are designed to be UI-friendly and suitable for direct consumption.
 */

/**
 * Character statistics at game end.
 */
export interface CharacterStats {
  /** Current HP (can be negative on death) */
  hpCurrent: number | null;
  /** Maximum HP */
  hpMax: number | null;
  /** Current MP */
  mpCurrent: number | null;
  /** Maximum MP */
  mpMax: number | null;
  /** Armor Class */
  ac: number | null;
  /** Evasion */
  ev: number | null;
  /** Shield */
  sh: number | null;
  /** Strength */
  str: number | null;
  /** Intelligence */
  int: number | null;
  /** Dexterity */
  dex: number | null;
  /** Gold collected */
  gold: number | null;
  /** Current god (null if atheist) */
  god: string | null;
  /** Piety level (0-6 stars, null if no god) */
  piety: number | null;
}

/**
 * Equipment slots and their contents.
 */
export interface Equipment {
  /** Wielded weapon */
  weapon: string | null;
  /** Body armour (robe, scales, mail, etc.) */
  bodyArmour: string | null;
  /** Shield, orb, or warlock's mirror */
  shield: string | null;
  /** Helmet, hat, or cap */
  helmet: string | null;
  /** Cloak or scarf */
  cloak: string | null;
  /** Gloves or gauntlets */
  gloves: string | null;
  /** Boots or barding */
  boots: string | null;
  /** Amulet */
  amulet: string | null;
  /** Ring on left hand */
  ringLeft: string | null;
  /** Ring on right hand */
  ringRight: string | null;
}

/**
 * A memorized spell.
 */
export interface Spell {
  /** Inventory slot (a-z) */
  slot: string;
  /** Spell name */
  name: string;
  /** Magic schools (e.g., ["Conjurations", "Earth"]) */
  schools: string[];
  /** Spell level (1-9) */
  level: number | null;
  /** Failure rate as string (e.g., "1%", "100%") */
  failure: string;
}

/**
 * God worship record.
 */
export interface GodRecord {
  /** God name */
  god: string;
  /** Turn when worship started */
  startedTurn: number | null;
  /** Location where worship started (e.g., "Temple") */
  startedLocation: string | null;
  /** Turn when worship ended (null if still worshipping at game end) */
  endedTurn: number | null;
}

/**
 * Branch visit information.
 */
export interface BranchInfo {
  /** Number of levels seen in this branch */
  levelsSeen: number | null;
  /** Total levels in this branch */
  levelsTotal: number | null;
  /** Deepest level reached */
  deepest: number | null;
  /** Turn when first entered (null if not tracked) */
  firstEntryTurn: number | null;
}

/**
 * XP level progression entry.
 */
export interface XpProgression {
  /** Turn when this XL was reached */
  turn: number | null;
  /** Location where this XL was reached (e.g., "D:5") */
  location: string;
}

/**
 * Action counts by XL range.
 * Keys are XL ranges like "1-3", "4-6", etc., plus "total".
 */
export type ActionCounts = Record<string, number>;

/**
 * Actions organized by category and action name.
 */
export type Actions = Record<string, Record<string, ActionCounts>>;

/**
 * Time statistics for a branch.
 */
export interface BranchTimeStats {
  /** Total elapsed time (in decaauts or percentage) */
  elapsed: number | null;
  /** Non-travel time */
  nonTravel: number | null;
  /** Inter-level travel time */
  interLevelTravel: number | null;
  /** Resting time */
  resting: number | null;
  /** Autoexplore time */
  autoexplore: number | null;
  /** Number of levels */
  levels: number | null;
  /** Mean time per level */
  meanPerLevel: number | null;
}

/**
 * Top level by time entry.
 */
export interface TopLevelTime {
  /** Level identifier (e.g., "D:13", "Elf:3") */
  level: string;
  /** Time spent (in decaauts) */
  time: number;
}

/**
 * Skill progression by XL.
 * Keys are XL numbers as strings, values are skill levels at that XL.
 */
export type SkillProgression = Record<string, number>;

/**
 * Source of skill progression data.
 * - 'table': From the skill table at the end of morgue (0.23+, more accurate)
 * - 'notes': Derived from "Reached skill level X in Y" entries in Notes section
 */
export type SkillsByXlSource = 'table' | 'notes' | null;

/**
 * Complete parsed morgue file data.
 */
export interface MorgueData {
  /** Parser version that generated this data */
  parserVersion: string;
  /** SHA-256 hash of the original morgue file content (hex string) */
  morgueHash: string;
  /** URL where the original morgue file can be found (if provided) */
  sourceUrl: string | null;
  /** List of parse errors encountered (empty if successful) */
  parseErrors: string[];

  // Header information
  /** DCSS version (e.g., "0.34-a0-3-g68670cc5b6") */
  version: string | null;
  /** Whether played on webtiles */
  isWebtiles: boolean | null;
  /** Game seed (added ~0.19) */
  gameSeed: string | null;
  /** Final score */
  score: number | null;
  /** Player name */
  playerName: string | null;
  /** Character title (e.g., "Archmage", "Sniper") */
  title: string | null;
  /** Race (e.g., "Gargoyle", "Deep Elf") */
  race: string | null;
  /** Background (e.g., "Berserker", "Fire Elementalist") */
  background: string | null;
  /** Character level (XL) */
  characterLevel: number | null;
  /** Game start date */
  startDate: string | null;
  /** Game end date */
  endDate: string | null;
  /** Game duration in seconds */
  gameDurationSeconds: number | null;
  /** Total turns played */
  totalTurns: number | null;
  /** Total possible runes */
  runesPossible: number | null;
  /** List of rune names collected */
  runesList: string[] | null;
  /** List of gem names collected (0.32+) */
  gemsList: string[] | null;
  /** Number of branches visited */
  branchesVisitedCount: number | null;
  /** Number of levels seen */
  levelsSeenCount: number | null;
  /** Whether the game was a win (escaped with the Orb) */
  isWin: boolean | null;

  // Detailed sections
  /** Character stats at game end */
  endingStats: CharacterStats | null;
  /** Equipped items */
  equipment: Equipment | null;
  /** Final skill levels (skill name -> level) */
  endingSkills: Record<string, number> | null;
  /** Skill progression by XL (skill name -> XL -> level) */
  skillsByXl: Record<string, SkillProgression> | null;
  /** Source of skillsByXl data: 'table' (0.23+) or 'notes' (derived from log) */
  skillsByXlSource: SkillsByXlSource;
  /** Memorized spells at game end */
  endingSpells: Spell[] | null;
  /** Gods worshipped during the game */
  godsWorshipped: GodRecord[] | null;
  /** Branch visit information (branch name -> info) */
  branches: Record<string, BranchInfo> | null;
  /** XP level progression (XL as string -> progression info) */
  xpProgression: Record<string, XpProgression> | null;
  /** Action statistics */
  actions: Actions | null;
  /** Time statistics by branch */
  timeByBranch: Record<string, BranchTimeStats> | null;
  /** Top levels by time spent */
  topLevelsByTime: TopLevelTime[] | null;
}

/**
 * Result of parsing a morgue file.
 * This is the same as MorgueData but with a discriminated success field.
 */
export interface ParseResult {
  /** Whether parsing completed without critical errors */
  success: boolean;
  /** The parsed data */
  data: MorgueData;
}

/**
 * Error thrown during parsing.
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly section: string,
    public readonly cause?: Error
  ) {
    super(`[${section}] ${message}`);
    this.name = 'ParseError';
  }
}

