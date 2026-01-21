/**
 * Shared utilities for analytics API routes.
 * Provides consistent input validation and query building.
 */

import {
  LEGACY_SPECIES_NAMES,
  LEGACY_BACKGROUND_NAMES,
} from 'dcss-game-data';

// Validation constants
const MAX_STRING_LENGTH = 100;
const MAX_ARRAY_LENGTH = 50;

/**
 * Sanitize a string input by trimming and limiting length.
 */
export function sanitizeString(value: string | null | undefined, maxLength = MAX_STRING_LENGTH): string | null {
  if (!value) return null;
  return value.trim().slice(0, maxLength) || null;
}

/**
 * Sanitize and parse a comma-separated string into an array.
 */
export function sanitizeStringArray(value: string | null | undefined, maxLength = MAX_ARRAY_LENGTH): string[] | null {
  if (!value) return null;
  const items = value.split(',')
    .map(s => s.trim().slice(0, MAX_STRING_LENGTH))
    .filter(Boolean)
    .slice(0, maxLength);
  return items.length > 0 ? items : null;
}

/**
 * Sanitize and parse an integer with bounds checking.
 */
export function sanitizeInt(value: string | null | undefined, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return null;
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Parse common filter parameters from URL search params.
 */
export interface CommonFilters {
  races: string[] | null;
  backgrounds: string[] | null;
  gods: string[] | null;
  isWin: boolean | null;
  minVersion: string | null;
  maxVersion: string | null;
  minRunes: number | null;
  maxRunes: number | null;
  minTurns: number | null;
  maxTurns: number | null;
  player: string | null;
  excludeLegacy: boolean;
}

export function parseCommonFilters(searchParams: URLSearchParams): CommonFilters {
  const races = sanitizeStringArray(searchParams.get('races'));
  const backgrounds = sanitizeStringArray(searchParams.get('backgrounds'));
  const gods = sanitizeStringArray(searchParams.get('gods'));
  
  const isWinParam = searchParams.get('isWin');
  let isWin: boolean | null = null;
  if (isWinParam === 'true') isWin = true;
  else if (isWinParam === 'false') isWin = false;
  
  const minVersion = sanitizeString(searchParams.get('minVersion'), 20);
  const maxVersion = sanitizeString(searchParams.get('maxVersion'), 20);
  
  const minRunes = sanitizeInt(searchParams.get('minRunes'), 0, 15);
  const maxRunes = sanitizeInt(searchParams.get('maxRunes'), 0, 15);
  const minTurns = sanitizeInt(searchParams.get('minTurns'), 0);
  const maxTurns = sanitizeInt(searchParams.get('maxTurns'), 0);
  
  const player = sanitizeString(searchParams.get('player'));
  
  const excludeLegacy = searchParams.get('excludeLegacy') === 'true';
  
  return { 
    races, 
    backgrounds, 
    gods, 
    isWin,
    minVersion,
    maxVersion,
    minRunes,
    maxRunes,
    minTurns,
    maxTurns,
    player,
    excludeLegacy,
  };
}

/**
 * Build a WHERE clause from common filters.
 * Returns the clause string and parameters array.
 * 
 * SECURITY: All values are passed as parameterized query parameters,
 * never interpolated into the SQL string.
 * 
 * NOTE: This function requires the query to have joined:
 * - races r ON g.race_id = r.id
 * - backgrounds b ON g.background_id = b.id
 * - gods god ON g.god_id = god.id
 * - game_versions v ON g.version_id = v.id (if using version filters)
 */
export function buildCommonWhereClause(filters: CommonFilters, options?: { includeVersionJoin?: boolean }): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;
  
  if (filters.races && filters.races.length > 0) {
    conditions.push(`r.name = ANY($${paramIndex})`);
    params.push(filters.races);
    paramIndex++;
  }
  
  if (filters.backgrounds && filters.backgrounds.length > 0) {
    conditions.push(`b.name = ANY($${paramIndex})`);
    params.push(filters.backgrounds);
    paramIndex++;
  }
  
  if (filters.gods && filters.gods.length > 0) {
    conditions.push(`god.name = ANY($${paramIndex})`);
    params.push(filters.gods);
    paramIndex++;
  }
  
  if (filters.isWin !== null) {
    conditions.push(`g.is_win = $${paramIndex}`);
    params.push(filters.isWin);
    paramIndex++;
  }
  
  if (filters.minRunes !== null) {
    conditions.push(`g.runes_count >= $${paramIndex}`);
    params.push(filters.minRunes);
    paramIndex++;
  }
  
  if (filters.maxRunes !== null) {
    conditions.push(`g.runes_count <= $${paramIndex}`);
    params.push(filters.maxRunes);
    paramIndex++;
  }
  
  if (filters.minTurns !== null) {
    conditions.push(`g.total_turns >= $${paramIndex}`);
    params.push(filters.minTurns);
    paramIndex++;
  }
  
  if (filters.maxTurns !== null) {
    conditions.push(`g.total_turns <= $${paramIndex}`);
    params.push(filters.maxTurns);
    paramIndex++;
  }
  
  if (filters.player) {
    conditions.push(`g.player_name ILIKE $${paramIndex}`);
    params.push(`%${filters.player}%`);
    paramIndex++;
  }
  
  if (filters.minVersion) {
    conditions.push(`v.minor >= $${paramIndex}`);
    const match = /^0\.(\d+)/.exec(filters.minVersion);
    params.push(match ? parseInt(match[1]!, 10) : 0);
    paramIndex++;
  }
  
  if (filters.maxVersion) {
    conditions.push(`v.minor <= $${paramIndex}`);
    const match = /^0\.(\d+)/.exec(filters.maxVersion);
    params.push(match ? parseInt(match[1]!, 10) : 99);
    paramIndex++;
  }
  
  if (filters.excludeLegacy) {
    // Exclude legacy species
    conditions.push(`r.name != ALL($${paramIndex})`);
    params.push([...LEGACY_SPECIES_NAMES]);
    paramIndex++;
    
    // Exclude legacy backgrounds
    conditions.push(`b.name != ALL($${paramIndex})`);
    params.push([...LEGACY_BACKGROUND_NAMES]);
    paramIndex++;
  }
  
  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}
