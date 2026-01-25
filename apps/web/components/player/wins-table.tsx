"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { getMorgueViewerUrl } from "./utils";
import type { Win } from "dcss-player-parser";

interface WinsTableProps {
  wins: Win[];
}

function getRunesBadgeClass(runes: number): string {
  if (runes >= 15) return "bg-health/20 border-health/30 text-health";
  if (runes >= 5) return "bg-mana/20 border-mana/30 text-mana";
  return "bg-secondary/50 border-border text-muted-foreground";
}

export function WinsTable({ wins }: WinsTableProps) {
  const [filters, setFilters] = useState({
    character: "",
    god: "",
    minRunes: 0,
    minScore: 0,
    maxTurns: 0,
  });

  const filteredWins = useMemo(() => {
    let result = [...wins];

    if (filters.character) {
      const search = filters.character.toLowerCase();
      result = result.filter(
        (w) =>
          w.character.toLowerCase().includes(search) ||
          w.species.toLowerCase().includes(search) ||
          w.background.toLowerCase().includes(search)
      );
    }
    if (filters.god) {
      const search = filters.god.toLowerCase();
      result = result.filter((w) => w.god.toLowerCase().includes(search));
    }
    if (filters.minRunes > 0) {
      result = result.filter((w) => w.runes >= filters.minRunes);
    }
    if (filters.minScore > 0) {
      result = result.filter((w) => w.score >= filters.minScore);
    }
    if (filters.maxTurns > 0) {
      result = result.filter((w) => w.turns <= filters.maxTurns);
    }

    return result;
  }, [wins, filters]);

  const { sortedData, sortField, sortDir, handleSort, isSortedBy } = useSortable(
    filteredWins,
    { initialField: "rank" as keyof Win, initialDirection: "asc" }
  );

  const hasActiveFilters =
    filters.character ||
    filters.god ||
    filters.minRunes > 0 ||
    filters.minScore > 0 ||
    filters.maxTurns > 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Wins
              {sortedData.length !== wins.length && (
                <span className="text-muted-foreground font-normal ml-2">
                  (showing {sortedData.length} of {wins.length})
                </span>
              )}
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({ character: "", god: "", minRunes: 0, minScore: 0, maxTurns: 0 })
                }
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Combo</label>
              <Input
                placeholder="e.g. MD, Fi, MiFi"
                value={filters.character}
                onChange={(e) => setFilters({ ...filters, character: e.target.value })}
                className="bg-secondary/50 h-8 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[120px] max-w-[160px]">
              <label className="text-xs text-muted-foreground mb-1 block">God</label>
              <Input
                placeholder="e.g. Trog"
                value={filters.god}
                onChange={(e) => setFilters({ ...filters, god: e.target.value })}
                className="bg-secondary/50 h-8 text-sm"
              />
            </div>
            <div className="w-[90px]">
              <label className="text-xs text-muted-foreground mb-1 block">Min Runes</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minRunes || ""}
                onChange={(e) =>
                  setFilters({ ...filters, minRunes: parseInt(e.target.value) || 0 })
                }
                className="bg-secondary/50 h-8 text-sm"
              />
            </div>
            <div className="w-[100px]">
              <label className="text-xs text-muted-foreground mb-1 block">Min Score</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minScore || ""}
                onChange={(e) =>
                  setFilters({ ...filters, minScore: parseInt(e.target.value) || 0 })
                }
                className="bg-secondary/50 h-8 text-sm"
              />
            </div>
            <div className="w-[100px]">
              <label className="text-xs text-muted-foreground mb-1 block">Max Turns</label>
              <Input
                type="number"
                placeholder="∞"
                value={filters.maxTurns || ""}
                onChange={(e) =>
                  setFilters({ ...filters, maxTurns: parseInt(e.target.value) || 0 })
                }
                className="bg-secondary/50 h-8 text-sm"
              />
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
                  onClick={() => handleSort("rank" as keyof Win)}
                >
                  #
                  <SortIcon active={isSortedBy("rank" as keyof Win)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("character" as keyof Win)}
                >
                  Combo
                  <SortIcon active={isSortedBy("character" as keyof Win)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("score" as keyof Win)}
                >
                  Score
                  <SortIcon active={isSortedBy("score" as keyof Win)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("runes" as keyof Win)}
                >
                  Runes
                  <SortIcon active={isSortedBy("runes" as keyof Win)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("god" as keyof Win)}
                >
                  God
                  <SortIcon active={isSortedBy("god" as keyof Win)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("turns" as keyof Win)}
                >
                  Turns
                  <SortIcon active={isSortedBy("turns" as keyof Win)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("duration" as keyof Win)}
                >
                  Duration
                  <SortIcon active={isSortedBy("duration" as keyof Win)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("time" as keyof Win)}
                >
                  Date
                  <SortIcon active={isSortedBy("time" as keyof Win)} direction={sortDir} />
                </TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((win) => (
                <TableRow key={win.rank} className="hover:bg-secondary/30">
                  <TableCell className="font-mono text-muted-foreground">{win.rank}</TableCell>
                  <TableCell>
                    {getMorgueViewerUrl(win.morgueUrl) ? (
                      <Link
                        href={getMorgueViewerUrl(win.morgueUrl)!}
                        className="font-mono text-health hover:underline"
                      >
                        {win.character}
                      </Link>
                    ) : (
                      <span className="font-mono text-health">{win.character}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">{win.title}</span>
                  </TableCell>
                  <TableCell className="font-mono text-gold">
                    {win.score.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRunesBadgeClass(win.runes)}>
                      {win.runes}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{win.god || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{win.turns.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-sm">{win.duration}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {win.time.split(" ")[0]}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{win.version}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

