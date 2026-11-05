/**
 * URL schema for every linkable view in the app.
 *
 * Pages read their state from the query string on load and write it back
 * as it changes, so any view can be shared as a plain link. The builders
 * and parsers here are the single source of truth for those parameter
 * names: lib/questions.ts, the blog, and the page components all go
 * through this file, which keeps a link built in one place round-tripping
 * in another.
 */

import {
  DIMENSIONS,
  METRICS,
  AGGREGATION_METRICS,
  TRACK_DIMENSIONS,
  MAX_DIMENSIONS,
  MAX_METRICS,
  MAX_TOP_N,
  isValidTrendMetric,
  type DimensionKey,
  type MetricKey,
} from "@/lib/analytics-types";

// =============================================================================
// Streak Analytics  (/analytics)
// =============================================================================

export type AnalyticsTab = "games" | "breakdown" | "trends" | "skills" | "spells" | "equipment";

export interface SkillFilter {
  /** Skill name as DCSS prints it, e.g. "Fighting", "Spellcasting". */
  name: string;
  level: number;
  /** Compare the character's final level against `level`. Defaults to ≥. */
  mode?: "gte" | "lt" | "eq";
}

/** Breakdown tab configuration (grouping + metrics). */
export interface BreakdownConfig {
  groupBy: DimensionKey[];
  metrics: MetricKey[];
  sortBy: string;
  sortDir: "asc" | "desc";
  limit: number;
  view: "table" | "chart" | "pivot";
}

export const DEFAULT_BREAKDOWN: BreakdownConfig = {
  groupBy: ["species"],
  metrics: ["count", "win_rate"],
  sortBy: "count",
  sortDir: "desc",
  limit: 25,
  view: "table",
};

export type TrackDimension = "combo" | "species" | "background" | "god";

/** Trends tab configuration. */
export interface TrendsConfig {
  track: TrackDimension;
  metric: MetricKey;
  topN: number;
  view: "chart" | "table";
}

export const DEFAULT_TRENDS: TrendsConfig = {
  track: "species",
  metric: "count",
  topN: 5,
  view: "chart",
};

export interface AnalyticsLinkOptions {
  tab?: AnalyticsTab;
  /** Full species names as the game prints them, e.g. "Minotaur". */
  species?: string[];
  /** Full background names, e.g. "Berserker". */
  backgrounds?: string[];
  /** God names, e.g. "Trog". Use "Atheist" for godless games. */
  gods?: string[];
  /** Defaults to wins only, which is what the analytics page itself defaults to. */
  outcome?: "wins" | "losses" | "all";
  minRunes?: number;
  maxRunes?: number;
  minTurns?: number;
  maxTurns?: number;
  /** Up to three final-skill-level conditions. */
  skills?: SkillFilter[];
  player?: string;
  /**
   * Inclusive version bounds as "0.NN". `minVersion` defaults to the page's
   * own default ("0.20"); pass `null` to include every version.
   */
  minVersion?: string | null;
  maxVersion?: string;
  /** Defaults to true, matching the page's default preset. */
  excludeLegacy?: boolean;
  breakdown?: Partial<BreakdownConfig> & Pick<BreakdownConfig, "groupBy">;
  trends?: Partial<TrendsConfig>;
}

const SKILL_SUFFIXES = ["", "2", "3"] as const;

/** The analytics page's default preset floors versions here; links mirror it unless told otherwise. */
export const ANALYTICS_DEFAULT_MIN_VERSION = "0.20";

/** Query-string parameter names the Breakdown tab owns. */
export const BREAKDOWN_PARAM_KEYS = ["groupBy", "metrics", "sortBy", "sortDir", "limit", "view"] as const;
/** Query-string parameter names the Trends tab owns. */
export const TRENDS_PARAM_KEYS = ["track", "metric", "topN", "trendsView"] as const;

