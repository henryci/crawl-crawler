/**
 * A single combo record entry from the top combo scores page
 */
export interface ComboRecord {
  /** Rank in the combo scores table */
  rank: number;
  /** Total score achieved */
  score: number;
  /** Link to the morgue file */
  morgueUrl: string | null;
  /** Character code (e.g., "AtAE", "MiBe") */
  character: string;
  /** Species code (e.g., "At", "Mi") */
  species: string;
  /** Background/class code (e.g., "AE", "Be") */
  background: string;
  /** Player name */
  player: string;
  /** Link to player's scoring page */
  playerUrl: string | null;
  /** God worshipped (if any) */
  god: string;
  /** Character title */
  title: string;
  /** Place of death/escape */
  place: string;
  /** How the game ended */
  end: string;
  /** Experience level at end */
  xl: number;
  /** Total turns taken */
  turns: number;
  /** Game duration (e.g., "02:51:20") */
  duration: string;
  /** Number of runes collected */
  runes: number;
  /** Date of the game (ISO format) */
  date: string;
  /** Game version (e.g., "0.33-a0") */
  version: string;
  /** Server abbreviation (e.g., "CNC", "CBR2") */
  server: string;
  /** Server URL */
  serverUrl: string | null;
}

// Import and re-export LegacyConfig from centralized package
import type { LegacyConfig } from 'dcss-game-data';
export type { LegacyConfig };

/**
 * Aggregate stats for a species
 */
export interface SpeciesAggregate {
  species: string;
  speciesName: string;
  isRemoved: boolean;
  recordCount: number;
  totalScore: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  oldestRecordDate: string;
  newestRecordDate: string;
  avgRunes: number;
}

/**
 * Aggregate stats for a background
 */
export interface BackgroundAggregate {
  background: string;
  backgroundName: string;
  isRemoved: boolean;
  recordCount: number;
  totalScore: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  oldestRecordDate: string;
  newestRecordDate: string;
  avgRunes: number;
}

/**
 * Full parsed combo records data
 */
export interface ComboRecordsData {
  /** All combo records */
  records: ComboRecord[];
  /** When the data was last updated (from the source) */
  lastUpdated: string | null;
  /** When this data was fetched */
  fetchedAt: string;
  /** Source URL */
  sourceUrl: string;
  /** Total number of combos/records */
  totalRecords: number;
}

/**
 * Full data structure including analytics
 */
export interface ComboRecordsWithAnalytics extends ComboRecordsData {
  /** Aggregated species stats */
  speciesStats: SpeciesAggregate[];
  /** Aggregated background stats */
  backgroundStats: BackgroundAggregate[];
  /** Legacy configuration used */
  legacyConfig: LegacyConfig;
}

