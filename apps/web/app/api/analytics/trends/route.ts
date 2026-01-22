import { NextRequest, NextResponse } from 'next/server';
import { query } from '@crawl-crawler/game-data-db';
import { parseCommonFilters, buildCommonWhereClause } from '@/lib/analytics-filters';
import {
  DIMENSIONS,
  METRICS,
  DIMENSION_FORMATTERS,
  MAX_TOP_N,
  DEFAULT_TOP_N,
  isValidTrackDimension,
  isValidOverDimension,
  isValidTrendMetric,
  getDimensionSelectForTrends,
  type DimensionKey,
  type MetricKey,
} from '@/lib/analytics-types';

export const dynamic = 'force-dynamic';

interface TrendsParams {
  track: DimensionKey;
  over: DimensionKey;
  metric: MetricKey;
  topN: number;
}

function parseTrendsParams(searchParams: URLSearchParams): TrendsParams | { error: string } {
  const track = searchParams.get('track');
  if (!track || !isValidTrackDimension(track)) {
    return { error: `Invalid track dimension. Allowed: combo, species, background, god` };
  }

  const over = searchParams.get('over');
  if (!over || !isValidOverDimension(over)) {
    return { error: `Invalid over dimension. Allowed: version, runes, character_level` };
  }

  const metric = searchParams.get('metric') || 'count';
  if (!isValidTrendMetric(metric)) {
    return { error: `Invalid metric. Allowed: count, wins, win_rate` };
  }

  const topNParam = searchParams.get('topN');
  let topN = topNParam ? parseInt(topNParam, 10) : DEFAULT_TOP_N;
  if (isNaN(topN) || topN < 1) topN = DEFAULT_TOP_N;
  if (topN > MAX_TOP_N) topN = MAX_TOP_N;

  return { 
    track: track as DimensionKey, 
    over: over as DimensionKey, 
    metric: metric as MetricKey, 
    topN 
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse trends parameters
    const trendsParams = parseTrendsParams(searchParams);
    if ('error' in trendsParams) {
      return NextResponse.json({ error: trendsParams.error }, { status: 400 });
    }

    const { track, over, metric, topN } = trendsParams;

    // Parse common filters
    const filters = parseCommonFilters(searchParams);
    const { where, params } = buildCommonWhereClause(filters);

    const trackConfig = DIMENSIONS[track];
    const metricConfig = METRICS[metric];
    
    // For "over" dimension in trends, we need the raw value for sorting
    const overSelectRaw = getDimensionSelectForTrends(over);
    const overAlias = DIMENSIONS[over].alias;

    // Query: Get all data grouped by track dimension and over dimension
    const sql = `
      SELECT 
        ${trackConfig.sql} AS ${trackConfig.alias},
        ${overSelectRaw} AS ${overAlias},
        ${metricConfig.sql} AS ${metricConfig.alias}
      FROM games g
      LEFT JOIN races r ON g.race_id = r.id
      LEFT JOIN backgrounds b ON g.background_id = b.id
      LEFT JOIN gods god ON g.god_id = god.id
      LEFT JOIN game_versions v ON g.version_id = v.id
      ${where}
      GROUP BY ${trackConfig.sql}, ${overSelectRaw}
      HAVING ${metricConfig.sql} > 0
      ORDER BY ${overSelectRaw}, ${metricConfig.alias} DESC
    `;

    const result = await query<Record<string, unknown>>(sql, params);

    // Process results: for each "over" value, rank the items and keep top N
    // Then collect all items that appear in top N for any "over" value
    const byOver = new Map<string | number, Array<{ item: string; value: number; rank: number }>>();
    const topItems = new Set<string>();

    // Group by "over" dimension
    for (const row of result.rows) {
      const overValue = row[overAlias] as string | number;
      const item = row[trackConfig.alias] as string;
      const value = Number(row[metricConfig.alias]) || 0;

      if (!byOver.has(overValue)) {
        byOver.set(overValue, []);
      }
      byOver.get(overValue)!.push({ item, value, rank: 0 });
    }

    // Sort and rank within each "over" value, collect top N items
    for (const [, items] of byOver) {
      items.sort((a, b) => b.value - a.value);
      items.forEach((item, index) => {
        item.rank = index + 1;
        if (index < topN) {
          topItems.add(item.item);
        }
      });
    }

    // Get sorted list of "over" values
    const overValues = Array.from(byOver.keys()).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });

    // Get the formatter for this dimension
    const formatter = DIMENSION_FORMATTERS[over] || ((v: number) => String(v));

    // Build series data for each top item
    const series: Array<{
      name: string;
      data: Array<{ over: string; value: number; rank: number }>;
    }> = [];

    for (const item of topItems) {
      const data: Array<{ over: string; value: number; rank: number }> = [];

      for (const overValue of overValues) {
        const items = byOver.get(overValue)!;
        const found = items.find(i => i.item === item);
        
        // Format the over value for display
        const formattedOver = formatter(overValue as number);
        
        if (found) {
          data.push({ over: formattedOver, value: found.value, rank: found.rank });
        } else {
          // Item doesn't exist for this "over" value
          data.push({ over: formattedOver, value: 0, rank: 0 });
        }
      }

      series.push({ name: item, data });
    }

    // Sort series by their best (lowest) rank achieved
    series.sort((a, b) => {
      const bestRankA = Math.min(...a.data.filter(d => d.rank > 0).map(d => d.rank));
      const bestRankB = Math.min(...b.data.filter(d => d.rank > 0).map(d => d.rank));
      return bestRankA - bestRankB;
    });

    return NextResponse.json({
      track,
      over,
      metric,
      topN,
      overValues: overValues.map(v => formatter(v as number)),
      series,
    });
  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends data' },
      { status: 500 }
    );
  }
}
