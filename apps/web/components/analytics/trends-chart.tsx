"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  Layers,
  Hash,
  BarChart3,
  Table2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DIMENSIONS,
  METRICS,
  TRACK_DIMENSIONS,
  OVER_DIMENSIONS,
  TREND_METRICS,
  type DimensionKey,
  type MetricKey,
} from "@/lib/analytics-types";

// Build options from shared config
const TRACK_OPTIONS = TRACK_DIMENSIONS.map((key) => ({
  value: key,
  label: DIMENSIONS[key].label,
  icon: DIMENSIONS[key].icon,
}));

const OVER_OPTIONS = OVER_DIMENSIONS.map((key) => ({
  value: key,
  label: DIMENSIONS[key].label,
  icon: DIMENSIONS[key].icon,
}));

const METRIC_OPTIONS = TREND_METRICS.map((key) => ({
  value: key,
  label: METRICS[key].label,
}));

interface SeriesData {
  name: string;
  data: Array<{ over: string; value: number; rank: number }>;
}

interface TrendsResponse {
  track: string;
  over: string;
  metric: string;
  topN: number;
  overValues: string[];
  series: SeriesData[];
}

interface TrendsChartProps {
  queryString: string;
}

// Distinct colors for each series
const COLORS = [
  "#3b82f6", // blue
  "#f97316", // orange
  "#22c55e", // green
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#ec4899", // pink
  "#eab308", // yellow
  "#78716c", // stone
  "#84cc16", // lime
  "#f43f5e", // rose
  "#14b8a6", // teal
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#6366f1", // indigo
  "#10b981", // emerald
];

// Different marker shapes as SVG path generators
const MARKERS = {
  circle: (x: number, y: number, size: number) => 
    `M ${x} ${y} m -${size}, 0 a ${size},${size} 0 1,0 ${size * 2},0 a ${size},${size} 0 1,0 -${size * 2},0`,
  square: (x: number, y: number, size: number) => 
    `M ${x - size} ${y - size} h ${size * 2} v ${size * 2} h -${size * 2} z`,
  diamond: (x: number, y: number, size: number) => 
    `M ${x} ${y - size} l ${size} ${size} l -${size} ${size} l -${size} -${size} z`,
  triangleUp: (x: number, y: number, size: number) => 
    `M ${x} ${y - size} l ${size} ${size * 1.7} h -${size * 2} z`,
  triangleDown: (x: number, y: number, size: number) => 
    `M ${x} ${y + size} l ${size} -${size * 1.7} h -${size * 2} z`,
  cross: (x: number, y: number, size: number) => {
    const s = size * 0.4;
    return `M ${x - s} ${y - size} h ${s * 2} v ${size - s} h ${size - s} v ${s * 2} h -${size - s} v ${size - s} h -${s * 2} v -${size - s} h -${size - s} v -${s * 2} h ${size - s} z`;
  },
  star: (x: number, y: number, size: number) => {
    const points = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    let path = "";
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      path += (i === 0 ? "M" : "L") + ` ${px} ${py} `;
    }
    return path + "z";
  },
  hexagon: (x: number, y: number, size: number) => {
    let path = "";
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      path += (i === 0 ? "M" : "L") + ` ${px} ${py} `;
    }
    return path + "z";
  },
};

const MARKER_TYPES = Object.keys(MARKERS) as (keyof typeof MARKERS)[];

