import { NextRequest, NextResponse } from 'next/server';
import { query } from '@crawl-crawler/game-data-db';
import { parseCommonFilters, buildCommonWhereClause } from '@/lib/analytics-filters';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate filter params
    const filters = parseCommonFilters(searchParams);
    const { where: whereClause, params } = buildCommonWhereClause(filters);
    
    // Get spell popularity
    const result = await query<{
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
      ${whereClause}
      GROUP BY sp.id, sp.name, sp.level
      ORDER BY game_count DESC
    `, params);
    
    // Get total games for percentage calculation
    const totalResult = await query<{ count: string }>(`
      SELECT COUNT(DISTINCT g.id) as count
      FROM games g
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      ${whereClause}
    `, params);
    
    const totalGames = parseInt(totalResult.rows[0]?.count ?? '0', 10);
    
    return NextResponse.json({
      spells: result.rows.map(row => ({
        ...row,
        percentage: totalGames > 0 ? Math.round((Number(row.game_count) / totalGames) * 100) : 0,
      })),
      totalGames,
    });
  } catch (error) {
    console.error('Spells API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spells data' },
      { status: 500 }
    );
  }
}
