import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { query } from '@crawl-crawler/game-data-db';
import {
  parseCommonFilters,
  buildCommonWhereClause,
  commonFiltersCacheKey,
  commonFiltersFromCacheKey,
  isCommonFiltersCacheable,
  type CommonFilters,
} from '@/lib/analytics-filters';
import {
  DB_CACHE_TAG,
  DB_CACHE_REVALIDATE_SECONDS,
  buildCacheDebugHeaders,
} from '@/lib/cache';

interface SkillHeatmapRow {
  skill_name: string;
  xl: number;
  avg_level: number;
  game_count: number;
}

interface FinalSkillDistributionRow {
  skill_name: string;
  level_bucket: string;
  bucket_order: number;
  game_count: number;
}

interface CapstoneSkillRow {
  skill_name: string;
  games_15_plus: number;
  games_20_plus: number;
  avg_level: number;
}

interface SkillsResult {
  totalGames: number;
  progression: SkillHeatmapRow[];
  finalSkills: Array<{
    skill_name: string;
    avg_level: number;
    max_level: number;
    game_count: number;
  }>;
  finalDistribution: FinalSkillDistributionRow[];
  capstoneSkills: Array<{
    skill_name: string;
    games_15_plus: number;
    games_20_plus: number;
    pct_15_plus: number;
    pct_20_plus: number;
    avg_level: number;
  }>;
}

async function getSkillsData(filters: CommonFilters): Promise<SkillsResult> {
  const { where: whereClause, params } = buildCommonWhereClause(filters);

  const [result, finalSkillsResult, totalGamesResult, distributionResult, capstoneResult] = await Promise.all([
    query<SkillHeatmapRow>(`
      SELECT 
        s.name as skill_name,
        gsp.xl,
        ROUND(AVG(gsp.skill_level)::numeric, 1) as avg_level,
        COUNT(DISTINCT gsp.game_id) as game_count
      FROM game_skill_progression gsp
      JOIN skills s ON gsp.skill_id = s.id
      JOIN games g ON gsp.game_id = g.id
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${whereClause}
      GROUP BY s.name, gsp.xl
      ORDER BY s.name, gsp.xl
    `, params),
    query<{
      skill_name: string;
      avg_level: number;
      max_level: number;
      game_count: number;
    }>(`
      SELECT 
        s.name as skill_name,
        ROUND(AVG(gs.level)::numeric, 1) as avg_level,
        MAX(gs.level) as max_level,
        COUNT(DISTINCT gs.game_id) as game_count
      FROM game_skills gs
      JOIN skills s ON gs.skill_id = s.id
      JOIN games g ON gs.game_id = g.id
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${whereClause}
      GROUP BY s.name
      ORDER BY avg_level DESC
    `, params),
    query<{ total_games: number }>(`
      SELECT COUNT(DISTINCT g.id) as total_games
      FROM games g
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${whereClause}
    `, params),
    query<FinalSkillDistributionRow>(`
      SELECT
        s.name as skill_name,
        CASE
          WHEN gs.level = 0 THEN '0'
          WHEN gs.level BETWEEN 1 AND 4 THEN '1-4'
          WHEN gs.level BETWEEN 5 AND 9 THEN '5-9'
          WHEN gs.level BETWEEN 10 AND 14 THEN '10-14'
          WHEN gs.level BETWEEN 15 AND 19 THEN '15-19'
          WHEN gs.level BETWEEN 20 AND 26 THEN '20-26'
          ELSE '27'
        END as level_bucket,
        CASE
          WHEN gs.level = 0 THEN 0
          WHEN gs.level BETWEEN 1 AND 4 THEN 1
          WHEN gs.level BETWEEN 5 AND 9 THEN 2
          WHEN gs.level BETWEEN 10 AND 14 THEN 3
          WHEN gs.level BETWEEN 15 AND 19 THEN 4
          WHEN gs.level BETWEEN 20 AND 26 THEN 5
          ELSE 6
        END as bucket_order,
        COUNT(DISTINCT gs.game_id) as game_count
      FROM game_skills gs
      JOIN skills s ON gs.skill_id = s.id
      JOIN games g ON gs.game_id = g.id
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${whereClause}
      GROUP BY s.name, level_bucket, bucket_order
      ORDER BY s.name, bucket_order
    `, params),
    query<CapstoneSkillRow>(`
      SELECT
        s.name as skill_name,
        COUNT(DISTINCT CASE WHEN gs.level >= 15 THEN gs.game_id END) as games_15_plus,
        COUNT(DISTINCT CASE WHEN gs.level >= 20 THEN gs.game_id END) as games_20_plus,
        ROUND(AVG(gs.level)::numeric, 1) as avg_level
      FROM game_skills gs
      JOIN skills s ON gs.skill_id = s.id
      JOIN games g ON gs.game_id = g.id
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${whereClause}
      GROUP BY s.name
      ORDER BY games_20_plus DESC, games_15_plus DESC, avg_level DESC
    `, params),
  ]);

  const totalGames = Number(totalGamesResult.rows[0]?.total_games ?? 0);

  return {
    totalGames,
    progression: result.rows,
    finalSkills: finalSkillsResult.rows,
    finalDistribution: distributionResult.rows,
    capstoneSkills: capstoneResult.rows.map((row) => {
      const games15 = Number(row.games_15_plus);
      const games20 = Number(row.games_20_plus);
      return {
        skill_name: row.skill_name,
        games_15_plus: games15,
        games_20_plus: games20,
        pct_15_plus: totalGames > 0 ? Number(((games15 / totalGames) * 100).toFixed(1)) : 0,
        pct_20_plus: totalGames > 0 ? Number(((games20 / totalGames) * 100).toFixed(1)) : 0,
        avg_level: Number(row.avg_level),
      };
    }),
  };
}

const fetchSkillsData = unstable_cache(
  async (cacheKey: string) => {
    const filters = commonFiltersFromCacheKey(cacheKey);
    return {
      data: await getSkillsData(filters),
      cachedAtUnixMs: Date.now(),
    };
  },
  ['analytics-skills'],
  { tags: [DB_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS }
);

export async function GET(request: NextRequest) {
  try {
    const filters = parseCommonFilters(new URL(request.url).searchParams);
    const cacheable = isCommonFiltersCacheable(filters);
    if (cacheable) {
      const cached = await fetchSkillsData(commonFiltersCacheKey(filters));
      return NextResponse.json(cached.data, {
        headers: buildCacheDebugHeaders({
          route: '/api/analytics/skills',
          cacheable: true,
          cachedAtUnixMs: cached.cachedAtUnixMs,
        }),
      });
    }

    const data = await getSkillsData(filters);
    return NextResponse.json(data, {
      headers: buildCacheDebugHeaders({
        route: '/api/analytics/skills',
        cacheable: false,
      }),
    });
  } catch (error) {
    console.error('Skills API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills data' },
      { status: 500 }
    );
  }
}
