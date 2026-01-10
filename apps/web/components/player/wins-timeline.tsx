"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Win } from "dcss-player-parser";

interface WinsTimelineProps {
  wins: Win[];
}

export function WinsTimeline({ wins }: WinsTimelineProps) {
  const [viewMode, setViewMode] = useState<"chart" | "bars">("chart");

  // Group wins by year
  const winsByYear = useMemo(() => {
    const grouped = new Map<number, Win[]>();
    wins.forEach((win) => {
      const year = parseInt(win.time.split("-")[0]);
      if (!grouped.has(year)) grouped.set(year, []);
      grouped.get(year)!.push(win);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }, [wins]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-mana" />
            Wins Over Time
          </CardTitle>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode("chart")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "chart"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode("bars")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "bars"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bars
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {viewMode === "chart" ? (
          <TimelineChart wins={wins} winsByYear={winsByYear} />
        ) : (
          <TimelineBars winsByYear={winsByYear} />
        )}

        {/* Stats summary */}
        <div className="mt-8 pt-6 border-t border-border grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {winsByYear.length > 0 ? winsByYear[0][0] : "—"}
            </div>
            <div className="text-sm text-muted-foreground">First win year</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {winsByYear.length > 0 ? winsByYear[winsByYear.length - 1][0] : "—"}
            </div>
            <div className="text-sm text-muted-foreground">Most recent win year</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-health">
              {winsByYear.reduce((max, [, w]) => Math.max(max, w.length), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Most wins in a year</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Month names for labels */
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Data structure for a time bucket */
interface TimeBucket {
  key: string;
  label: string;
  year: number;
  quarter?: number;
  wins: Win[];
}

/**
 * Interactive chart view showing wins aggregated by quarter
 * Responsive - fits within container width without scrolling
 */
function TimelineChart({
  wins,
}: {
  wins: Win[];
  winsByYear: [number, Win[]][];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [hoveredBucket, setHoveredBucket] = useState<TimeBucket | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Group wins by quarter for a more compact view
  const buckets = useMemo(() => {
    if (wins.length === 0) return [];

    // Parse all dates and find range
    const winsWithDates = wins.map((win) => {
      const [year, month] = win.time.split("-").map(Number);
      const quarter = Math.ceil(month / 3);
      return { win, year, quarter };
    });

    const minYear = Math.min(...winsWithDates.map((w) => w.year));
    const maxYear = Math.max(...winsWithDates.map((w) => w.year));
    const minQuarter = Math.min(
      ...winsWithDates.filter((w) => w.year === minYear).map((w) => w.quarter)
    );
    const maxQuarter = Math.max(
      ...winsWithDates.filter((w) => w.year === maxYear).map((w) => w.quarter)
    );

    // Create buckets for every quarter in range
    const allBuckets: TimeBucket[] = [];
    for (let year = minYear; year <= maxYear; year++) {
      const startQ = year === minYear ? minQuarter : 1;
      const endQ = year === maxYear ? maxQuarter : 4;
      for (let quarter = startQ; quarter <= endQ; quarter++) {
        const quarterWins = winsWithDates
          .filter((w) => w.year === year && w.quarter === quarter)
          .map((w) => w.win);
        const quarterLabels = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
        allBuckets.push({
          key: `${year}-Q${quarter}`,
          label: `${quarterLabels[quarter - 1]} ${year}`,
          year,
          quarter,
          wins: quarterWins,
        });
      }
    }

    return allBuckets;
  }, [wins]);

  const maxWinsInBucket = Math.max(...buckets.map((b) => b.wins.length), 1);

  // Chart dimensions - responsive
  const chartHeight = 220;
  const chartPadding = { top: 20, right: 15, bottom: 50, left: 35 };
  const barGap = 3;
  
  // Calculate bar width to fit all bars in available space
  const availableWidth = containerWidth - chartPadding.left - chartPadding.right;
  const barWidth = Math.max(8, (availableWidth - barGap * (buckets.length - 1)) / buckets.length);
  const chartWidth = containerWidth;

  // Scales
  const xScale = (index: number) =>
    chartPadding.left + index * (barWidth + barGap) + barWidth / 2;
  
  const yScale = (count: number) => {
    const chartAreaHeight = chartHeight - chartPadding.top - chartPadding.bottom;
    return chartHeight - chartPadding.bottom - (count / maxWinsInBucket) * chartAreaHeight;
  };

  // Y-axis tick marks
  const yTicks = useMemo(() => {
    const ticks: number[] = [0];
    const step = Math.max(1, Math.ceil(maxWinsInBucket / 4));
    for (let i = step; i <= maxWinsInBucket; i += step) {
      ticks.push(i);
    }
    if (!ticks.includes(maxWinsInBucket) && maxWinsInBucket > 0) {
      ticks.push(maxWinsInBucket);
    }
    return ticks;
  }, [maxWinsInBucket]);

  // Find year boundaries for x-axis labels
  const yearBoundaries = useMemo(() => {
    const boundaries: { year: number; startIndex: number; endIndex: number }[] = [];
    let currentYear = -1;
    let startIndex = 0;

    buckets.forEach((bucket, index) => {
      if (bucket.year !== currentYear) {
        if (currentYear !== -1) {
          boundaries.push({ year: currentYear, startIndex, endIndex: index - 1 });
        }
        currentYear = bucket.year;
        startIndex = index;
      }
    });

    if (currentYear !== -1) {
      boundaries.push({ year: currentYear, startIndex, endIndex: buckets.length - 1 });
    }

    return boundaries;
  }, [buckets]);

  if (buckets.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No wins to display
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={chartWidth}
        height={chartHeight}
        className="block"
        onMouseLeave={() => {
          setHoveredBucket(null);
          setTooltipPosition(null);
        }}
      >
        {/* Y-axis grid lines and labels */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={chartPadding.left}
              y1={yScale(tick)}
              x2={chartWidth - chartPadding.right}
              y2={yScale(tick)}
              className="stroke-border/40"
              strokeDasharray={tick === 0 ? "0" : "4 4"}
            />
            <text
              x={chartPadding.left - 6}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-xs font-mono"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Year labels on x-axis */}
        {yearBoundaries.map(({ year, startIndex, endIndex }) => {
          const startX = xScale(startIndex) - barWidth / 2;
          const endX = xScale(endIndex) + barWidth / 2;
          const centerX = (startX + endX) / 2;
          const yearWidth = endX - startX;

          return (
            <g key={year}>
              {/* Year separator line */}
              {startIndex > 0 && (
                <line
                  x1={startX - barGap / 2}
                  y1={chartPadding.top}
                  x2={startX - barGap / 2}
                  y2={chartHeight - chartPadding.bottom + 8}
                  className="stroke-border/60"
                />
              )}
              {/* Year label - only show if there's enough space */}
              {yearWidth > 30 && (
                <text
                  x={centerX}
                  y={chartHeight - chartPadding.bottom + 28}
                  textAnchor="middle"
                  className="fill-foreground text-xs font-medium"
                >
                  {year}
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {buckets.map((bucket, index) => {
          const x = xScale(index) - barWidth / 2;
          const barHeight = bucket.wins.length > 0
            ? ((chartHeight - chartPadding.top - chartPadding.bottom) * bucket.wins.length) / maxWinsInBucket
            : 0;
          const y = chartHeight - chartPadding.bottom - barHeight;
          const isHovered = hoveredBucket?.key === bucket.key;

          return (
            <g key={bucket.key}>
              {/* Invisible hit area */}
              <rect
                x={x}
                y={chartPadding.top}
                width={barWidth}
                height={chartHeight - chartPadding.top - chartPadding.bottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredBucket(bucket);
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
              />
              {/* Actual bar */}
              {bucket.wins.length > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={Math.min(2, barWidth / 4)}
                  fill="var(--health)"
                  opacity={isHovered ? 1 : 0.75}
                  className="transition-opacity duration-150"
                />
              )}
              {/* Show count on bar if there's space */}
              {bucket.wins.length > 0 && barHeight > 18 && barWidth > 14 && (
                <text
                  x={xScale(index)}
                  y={y + 12}
                  textAnchor="middle"
                  className="fill-background text-[10px] font-bold pointer-events-none"
                >
                  {bucket.wins.length}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredBucket && tooltipPosition && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-lg p-3 pointer-events-none z-50"
          style={{
            left: Math.min(tooltipPosition.x + 15, window.innerWidth - 220),
            top: Math.max(10, tooltipPosition.y - 10),
          }}
        >
          <div className="font-medium text-foreground mb-1">
            {hoveredBucket.label}
          </div>
          {hoveredBucket.wins.length === 0 ? (
            <div className="text-sm text-muted-foreground">No wins this quarter</div>
          ) : (
            <div className="text-sm text-health font-medium">
              {hoveredBucket.wins.length} win{hoveredBucket.wins.length !== 1 ? "s" : ""}
              {hoveredBucket.wins.length <= 5 && (
                <span className="text-muted-foreground font-normal ml-2">
                  {hoveredBucket.wins.map((w) => w.character).join(", ")}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Original bar chart view showing wins per year
 */
function TimelineBars({ winsByYear }: { winsByYear: [number, Win[]][] }) {
  const maxWinsInYear = Math.max(...winsByYear.map(([, w]) => w.length));

  return (
    <div className="space-y-3">
      {winsByYear.map(([year, yearWins]) => (
        <div key={year} className="flex items-center gap-4">
          <span className="w-12 font-mono text-sm text-muted-foreground">{year}</span>
          <div className="flex-1 h-8 bg-secondary/30 rounded overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-health/60 to-health transition-all duration-500"
              style={{ width: `${(yearWins.length / maxWinsInYear) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center px-3">
              <span className="text-sm font-medium">
                {yearWins.length} win{yearWins.length !== 1 && "s"}
              </span>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap max-w-xs">
            {yearWins.slice(0, 10).map((win, i) => (
              <a
                key={i}
                href={win.morgueUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                title={`${win.character} - ${win.score.toLocaleString()}`}
                className="w-6 h-6 rounded bg-health/20 hover:bg-health/40 transition-colors flex items-center justify-center text-xs font-mono text-health"
              >
                {win.runes}
              </a>
            ))}
            {yearWins.length > 10 && (
              <span className="text-xs text-muted-foreground self-center">
                +{yearWins.length - 10}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

