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
  DIMENSIONS,
  METRICS,
  MAX_DIMENSIONS,
  MAX_METRICS,
  MAX_RESULTS,
  isValidDimension,
  isValidMetric,
  type DimensionKey,
  type MetricKey,
} from '@/lib/analytics-types';
import { DB_CACHE_TAG, DB_CACHE_REVALIDATE_SECONDS } from '@/lib/cache';

interface AggregateParams {
  groupBy: DimensionKey[];
  metrics: MetricKey[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  limit: number;
  offset: number;
}

interface AggregateResult {
  results: Record<string, unknown>[];
  totalGames: number;
  totalWins: number;
  totalGroups: number;
  groupBy: DimensionKey[];
  metrics: MetricKey[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  limit: number;
  offset: number;
}

function parseAggregateParams(searchParams: URLSearchParams): AggregateParams | { error: string } {
  // Parse and validate groupBy
  const groupByParam = searchParams.get('groupBy');
  if (!groupByParam) {
    return { error: 'groupBy parameter is required' };
  }
  
  const groupByRaw = groupByParam.split(',').filter(Boolean);
  if (groupByRaw.length === 0) {
    return { error: 'At least one groupBy dimension is required' };
  }
  if (groupByRaw.length > MAX_DIMENSIONS) {
    return { error: `Maximum ${MAX_DIMENSIONS} dimensions allowed` };
  }
  
  // Validate each dimension
  const groupBy: DimensionKey[] = [];
  for (const dim of groupByRaw) {
    if (!isValidDimension(dim)) {
      return { error: `Invalid dimension: ${dim}. Allowed: ${Object.keys(DIMENSIONS).join(', ')}` };
    }
    groupBy.push(dim);
  }
  
  // Parse and validate metrics
  const metricsParam = searchParams.get('metrics');
  const metricsRaw = metricsParam 
    ? metricsParam.split(',').filter(Boolean)
    : ['count'];
    
  if (metricsRaw.length > MAX_METRICS) {
    return { error: `Maximum ${MAX_METRICS} metrics allowed` };
  }
  
  // Validate each metric
  const metrics: MetricKey[] = [];
  for (const metric of metricsRaw) {
    if (!isValidMetric(metric)) {
      return { error: `Invalid metric: ${metric}. Allowed: ${Object.keys(METRICS).join(', ')}` };
    }
    metrics.push(metric);
  }
  
  // Parse sort parameters
  const sortBy = searchParams.get('sortBy') ?? 'count';
  const sortDirParam = searchParams.get('sortDir')?.toLowerCase();
  const sortDir: 'asc' | 'desc' = sortDirParam === 'asc' ? 'asc' : 'desc';
  
  // Validate sortBy is either a metric or a dimension
  const allAliases: string[] = [
    ...groupBy.map(d => DIMENSIONS[d].alias),
    ...metrics.map(m => METRICS[m].alias),
  ];
  if (!allAliases.includes(sortBy)) {
    return { error: `sortBy must be one of: ${allAliases.join(', ')}` };
  }
  
  // Parse limit
  const limitParam = searchParams.get('limit');
  let limit = limitParam ? parseInt(limitParam, 10) : 100;
  if (isNaN(limit) || limit < 1) limit = 100;
  if (limit > MAX_RESULTS) limit = MAX_RESULTS;
  
  // Parse offset
  const offsetParam = searchParams.get('offset');
  let offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  if (isNaN(offset) || offset < 0) offset = 0;
  
  return { groupBy, metrics, sortBy, sortDir, limit, offset };
}

async function getAggregateData(
  aggParams: AggregateParams,
  filters: CommonFilters
): Promise<AggregateResult> {
    const { groupBy, metrics, sortBy, sortDir, limit, offset } = aggParams;

    const requiredJoins = new Set<string>();
    requiredJoins.add('LEFT JOIN races r ON g.race_id = r.id');
    requiredJoins.add('LEFT JOIN backgrounds b ON g.background_id = b.id');
    requiredJoins.add('LEFT JOIN gods god ON g.god_id = god.id');
    requiredJoins.add('LEFT JOIN game_versions v ON g.version_id = v.id');

    for (const dim of groupBy) {
      const dimConfig = DIMENSIONS[dim];
      if (dimConfig.join) {
        requiredJoins.add(`LEFT JOIN ${dimConfig.join}`);
      }
    }

    const selectParts: string[] = [];
    for (const dim of groupBy) {
      const dimConfig = DIMENSIONS[dim];
      selectParts.push(`${dimConfig.sql} AS ${dimConfig.alias}`);
    }
    for (const metric of metrics) {
      const metricConfig = METRICS[metric];
      selectParts.push(`${metricConfig.sql} AS ${metricConfig.alias}`);
    }

    const groupByParts = groupBy.map(dim => DIMENSIONS[dim].sql);
    const { where, params } = buildCommonWhereClause(filters);

    const sql = `
      SELECT ${selectParts.join(', ')}
      FROM games g
      ${Array.from(requiredJoins).join('\n      ')}
      ${where}
      GROUP BY ${groupByParts.join(', ')}
      ORDER BY ${sortBy} ${sortDir.toUpperCase()} NULLS LAST
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const result = await query<Record<string, unknown>>(sql, [...params, limit, offset]);

    const countSql = `
      SELECT COUNT(*) as total_games,
             SUM(CASE WHEN g.is_win THEN 1 ELSE 0 END) as total_wins
      FROM games g
      ${Array.from(requiredJoins).join('\n      ')}
      ${where}
    `;

    const groupCountSql = `
      SELECT COUNT(*) as total FROM (
        SELECT 1
        FROM games g
        ${Array.from(requiredJoins).join('\n        ')}
        ${where}
        GROUP BY ${groupByParts.join(', ')}
      ) subquery
    `;

    const [countResult, groupCountResult] = await Promise.all([
      query<{ total_games: string; total_wins: string }>(countSql, params),
      query<{ total: string }>(groupCountSql, params),
    ]);

    const totalGames = parseInt(countResult.rows[0]?.total_games ?? '0', 10);
    const totalWins = parseInt(countResult.rows[0]?.total_wins ?? '0', 10);
    const totalGroups = parseInt(groupCountResult.rows[0]?.total ?? '0', 10);

    return {
      results: result.rows,
      totalGames,
      totalWins,
      totalGroups,
      groupBy,
      metrics,
      sortBy,
      sortDir,
      limit,
      offset,
    };
}

const fetchAggregateData = unstable_cache(
  async (cacheKey: string) => {
    const parsed = JSON.parse(cacheKey) as {
      aggParams: AggregateParams;
      commonFiltersKey: string;
    };
    return getAggregateData(
      parsed.aggParams,
      commonFiltersFromCacheKey(parsed.commonFiltersKey)
    );
  },
  ['analytics-aggregate'],
  { tags: [DB_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS }
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const aggParams = parseAggregateParams(searchParams);
    if ('error' in aggParams) {
      return NextResponse.json({ error: aggParams.error }, { status: 400 });
    }
    const filters = parseCommonFilters(searchParams);
    const data = isCommonFiltersCacheable(filters)
      ? await fetchAggregateData(JSON.stringify({
          aggParams,
          commonFiltersKey: commonFiltersCacheKey(filters),
        }))
      : await getAggregateData(aggParams, filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Aggregate API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute aggregation query' },
      { status: 500 }
    );
  }
}
