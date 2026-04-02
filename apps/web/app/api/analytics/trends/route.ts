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
import { DB_CACHE_TAG, DB_CACHE_REVALIDATE_SECONDS } from '@/lib/cache';

interface TrendsParams {
  track: DimensionKey;
  over: DimensionKey;
  metric: MetricKey;
  topN: number;
}

interface TrendsResult {
  track: DimensionKey;
  over: DimensionKey;
  metric: MetricKey;
  topN: number;
  overValues: string[];
  series: Array<{
    name: string;
    data: Array<{ over: string; value: number; rank: number }>;
  }>;
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

async function getTrendsData(
  trendsParams: TrendsParams,
  filters: CommonFilters
): Promise<TrendsResult> {
    const { track, over, metric, topN } = trendsParams;
    const { where, params } = buildCommonWhereClause(filters);

    const trackConfig = DIMENSIONS[track];
    const metricConfig = METRICS[metric];
    const overSelectRaw = getDimensionSelectForTrends(over);
    const overAlias = DIMENSIONS[over].alias;

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

    const byOver = new Map<string | number, Array<{ item: string; value: number; rank: number }>>();
    const topItems = new Set<string>();

    for (const row of result.rows) {
      const overValue = row[overAlias] as string | number;
      const item = row[trackConfig.alias] as string;
      const value = Number(row[metricConfig.alias]) || 0;

      if (!byOver.has(overValue)) {
        byOver.set(overValue, []);
      }
      byOver.get(overValue)!.push({ item, value, rank: 0 });
    }

    for (const [, items] of byOver) {
      items.sort((a, b) => b.value - a.value);
      items.forEach((item, index) => {
        item.rank = index + 1;
        if (index < topN) {
          topItems.add(item.item);
        }
      });
    }

    const overValues = Array.from(byOver.keys()).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });

    const formatter = DIMENSION_FORMATTERS[over] || ((v: number) => String(v));

    const series: Array<{
      name: string;
      data: Array<{ over: string; value: number; rank: number }>;
    }> = [];

    for (const item of topItems) {
      const data: Array<{ over: string; value: number; rank: number }> = [];

      for (const overValue of overValues) {
        const items = byOver.get(overValue)!;
        const found = items.find(i => i.item === item);
        const formattedOver = formatter(overValue as number);

        if (found) {
          data.push({ over: formattedOver, value: found.value, rank: found.rank });
        } else {
          data.push({ over: formattedOver, value: 0, rank: 0 });
        }
      }

      series.push({ name: item, data });
    }

    series.sort((a, b) => {
      const bestRankA = Math.min(...a.data.filter(d => d.rank > 0).map(d => d.rank));
      const bestRankB = Math.min(...b.data.filter(d => d.rank > 0).map(d => d.rank));
      return bestRankA - bestRankB;
    });

    return {
      track,
      over,
      metric,
      topN,
      overValues: overValues.map(v => formatter(v as number)),
      series,
    };
}

const fetchTrendsData = unstable_cache(
  async (cacheKey: string) => {
    const parsed = JSON.parse(cacheKey) as {
      trendsParams: TrendsParams;
      commonFiltersKey: string;
    };
    return getTrendsData(
      parsed.trendsParams,
      commonFiltersFromCacheKey(parsed.commonFiltersKey)
    );
  },
  ['analytics-trends'],
  { tags: [DB_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS }
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const trendsParams = parseTrendsParams(searchParams);
    if ('error' in trendsParams) {
      return NextResponse.json({ error: trendsParams.error }, { status: 400 });
    }
    const filters = parseCommonFilters(searchParams);
    const data = isCommonFiltersCacheable(filters)
      ? await fetchTrendsData(JSON.stringify({
          trendsParams,
          commonFiltersKey: commonFiltersCacheKey(filters),
        }))
      : await getTrendsData(trendsParams, filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends data' },
      { status: 500 }
    );
  }
}
