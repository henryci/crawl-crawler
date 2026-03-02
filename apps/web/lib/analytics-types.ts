/**
 * Shared analytics configuration for dimensions and metrics.
 * Used by both frontend components and backend API routes.
 */

// =============================================================================
// DIMENSIONS - What we can group by or track
// =============================================================================

export interface DimensionConfig {
  value: string;
  label: string;
  icon: string;
  /** SQL select expression for this dimension */
  sql: string;
  /** SQL alias for the result column */
  alias: string;
  /** JOIN clause needed for this dimension (null if no additional join needed) */
  join: string | null;
  /** Format function for display (used for ordinal dimensions) */
  format?: (v: number) => string;
}

/**
 * All available dimensions for grouping/tracking.
 * These are used in Breakdown, Trends, and other analytics features.
 */
export const DIMENSIONS = {
  species: {
    value: "species",
    label: "Species",
    icon: "🐉",
    sql: "r.name",
    alias: "species",
    join: "races r ON g.race_id = r.id",
  },
  background: {
    value: "background",
    label: "Background",
    icon: "⚔️",
    sql: "b.name",
    alias: "background",
    join: "backgrounds b ON g.background_id = b.id",
  },
  combo: {
    value: "combo",
    label: "Combo",
    icon: "🎲",
    sql: "CONCAT(r.code, b.code)",
    alias: "combo",
    join: null, // Uses races and backgrounds joins
  },
  god: {
    value: "god",
    label: "God",
    icon: "✨",
    sql: "COALESCE(god.name, 'Atheist')",
    alias: "god",
    join: "gods god ON g.god_id = god.id",
  },
  version: {
    value: "version",
    label: "Version",
    icon: "📦",
    sql: "CONCAT('0.', v.minor)",
    alias: "version",
    join: "game_versions v ON g.version_id = v.id",
  },
  is_win: {
    value: "is_win",
    label: "Outcome",
    icon: "🏆",
    sql: "g.is_win",
    alias: "is_win",
    join: null,
  },
  runes: {
    value: "runes",
    label: "Rune Count",
    icon: "💎",
    sql: "g.runes_count",
    alias: "runes",
    join: null,
  },
  character_level: {
    value: "character_level",
    label: "Character Level",
    icon: "📈",
    sql: "g.character_level",
    alias: "character_level",
    join: null,
  },
  is_webtiles: {
    value: "is_webtiles",
    label: "WebTiles",
    icon: "🌐",
    sql: "g.is_webtiles",
    alias: "is_webtiles",
    join: null,
  },
  draconian_color: {
    value: "draconian_color",
    label: "Draconian Color",
    icon: "🐲",
    sql: "g.draconian_color",
    alias: "draconian_color",
    join: null,
  },
} as const;

export type DimensionKey = keyof typeof DIMENSIONS;

/**
 * Dimensions that can be used as the "track" dimension in trends (categorical).
 * These represent what we're measuring/comparing.
 */
export const TRACK_DIMENSIONS: DimensionKey[] = ["combo", "species", "background", "god"];

/**
 * Dimensions that can be used as the "over" dimension in trends (ordinal).
 * These represent the X-axis of a trend chart.
 */
export const OVER_DIMENSIONS: DimensionKey[] = ["version", "runes", "character_level"];

/**
 * Format functions for ordinal dimensions (used in trends X-axis).
 */
export const DIMENSION_FORMATTERS: Record<string, (v: number) => string> = {
  version: (v: number) => `0.${v}`,
  runes: (v: number) => String(v),
  character_level: (v: number) => String(v),
};

/**
 * Get the raw SQL select for a dimension (without alias, for trends API).
 * Some dimensions need different SQL when used in trends context.
 */
export function getDimensionSelectForTrends(dim: DimensionKey): string {
  // For version in trends, we want the raw minor number for sorting
  if (dim === "version") {
    return "v.minor";
  }
  return DIMENSIONS[dim].sql;
}

// =============================================================================
// METRICS - What we can measure/aggregate
// =============================================================================

export interface MetricConfig {
  value: string;
  label: string;
  description: string;
  /** SQL aggregate expression */
  sql: string;
  /** SQL alias for the result column */
  alias: string;
}

/**
 * All available metrics for aggregation.
 */
