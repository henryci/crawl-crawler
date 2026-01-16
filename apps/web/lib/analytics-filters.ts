/**
 * Shared utilities for analytics API routes.
 * Provides consistent input validation and query building.
 */

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
}

export function parseCommonFilters(searchParams: URLSearchParams): CommonFilters {
  const races = sanitizeStringArray(searchParams.get('races'));
  const backgrounds = sanitizeStringArray(searchParams.get('backgrounds'));
  const gods = sanitizeStringArray(searchParams.get('gods'));
  
  const isWinParam = searchParams.get('isWin');
  let isWin: boolean | null = null;
  if (isWinParam === 'true') isWin = true;
  else if (isWinParam === 'false') isWin = false;
  
  return { races, backgrounds, gods, isWin };
}

/**
 * Build a WHERE clause from common filters.
 * Returns the clause string and parameters array.
 * 
 * SECURITY: All values are passed as parameterized query parameters,
 * never interpolated into the SQL string.
 */
export function buildCommonWhereClause(filters: CommonFilters): { where: string; params: unknown[] } {
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
  
  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}
