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

interface SkillsResult {
  progression: SkillHeatmapRow[];
  finalSkills: Array<{
    skill_name: string;
    avg_level: number;
    max_level: number;
    game_count: number;
  }>;
}

async function getSkillsData(filters: CommonFilters): Promise<SkillsResult> {
  const { where: whereClause, params } = buildCommonWhereClause(filters);

  const [result, finalSkillsResult] = await Promise.all([
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
  ]);

  return {
    progression: result.rows,
    finalSkills: finalSkillsResult.rows,
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
