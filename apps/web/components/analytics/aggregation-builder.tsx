"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Layers,
  Calculator,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  Table2,
  Sparkles,
  Columns,
  ArrowRightLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DIMENSIONS,
  METRICS,
  AGGREGATION_METRICS,
  MAX_DIMENSIONS,
  MAX_METRICS,
  MAX_RESULTS,
  type DimensionKey,
  type MetricKey,
} from "@/lib/analytics-types";

// Dimension options split into logical rows for the UI
const allDimOptions = (Object.keys(DIMENSIONS) as DimensionKey[]).map((key) => ({
  value: key,
  label: DIMENSIONS[key].label,
  icon: DIMENSIONS[key].icon,
}));
const DIMENSION_ROWS = [
  allDimOptions.slice(0, 5),  // Species, Background, Combo, God, Version
  allDimOptions.slice(5),     // Outcome, Rune Count, Character Level, WebTiles, Draconian Color
];

// Metric options split into logical rows for the UI
const allMetricOptions = AGGREGATION_METRICS.map((key) => ({
  value: key,
  label: METRICS[key].label,
  description: METRICS[key].description,
}));
const METRIC_ROWS = [
  allMetricOptions.slice(0, 5),  // Game Count, Win Count, Win Rate %, Avg Score, Max Score
  allMetricOptions.slice(5),     // Avg Turns, Median Turns, Avg Gems, Median Gems, Avg Runes, Avg XL
];

interface AggregationResult {
  [key: string]: unknown;
}

interface AggregationBuilderProps {
  queryString: string;
}

