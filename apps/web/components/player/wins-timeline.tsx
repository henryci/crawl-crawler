"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Win } from "dcss-player-parser";

interface WinsTimelineProps {
  wins: Win[];
}

export function WinsTimeline({ wins }: WinsTimelineProps) {
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

  const maxWinsInYear = Math.max(...winsByYear.map(([, w]) => w.length));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-mana" />
          Wins Over Time
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Year-based bar chart */}
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

