"use client";

import { useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlayerData } from "dcss-player-parser";

interface StreaksSectionProps {
  streaks: PlayerData["streaks"];
}

export function StreaksSection({ streaks }: StreaksSectionProps) {
  const [sortBy, setSortBy] = useState<"length" | "start" | "end">("length");

  const sortedStreaks = useMemo(() => {
    const sorted = [...streaks];
    sorted.sort((a, b) => {
      if (sortBy === "length") {
        return b.wins - a.wins;
      } else if (sortBy === "start") {
        return new Date(b.start).getTime() - new Date(a.start).getTime();
      } else {
        return new Date(b.end).getTime() - new Date(a.end).getTime();
      }
    });
    return sorted;
  }, [streaks, sortBy]);

  if (streaks.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No recorded win streaks</p>
        </CardContent>
      </Card>
    );
  }

  const maxWins = Math.max(...streaks.map((s) => s.wins));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            Win Streaks
          </CardTitle>
          <div className="flex gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Sort:</span>
            {(["length", "start", "end"] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  sortBy === sort
                    ? "bg-gold/20 border-gold/50 text-foreground"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {sort === "length" ? "Length" : sort === "start" ? "Start Date" : "End Date"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {sortedStreaks.map((streak, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border transition-colors ${
                streak.wins === maxWins
                  ? "bg-gold/5 border-gold/30"
                  : "bg-secondary/30 border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`text-2xl font-bold ${
                      streak.wins === maxWins ? "text-gold" : "text-foreground"
                    }`}
                  >
                    {streak.wins}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">consecutive wins</div>
                    <div className="text-xs text-muted-foreground">
                      {streak.start.split(" ")[0]} → {streak.end.split(" ")[0]}
                    </div>
                  </div>
                </div>
                {streak.wins === maxWins && (
                  <Badge className="bg-gold/20 text-gold border-gold/30">Best Streak</Badge>
                )}
              </div>

              {/* Games in streak */}
              <div className="flex flex-wrap gap-2 mb-3">
                {streak.games.map((game, j) => (
                  <a
                    key={j}
                    href={game.morgueUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-health/20 rounded text-xs font-mono text-health hover:bg-health/30 transition-colors"
                  >
                    {game.character}
                  </a>
                ))}
                {streak.streakBreaker && (
                  <>
                    <span className="self-center text-muted-foreground">→</span>
                    <a
                      href={streak.streakBreaker.morgueUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-destructive/20 rounded text-xs font-mono text-destructive hover:bg-destructive/30 transition-colors"
                      title="Streak breaker"
                    >
                      {streak.streakBreaker.character} ✗
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

