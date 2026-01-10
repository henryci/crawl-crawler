"use client";

import { useState, useMemo } from "react";
import { TrendingUp, Trophy, Flame, Target, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlayerData } from "dcss-player-parser";

interface StreaksSectionProps {
  streaks: PlayerData["streaks"];
}

export function StreaksSection({ streaks }: StreaksSectionProps) {
  const [expandedStreak, setExpandedStreak] = useState<number | null>(null);

  // Sort by length (longest first)
  const sortedStreaks = useMemo(() => {
    return [...streaks].sort((a, b) => b.wins - a.wins);
  }, [streaks]);

  // Calculate stats
  const stats = useMemo(() => {
    if (streaks.length === 0) return null;
    
    const maxStreak = Math.max(...streaks.map((s) => s.wins));
    const totalStreakWins = streaks.reduce((sum, s) => sum + s.wins, 0);
    const avgStreakLength = totalStreakWins / streaks.length;
    
    // Find most common species/class in streaks
    const comboCounts = new Map<string, number>();
    streaks.forEach((streak) => {
      streak.games.forEach((game) => {
        const combo = game.character;
        comboCounts.set(combo, (comboCounts.get(combo) || 0) + 1);
      });
    });
    const topCombo = [...comboCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      maxStreak,
      totalStreaks: streaks.length,
      avgStreakLength: avgStreakLength.toFixed(1),
      totalStreakWins,
      topCombo: topCombo ? { combo: topCombo[0], count: topCombo[1] } : null,
    };
  }, [streaks]);

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

  const maxWins = stats?.maxStreak || 1;

  return (
    <div className="space-y-4">
      {/* Stats Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-2xl font-bold text-gold">{stats?.maxStreak}</span>
          </div>
          <div className="text-xs text-muted-foreground">Best Streak</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-health" />
            <span className="text-2xl font-bold text-foreground">{stats?.totalStreaks}</span>
          </div>
          <div className="text-xs text-muted-foreground">Total Streaks</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-mana" />
            <span className="text-2xl font-bold text-foreground">{stats?.avgStreakLength}</span>
          </div>
          <div className="text-xs text-muted-foreground">Avg Length</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Target className="w-4 h-4 text-special" />
            <span className="text-lg font-bold font-mono text-foreground">{stats?.topCombo?.combo}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Top Combo ({stats?.topCombo?.count}×)
          </div>
        </div>
      </div>

      {/* Streak Visualization */}
      <Card className="bg-card border-border">
        <CardContent className="py-4">
          <div className="space-y-2">
            {sortedStreaks.map((streak, i) => {
              const isExpanded = expandedStreak === i;
              const isBest = streak.wins === maxWins;
              const barWidth = (streak.wins / maxWins) * 100;

              return (
                <div key={i} className="group">
                  {/* Compact streak bar */}
                  <button
                    onClick={() => setExpandedStreak(isExpanded ? null : i)}
                    className={`w-full text-left transition-colors rounded-lg p-2 ${
                      isBest
                        ? "bg-gold/10 hover:bg-gold/15"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Streak length number */}
                      <div
                        className={`w-8 text-lg font-bold text-center ${
                          isBest ? "text-gold" : "text-foreground"
                        }`}
                      >
                        {streak.wins}
                      </div>

                      {/* Visual bar */}
                      <div className="flex-1 relative">
                        <div className="h-6 bg-secondary/30 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all duration-300 ${
                              isBest
                                ? "bg-gradient-to-r from-gold/40 to-gold/60"
                                : "bg-gradient-to-r from-health/30 to-health/50"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        {/* Inline game badges on bar */}
                        <div className="absolute inset-0 flex items-center px-2 gap-1 overflow-hidden">
                          {streak.games.slice(0, 8).map((game, j) => (
                            <span
                              key={j}
                              className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                                isBest
                                  ? "bg-background text-gold border-gold/40"
                                  : "bg-background text-health border-health/40"
                              }`}
                            >
                              {game.character}
                            </span>
                          ))}
                          {streak.games.length > 8 && (
                            <span className="text-[10px] bg-background text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                              +{streak.games.length - 8}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date range */}
                      <div className="text-xs text-muted-foreground hidden sm:block w-28 text-right">
                        {streak.start.split(" ")[0].slice(2)}
                      </div>

                      {/* Expand icon */}
                      <div className="text-muted-foreground">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-2 ml-11 mr-8 p-3 bg-secondary/20 rounded-lg border border-border/50">
                      <div className="text-xs text-muted-foreground mb-2">
                        {streak.start.split(" ")[0]} → {streak.end.split(" ")[0]}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
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
                            <span className="self-center text-muted-foreground text-xs">→</span>
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
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

