import { NextRequest, NextResponse } from 'next/server';
import { query } from '@crawl-crawler/game-data-db';
import { parseCommonFilters, buildCommonWhereClause } from '@/lib/analytics-filters';

export const dynamic = 'force-dynamic';

// Allowed dimensions for GROUP BY
const ALLOWED_DIMENSIONS = {
  species: { select: 'r.name', alias: 'species', join: 'races r ON g.race_id = r.id' },
  background: { select: 'b.name', alias: 'background', join: 'backgrounds b ON g.background_id = b.id' },
  combo: { select: 'CONCAT(r.code, b.code)', alias: 'combo', join: null }, // Uses races and backgrounds joins
  god: { select: 'COALESCE(god.name, \'Atheist\')', alias: 'god', join: 'gods god ON g.god_id = god.id' },
  version: { select: 'CONCAT(\'0.\', v.minor)', alias: 'version', join: 'game_versions v ON g.version_id = v.id' },
  is_win: { select: 'g.is_win', alias: 'is_win', join: null },
  runes: { select: 'g.runes_count', alias: 'runes', join: null },
  character_level: { select: 'g.character_level', alias: 'character_level', join: null },
} as const;

type DimensionKey = keyof typeof ALLOWED_DIMENSIONS;

// Allowed metrics for aggregation
const ALLOWED_METRICS = {
  count: { select: 'COUNT(*)', alias: 'count' },
  wins: { select: 'SUM(CASE WHEN g.is_win THEN 1 ELSE 0 END)', alias: 'wins' },
  win_rate: { select: 'ROUND(100.0 * SUM(CASE WHEN g.is_win THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2)', alias: 'win_rate' },
  avg_score: { select: 'ROUND(AVG(g.score))', alias: 'avg_score' },
  max_score: { select: 'MAX(g.score)', alias: 'max_score' },
  min_score: { select: 'MIN(g.score)', alias: 'min_score' },
  avg_turns: { select: 'ROUND(AVG(g.total_turns))', alias: 'avg_turns' },
  avg_runes: { select: 'ROUND(AVG(g.runes_count), 2)', alias: 'avg_runes' },
  avg_xl: { select: 'ROUND(AVG(g.character_level), 1)', alias: 'avg_xl' },
  total_runes: { select: 'SUM(g.runes_count)', alias: 'total_runes' },
} as const;

type MetricKey = keyof typeof ALLOWED_METRICS;

// Validation constants
const MAX_DIMENSIONS = 3;
const MAX_METRICS = 6;
const MAX_RESULTS = 500;