export function TrendsChart({ queryString }: TrendsChartProps) {
  const [track, setTrack] = useState<DimensionKey>("species");
  const [over, setOver] = useState<DimensionKey>("version");
  const [metric, setMetric] = useState<MetricKey>("count");
  const [topN, setTopN] = useState(5);

  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ series: string; over: string; value: number; rank: number } | null>(null);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000); // Start with reasonable default

  // Measure container using ResizeObserver only
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };

    // Initial measurement
    updateWidth();

    // Set up resize observer for subsequent changes
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Fetch trends data
  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(queryString);
      params.set("track", track);
      params.set("over", over);
      params.set("metric", metric);
      params.set("topN", topN.toString());

      const response = await fetch(`/api/analytics/trends?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch trends");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [queryString, track, over, metric, topN]);

  useEffect(() => {
    const timer = setTimeout(fetchTrends, 300);
    return () => clearTimeout(timer);
  }, [fetchTrends]);

  // Chart dimensions - use full width and generous height
  const chartPadding = { top: 20, right: 10, bottom: 40, left: 35 };
  const chartHeight = Math.max(400, topN * 60); // Scale height with number of ranks
  const chartWidth = Math.max(containerWidth, 600);

  // Filter series to only those with at least one point in top N
  const visibleSeries = useMemo(() => {
    if (!data) return [];
    return data.series.filter(s => s.data.some(d => d.rank > 0 && d.rank <= topN));
  }, [data, topN]);

  // Scales
  const xScale = useCallback(
    (index: number) => {
      if (!data || data.overValues.length <= 1) return chartPadding.left;
      const availableWidth = chartWidth - chartPadding.left - chartPadding.right;
      return chartPadding.left + (index / (data.overValues.length - 1)) * availableWidth;
    },
    [data, chartWidth]
  );

  const yScale = useCallback(
    (rank: number) => {
      const availableHeight = chartHeight - chartPadding.top - chartPadding.bottom;
      // Rank 1 at top, rank N at bottom
      return chartPadding.top + ((rank - 1) / (topN - 1)) * availableHeight;
    },
    [topN, chartHeight]
  );

  // Generate line path for a series (straight lines)
  const generatePath = useCallback(
    (series: SeriesData) => {
      let path = "";
      let lastValidPoint: { x: number; y: number } | null = null;

      series.data.forEach((d, i) => {
        if (d.rank > 0 && d.rank <= topN) {
          const x = xScale(i);
          const y = yScale(d.rank);
          
          if (lastValidPoint) {
            path += ` L ${x} ${y}`;
          } else {
            path += `M ${x} ${y}`;
          }
          lastValidPoint = { x, y };
        } else {
          // Break the line when rank goes out of range
          lastValidPoint = null;
        }
      });

      return path;
    },
    [xScale, yScale, topN]
  );

  const trackLabel = DIMENSIONS[track].label;
  const overLabel = DIMENSIONS[over].label;
  const metricLabel = METRICS[metric].label;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="bg-card border-border py-3 gap-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-health" />
            <CardTitle className="text-base">Trends</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Track</span>
              <Select value={track} onValueChange={(v) => setTrack(v as DimensionKey)}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRACK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      <span className="mr-2">{opt.icon}</span>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">over</span>
              <Select value={over} onValueChange={(v) => setOver(v as DimensionKey)}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OVER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      <span className="mr-2">{opt.icon}</span>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">by</span>
              <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Top</span>
              <Select value={topN.toString()} onValueChange={(v) => setTopN(parseInt(v, 10))}>
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3" className="text-xs">3</SelectItem>
                  <SelectItem value="5" className="text-xs">5</SelectItem>
                  <SelectItem value="10" className="text-xs">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work in progress banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-mana/10 border border-mana/30 rounded-lg text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 text-mana flex-shrink-0" />
        <span>I am still figuring out how to make this feature usable. It contains good data but it is difficult to visualize.</span>
      </div>

      {/* Error */}
      {error && (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-danger">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-mana" />
            <p className="mt-4 text-muted-foreground">Loading trends...</p>
          </CardContent>
        </Card>
      )}

      {/* Chart / Table */}
      {!loading && !error && data && visibleSeries.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top {topN} {trackLabel} by {metricLabel} over {overLabel}
              </CardTitle>
              <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs",
                    viewMode === "chart" && "bg-background shadow-sm"
                  )}
                  onClick={() => setViewMode("chart")}
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1" />
                  Chart
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs",
                    viewMode === "table" && "bg-background shadow-sm"
                  )}
                  onClick={() => setViewMode("table")}
                >
                  <Table2 className="w-3.5 h-3.5 mr-1" />
                  Table
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 w-full" ref={containerRef}>
            {viewMode === "chart" ? (
              <>
                {/* Hover info bar */}
                <div className="h-8 mb-2 flex items-center">
                  {hoveredPoint ? (
                    <div className="flex items-center gap-3 text-sm">
                      <span 
                        className="font-bold text-lg"
                        style={{ color: COLORS[visibleSeries.findIndex(s => s.name === hoveredPoint.series) % COLORS.length] }}
                      >
                        {hoveredPoint.series}
                      </span>
                      <span className="text-muted-foreground">
                        {overLabel}: <span className="text-foreground font-mono">{hoveredPoint.over}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Rank: <span className="text-foreground font-bold">#{hoveredPoint.rank}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {metricLabel}: <span className="text-mana font-mono">{hoveredPoint.value.toLocaleString()}{metric === "win_rate" && "%"}</span>
                      </span>
                    </div>
                  ) : hoveredSeries ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span 
                        className="font-bold text-lg"
                        style={{ color: COLORS[visibleSeries.findIndex(s => s.name === hoveredSeries) % COLORS.length] }}
                      >
                        {hoveredSeries}
                      </span>
                      <span className="text-muted-foreground">— hover over points for details</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Hover over the chart to see details</span>
                  )}
                </div>

                {/* SVG Chart */}
            <svg 
              width="100%" 
              height={chartHeight} 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="xMidYMid meet"
              className="block w-full"
              onMouseLeave={() => {
                setHoveredSeries(null);
                setHoveredPoint(null);
              }}
            >
              {/* Background */}
              <rect
                x={chartPadding.left}
                y={chartPadding.top}
                width={chartWidth - chartPadding.left - chartPadding.right}
                height={chartHeight - chartPadding.top - chartPadding.bottom}
                className="fill-secondary/10"
              />

              {/* Horizontal grid lines for each rank */}
              {Array.from({ length: topN }, (_, i) => i + 1).map((rank) => (
                <g key={rank}>
                  <line
                    x1={chartPadding.left}
                    y1={yScale(rank)}
                    x2={chartWidth - chartPadding.right}
                    y2={yScale(rank)}
                    className="stroke-border"
                    strokeWidth={1}
                  />
                  <text
                    x={chartPadding.left - 8}
                    y={yScale(rank)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs font-medium"
                  >
                    {rank}
                  </text>
                </g>
              ))}

              {/* X-axis labels */}
              {data.overValues.map((overValue, i) => {
                const x = xScale(i);
                // Only show every Nth label to avoid crowding
                const showLabel = data.overValues.length <= 15 || i % Math.ceil(data.overValues.length / 15) === 0;
                
                return (
                  <g key={overValue}>
                    {/* Vertical grid line */}
                    <line
                      x1={x}
                      y1={chartPadding.top}
                      x2={x}
                      y2={chartHeight - chartPadding.bottom}
                      className="stroke-border/30"
                      strokeWidth={1}
                    />
                    {/* Label */}
                    {showLabel && (
                      <text
                        x={x}
                        y={chartHeight - chartPadding.bottom + 15}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px] font-mono"
                      >
                        {overValue}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Series lines and points */}
              {visibleSeries.map((series, seriesIndex) => {
                const color = COLORS[seriesIndex % COLORS.length];
                const markerType = MARKER_TYPES[seriesIndex % MARKER_TYPES.length];
                const isHovered = hoveredSeries === series.name;
                const isOtherHovered = hoveredSeries !== null && !isHovered;

                return (
                  <g
                    key={series.name}
                    onMouseEnter={() => setHoveredSeries(series.name)}
                  >
                    {/* Line */}
                    <path
                      d={generatePath(series)}
                      fill="none"
                      stroke={color}
                      strokeWidth={isHovered ? 3 : 2}
                      opacity={isOtherHovered ? 0.15 : 1}
                      className="transition-all duration-150"
                      strokeLinejoin="round"
                    />

                    {/* Points */}
                    {series.data.map((d, i) => {
                      if (d.rank === 0 || d.rank > topN) return null;
                      const x = xScale(i);
                      const y = yScale(d.rank);
                      const size = isHovered ? 6 : 4;

                      return (
                        <path
                          key={i}
                          d={MARKERS[markerType](x, y, size)}
                          fill={color}
                          stroke="var(--background)"
                          strokeWidth={1.5}
                          opacity={isOtherHovered ? 0.15 : 1}
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredPoint({ 
                            series: series.name, 
                            over: d.over, 
                            value: d.value, 
                            rank: d.rank 
                          })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Y-axis label */}
              <text
                x={12}
                y={chartHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(-90, 12, ${chartHeight / 2})`}
                className="fill-muted-foreground text-xs"
              >
                Rank
              </text>
            </svg>

                {/* Mini legend - just colored dots with names, compact */}
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {visibleSeries.map((series, seriesIndex) => {
                      const color = COLORS[seriesIndex % COLORS.length];
                      const markerType = MARKER_TYPES[seriesIndex % MARKER_TYPES.length];
                      const isHovered = hoveredSeries === series.name;

                      return (
                        <button
                          key={series.name}
                          className={cn(
                            "flex items-center gap-1.5 text-xs transition-opacity",
                            hoveredSeries && !isHovered ? "opacity-30" : "opacity-100"
                          )}
                          onMouseEnter={() => setHoveredSeries(series.name)}
                          onMouseLeave={() => setHoveredSeries(null)}
                        >
                          <svg width="12" height="12" className="shrink-0">
                            <path
                              d={MARKERS[markerType](6, 6, 5)}
                              fill={color}
                            />
                          </svg>
                          <span style={{ color }} className={cn(isHovered && "font-bold")}>
                            {series.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Table View */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card">{trackLabel}</TableHead>
                      {data.overValues.map((overValue) => (
                        <TableHead key={overValue} className="text-center font-mono text-xs">
                          {overValue}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleSeries.map((series, seriesIndex) => {
                      const color = COLORS[seriesIndex % COLORS.length];
                      return (
                        <TableRow key={series.name}>
                          <TableCell className="sticky left-0 bg-card font-medium" style={{ color }}>
                            {series.name}
                          </TableCell>
                          {series.data.map((d, i) => (
                            <TableCell key={i} className="text-center">
                              {d.rank > 0 && d.rank <= topN ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-foreground">#{d.rank}</span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {d.value.toLocaleString()}{metric === "win_rate" && "%"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && data && visibleSeries.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No data available for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
