"use client";

import { useState, useMemo } from "react";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayerData } from "dcss-player-parser";

interface ComboStatsSectionProps {
  data: PlayerData;
}

export function ComboStatsSection({ data }: ComboStatsSectionProps) {
  const [viewMode, setViewMode] = useState<"species" | "background" | "combo">("species");
  const [sortBy, setSortBy] = useState<"wins" | "games" | "winPercent">("wins");

  const displayData = useMemo(() => {
    let items: Array<{ name: string; wins: number; games: number; winPercent: number; bestXL: number }> =
      [];

    if (viewMode === "species") {
      items = data.speciesStats.map((s) => ({
        name: s.species,
        wins: s.wins,
        games: s.games,
        winPercent: s.winPercent,
        bestXL: s.bestXL,
      }));
    } else if (viewMode === "background") {
      items = data.backgroundStats.map((b) => ({
        name: b.background,
        wins: b.wins,
        games: b.games,
        winPercent: b.winPercent,
        bestXL: b.bestXL,
      }));
    } else {
      items = data.comboStats.map((c) => ({
        name: `${c.species}${c.background}`,
        wins: c.wins,
        games: c.games,
        winPercent: c.winPercent,
        bestXL: c.bestXL,
      }));
    }

    // Filter out zero-game entries and sort
    items = items.filter((item) => item.games > 0);
    items.sort((a, b) => {
      if (sortBy === "winPercent") {
        // For win percent, only compare items with wins
        if (a.wins === 0 && b.wins === 0) return b.games - a.games;
        if (a.wins === 0) return 1;
        if (b.wins === 0) return -1;
      }
      return b[sortBy] - a[sortBy];
    });

    return items;
  }, [data, viewMode, sortBy]);

  const maxGames = Math.max(...displayData.map((d) => d.games), 1);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-special" />
            Character Statistics
          </CardTitle>
          <div className="flex flex-wrap gap-4">
            {/* View mode tabs - matching main tab style */}
            <div className="flex gap-2">
              {(["species", "background", "combo"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 text-sm rounded-md border transition-colors ${
                    viewMode === mode
                      ? "bg-health/20 border-health/50 text-foreground"
                      : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            {/* Sort tabs */}
            <div className="flex gap-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Sort:</span>
              {(["wins", "games", "winPercent"] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    sortBy === sort
                      ? "bg-gold/20 border-gold/50 text-foreground"
                      : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {sort === "winPercent" ? "Win %" : sort.charAt(0).toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-1">
          {displayData.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-4 py-1.5 px-2 rounded hover:bg-secondary/30 transition-colors"
            >
              <span className="w-14 font-mono text-sm font-medium text-foreground">
                {item.name}
              </span>

              {/* Bar */}
              <div className="flex-1 h-5 bg-secondary/30 rounded overflow-hidden relative">
                {/* Games bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-muted-foreground/20"
                  style={{ width: `${(item.games / maxGames) * 100}%` }}
                />
                {/* Wins portion */}
                {item.wins > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-health/60"
                    style={{ width: `${(item.wins / maxGames) * 100}%` }}
                  />
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-sm">
                <div className="w-14 text-right font-mono">
                  <span className="text-health">{item.wins}</span>
                  <span className="text-muted-foreground">/{item.games}</span>
                </div>
                <div className="w-12 text-right font-mono">
                  {item.wins > 0 ? (
                    <span className={item.winPercent >= 10 ? "text-gold" : "text-muted-foreground"}>
                      {item.winPercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-border flex gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-health/60 rounded" />
            <span>Wins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-muted-foreground/20 rounded" />
            <span>Games Played</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