export function AggregationBuilder({ queryString }: AggregationBuilderProps) {
  // Query configuration state
  const [selectedDimensions, setSelectedDimensions] = useState<DimensionKey[]>(["species"]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["count", "win_rate"]);
  const [sortBy, setSortBy] = useState<string>("count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState<number>(25);
  
  // Results state
  const [results, setResults] = useState<AggregationResult[]>([]);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [totalWins, setTotalWins] = useState<number>(0);
  const [totalGroups, setTotalGroups] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "chart" | "pivot">("table");
  const [page, setPage] = useState(0);
  
  const totalPages = Math.ceil(totalGroups / limit);

  // Build the aggregation query string
  const aggregateQueryString = useMemo(() => {
    const params = new URLSearchParams(queryString);
    params.set("groupBy", selectedDimensions.join(","));

    // In pivot mode, always include count for column totals and fetch all results
    if (viewMode === "pivot") {
      const metricsWithCount = Array.from(new Set(["count" as MetricKey, ...selectedMetrics]));
      params.set("metrics", metricsWithCount.join(","));
      params.set("sortBy", "count");
      params.set("sortDir", "desc");
      params.set("limit", MAX_RESULTS.toString());
      params.set("offset", "0");
    } else {
      params.set("metrics", selectedMetrics.join(","));
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      params.set("limit", limit.toString());
      params.set("offset", (page * limit).toString());
    }

    return params.toString();
  }, [queryString, selectedDimensions, selectedMetrics, sortBy, sortDir, limit, page, viewMode]);

  // Fetch aggregation results
  const executeQuery = useCallback(async () => {
    if (selectedDimensions.length === 0) {
      setError("Select at least one dimension to group by");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analytics/aggregate?${aggregateQueryString}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch results");
      }
      
      setResults(data.results);
      setTotalGames(data.totalGames);
      setTotalWins(data.totalWins);
      setTotalGroups(data.totalGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [aggregateQueryString, selectedDimensions.length]);

  // Auto-execute when config changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      executeQuery();
    }, 300);
    return () => clearTimeout(timer);
  }, [executeQuery]);

  // Reset page when query parameters change (except page itself)
  useEffect(() => {
    setPage(0);
  }, [queryString, selectedDimensions, selectedMetrics, sortBy, sortDir, limit]);

  // Fall back from pivot mode if dimensions no longer suitable
  useEffect(() => {
    if (viewMode === "pivot" && selectedDimensions.length !== 2) {
      setViewMode("table");
    }
  }, [viewMode, selectedDimensions.length]);

  // Handle dimension toggle
  const toggleDimension = (dim: DimensionKey) => {
    setSelectedDimensions(prev => {
      if (prev.includes(dim)) {
        return prev.filter(d => d !== dim);
      }
      if (prev.length >= MAX_DIMENSIONS) {
        return prev; // Max dimensions reached
      }
      return [...prev, dim];
    });
  };

  // Handle metric toggle
  const toggleMetric = (metric: MetricKey) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metric)) {
        // Don't allow removing the last metric
        if (prev.length === 1) return prev;
        // If removing the sortBy metric, reset sortBy
        if (metric === sortBy) {
          const remaining = prev.filter(m => m !== metric);
          setSortBy(remaining[0] || "count");
        }
        return prev.filter(m => m !== metric);
      }
      if (prev.length >= MAX_METRICS) {
        return prev; // Max metrics reached
      }
      return [...prev, metric];
    });
  };

  // Get column headers for the results table
  const columnHeaders = useMemo(() => {
    const headers: { key: string; label: string; isMetric: boolean }[] = [];
    
    for (const dim of selectedDimensions) {
      const dimConfig = DIMENSIONS[dim];
      headers.push({
        key: dim,
        label: dimConfig.label,
        isMetric: false,
      });
    }
    
    for (const metric of selectedMetrics) {
      const metricConfig = METRICS[metric];
      headers.push({
        key: metric,
        label: metricConfig.label,
        isMetric: true,
      });
    }
    
    return headers;
  }, [selectedDimensions, selectedMetrics]);

  // Format cell value for display
  // Note: pg returns aggregates (COUNT, SUM, ROUND, etc.) as strings,
  // so we parse to number for any numeric-looking value.
  const formatValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return "—";
    
    // Boolean formatting
    if (key === "is_win") {
      return value === true || value === "true" ? "Win" : "Death";
    }
    if (key === "is_webtiles") {
      if (value === true || value === "true") return "WebTiles";
      if (value === false || value === "false") return "Console";
      return "Unknown";
    }
    
    const num = typeof value === "number" ? value : Number(value);
    if (!isNaN(num)) {
      if (key === "win_rate") return `${num}%`;
      if (key === "count" && totalGames > 0) {
        const pct = (num / totalGames * 100).toFixed(1);
        return `${Math.round(num).toLocaleString()} (${pct}%)`;
      }
      if (key === "wins" && totalWins > 0) {
        const pct = (num / totalWins * 100).toFixed(1);
        return `${Math.round(num).toLocaleString()} (${pct}%)`;
      }
      if (key.includes("score") || key === "avg_turns" || key === "median_turns") {
        return Math.round(num).toLocaleString();
      }
      if (key === "avg_runes" || key === "avg_xl" || key === "avg_gems" || key === "median_gems") {
        return num.toFixed(1);
      }
      return num.toLocaleString();
    }
    
    return String(value);
  };

  const viewToggle = (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-2"
            >
              <Table2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Flat table — one row per group, all metrics as columns</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant={viewMode === "pivot" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("pivot")}
                disabled={selectedDimensions.length !== 2}
                className="h-8 px-2"
              >
                <Columns className="w-4 h-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {selectedDimensions.length !== 2
                ? "Pivot — select exactly 2 dimensions to compare distributions side-by-side"
                : "Pivot — compare distributions across one dimension as columns"}
            </p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === "chart" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("chart")}
              className="h-8 px-2"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Bar chart — visual ranking of the primary metric</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="space-y-4">
      {/* Query Builder Card */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-special" />
            <CardTitle className="text-base">Deep Dive</CardTitle>
            <Badge variant="outline" className="text-xs">
              {totalGames.toLocaleString()} games
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Dimensions Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-mana" />
              <span className="text-sm font-medium">Group By</span>
              <span className="text-xs text-muted-foreground">(max {MAX_DIMENSIONS})</span>
            </div>
            <div className="space-y-1.5">
              {DIMENSION_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="flex flex-wrap gap-1.5">
                  {row.map((dim) => {
                    const isSelected = selectedDimensions.includes(dim.value);
                    const isDisabled = !isSelected && selectedDimensions.length >= MAX_DIMENSIONS;
                    return (
                      <Button
                        key={dim.value}
                        variant={isSelected ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleDimension(dim.value)}
                        disabled={isDisabled}
                        className={cn(
                          "h-7 text-xs gap-1.5",
                          isSelected && "bg-mana/20 border-mana/30 text-mana hover:bg-mana/30",
                          isDisabled && "opacity-50"
                        )}
                      >
                        <span>{dim.icon}</span>
                        {dim.label}
                      </Button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium">Metrics</span>
              <span className="text-xs text-muted-foreground">(max {MAX_METRICS})</span>
            </div>
            <div className="space-y-1.5">
              {METRIC_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="flex flex-wrap gap-1.5">
                  {row.map((metric) => {
                    const isSelected = selectedMetrics.includes(metric.value);
                    const isDisabled = !isSelected && selectedMetrics.length >= MAX_METRICS;
                    const isOnlyOne = isSelected && selectedMetrics.length === 1;
                    return (
                      <Button
                        key={metric.value}
                        variant={isSelected ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleMetric(metric.value)}
                        disabled={isDisabled || isOnlyOne}
                        className={cn(
                          "h-7 text-xs",
                          isSelected && "bg-gold/20 border-gold/30 text-gold hover:bg-gold/30",
                          isDisabled && "opacity-50"
                        )}
                        title={metric.description}
                      >
                        {metric.label}
                      </Button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Sort & Limit Section */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Sort by</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedMetrics.map((metric) => (
                    <SelectItem key={metric} value={metric} className="text-xs">
                      {METRICS[metric].label}
                    </SelectItem>
                  ))}
                  {selectedDimensions.map((dim) => (
                    <SelectItem key={dim} value={dim} className="text-xs">
                      {DIMENSIONS[dim].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortDir(prev => prev === "asc" ? "desc" : "asc")}
                className="h-8 px-2"
              >
                {sortDir === "desc" ? "↓ High to Low" : "↑ Low to High"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v, 10))}>
                <SelectTrigger className="h-8 w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10</SelectItem>
                  <SelectItem value="25" className="text-xs">25</SelectItem>
                  <SelectItem value="50" className="text-xs">50</SelectItem>
                  <SelectItem value="100" className="text-xs">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">results</span>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {error && (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-danger">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Show loading card only on initial load (no results yet) */}
      {loading && results.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-mana" />
            <p className="mt-4 text-muted-foreground">Crunching numbers...</p>
          </CardContent>
        </Card>
      )}

      {!error && results.length > 0 && viewMode === "table" && (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {/* Pagination Controls + View Toggle */}
            <div className="grid grid-cols-3 items-center px-4 py-3 border-b border-border">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-mono text-foreground">{Math.min(page * limit + 1, totalGroups).toLocaleString()}</span>
                {" - "}
                <span className="font-mono text-foreground">{Math.min((page + 1) * limit, totalGroups).toLocaleString()}</span>
                {" of "}
                <span className="font-mono text-foreground">{totalGroups.toLocaleString()}</span>
                {" groups"}
              </div>
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(0)}
                  disabled={page === 0 || loading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2 min-w-[80px] text-center">
                  Page <span className="font-mono">{page + 1}</span> of <span className="font-mono">{totalPages || 1}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1 || loading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-end">
                {viewToggle}
              </div>
            </div>

            <div className="overflow-x-auto relative">
              {loading && (
                <div className="absolute inset-0 bg-card/80 flex items-center justify-center z-20">
                  <Loader2 className="w-6 h-6 animate-spin text-mana" />
                </div>
              )}
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center">#</TableHead>
                    {columnHeaders.map((header) => (
                      <TableHead
                        key={header.key}
                        className={cn(
                          "cursor-pointer hover:text-foreground transition-colors",
                          header.key === sortBy && "text-gold"
                        )}
                        onClick={() => {
                          if (sortBy === header.key) {
                            setSortDir(prev => prev === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy(header.key);
                            setSortDir("desc");
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {header.label}
                          {header.key === sortBy && (
                            <ChevronDown
                              className={cn(
                                "w-3 h-3 transition-transform",
                                sortDir === "asc" && "rotate-180"
                              )}
                            />
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, index) => (
                    <TableRow key={index} className="hover:bg-secondary/30">
                      <TableCell className="text-center text-muted-foreground font-mono text-xs">
                        {page * limit + index + 1}
                      </TableCell>
                      {columnHeaders.map((header) => {
                        const value = row[header.key];
                        const numValue = Number(value) || 0;
                        return (
                          <TableCell
                            key={header.key}
                            className={cn(
                              header.isMetric && "font-mono",
                              header.key === "win_rate" && numValue >= 50 && "text-health",
                              header.key === "win_rate" && numValue < 50 && numValue > 0 && "text-danger",
                              header.key === "count" && "text-mana",
                              header.key === "avg_score" && "text-gold",
                              header.key === "max_score" && "text-gold",
                            )}
                          >
                            {formatValue(header.key, value)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && results.length > 0 && viewMode === "pivot" && selectedDimensions.length === 2 && (
        <PivotTable
          results={results}
          dimensions={selectedDimensions}
          metrics={selectedMetrics}
          totalGroups={totalGroups}
          loading={loading}
          viewToggle={viewToggle}
        />
      )}

      {!error && results.length > 0 && viewMode === "chart" && (
        <AggregationChart
          results={results}
          dimensions={selectedDimensions}
          metrics={selectedMetrics}
          formatValue={formatValue}
          viewToggle={viewToggle}
        />
      )}

      {!loading && !error && results.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No results match your query.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Format a dimension value for display (handles booleans from pg)
function formatDimLabel(dim: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (dim === "is_win") return value === true || value === "true" ? "Win" : "Death";
  if (dim === "is_webtiles") {
    if (value === true || value === "true") return "WebTiles";
    if (value === false || value === "false") return "Console";
    return "Unknown";
  }
  return String(value);
}

// Format a metric value for pivot cells (no percentage-of-total, unlike the main formatValue)
function formatPivotMetric(metricKey: string, value: number): string {
  if (metricKey === "win_rate") return `${value}%`;
  if (
    metricKey.includes("score") || metricKey === "count" || metricKey === "wins"
    || metricKey === "avg_turns" || metricKey === "median_turns" || metricKey === "total_runes"
  ) {
    return Math.round(value).toLocaleString();
  }
  if (metricKey === "avg_runes" || metricKey === "avg_xl" || metricKey === "avg_gems" || metricKey === "median_gems") {
    return value.toFixed(1);
  }
  return value.toLocaleString();
}

const ADDITIVE_METRICS = new Set(["count", "wins", "total_runes"]);

// Pivot table: reshapes 2-dimension results into a crosstab matrix
function PivotTable({
  results,
  dimensions,
  metrics,
  totalGroups,
  loading,
  viewToggle,
}: {
  results: AggregationResult[];
  dimensions: DimensionKey[];
  metrics: MetricKey[];
  totalGroups: number;
  loading: boolean;
  viewToggle: React.ReactNode;
}) {
  const [swapped, setSwapped] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);

  // Reset sort when dimensions change
  useEffect(() => {
    setSortCol(null);
    setSortDir("desc");
    setSwapped(false);
  }, [dimensions[0], dimensions[1]]);

  const pivotMetric = selectedMetric && metrics.includes(selectedMetric) ? selectedMetric : metrics[0];

  const pivotData = useMemo(() => {
    if (dimensions.length !== 2 || results.length === 0) return null;

    const [dim0, dim1] = dimensions;
    const unique0 = new Set(results.map(r => formatDimLabel(dim0, r[dim0])));
    const unique1 = new Set(results.map(r => formatDimLabel(dim1, r[dim1])));

    // Dimension with fewer unique values becomes columns
    const autoColIsDim1 = unique1.size <= unique0.size;
    let rowDim: DimensionKey, colDim: DimensionKey;
    if (swapped) {
      rowDim = autoColIsDim1 ? dim1 : dim0;
      colDim = autoColIsDim1 ? dim0 : dim1;
    } else {
      rowDim = autoColIsDim1 ? dim0 : dim1;
      colDim = autoColIsDim1 ? dim1 : dim0;
    }

    // All metrics to track (always include count for "n=" headers)
    const allMetricKeys = Array.from(new Set(["count" as MetricKey, ...metrics]));

    const colLabelsSet = new Set<string>();
    const matrix = new Map<string, Map<string, Record<string, number>>>();
    const colTotals = new Map<string, Record<string, number>>();

    for (const row of results) {
      const rowLabel = formatDimLabel(rowDim, row[rowDim]);
      const colLabel = formatDimLabel(colDim, row[colDim]);
      colLabelsSet.add(colLabel);

      if (!matrix.has(rowLabel)) matrix.set(rowLabel, new Map());

      const cellData: Record<string, number> = {};
      for (const m of allMetricKeys) {
        cellData[m] = Number(row[m]) || 0;
      }
      matrix.get(rowLabel)!.set(colLabel, cellData);

      if (!colTotals.has(colLabel)) {
        colTotals.set(colLabel, Object.fromEntries(allMetricKeys.map(m => [m, 0])));
      }
      const totals = colTotals.get(colLabel)!;
      for (const m of allMetricKeys) {
        totals[m] += cellData[m];
      }
    }

    const colLabels = Array.from(colLabelsSet).sort();

    // Sort rows by metric value in the selected column
    const effectiveSortCol = sortCol && colLabelsSet.has(sortCol) ? sortCol : colLabels[0];
    const entries = Array.from(matrix.entries());
    entries.sort((a, b) => {
      if (!effectiveSortCol) return a[0].localeCompare(b[0]);
      const aVal = a[1].get(effectiveSortCol)?.[pivotMetric] ?? -Infinity;
      const bVal = b[1].get(effectiveSortCol)?.[pivotMetric] ?? -Infinity;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return { rowDim, colDim, rows: entries, colLabels, colTotals };
  }, [dimensions, results, metrics, swapped, sortCol, sortDir, pivotMetric]);

  if (!pivotData) return null;

  const { rowDim, colDim, rows, colLabels, colTotals } = pivotData;

  const handleColumnSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const showPct = ADDITIVE_METRICS.has(pivotMetric);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        {/* Pivot header: dimensions, swap, metric selector, view toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Rows:</span>
            <Badge variant="outline" className="text-xs">{DIMENSIONS[rowDim].icon} {DIMENSIONS[rowDim].label}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSwapped(s => !s); setSortCol(null); }}
              className="h-7 w-7 p-0"
              title="Swap rows and columns"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-muted-foreground">Columns:</span>
            <Badge variant="outline" className="text-xs">{DIMENSIONS[colDim].icon} {DIMENSIONS[colDim].label}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Metric:</span>
            <Select value={pivotMetric} onValueChange={(v) => setSelectedMetric(v as MetricKey)}>
              <SelectTrigger className="h-7 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {METRICS[m].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
            {viewToggle}
          </div>
        </div>

        {totalGroups > MAX_RESULTS && (
          <div className="px-4 py-2 bg-gold/10 text-gold text-xs border-b border-border">
            Showing {MAX_RESULTS} of {totalGroups.toLocaleString()} groups. Some combinations may be missing.
          </div>
        )}

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-card/80 flex items-center justify-center z-20">
              <Loader2 className="w-6 h-6 animate-spin text-mana" />
            </div>
          )}
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[140px]">
                  {DIMENSIONS[rowDim].label}
                </TableHead>
                {colLabels.map(col => {
                  const colCount = colTotals.get(col)?.count ?? 0;
                  const isSorted = sortCol === col || (!sortCol && col === colLabels[0]);
                  return (
                    <TableHead
                      key={col}
                      className={cn(
                        "text-center cursor-pointer hover:text-foreground transition-colors min-w-[120px]",
                        isSorted && "text-gold"
                      )}
                      onClick={() => handleColumnSort(col)}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          {col}
                          {isSorted && (
                            <ChevronDown className={cn("w-3 h-3 transition-transform", sortDir === "asc" && "rotate-180")} />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          n={Math.round(colCount).toLocaleString()}
                        </span>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([rowLabel, colMap]) => (
                <TableRow key={rowLabel} className="hover:bg-secondary/30">
                  <TableCell className="font-medium">{rowLabel}</TableCell>
                  {colLabels.map(col => {
                    const cellData = colMap.get(col);
                    if (!cellData) {
                      return <TableCell key={col} className="text-center text-muted-foreground">—</TableCell>;
                    }

                    const val = cellData[pivotMetric] ?? 0;
                    const colTotal = colTotals.get(col)?.[pivotMetric] ?? 0;
                    const pct = showPct && colTotal > 0 ? (val / colTotal * 100) : null;

                    return (
                      <TableCell key={col} className="text-center font-mono">
                        <span className="text-mana">{formatPivotMetric(pivotMetric, val)}</span>
                        {pct !== null && (
                          <span className="text-muted-foreground text-xs ml-1">({pct.toFixed(1)}%)</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple bar chart visualization
function AggregationChart({
  results,
  dimensions,
  metrics,
  formatValue,
  viewToggle,
}: {
  results: AggregationResult[];
  dimensions: DimensionKey[];
  metrics: MetricKey[];
  formatValue: (key: string, value: unknown) => string;
  viewToggle: React.ReactNode;
}) {
  // Use the first metric for the chart
  const primaryMetric = metrics[0];
  const maxValue = Math.max(...results.map(r => Number(r[primaryMetric]) || 0));
  
  // Build label from dimensions
  const getLabel = (row: AggregationResult) => {
    return dimensions.map(d => {
      const val = row[d];
      if (d === "is_win") return val === true || val === "true" ? "Win" : "Death";
      if (d === "is_webtiles") {
        if (val === true || val === "true") return "WebTiles";
        if (val === false || val === "false") return "Console";
        return "Unknown";
      }
      return String(val ?? "—");
    }).join(" / ");
  };

  const metricConfig = METRICS[primaryMetric];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metricConfig.label} by {dimensions.map(d => DIMENSIONS[d].label).join(", ")}
          </CardTitle>
          {viewToggle}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {results.slice(0, 15).map((row, index) => {
          const value = Number(row[primaryMetric]) || 0;
          const percentage = maxValue ? (value / maxValue) * 100 : 0;
          const label = getLabel(row);
          
          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm truncate max-w-[200px]" title={label}>
                  {label}
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  {formatValue(primaryMetric, value)}
                </span>
              </div>
              <div className="h-6 bg-secondary/30 rounded overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded transition-all duration-500 ease-out",
                    primaryMetric === "win_rate" && value >= 50 && "bg-health/60",
                    primaryMetric === "win_rate" && value < 50 && "bg-danger/60",
                    primaryMetric === "count" && "bg-mana/60",
                    primaryMetric === "avg_score" && "bg-gold/60",
                    primaryMetric === "wins" && "bg-health/60",
                    !["win_rate", "count", "avg_score", "wins"].includes(primaryMetric) && "bg-special/60"
                  )}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
        {results.length > 15 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Showing top 15 of {results.length} results. Switch to table view to see all.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
