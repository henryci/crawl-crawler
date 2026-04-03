"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SpellData {
  spell_name: string;
  spell_level: number | null;
  game_count: number;
  avg_failure: number | null;
  schools: string;
  percentage: number;
}

interface SpellsChartProps {
  queryString: string;
}

const PAGE_SIZE = 30;

export function SpellsChart({ queryString }: SpellsChartProps) {
  const [loading, setLoading] = useState(true);
  const [spells, setSpells] = useState<SpellData[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function loadSpells() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/spells?${queryString}`);
        if (!response.ok) throw new Error("Failed to load spells");
        const data = await response.json();
        setSpells(data.spells);
      } catch (err) {
        console.error("Failed to load spells:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSpells();
  }, [queryString]);

  useEffect(() => {
    setPage(0);
  }, [queryString]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(spells.length / PAGE_SIZE) - 1);
    setPage((currentPage) => Math.min(currentPage, maxPage));
  }, [spells.length]);

  function getSpellLevelColor(level: number | null): string {
    if (!level) return "bg-secondary/50 border-border text-muted-foreground";
    if (level <= 3) return "bg-health/20 border-health/30 text-health";
    if (level <= 5) return "bg-gold/20 border-gold/30 text-gold";
    if (level <= 7) return "bg-mana/20 border-mana/30 text-mana";
    return "bg-special/20 border-special/30 text-special";
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-mana" />
          <p className="mt-4 text-muted-foreground">Loading spell data...</p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(spells.length / PAGE_SIZE);
  const pageStart = page * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paginatedSpells = spells.slice(pageStart, pageEnd);

  return (
    <div>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Spell Popularity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {spells.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No spell data available for current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Spell</TableHead>
                    <TableHead className="text-center">Level</TableHead>
                    <TableHead>Schools</TableHead>
                    <TableHead className="text-right">Games</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Avg Fail</TableHead>
                    <TableHead className="w-[200px]">Popularity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSpells.map((spell, index) => (
                    <TableRow key={spell.spell_name} className="hover:bg-secondary/30">
                      <TableCell className="font-medium">
                        <span className="text-muted-foreground mr-2 text-xs">
                          #{pageStart + index + 1}
                        </span>
                        {spell.spell_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={getSpellLevelColor(spell.spell_level)}
                        >
                          {spell.spell_level ?? "?"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {spell.schools || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(spell.game_count).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-mana">
                        {spell.percentage}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {spell.avg_failure !== null ? `${spell.avg_failure}%` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-secondary/30 rounded-full h-2">
                          <div
                            className="bg-mana h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(spell.percentage, 100)}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {spells.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-mono text-foreground">{(pageStart + 1).toLocaleString()}</span>
              {" - "}
              <span className="font-mono text-foreground">{Math.min(pageEnd, spells.length).toLocaleString()}</span>
              {" of "}
              <span className="font-mono text-foreground">{spells.length.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm text-muted-foreground">
                Page <span className="font-mono text-foreground">{page + 1}</span> of{" "}
                <span className="font-mono text-foreground">{totalPages}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
