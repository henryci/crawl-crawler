"use client";

import type { PlayerData } from "dcss-player-parser";

interface OverallStatsSectionProps {
  data: PlayerData;
}

export function OverallStatsSection({ data }: OverallStatsSectionProps) {
  const stats = data.overallStats;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <span>
        <span className="text-muted-foreground">Score:</span>{" "}
        <span className="font-mono text-gold">{stats.totalScore.toLocaleString()}</span>
      </span>
      <span className="text-border">•</span>
      <span>
        <span className="text-muted-foreground">Games:</span>{" "}
        <span className="font-mono">{stats.games.toLocaleString()}</span>
      </span>
      <span className="text-border">•</span>
      <span>
        <span className="text-muted-foreground">Wins:</span>{" "}
        <span className="font-mono text-health">{stats.wins}</span>
        <span className="text-muted-foreground"> ({stats.winPercent.toFixed(1)}%)</span>
      </span>
      <span className="text-border">•</span>
      {stats.bestScoreMorgueUrl ? (
        <a
          href={stats.bestScoreMorgueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <span className="text-muted-foreground">Best:</span>{" "}
          <span className="font-mono text-mana">{stats.bestScore.toLocaleString()}</span>
        </a>
      ) : (
        <span>
          <span className="text-muted-foreground">Best:</span>{" "}
          <span className="font-mono text-mana">{stats.bestScore.toLocaleString()}</span>
        </span>
      )}
      <span className="text-border">•</span>
      <span>
        <span className="text-muted-foreground">Avg:</span>{" "}
        <span className="font-mono">{stats.averageScore.toLocaleString()}</span>
      </span>
    </div>
  );
}

