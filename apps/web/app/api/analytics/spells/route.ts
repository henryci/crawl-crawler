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
import { DB_CACHE_TAG, DB_CACHE_REVALIDATE_SECONDS } from '@/lib/cache';

interface SpellsResult {
  spells: Array<{
    spell_name: string;
    spell_level: number | null;
    game_count: number;
    avg_failure: number | null;
    schools: string;
    percentage: number;
  }>;
  totalGames: number;
}

async function getSpellsData(filters: CommonFilters): Promise<SpellsResult> {
  const { where: whereClause, params } = buildCommonWhereClause(filters);

  const [result, totalResult] = await Promise.all([
    query<{
      spell_name: string;
      spell_level: number | null;
      game_count: number;
      avg_failure: number | null;
      schools: string;
    }>(`
      SELECT 
        sp.name as spell_name,
        sp.level as spell_level,
        COUNT(DISTINCT gs.game_id) as game_count,
        ROUND(AVG(gs.failure_percent)::numeric, 0) as avg_failure,
        COALESCE(
          (SELECT STRING_AGG(DISTINCT ss.name, ', ' ORDER BY ss.name)
           FROM spell_school_mapping ssm
           JOIN spell_schools ss ON ssm.school_id = ss.id
           WHERE ssm.spell_id = sp.id),
          ''
        ) as schools
      FROM game_spells gs
      JOIN spells sp ON gs.spell_id = sp.id
      JOIN games g ON gs.game_id = g.id
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${whereClause}
      GROUP BY sp.id, sp.name, sp.level
      ORDER BY game_count DESC
    `, params),
    query<{ count: string }>(`
      SELECT COUNT(DISTINCT g.id) as count
      FROM games g
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${whereClause}
    `, params),
  ]);

  const totalGames = parseInt(totalResult.rows[0]?.count ?? '0', 10);

  return {
    spells: result.rows.map(row => ({
      ...row,
      percentage: totalGames > 0 ? Math.round((Number(row.game_count) / totalGames) * 100) : 0,
    })),
    totalGames,
  };
}

const fetchSpellsData = unstable_cache(
  async (cacheKey: string) => {
    const filters = commonFiltersFromCacheKey(cacheKey);
    return getSpellsData(filters);
  },
  ['analytics-spells'],
  { tags: [DB_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS }
);

export async function GET(request: NextRequest) {
  try {
    const filters = parseCommonFilters(new URL(request.url).searchParams);
    const data = isCommonFiltersCacheable(filters)
      ? await fetchSpellsData(commonFiltersCacheKey(filters))
      : await getSpellsData(filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Spells API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spells data' },
      { status: 500 }
    );
  }
}
