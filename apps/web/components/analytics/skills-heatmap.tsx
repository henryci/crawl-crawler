"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface FinalSkillDistribution {
  skill_name: string;
  level_bucket: string;
  bucket_order: number;
  game_count: number;
}

interface CapstoneSkill {
  skill_name: string;
  games_15_plus: number;
  games_20_plus: number;
  pct_15_plus: number;
  pct_20_plus: number;
  avg_level: number;
}

interface SkillsHeatmapProps {
  queryString: string;
}

export function SkillsHeatmap({ queryString }: SkillsHeatmapProps) {
  const [loading, setLoading] = useState(true);
  const [isFinalDistributionHelpOpen, setIsFinalDistributionHelpOpen] = useState(false);
  const [finalSkillsView, setFinalSkillsView] = useState<"distribution" | "capstone">("distribution");
  const [showAllAverageFinalSkills, setShowAllAverageFinalSkills] = useState(false);
  const [showAllTrainingSkills, setShowAllTrainingSkills] = useState(false);
  const [showAllFinalDistribution, setShowAllFinalDistribution] = useState(false);
  const [showAllCapstoneSkills, setShowAllCapstoneSkills] = useState(false);
  const [totalGames, setTotalGames] = useState(0);
  const [progression, setProgression] = useState<SkillProgression[]>([]);
  const [finalSkills, setFinalSkills] = useState<FinalSkill[]>([]);
  const [finalDistribution, setFinalDistribution] = useState<FinalSkillDistribution[]>([]);
  const [capstoneSkills, setCapstoneSkills] = useState<CapstoneSkill[]>([]);

  useEffect(() => {
    async function loadSkills() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/skills?${queryString}`);
        if (!response.ok) throw new Error("Failed to load skills");
        const data = await response.json();
        setTotalGames(Number(data.totalGames ?? 0));
        setProgression(data.progression);
        setFinalSkills(data.finalSkills);
        setFinalDistribution(data.finalDistribution ?? []);
        setCapstoneSkills(data.capstoneSkills ?? []);
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
      .sort((a, b) => b.total - a.total);
    
    return sortedSkills;
  }, [progression]);

  const distributionBuckets = [
    { key: "0", label: "0" },
    { key: "1-4", label: "1-4" },
    { key: "5-9", label: "5-9" },
    { key: "10-14", label: "10-14" },
    { key: "15-19", label: "15-19" },
    { key: "20-26", label: "20-26" },
    { key: "27", label: "27" },
  ];

  const finalDistributionData = useMemo(() => {
    const bucketMap = new Map<string, Map<string, number>>();

    for (const row of finalDistribution) {
      if (!bucketMap.has(row.skill_name)) {
        bucketMap.set(row.skill_name, new Map());
      }
      bucketMap.get(row.skill_name)!.set(row.level_bucket, Number(row.game_count));
    }

    return finalSkills.map((skill) => {
      const skillBuckets = bucketMap.get(skill.skill_name) ?? new Map<string, number>();
      const rowsTotal = Array.from(skillBuckets.values()).reduce((sum, count) => sum + count, 0);
      if (!skillBuckets.has("0") && totalGames > rowsTotal) {
        skillBuckets.set("0", totalGames - rowsTotal);
      }

      const cells = distributionBuckets.map((bucket) => {
        const count = skillBuckets.get(bucket.key) ?? 0;
        const pct = totalGames > 0 ? (count / totalGames) * 100 : 0;
        return {
          key: bucket.key,
          label: bucket.label,
          count,
          pct,
        };
      });

      return {
        skill_name: skill.skill_name,
        avg_level: Number(skill.avg_level),
        cells,
      };
    });
  }, [distributionBuckets, finalDistribution, finalSkills, totalGames]);

  // XL columns (1-27)
  const xlColumns = Array.from({ length: 27 }, (_, i) => i + 1);
  const displayedFinalDistributionRows = showAllFinalDistribution
    ? finalDistributionData
    : finalDistributionData.slice(0, 12);
  const displayedCapstoneRows = showAllCapstoneSkills
    ? capstoneSkills
    : capstoneSkills.slice(0, 12);
  const displayedAverageFinalSkills = showAllAverageFinalSkills
    ? finalSkills
    : finalSkills.slice(0, 12);
  const displayedTrainingSkills = showAllTrainingSkills
    ? heatmapData
    : heatmapData.slice(0, 15);

  // Get color intensity based on skill level
  // Returns { bg, text, subtext } classes for proper contrast
  function getHeatColors(level: number | undefined): { bg: string; text: string; subtext: string } {
    if (!level || level === 0) return { bg: "bg-transparent", text: "", subtext: "text-muted-foreground/70" };
    if (level < 5) return { bg: "bg-mana/20", text: "text-foreground", subtext: "text-muted-foreground" };
    if (level < 10) return { bg: "bg-mana/40", text: "text-foreground", subtext: "text-foreground/70" };
    if (level < 15) return { bg: "bg-mana/60", text: "text-white", subtext: "text-white/70" };
    if (level < 20) return { bg: "bg-mana/80", text: "text-white", subtext: "text-white/70" };
    return { bg: "bg-mana", text: "text-white", subtext: "text-white/70" };
  }

  function getDistributionColors(percent: number): { bg: string; text: string; subtext: string } {
    if (percent === 0) return { bg: "bg-transparent", text: "", subtext: "text-muted-foreground/70" };
    if (percent < 5) return { bg: "bg-health/20", text: "text-foreground", subtext: "text-muted-foreground" };
    if (percent < 15) return { bg: "bg-health/35", text: "text-foreground", subtext: "text-foreground/70" };
    if (percent < 30) return { bg: "bg-health/55", text: "text-foreground", subtext: "text-foreground/80" };
    if (percent < 50) return { bg: "bg-health/75", text: "text-foreground", subtext: "text-foreground/80" };
    return { bg: "bg-health", text: "text-background", subtext: "text-background/70" };
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
          <CardTitle className="flex items-center justify-between gap-3 text-lg">
            <span>Average Final Skill Levels</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAllAverageFinalSkills((value) => !value)}
            >
              {showAllAverageFinalSkills ? "Top 12" : `Show all (${finalSkills.length})`}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {finalSkills.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No skill data available for current filters.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayedAverageFinalSkills.map((skill) => (
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
          <CardTitle className="flex items-center justify-between gap-3 text-lg">
            <span>Final Skill Distribution</span>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/30 p-0.5">
                <Button
                  type="button"
                  variant={finalSkillsView === "distribution" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setFinalSkillsView("distribution")}
                >
                  Distribution
                </Button>
                <Button
                  type="button"
                  variant={finalSkillsView === "capstone" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setFinalSkillsView("capstone")}
                >
                  Capstone rank
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (finalSkillsView === "distribution") {
                    setShowAllFinalDistribution((value) => !value);
                  } else {
                    setShowAllCapstoneSkills((value) => !value);
                  }
                }}
              >
                {finalSkillsView === "distribution"
                  ? (showAllFinalDistribution ? "Top 12" : `Show all (${finalDistributionData.length})`)
                  : (showAllCapstoneSkills ? "Top 12" : `Show all (${capstoneSkills.length})`)}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsFinalDistributionHelpOpen(true)}
                aria-label="How to read final skill distribution"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {finalSkillsView === "distribution" ? (
            displayedFinalDistributionRows.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No final skill distribution data available for current filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="sticky left-0 bg-card z-10 min-w-[150px]">
                        Skill
                      </TableHead>
                      {distributionBuckets.map((bucket) => (
                        <TableHead
                          key={bucket.key}
                          className="text-center px-2 min-w-[72px] text-xs"
                        >
                          {bucket.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedFinalDistributionRows.map((row) => (
                      <TableRow key={row.skill_name} className="hover:bg-secondary/20">
                        <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm">
                          {row.skill_name}
                        </TableCell>
                        {row.cells.map((cell) => {
                          const colors = getDistributionColors(cell.pct);
                          return (
                            <TableCell
                              key={cell.key}
                              className={`text-center px-1 py-0.5 ${colors.bg}`}
                              title={`${row.skill_name} ending at ${cell.label}: ${cell.count} games (${cell.pct.toFixed(1)}%)`}
                            >
                              {cell.count > 0 && (
                                <div className="flex flex-col items-center leading-none">
                                  <span className={`text-xs font-mono ${colors.text}`}>
                                    {Math.round(cell.pct)}%
                                  </span>
                                  <span className={`text-[9px] ${colors.subtext}`}>
                                    {cell.count}
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
            )
          ) : displayedCapstoneRows.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No capstone skill data available for current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[180px]">Skill</TableHead>
                    <TableHead className="text-right text-health">15+</TableHead>
                    <TableHead className="text-right text-gold">20+</TableHead>
                    <TableHead className="text-right text-mana">Avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCapstoneRows.map((skill) => (
                    <TableRow key={skill.skill_name} className="hover:bg-secondary/20">
                      <TableCell className="py-1.5 text-sm">{skill.skill_name}</TableCell>
                      <TableCell className="py-1.5 text-right text-xs font-mono text-health">
                        {skill.pct_15_plus.toFixed(1)}%
                      </TableCell>
                      <TableCell className="py-1.5 text-right text-xs font-mono text-gold">
                        {skill.pct_20_plus.toFixed(1)}%
                      </TableCell>
                      <TableCell className="py-1.5 text-right text-xs font-mono text-mana">
                        {skill.avg_level.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isFinalDistributionHelpOpen} onOpenChange={setIsFinalDistributionHelpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {finalSkillsView === "distribution"
                ? "How to read Final Skill Distribution"
                : "How to read Capstone Rank"}
            </DialogTitle>
            <DialogDescription>
              {finalSkillsView === "distribution"
                ? "Each row is one skill. Each column is the final level bucket for that skill at game end."
                : "Each row is one skill, ranked by how often games finish with high investment in that skill."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            {finalSkillsView === "distribution" ? (
              <>
                <p>
                  The big number in each cell is the percent of filtered games ending in that bucket.
                  The small number is the raw game count.
                </p>
                <p>
                  Example: if Fighting shows 9% in the 0 column, 9% of games ended with Fighting at level 0.
                </p>
                <p>
                  Buckets are: 0, 1-4, 5-9, 10-14, 15-19, 20-26, and 27.
                  Row totals should be about 100% (minor rounding differences are normal).
                </p>
              </>
            ) : (
              <>
                <p>
                  15+ means the percent of filtered games that ended with the skill at level 15 or higher.
                  20+ is the same idea for level 20 or higher.
                </p>
                <p>
                  Skills are ranked by 20+ first, then 15+, then average final level.
                </p>
                <p>
                  This is a compact summary of high-investment skills, while Distribution shows the full shape.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-lg">
            <span>Skill Training by XL</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAllTrainingSkills((value) => !value)}
            >
              {showAllTrainingSkills ? "Top 15" : `Show all (${heatmapData.length})`}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {displayedTrainingSkills.length === 0 ? (
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
                  {displayedTrainingSkills.map(({ name, xlMap }) => (
                    <TableRow key={name} className="hover:bg-secondary/20">
                      <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm">
                        {name}
                      </TableCell>
                      {xlColumns.map((xl) => {
                        const data = xlMap.get(xl);
                        const colors = getHeatColors(data?.avg);
                        return (
                          <TableCell
                            key={xl}
                            className={`text-center px-0 py-0.5 ${colors.bg}`}
                            title={
                              data
                                ? `${name} at XL ${xl}: avg ${data.avg} (${data.count} games)`
                                : undefined
                            }
                          >
                            {data && data.avg > 0 && (
                              <div className="flex flex-col items-center leading-none">
                                <span className={`text-xs font-mono ${colors.text}`}>
                                  {Math.round(data.avg)}
                                </span>
                                <span className={`text-[9px] ${colors.subtext}`}>
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
