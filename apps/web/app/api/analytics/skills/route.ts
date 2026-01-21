import { NextRequest, NextResponse } from 'next/server';
import { query } from '@crawl-crawler/game-data-db';
import { parseCommonFilters, buildCommonWhereClause } from '@/lib/analytics-filters';

export const dynamic = 'force-dynamic';

interface SkillHeatmapRow {
  skill_name: string;
  xl: number;
  avg_level: number;
  game_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate filter params
    const filters = parseCommonFilters(searchParams);
    const { where: whereClause, params } = buildCommonWhereClause(filters);
    
    // Get skill progression heatmap data
    const result = await query<SkillHeatmapRow>(`
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
    `, params);
    
    // Also get final skill levels
    const finalSkillsResult = await query<{
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
    `, params);
    
    return NextResponse.json({
      progression: result.rows,
      finalSkills: finalSkillsResult.rows,
    });
  } catch (error) {
    console.error('Skills API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills data' },
      { status: 500 }
    );
  }
}
