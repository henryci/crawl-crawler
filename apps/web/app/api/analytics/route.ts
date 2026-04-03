import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { query } from '@crawl-crawler/game-data-db';
import {
  LEGACY_SPECIES_NAMES,
  LEGACY_BACKGROUND_NAMES,
} from 'dcss-game-data';
import {
  DB_CACHE_TAG,
  DB_CACHE_REVALIDATE_SECONDS,
  buildCacheDebugHeaders,
} from '@/lib/cache';

interface FilterParams {
  races?: string[];
  backgrounds?: string[];
  gods?: string[];
  isWin?: boolean;
  minVersion?: string;
  maxVersion?: string;
  minRunes?: number;
  maxRunes?: number;
  minTurns?: number;
  maxTurns?: number;
  minScore?: number;
  maxScore?: number;
  skillFilters?: Array<{
    skillName: string;
    skillLevel: number;
    skillLevelMode: 'gte' | 'lt' | 'eq';
  }>;
  player?: string;
  excludeLegacy?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

interface AnalyticsResult {
  games: Array<{
    id: number;
    player_name: string;
    score: number;
    race: string;
    background: string;
    god: string | null;
    character_level: number;
    is_win: boolean;
    runes_count: number;
    total_turns: number;
    end_date: string | null;
    version: string | null;
    title: string | null;
    morgue_hash: string | null;
  }>;
  totalCount: number;
  totalGamesCount: number;
  limit: number;
  offset: number;
}

// Valid sort columns (maps API param to SQL column)
const VALID_SORT_COLUMNS: Record<string, string> = {
  score: 'g.score',
  player_name: 'g.player_name',
  god: 'god.name',
  character_level: 'g.character_level',
  runes_count: 'g.runes_count',
  total_turns: 'g.total_turns',
  end_date: 'g.end_date',
  version: 'v.minor',
};

// Validation helpers
const MAX_STRING_LENGTH = 100;
const MAX_ARRAY_LENGTH = 50;

function sanitizeString(value: string | null, maxLength = MAX_STRING_LENGTH): string | null {
  if (!value) return null;
  // Trim and limit length to prevent DoS via extremely long strings
  return value.trim().slice(0, maxLength);
}

function sanitizeStringArray(value: string | null, maxLength = MAX_ARRAY_LENGTH): string[] | null {
  if (!value) return null;
  const items = value.split(',')
    .map(s => s.trim().slice(0, MAX_STRING_LENGTH))
    .filter(Boolean)
    .slice(0, maxLength);
  return items.length > 0 ? items : null;
}

function sanitizeInt(value: string | null, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return null;
  return Math.max(min, Math.min(max, parsed));
}

function parseFilters(searchParams: URLSearchParams): FilterParams {
  const filters: FilterParams = {};
  
  const races = sanitizeStringArray(searchParams.get('races'));
  if (races) filters.races = races;
  
  const backgrounds = sanitizeStringArray(searchParams.get('backgrounds'));
  if (backgrounds) filters.backgrounds = backgrounds;
  
  const gods = sanitizeStringArray(searchParams.get('gods'));
  if (gods) filters.gods = gods;
  
  const isWin = searchParams.get('isWin');
  if (isWin === 'true') filters.isWin = true;
  else if (isWin === 'false') filters.isWin = false;
  
  const minVersion = sanitizeString(searchParams.get('minVersion'), 20);
  if (minVersion) filters.minVersion = minVersion;
  
  const maxVersion = sanitizeString(searchParams.get('maxVersion'), 20);
  if (maxVersion) filters.maxVersion = maxVersion;
  
  const minRunes = sanitizeInt(searchParams.get('minRunes'), 0, 15);
  if (minRunes !== null) filters.minRunes = minRunes;
  
  const maxRunes = sanitizeInt(searchParams.get('maxRunes'), 0, 15);
  if (maxRunes !== null) filters.maxRunes = maxRunes;
  
  const minTurns = sanitizeInt(searchParams.get('minTurns'), 0);
  if (minTurns !== null) filters.minTurns = minTurns;
  
  const maxTurns = sanitizeInt(searchParams.get('maxTurns'), 0);
  if (maxTurns !== null) filters.maxTurns = maxTurns;
  
  const minScore = sanitizeInt(searchParams.get('minScore'), 0);
  if (minScore !== null) filters.minScore = minScore;
  
  const maxScore = sanitizeInt(searchParams.get('maxScore'), 0);
  if (maxScore !== null) filters.maxScore = maxScore;

  const skillFilters: NonNullable<FilterParams['skillFilters']> = [];
  for (const suffix of ['', '2', '3']) {
    const skillName = sanitizeString(searchParams.get(`skillName${suffix}`));
    const skillLevel = sanitizeInt(searchParams.get(`skillLevel${suffix}`), 0, 27);
    if (skillName && skillLevel !== null) {
      const skillLevelMode = searchParams.get(`skillLevelMode${suffix}`);
      skillFilters.push({
        skillName,
        skillLevel,
        skillLevelMode: skillLevelMode === 'lt' ? 'lt' : skillLevelMode === 'eq' ? 'eq' : 'gte',
      });
    }
  }
  if (skillFilters.length > 0) {
    filters.skillFilters = skillFilters;
  }
  
  const player = sanitizeString(searchParams.get('player'));
  if (player) filters.player = player;
  
  const excludeLegacy = searchParams.get('excludeLegacy');
  if (excludeLegacy === 'true') filters.excludeLegacy = true;
  
  // Limit and offset with strict bounds
  const limit = sanitizeInt(searchParams.get('limit'), 1, 1000);
  filters.limit = limit ?? 100;
  
  const offset = sanitizeInt(searchParams.get('offset'), 0, 100000);
  filters.offset = offset ?? 0;
  
  // Sort parameters
  const sortBy = sanitizeString(searchParams.get('sortBy'), 50);
  if (sortBy && sortBy in VALID_SORT_COLUMNS) {
    filters.sortBy = sortBy;
  }
  
  const sortDir = searchParams.get('sortDir');
  if (sortDir === 'asc' || sortDir === 'desc') {
    filters.sortDir = sortDir;
  }
  
  return filters;
}

function buildWhereClause(filters: FilterParams): { where: string; params: unknown[] } {
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
  
  if (filters.isWin !== undefined) {
    conditions.push(`g.is_win = $${paramIndex}`);
    params.push(filters.isWin);
    paramIndex++;
  }
  
  if (filters.minRunes !== undefined) {
    conditions.push(`g.runes_count >= $${paramIndex}`);
    params.push(filters.minRunes);
    paramIndex++;
  }
  
  if (filters.maxRunes !== undefined) {
    conditions.push(`g.runes_count <= $${paramIndex}`);
    params.push(filters.maxRunes);
    paramIndex++;
  }
  
  if (filters.minTurns !== undefined) {
    conditions.push(`g.total_turns >= $${paramIndex}`);
    params.push(filters.minTurns);
    paramIndex++;
  }
  
  if (filters.maxTurns !== undefined) {
    conditions.push(`g.total_turns <= $${paramIndex}`);
    params.push(filters.maxTurns);
    paramIndex++;
  }
  
  if (filters.minScore !== undefined) {
    conditions.push(`g.score >= $${paramIndex}`);
    params.push(filters.minScore);
    paramIndex++;
  }
  
  if (filters.maxScore !== undefined) {
    conditions.push(`g.score <= $${paramIndex}`);
    params.push(filters.maxScore);
    paramIndex++;
  }

  for (const skillFilter of filters.skillFilters ?? []) {
    if (skillFilter.skillLevelMode === 'lt') {
      conditions.push(`NOT EXISTS (
        SELECT 1
        FROM game_skills gs
        JOIN skills sf ON gs.skill_id = sf.id
        WHERE gs.game_id = g.id
          AND sf.name = $${paramIndex}
          AND gs.level >= $${paramIndex + 1}
      )`);
    } else if (skillFilter.skillLevelMode === 'eq') {
      conditions.push(`EXISTS (
        SELECT 1
        FROM game_skills gs
        JOIN skills sf ON gs.skill_id = sf.id
        WHERE gs.game_id = g.id
          AND sf.name = $${paramIndex}
          AND gs.level = $${paramIndex + 1}
      )`);
    } else {
      conditions.push(`EXISTS (
        SELECT 1
        FROM game_skills gs
        JOIN skills sf ON gs.skill_id = sf.id
        WHERE gs.game_id = g.id
          AND sf.name = $${paramIndex}
          AND gs.level >= $${paramIndex + 1}
      )`);
    }
    params.push(skillFilter.skillName, skillFilter.skillLevel);
    paramIndex += 2;
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

function normalizeArray(values: string[] | undefined): string[] | undefined {
  if (!values || values.length === 0) return undefined;
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function isCacheable(filters: FilterParams): boolean {
  return !filters.player;
}

function analyticsCacheKey(filters: FilterParams): string {
  return JSON.stringify({
    races: normalizeArray(filters.races),
    backgrounds: normalizeArray(filters.backgrounds),
    gods: normalizeArray(filters.gods),
    isWin: filters.isWin,
    minVersion: filters.minVersion,
    maxVersion: filters.maxVersion,
    minRunes: filters.minRunes,
    maxRunes: filters.maxRunes,
    minTurns: filters.minTurns,
    maxTurns: filters.maxTurns,
    minScore: filters.minScore,
    maxScore: filters.maxScore,
    skillFilters: filters.skillFilters ?? [],
    excludeLegacy: filters.excludeLegacy === true,
    limit: filters.limit ?? 100,
    offset: filters.offset ?? 0,
    sortBy: filters.sortBy ?? 'score',
    sortDir: filters.sortDir ?? 'desc',
  });
}

async function getAnalyticsData(filters: FilterParams): Promise<AnalyticsResult> {
  const { where, params } = buildWhereClause(filters);

  const [countResult, totalGamesResult] = await Promise.all([
    query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM games g
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${where}
    `, params),
    query<{ count: string }>('SELECT COUNT(*) as count FROM games'),
  ]);

  const totalCount = parseInt(countResult.rows[0]?.count ?? '0', 10);
  const totalGamesCount = parseInt(totalGamesResult.rows[0]?.count ?? '0', 10);

  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  const sortColumn = filters.sortBy ? VALID_SORT_COLUMNS[filters.sortBy] : 'g.score';
  const sortDirection = filters.sortDir ?? 'desc';
  const orderBy = `ORDER BY ${sortColumn} ${sortDirection.toUpperCase()} NULLS LAST`;

  const gamesResult = await query<AnalyticsResult['games'][number]>(`
      SELECT 
        g.id,
        g.player_name,
        g.score,
        r.name as race,
        b.name as background,
        god.name as god,
        g.character_level,
        g.is_win,
        g.runes_count,
        g.total_turns,
        g.end_date::text,
        v.version,
        g.title,
        g.morgue_hash
      FROM games g
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${where}
      ${orderBy}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `, [...params, filters.limit, filters.offset]);

  return {
    games: gamesResult.rows,
    totalCount,
    totalGamesCount,
    limit: filters.limit ?? 100,
    offset: filters.offset ?? 0,
  };
}

const fetchAnalyticsData = unstable_cache(
  async (cacheKey: string) => {
    const filters = JSON.parse(cacheKey) as FilterParams;
    return {
      data: await getAnalyticsData(filters),
      cachedAtUnixMs: Date.now(),
    };
  },
  ['analytics'],
  { tags: [DB_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS }
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const filters = parseFilters(searchParams);
    const cacheable = isCacheable(filters);
    if (cacheable) {
      const cached = await fetchAnalyticsData(analyticsCacheKey(filters));
      return NextResponse.json(cached.data, {
        headers: buildCacheDebugHeaders({
          route: '/api/analytics',
          cacheable: true,
          cachedAtUnixMs: cached.cachedAtUnixMs,
        }),
      });
    }

    const data = await getAnalyticsData(filters);
    return NextResponse.json(data, {
      headers: buildCacheDebugHeaders({
        route: '/api/analytics',
        cacheable: false,
      }),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
