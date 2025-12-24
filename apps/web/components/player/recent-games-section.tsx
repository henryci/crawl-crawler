"use client";

import { useMemo } from "react";
import { Trophy, Skull, Gamepad2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortIcon } from "@/components/sort-icon";
import { useSortable } from "@/hooks/use-sortable";
import type { RecentGame } from "dcss-player-parser";

interface RecentGamesSectionProps {
  games: RecentGame[];
}

function isWin(game: RecentGame): boolean {
  return game.end.includes("escaped with the Orb");
}

export function RecentGamesSection({ games }: RecentGamesSectionProps) {
  // Calculate summary stats
  const summary = useMemo(() => {
    const totalGames = games.length;
    const wins = games.filter((g) => isWin(g)).length;
    const totalScore = games.reduce((sum, g) => sum + g.score, 0);
    const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    return { totalGames, wins, avgScore, winRate };
  }, [games]);

  const { sortedData, sortDir, handleSort, isSortedBy } = useSortable(games, {
    initialField: "date" as keyof RecentGame,
    initialDirection: "desc",
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-mana" />
            Recent Games
          </CardTitle>

          {/* Summary Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/30 border border-border">
              <span className="text-muted-foreground">Games:</span>
              <span className="font-mono font-medium">{summary.totalGames}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/30 border border-border">
              <span className="text-muted-foreground">Wins:</span>
              <span className="font-mono font-medium text-health">{summary.wins}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/30 border border-border">
              <span className="text-muted-foreground">Win Rate:</span>
              <span
                className={`font-mono font-medium ${summary.winRate >= 5 ? "text-gold" : ""}`}
              >
                {summary.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/30 border border-border">
              <span className="text-muted-foreground">Avg Score:</span>
              <span className="font-mono font-medium">{summary.avgScore.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("score" as keyof RecentGame)}
                >
                  Score
                  <SortIcon active={isSortedBy("score" as keyof RecentGame)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("character" as keyof RecentGame)}
                >
                  Combo
                  <SortIcon
                    active={isSortedBy("character" as keyof RecentGame)}
                    direction={sortDir}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("god" as keyof RecentGame)}
                >
                  God
                  <SortIcon active={isSortedBy("god" as keyof RecentGame)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("xl" as keyof RecentGame)}
                >
                  XL
                  <SortIcon active={isSortedBy("xl" as keyof RecentGame)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("place" as keyof RecentGame)}
                >
                  Place
                  <SortIcon active={isSortedBy("place" as keyof RecentGame)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("runes" as keyof RecentGame)}
                >
                  Runes
                  <SortIcon active={isSortedBy("runes" as keyof RecentGame)} direction={sortDir} />
                </TableHead>
                <TableHead>End</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("turns" as keyof RecentGame)}
                >
                  Turns
                  <SortIcon active={isSortedBy("turns" as keyof RecentGame)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("duration" as keyof RecentGame)}
                >
                  Duration
                  <SortIcon
                    active={isSortedBy("duration" as keyof RecentGame)}
                    direction={sortDir}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("date" as keyof RecentGame)}
                >
                  Date
                  <SortIcon active={isSortedBy("date" as keyof RecentGame)} direction={sortDir} />
                </TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((game, idx) => {
                const won = isWin(game);
                return (
                  <TableRow
                    key={idx}
                    className={`hover:bg-secondary/30 ${won ? "bg-health/5" : ""}`}
                  >
                    <TableCell className="font-mono">
                      {game.morgueUrl ? (
                        <a
                          href={game.morgueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`hover:underline ${won ? "text-gold" : "text-foreground"}`}
                        >
                          {game.score > 0 ? game.score.toLocaleString() : "—"}
                        </a>
                      ) : (
                        <span className={won ? "text-gold" : ""}>
                          {game.score > 0 ? game.score.toLocaleString() : "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono ${won ? "text-health font-medium" : ""}`}>
                        {game.character}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{game.god || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{game.xl}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {game.place || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {game.runes !== null ? (
                        <span className={game.runes === 15 ? "text-health font-medium" : ""}>
                          {game.runes}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {won ? (
                        <span className="flex items-center gap-1 text-health">
                          <Trophy className="w-3 h-3" />
                          <span className="truncate">{game.end}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Skull className="w-3 h-3" />
                          <span className="truncate">{game.end}</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {game.turns.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{game.duration}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {game.date.split(" ")[0]}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{game.version}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