export function breakdownToParams(config: BreakdownConfig): Record<string, string> {
  const out: Record<string, string> = {};
  const d = DEFAULT_BREAKDOWN;
  if (config.groupBy.join(",") !== d.groupBy.join(",")) out.groupBy = config.groupBy.join(",");
  if (config.metrics.join(",") !== d.metrics.join(",")) out.metrics = config.metrics.join(",");
  if (config.sortBy !== d.sortBy) out.sortBy = config.sortBy;
  if (config.sortDir !== d.sortDir) out.sortDir = config.sortDir;
  if (config.limit !== d.limit) out.limit = String(config.limit);
  if (config.view !== d.view) out.view = config.view;
  return out;
}

export function trendsToParams(config: TrendsConfig): Record<string, string> {
  const out: Record<string, string> = {};
  const d = DEFAULT_TRENDS;
  if (config.track !== d.track) out.track = config.track;
  if (config.metric !== d.metric) out.metric = config.metric;
  if (config.topN !== d.topN) out.topN = String(config.topN);
  if (config.view !== d.view) out.trendsView = config.view;
  return out;
}

function isDimensionKey(value: string): value is DimensionKey {
  return Object.prototype.hasOwnProperty.call(DIMENSIONS, value);
}

function isMetricKey(value: string): value is MetricKey {
  return Object.prototype.hasOwnProperty.call(METRICS, value);
}

function isTrackDimension(value: string): value is TrackDimension {
  return (TRACK_DIMENSIONS as string[]).includes(value);
}

function parseList<T extends string>(
  raw: string | null,
  guard: (v: string) => v is T,
  max: number,
): T[] | null {
  if (raw === null) return null;
  const items = raw.split(",").map((s) => s.trim()).filter(guard).slice(0, max);
  return items.length > 0 ? items : null;
}

