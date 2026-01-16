"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SkillProgression {
  skill_name: string;
  xl: number;
  avg_level: number;
  game_count: number;
}

interface FinalSkill {
  skill_name: string;
  avg_level: number;
  max_level: number;
  game_count: number;
}

interface SkillsHeatmapProps {
  queryString: string;
}

export function SkillsHeatmap({ queryString }: SkillsHeatmapProps) {
  const [loading, setLoading] = useState(true);
  const [progression, setProgression] = useState<SkillProgression[]>([]);
  const [finalSkills, setFinalSkills] = useState<FinalSkill[]>([]);

  useEffect(() => {
    async function loadSkills() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/skills?${queryString}`);
        if (!response.ok) throw new Error("Failed to load skills");
        const data = await response.json();
        setProgression(data.progression);
        setFinalSkills(data.finalSkills);
      } catch (err) {
        console.error("Failed to load skills:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSkills();
  }, [queryString]);

  // Build heatmap data structure
  const heatmapData = useMemo(() => {
    const skillMap = new Map<string, Map<number, { avg: number; count: number }>>();
    
    for (const row of progression) {
      if (!skillMap.has(row.skill_name)) {
        skillMap.set(row.skill_name, new Map());
      }
      skillMap.get(row.skill_name)!.set(row.xl, {
        avg: Number(row.avg_level),
        count: Number(row.game_count),
      });
    }
    
    // Sort skills by total training (sum of avg levels)
    const sortedSkills = Array.from(skillMap.entries())
      .map(([name, xlMap]) => {
        let total = 0;
        xlMap.forEach((v) => (total += v.avg));
        return { name, xlMap, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Top 15 skills
    
    return sortedSkills;
  }, [progression]);

  // XL columns (1-27)
  const xlColumns = Array.from({ length: 27 }, (_, i) => i + 1);

  // Get color intensity based on skill level
  function getHeatColor(level: number | undefined): string {
    if (!level || level === 0) return "bg-transparent";
    if (level < 5) return "bg-mana/20";
    if (level < 10) return "bg-mana/40";
    if (level < 15) return "bg-mana/60";
    if (level < 20) return "bg-mana/80";
    return "bg-mana";
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-mana" />
          <p className="mt-4 text-muted-foreground">Loading skill data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Final Skills Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Average Final Skill Levels</CardTitle>
        </CardHeader>
        <CardContent>
          {finalSkills.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No skill data available for current filters.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {finalSkills.slice(0, 12).map((skill) => (
                <div
                  key={skill.skill_name}
                  className="flex items-center justify-between p-2 rounded bg-secondary/30"
                >
                  <span className="text-sm text-foreground truncate">
                    {skill.skill_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-mana">
                      {skill.avg_level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({skill.game_count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Progression Heatmap */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Skill Training by XL</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {heatmapData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No progression data available for current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="sticky left-0 bg-card z-10 min-w-[120px]">
                      Skill
                    </TableHead>
                    {xlColumns.map((xl) => (
                      <TableHead
                        key={xl}
                        className="text-center px-1 min-w-[32px] text-xs"
                      >
                        {xl}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmapData.map(({ name, xlMap }) => (
                    <TableRow key={name} className="hover:bg-secondary/20">
                      <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm">
                        {name}
                      </TableCell>
                      {xlColumns.map((xl) => {
                        const data = xlMap.get(xl);
                        return (
                          <TableCell
                            key={xl}
                            className={`text-center px-0 py-0.5 ${getHeatColor(data?.avg)}`}
                            title={
                              data
                                ? `${name} at XL ${xl}: avg ${data.avg} (${data.count} games)`
                                : undefined
                            }
                          >
                            {data && data.avg > 0 && (
                              <div className="flex flex-col items-center leading-none">
                                <span className="text-xs font-mono">
                                  {Math.round(data.avg)}
                                </span>
                                <span className="text-[9px] text-muted-foreground/70">
                                  {data.count}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
        <span>Skill Level:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-mana/20 rounded" />
          <span>1-4</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-mana/40 rounded" />
          <span>5-9</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-mana/60 rounded" />
          <span>10-14</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-mana/80 rounded" />
          <span>15-19</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-mana rounded" />
          <span>20+</span>
        </div>
      </div>
    </div>
  );
}