export const METRICS = {
  count: {
    value: "count",
    label: "Game Count",
    description: "Total number of games",
    sql: "COUNT(*)",
    alias: "count",
  },
  wins: {
    value: "wins",
    label: "Win Count",
    description: "Number of wins",
    sql: "SUM(CASE WHEN g.is_win THEN 1 ELSE 0 END)",
    alias: "wins",
  },
  win_rate: {
    value: "win_rate",
    label: "Win Rate %",
    description: "Percentage of games won",
    sql: "ROUND(100.0 * SUM(CASE WHEN g.is_win THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2)",
    alias: "win_rate",
  },
  avg_score: {
    value: "avg_score",
    label: "Avg Score",
    description: "Average score",
    sql: "ROUND(AVG(g.score))",
    alias: "avg_score",
  },
  max_score: {
    value: "max_score",
    label: "Max Score",
    description: "Highest score",
    sql: "MAX(g.score)",
    alias: "max_score",
  },
  min_score: {
    value: "min_score",
    label: "Min Score",
    description: "Lowest score",
    sql: "MIN(g.score)",
    alias: "min_score",
  },
  avg_turns: {
    value: "avg_turns",
    label: "Avg Turns",
    description: "Average game length in turns",
    sql: "ROUND(AVG(g.total_turns))",
    alias: "avg_turns",
  },
  avg_runes: {
    value: "avg_runes",
    label: "Avg Runes",
    description: "Average runes collected",
    sql: "ROUND(AVG(g.runes_count), 2)",
    alias: "avg_runes",
  },
  avg_xl: {
    value: "avg_xl",
    label: "Avg XL",
    description: "Average character level",
    sql: "ROUND(AVG(g.character_level), 1)",
    alias: "avg_xl",
  },
  total_runes: {
    value: "total_runes",
    label: "Total Runes",
    description: "Sum of all runes collected",
    sql: "SUM(g.runes_count)",
    alias: "total_runes",
  },
  median_turns: {
    value: "median_turns",
    label: "Median Turns",
    description: "Median game length in turns",
    sql: "ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY g.total_turns))",
    alias: "median_turns",
  },
  avg_gems: {
    value: "avg_gems",
    label: "Avg Gems",
    description: "Average gems collected",
    sql: "ROUND(AVG(g.gems_count), 2)",
    alias: "avg_gems",
  },
  median_gems: {
    value: "median_gems",
    label: "Median Gems",
    description: "Median gems collected",
    sql: "ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY g.gems_count))",
    alias: "median_gems",
  },
} as const;

export type MetricKey = keyof typeof METRICS;

/**
 * Metrics available in the trends chart (subset of all metrics).
 */
export const TREND_METRICS: MetricKey[] = ["count", "wins", "win_rate"];

/**
 * Metrics available in the aggregation builder (all metrics).
 */
export const AGGREGATION_METRICS: MetricKey[] = [
  "count",
  "wins",
  "win_rate",
  "avg_score",
  "max_score",
  "avg_turns",
  "median_turns",
  "avg_gems",
  "median_gems",
  "avg_runes",
  "avg_xl",
];

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

export const MAX_DIMENSIONS = 3;
export const MAX_METRICS = 6;
export const MAX_RESULTS = 500;
export const MAX_TOP_N = 20;
export const DEFAULT_TOP_N = 10;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get dimension options for UI dropdowns.
 */
export function getDimensionOptions(keys?: DimensionKey[]) {
  const keysToUse = keys ?? (Object.keys(DIMENSIONS) as DimensionKey[]);
  return keysToUse.map((key) => ({
    value: DIMENSIONS[key].value,
    label: DIMENSIONS[key].label,
    icon: DIMENSIONS[key].icon,
  }));
}

/**
 * Get metric options for UI dropdowns.
 */
export function getMetricOptions(keys?: MetricKey[]) {
  const keysToUse = keys ?? (Object.keys(METRICS) as MetricKey[]);
  return keysToUse.map((key) => ({
    value: METRICS[key].value,
    label: METRICS[key].label,
    description: METRICS[key].description,
  }));
}

/**
 * Check if a string is a valid dimension key.
 */
export function isValidDimension(value: string): value is DimensionKey {
  return value in DIMENSIONS;
}

/**
 * Check if a string is a valid metric key.
 */
export function isValidMetric(value: string): value is MetricKey {
  return value in METRICS;
}

/**
 * Check if a dimension is valid for tracking in trends.
 */
export function isValidTrackDimension(value: string): boolean {
  return TRACK_DIMENSIONS.includes(value as DimensionKey);
}

/**
 * Check if a dimension is valid for the "over" axis in trends.
 */
export function isValidOverDimension(value: string): boolean {
  return OVER_DIMENSIONS.includes(value as DimensionKey);
}

/**
 * Check if a metric is valid for trends.
 */
export function isValidTrendMetric(value: string): boolean {
  return TREND_METRICS.includes(value as MetricKey);
}
