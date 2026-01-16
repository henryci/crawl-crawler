"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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

export function SpellsChart({ queryString }: SpellsChartProps) {
  const [loading, setLoading] = useState(true);
  const [spells, setSpells] = useState<SpellData[]>([]);
  const [totalGames, setTotalGames] = useState(0);

  useEffect(() => {
    async function loadSpells() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/spells?${queryString}`);
        if (!response.ok) throw new Error("Failed to load spells");
        const data = await response.json();
        setSpells(data.spells);
        setTotalGames(data.totalGames);
      } catch (err) {
        console.error("Failed to load spells:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSpells();
  }, [queryString]);

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalGames.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Spells Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mana">
              {spells.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Popular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-health truncate">
              {spells[0]?.spell_name ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {spells[0] ? `${spells[0].percentage}% of games` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spells Table */}
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
                  {spells.slice(0, 30).map((spell, index) => (
                    <TableRow key={spell.spell_name} className="hover:bg-secondary/30">
                      <TableCell className="font-medium">
                        <span className="text-muted-foreground mr-2 text-xs">
                          #{index + 1}
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
      </Card>
    </div>
  );
}