function parseBoundedInt(raw: string | null, min: number, max: number): number | null {
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

/** Read Breakdown config from the URL, falling back to defaults for anything missing or invalid. */
export function parseBreakdownParams(params: URLSearchParams): BreakdownConfig {
  const d = DEFAULT_BREAKDOWN;
  const groupBy = parseList(params.get("groupBy"), isDimensionKey, MAX_DIMENSIONS) ?? d.groupBy;
  const metrics =
    parseList(
      params.get("metrics"),
      (v): v is MetricKey => isMetricKey(v) && AGGREGATION_METRICS.includes(v),
      MAX_METRICS,
    ) ?? d.metrics;
  // The aggregate API only sorts by a selected dimension or metric.
  const sortable: string[] = [...groupBy, ...metrics];
  const sortByRaw = params.get("sortBy");
  const sortBy =
    sortByRaw && sortable.includes(sortByRaw)
      ? sortByRaw
      : sortable.includes(d.sortBy)
        ? d.sortBy
        : metrics[0]!;
  const sortDirRaw = params.get("sortDir");
  const sortDir = sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : d.sortDir;
  const limit = parseBoundedInt(params.get("limit"), 5, 500) ?? d.limit;
  const viewRaw = params.get("view");
  const view =
    viewRaw === "table" || viewRaw === "chart" || viewRaw === "pivot" ? viewRaw : d.view;
  return { groupBy, metrics, sortBy, sortDir, limit, view };
}

/** Read Trends config from the URL, falling back to defaults for anything missing or invalid. */
export function parseTrendsParams(params: URLSearchParams): TrendsConfig {
  const d = DEFAULT_TRENDS;
  const trackRaw = params.get("track");
  const track = trackRaw && isTrackDimension(trackRaw) ? trackRaw : d.track;
  const metricRaw = params.get("metric");
  const metric = metricRaw && isValidTrendMetric(metricRaw) ? metricRaw : d.metric;
  // The chart spaces ranks by (topN - 1), so it needs at least two.
  const topN = parseBoundedInt(params.get("topN"), 2, MAX_TOP_N) ?? d.topN;
  const viewRaw = params.get("trendsView");
  const view = viewRaw === "chart" || viewRaw === "table" ? viewRaw : d.view;
  return { track, metric, topN, view };
}

export function analyticsLink(opts: AnalyticsLinkOptions = {}): string {
  const p = new URLSearchParams();
  if (opts.species?.length) p.set("races", opts.species.join(","));
  if (opts.backgrounds?.length) p.set("backgrounds", opts.backgrounds.join(","));
  if (opts.gods?.length) p.set("gods", opts.gods.join(","));
  if (opts.minRunes !== undefined) p.set("minRunes", String(opts.minRunes));
  if (opts.maxRunes !== undefined) p.set("maxRunes", String(opts.maxRunes));
  if (opts.minTurns !== undefined) p.set("minTurns", String(opts.minTurns));
  if (opts.maxTurns !== undefined) p.set("maxTurns", String(opts.maxTurns));
  (opts.skills ?? []).slice(0, 3).forEach((skill, i) => {
    const suffix = SKILL_SUFFIXES[i]!;
    p.set(`skillName${suffix}`, skill.name);
    p.set(`skillLevel${suffix}`, String(skill.level));
    p.set(`skillLevelMode${suffix}`, skill.mode ?? "gte");
  });
  if (opts.player) p.set("player", opts.player);
  const minVersion = opts.minVersion === undefined ? ANALYTICS_DEFAULT_MIN_VERSION : opts.minVersion;
  if (minVersion) p.set("minVersion", minVersion);
  if (opts.maxVersion) p.set("maxVersion", opts.maxVersion);
  if (opts.excludeLegacy ?? true) p.set("excludeLegacy", "true");

  // The analytics page treats "no filter params at all" as its default
  // preset (wins only). Once any filter is present, isWin must be explicit
  // or the page reads it as "all outcomes".
  const outcome = opts.outcome ?? "wins";
  const hasFilters = [...p.keys()].length > 0;
  if (outcome === "wins") p.set("isWin", "true");
  else if (outcome === "losses") p.set("isWin", "false");
  else if (!hasFilters) p.set("preset", "clear");

  const tab = opts.tab ?? "games";
  if (tab !== "games") p.set("tab", tab);
  if (opts.breakdown) {
    for (const [k, v] of Object.entries(breakdownToParams({ ...DEFAULT_BREAKDOWN, ...opts.breakdown }))) {
      p.set(k, v);
    }
  }
  if (opts.trends) {
    for (const [k, v] of Object.entries(trendsToParams({ ...DEFAULT_TRENDS, ...opts.trends }))) {
      p.set(k, v);
    }
  }
  const qs = p.toString();
  return qs ? `/analytics?${qs}` : "/analytics";
}

// =============================================================================
// Morgue / Character Viewer  (/morgue)
// =============================================================================

export type MorgueTab = "overview" | "skills" | "dungeon" | "optimizer" | "debug";

/**
 * A bundled 0.34 character dump served from /public, so visitors can try
 * the optimizer without having a fresh dump of their own.
 */
export const SAMPLE_CHARACTER_URL = "/samples/sample-character.txt";

/** Optimizer configuration as carried in the URL. Item ids are inventory letters. */
export interface OptimizerLinkState {
  /** Objective preset ids in priority order, e.g. ["max-all-resist", "max-ac"]. */
  priorities?: string[];
  /** "Require at least" constraints. */
  floors?: { prop: string; value: number }[];
  /** Inventory letters of items to keep equipped. */
  lock?: string[];
  /** Inventory letters of items to exclude. */
  ban?: string[];
  view?: "equipment" | "stats";
}

/** Query-string parameter names the Optimizer tab owns. */
export const OPTIMIZER_PARAM_KEYS = ["obj", "floors", "lock", "ban", "view"] as const;

export function optimizerToParams(state: OptimizerLinkState): Record<string, string> {
  const out: Record<string, string> = {};
  if (state.priorities?.length) out.obj = state.priorities.join(",");
  if (state.floors?.length) out.floors = state.floors.map((f) => `${f.prop}:${f.value}`).join(",");
  if (state.lock?.length) out.lock = state.lock.join(",");
  if (state.ban?.length) out.ban = state.ban.join(",");
  if (state.view && state.view !== "equipment") out.view = state.view;
  return out;
}

/**
 * Read optimizer state from the URL. Values are returned as plain strings;
 * the optimizer validates them against its own preset and property lists.
 */
export function parseOptimizerParams(params: URLSearchParams): OptimizerLinkState {
  const split = (raw: string | null) =>
    raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const floors = split(params.get("floors"))
    .map((entry) => {
      const [prop, valueRaw] = entry.split(":");
      const value = parseInt(valueRaw ?? "", 10);
      return prop && Number.isFinite(value) && value > 0 ? { prop, value } : null;
    })
    .filter((f): f is { prop: string; value: number } => f !== null);
  const viewRaw = params.get("view");
  return {
    priorities: split(params.get("obj")),
    floors,
    lock: split(params.get("lock")),
    ban: split(params.get("ban")),
    view: viewRaw === "stats" ? "stats" : "equipment",
  };
}

/** True when the URL carries any optimizer configuration worth auto-running. */
export function hasOptimizerParams(params: URLSearchParams): boolean {
  return ["obj", "floors", "lock", "ban"].some((k) => params.has(k));
}

export interface MorgueLinkOptions {
  /** Morgue or character-dump URL on a supported server, or SAMPLE_CHARACTER_URL. */
  url?: string;
  /** Hash of a morgue already in the database (takes priority over url). */
  hash?: string;
  tab?: MorgueTab;
  optimizer?: OptimizerLinkState;
}

export function morgueLink(opts: MorgueLinkOptions = {}): string {
  const p = new URLSearchParams();
  if (opts.hash) p.set("hash", opts.hash);
  else if (opts.url) p.set("url", opts.url);
  const tab = opts.tab ?? (opts.optimizer ? "optimizer" : "overview");
  if (tab !== "overview") p.set("tab", tab);
  if (opts.optimizer) {
    for (const [k, v] of Object.entries(optimizerToParams(opts.optimizer))) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `/morgue?${qs}` : "/morgue";
}

// =============================================================================
// Combo Records  (/records)
// =============================================================================

export interface RecordsLinkOptions {
  /** Species code, e.g. "Mi". */
  species?: string;
  /** Background code, e.g. "Be". */
  background?: string;
  player?: string;
  /** Free-text search across combo, player, god, species and background. */
  search?: string;
  /** Show records for removed species/backgrounds too. */
  includeLegacy?: boolean;
}

export interface RecordsFilters {
  search: string;
  player: string;
  species: string;
  background: string;
  hideLegacy: boolean;
}

export const DEFAULT_RECORDS_FILTERS: RecordsFilters = {
  search: "",
  player: "",
  species: "all",
  background: "all",
  hideLegacy: true,
};

export function recordsFiltersToParams(f: RecordsFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.search) out.q = f.search;
  if (f.player) out.player = f.player;
  if (f.species !== "all") out.species = f.species;
  if (f.background !== "all") out.background = f.background;
  if (!f.hideLegacy) out.legacy = "1";
  return out;
}

export function parseRecordsParams(params: URLSearchParams): RecordsFilters {
  return {
    search: params.get("q") ?? "",
    player: params.get("player") ?? "",
    species: params.get("species") || "all",
    background: params.get("background") || "all",
    hideLegacy: params.get("legacy") !== "1",
  };
}

export function recordsLink(opts: RecordsLinkOptions = {}): string {
  const p = new URLSearchParams(
    recordsFiltersToParams({
      search: opts.search ?? "",
      player: opts.player ?? "",
      species: opts.species ?? "all",
      background: opts.background ?? "all",
      hideLegacy: !opts.includeLegacy,
    }),
  );
  const qs = p.toString();
  return qs ? `/records?${qs}` : "/records";
}

// =============================================================================
// Player Summary  (/player)
// =============================================================================

export const CAO_PLAYER_BASE_URL = "https://crawl.akrasiac.org/scoring/players/";

/** Link to a player's summary by CAO username or full scoring-page URL. */
export function playerLink(usernameOrUrl: string): string {
  const url = /^https?:\/\//i.test(usernameOrUrl)
    ? usernameOrUrl
    : `${CAO_PLAYER_BASE_URL}${usernameOrUrl.toLowerCase()}.html`;
  return `/player?url=${encodeURIComponent(url)}`;
}