interface AggregateParams {
  groupBy: DimensionKey[];
  metrics: MetricKey[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  limit: number;
}

function parseAggregateParams(searchParams: URLSearchParams): AggregateParams | { error: string } {
  // Parse and validate groupBy
  const groupByParam = searchParams.get('groupBy');
  if (!groupByParam) {
    return { error: 'groupBy parameter is required' };
  }
  
  const groupBy = groupByParam.split(',').filter(Boolean) as DimensionKey[];
  if (groupBy.length === 0) {
    return { error: 'At least one groupBy dimension is required' };
  }
  if (groupBy.length > MAX_DIMENSIONS) {
    return { error: `Maximum ${MAX_DIMENSIONS} dimensions allowed` };
  }
  
  // Validate each dimension
  for (const dim of groupBy) {
    if (!(dim in ALLOWED_DIMENSIONS)) {
      return { error: `Invalid dimension: ${dim}. Allowed: ${Object.keys(ALLOWED_DIMENSIONS).join(', ')}` };
    }
  }
  
  // Parse and validate metrics
  const metricsParam = searchParams.get('metrics');
  const metrics = metricsParam 
    ? metricsParam.split(',').filter(Boolean) as MetricKey[]
    : ['count'] as MetricKey[];
    
  if (metrics.length > MAX_METRICS) {
    return { error: `Maximum ${MAX_METRICS} metrics allowed` };
  }
  
  // Validate each metric
  for (const metric of metrics) {
    if (!(metric in ALLOWED_METRICS)) {
      return { error: `Invalid metric: ${metric}. Allowed: ${Object.keys(ALLOWED_METRICS).join(', ')}` };
    }
  }
  
  // Parse sort parameters
  const sortBy = searchParams.get('sortBy') ?? 'count';
  const sortDirParam = searchParams.get('sortDir')?.toLowerCase();
  const sortDir: 'asc' | 'desc' = sortDirParam === 'asc' ? 'asc' : 'desc';
  
  // Validate sortBy is either a metric or a dimension
  const allAliases: string[] = [
    ...groupBy.map(d => ALLOWED_DIMENSIONS[d].alias),
    ...metrics.map(m => ALLOWED_METRICS[m].alias),
  ];
  if (!allAliases.includes(sortBy)) {
    return { error: `sortBy must be one of: ${allAliases.join(', ')}` };
  }
  
  // Parse limit
  const limitParam = searchParams.get('limit');
  let limit = limitParam ? parseInt(limitParam, 10) : 100;
  if (isNaN(limit) || limit < 1) limit = 100;
  if (limit > MAX_RESULTS) limit = MAX_RESULTS;
  
  return { groupBy, metrics, sortBy, sortDir, limit };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse aggregation parameters
    const aggParams = parseAggregateParams(searchParams);
    if ('error' in aggParams) {
      return NextResponse.json({ error: aggParams.error }, { status: 400 });
    }
    
    const { groupBy, metrics, sortBy, sortDir, limit } = aggParams;
    
    // Parse common filters
    const filters = parseCommonFilters(searchParams);
    
    // Build required JOINs based on dimensions, metrics, and filters
    const requiredJoins = new Set<string>();
    
    // Always need these for filters
    requiredJoins.add('LEFT JOIN races r ON g.race_id = r.id');
    requiredJoins.add('LEFT JOIN backgrounds b ON g.background_id = b.id');
    requiredJoins.add('LEFT JOIN gods god ON g.god_id = god.id');
    requiredJoins.add('LEFT JOIN game_versions v ON g.version_id = v.id');
    
    // Add joins for selected dimensions
    for (const dim of groupBy) {
      const dimConfig = ALLOWED_DIMENSIONS[dim];
      if (dimConfig.join) {
        requiredJoins.add(`LEFT JOIN ${dimConfig.join}`);
      }
    }
    
    // Build SELECT clause
    const selectParts: string[] = [];
    for (const dim of groupBy) {
      const dimConfig = ALLOWED_DIMENSIONS[dim];
      selectParts.push(`${dimConfig.select} AS ${dimConfig.alias}`);
    }
    for (const metric of metrics) {
      const metricConfig = ALLOWED_METRICS[metric];
      selectParts.push(`${metricConfig.select} AS ${metricConfig.alias}`);
    }
    
    // Build GROUP BY clause
    const groupByParts = groupBy.map(dim => ALLOWED_DIMENSIONS[dim].select);
    
    // Build WHERE clause from filters
    const { where, params } = buildCommonWhereClause(filters);
    
    // Build final query
    const sql = `
      SELECT ${selectParts.join(', ')}
      FROM games g
      ${Array.from(requiredJoins).join('\n      ')}
      ${where}
      GROUP BY ${groupByParts.join(', ')}
      ORDER BY ${sortBy} ${sortDir.toUpperCase()} NULLS LAST
      LIMIT $${params.length + 1}
    `;
    
    const result = await query<Record<string, unknown>>(sql, [...params, limit]);
    
    // Also get total count for context
    const countSql = `
      SELECT COUNT(*) as total
      FROM games g
      ${Array.from(requiredJoins).join('\n      ')}
      ${where}
    `;
    const countResult = await query<{ total: string }>(countSql, params);
    const totalGames = parseInt(countResult.rows[0]?.total ?? '0', 10);
    
    return NextResponse.json({
      results: result.rows,
      totalGames,
      groupBy,
      metrics,
      sortBy,
      sortDir,
    });
  } catch (error) {
    console.error('Aggregate API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute aggregation query' },
      { status: 500 }
    );
  }
}
