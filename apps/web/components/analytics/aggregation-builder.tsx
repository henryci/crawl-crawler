"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Layers,
  Calculator,
  ArrowUpDown,
  ChevronDown,
  BarChart3,
  Table2,
  Sparkles,
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
  DIMENSIONS,
  METRICS,
  AGGREGATION_METRICS,
  MAX_DIMENSIONS,
  MAX_METRICS,
  type DimensionKey,
  type MetricKey,
} from "@/lib/analytics-types";

// Get dimension options for the UI
const DIMENSION_OPTIONS = (Object.keys(DIMENSIONS) as DimensionKey[]).map((key) => ({
  value: key,
  label: DIMENSIONS[key].label,
  icon: DIMENSIONS[key].icon,
}));

// Get metric options for the UI (only aggregation metrics)
const METRIC_OPTIONS = AGGREGATION_METRICS.map((key) => ({
  value: key,
  label: METRICS[key].label,
  description: METRICS[key].description,
}));

interface AggregationResult {
  [key: string]: unknown;
}

interface AggregationResponse {
  results: AggregationResult[];
  totalGames: number;
  groupBy: string[];
  metrics: string[];
  sortBy: string;
  sortDir: "asc" | "desc";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  // Build the aggregation query string
  const aggregateQueryString = useMemo(() => {
    const params = new URLSearchParams(queryString);
    params.set("groupBy", selectedDimensions.join(","));
    params.set("metrics", selectedMetrics.join(","));
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("limit", limit.toString());
    return params.toString();
  }, [queryString, selectedDimensions, selectedMetrics, sortBy, sortDir, limit]);

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
  const formatValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return "—";
    
    // Boolean formatting for is_win
    if (key === "is_win") {
      return value === true ? "Win" : "Death";
    }
    
    // Number formatting
    if (typeof value === "number") {
      if (key === "win_rate") return `${value}%`;
      if (key.includes("score") || key === "count" || key === "wins" || key === "avg_turns") {
        return Math.round(value).toLocaleString();
      }
      if (key === "avg_runes" || key === "avg_xl") {
        return value.toFixed(1);
      }
      return value.toLocaleString();
    }
    
    return String(value);
  };

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
            <div className="flex flex-wrap gap-2">
              {DIMENSION_OPTIONS.map((dim) => {
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
                      "h-8 text-xs gap-1.5",
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
          </div>

          {/* Metrics Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium">Metrics</span>
              <span className="text-xs text-muted-foreground">(max {MAX_METRICS})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {METRIC_OPTIONS.map((metric) => {
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
                      "h-8 text-xs",
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

            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-2"
              >
                <Table2 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "chart" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chart")}
                className="h-8 px-2"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
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

      {loading && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-mana" />
            <p className="mt-4 text-muted-foreground">Crunching numbers...</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && results.length > 0 && (
        viewMode === "table" ? (
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
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
                          {index + 1}
                        </TableCell>
                        {columnHeaders.map((header) => {
                          const value = row[header.key];
                          const numValue = typeof value === "number" ? value : 0;
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
        ) : (
          <AggregationChart
            results={results}
            dimensions={selectedDimensions}
            metrics={selectedMetrics}
            formatValue={formatValue}
          />
        )
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

// Simple bar chart visualization
function AggregationChart({
  results,
  dimensions,
  metrics,
  formatValue,
}: {
  results: AggregationResult[];
  dimensions: DimensionKey[];
  metrics: MetricKey[];
  formatValue: (key: string, value: unknown) => string;
}) {
  // Use the first metric for the chart
  const primaryMetric = metrics[0];
  const maxValue = Math.max(...results.map(r => Number(r[primaryMetric]) || 0));
  
  // Build label from dimensions
  const getLabel = (row: AggregationResult) => {
    return dimensions.map(d => {
      const val = row[d];
      if (d === "is_win") return val ? "Win" : "Death";
      return String(val ?? "—");
    }).join(" / ");
  };

  const metricConfig = METRICS[primaryMetric];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metricConfig.label} by {dimensions.map(d => DIMENSIONS[d].label).join(", ")}
        </CardTitle>
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
