"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Loader2,
  AlertCircle,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
import { SortIcon } from "@/components/sort-icon";
import { useSortable } from "@/hooks/use-sortable";
import { SkillsHeatmap } from "@/components/analytics/skills-heatmap";
import { SpellsChart } from "@/components/analytics/spells-chart";
import { StatsOverview } from "@/components/analytics/stats-overview";

interface Lookups {
  races: { id: number; name: string; code: string }[];
  backgrounds: { id: number; name: string; code: string }[];
  gods: { id: number; name: string }[];
  skills: { id: number; name: string }[];
  versions: { id: number; version: string; major: number; minor: number }[];
}

interface Game {
  id: number;
  player_name: string;
  score: number;
  race: string;
  background: string;
  god: string | null;
  character_level: number;
  is_win: boolean;
  runes_count: number;
  total_turns: number;
  end_date: string | null;
  version: string | null;
  title: string | null;
}

interface Filters {
  races: string[];
  backgrounds: string[];
  gods: string[];
  isWin: string;
  minRunes: string;
  maxRunes: string;
  minTurns: string;
  maxTurns: string;
  player: string;
}

const initialFilters: Filters = {
  races: [],
  backgrounds: [],
  gods: [],
  isWin: "",
  minRunes: "",
  maxRunes: "",
  minTurns: "",
  maxTurns: "",
  player: "",
};

export default function AnalyticsPage() {
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("games");

  // Load lookups on mount
  useEffect(() => {
    async function loadLookups() {
      try {
        const response = await fetch("/api/analytics/lookups");
        if (!response.ok) throw new Error("Failed to load lookups");
        const data = await response.json();
        setLookups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    loadLookups();
  }, []);

  // Build query string from filters
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.races.length > 0) params.set("races", filters.races.join(","));
    if (filters.backgrounds.length > 0) params.set("backgrounds", filters.backgrounds.join(","));
    if (filters.gods.length > 0) params.set("gods", filters.gods.join(","));
    if (filters.isWin) params.set("isWin", filters.isWin);
    if (filters.minRunes) params.set("minRunes", filters.minRunes);
    if (filters.maxRunes) params.set("maxRunes", filters.maxRunes);
    if (filters.minTurns) params.set("minTurns", filters.minTurns);
    if (filters.maxTurns) params.set("maxTurns", filters.maxTurns);
    if (filters.player) params.set("player", filters.player);
    params.set("limit", "100");
    return params.toString();
  }, [filters]);

  // Load games when filters change
  useEffect(() => {
    async function loadGames() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?${queryString}`);
        if (!response.ok) throw new Error("Failed to load games");
        const data = await response.json();
        setGames(data.games);
        setTotalCount(data.totalCount);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, [queryString]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.races.length > 0 ||
      filters.backgrounds.length > 0 ||
      filters.gods.length > 0 ||
      filters.isWin !== "" ||
      filters.minRunes !== "" ||
      filters.maxRunes !== "" ||
      filters.minTurns !== "" ||
      filters.maxTurns !== "" ||
      filters.player !== ""
    );
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const toggleRace = useCallback((race: string) => {
    setFilters(prev => ({
      ...prev,
      races: prev.races.includes(race)
        ? prev.races.filter(r => r !== race)
        : [...prev.races, race],
    }));
  }, []);

  const toggleBackground = useCallback((bg: string) => {
    setFilters(prev => ({
      ...prev,
      backgrounds: prev.backgrounds.includes(bg)
        ? prev.backgrounds.filter(b => b !== bg)
        : [...prev.backgrounds, bg],
    }));
  }, []);

  const toggleGod = useCallback((god: string) => {
    setFilters(prev => ({
      ...prev,
      gods: prev.gods.includes(god)
        ? prev.gods.filter(g => g !== god)
        : [...prev.gods, god],
    }));
  }, []);

  if (error && !lookups) {
    return (
      <PageWrapper>
        <PageHeader
          title="Game Analytics"
          subtitle="Explore game data and statistics"
          icon={BarChart3}
          variant="mana"
        />
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Failed to Load Data</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Game Analytics"
        subtitle={`${totalCount.toLocaleString()} games in database`}
        icon={BarChart3}
        variant="mana"
      />

      {/* Filters Section */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="py-3 cursor-pointer" onClick={() => setFiltersExpanded(!filtersExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Filters</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetFilters();
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}
              {filtersExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        {filtersExpanded && (
          <CardContent className="pt-0 pb-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Race Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Species</label>
                <Select
                  value={filters.races[0] || "all"}
                  onValueChange={(v) => setFilters(prev => ({
                    ...prev,
                    races: v === "all" ? [] : [v],
                  }))}
                >
                  <SelectTrigger className="bg-secondary/50 h-9 text-sm">
                    <SelectValue placeholder="All Species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Species</SelectItem>
                    {lookups?.races.map((race) => (
                      <SelectItem key={race.id} value={race.name}>
                        {race.name} ({race.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Background Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Background</label>
                <Select
                  value={filters.backgrounds[0] || "all"}
                  onValueChange={(v) => setFilters(prev => ({
                    ...prev,
                    backgrounds: v === "all" ? [] : [v],
                  }))}
                >
                  <SelectTrigger className="bg-secondary/50 h-9 text-sm">
                    <SelectValue placeholder="All Backgrounds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Backgrounds</SelectItem>
                    {lookups?.backgrounds.map((bg) => (
                      <SelectItem key={bg.id} value={bg.name}>
                        {bg.name} ({bg.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* God Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">God</label>
                <Select
                  value={filters.gods[0] || "all"}
                  onValueChange={(v) => setFilters(prev => ({
                    ...prev,
                    gods: v === "all" ? [] : [v],
                  }))}
                >
                  <SelectTrigger className="bg-secondary/50 h-9 text-sm">
                    <SelectValue placeholder="All Gods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gods</SelectItem>
                    {lookups?.gods.map((god) => (
                      <SelectItem key={god.id} value={god.name}>
                        {god.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Win Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Outcome</label>
                <Select
                  value={filters.isWin}
                  onValueChange={(v) => setFilters(prev => ({
                    ...prev,
                    isWin: v === "all" ? "" : v,
                  }))}
                >
                  <SelectTrigger className="bg-secondary/50 h-9 text-sm">
                    <SelectValue placeholder="All Games" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="true">Wins Only</SelectItem>
                    <SelectItem value="false">Deaths Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Runes Range */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min Runes</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minRunes}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRunes: e.target.value }))}
                  className="bg-secondary/50 h-9 text-sm"
                  min={0}
                  max={15}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Runes</label>
                <Input
                  type="number"
                  placeholder="15"
                  value={filters.maxRunes}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxRunes: e.target.value }))}
                  className="bg-secondary/50 h-9 text-sm"
                  min={0}
                  max={15}
                />
              </div>

              {/* Turns Range */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min Turns</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minTurns}
                  onChange={(e) => setFilters(prev => ({ ...prev, minTurns: e.target.value }))}
                  className="bg-secondary/50 h-9 text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Turns</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.maxTurns}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxTurns: e.target.value }))}
                  className="bg-secondary/50 h-9 text-sm"
                  min={0}
                />
              </div>

              {/* Player Search */}
              <div className="md:col-span-2 lg:col-span-4">
                <label className="text-xs text-muted-foreground mb-1 block">Player Name</label>
                <Input
                  placeholder="Search by player name..."
                  value={filters.player}
                  onChange={(e) => setFilters(prev => ({ ...prev, player: e.target.value }))}
                  className="bg-secondary/50 h-9 text-sm max-w-md"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="games">Games ({totalCount.toLocaleString()})</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="spells">Spells</TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <GamesTable games={games} loading={loading} />
        </TabsContent>

        <TabsContent value="stats">
          <StatsOverview queryString={queryString} totalCount={totalCount} />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsHeatmap queryString={queryString} />
        </TabsContent>

        <TabsContent value="spells">
          <SpellsChart queryString={queryString} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

function GamesTable({ games, loading }: { games: Game[]; loading: boolean }) {
  const { sortedData, sortDir, handleSort, isSortedBy } = useSortable(games, {
    initialField: "score" as keyof Game,
    initialDirection: "desc",
  });

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-mana" />
          <p className="mt-4 text-muted-foreground">Loading games...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("score" as keyof Game)}
                >
                  Score
                  <SortIcon active={isSortedBy("score" as keyof Game)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("player_name" as keyof Game)}
                >
                  Player
                  <SortIcon active={isSortedBy("player_name" as keyof Game)} direction={sortDir} />
                </TableHead>
                <TableHead>Combo</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("god" as keyof Game)}
                >
                  God
                  <SortIcon active={isSortedBy("god" as keyof Game)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("character_level" as keyof Game)}
                >
                  XL
                  <SortIcon active={isSortedBy("character_level" as keyof Game)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("runes_count" as keyof Game)}
                >
                  Runes
                  <SortIcon active={isSortedBy("runes_count" as keyof Game)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("total_turns" as keyof Game)}
                >
                  Turns
                  <SortIcon active={isSortedBy("total_turns" as keyof Game)} direction={sortDir} />
                </TableHead>
                <TableHead>Win</TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((game) => (
                <TableRow key={game.id} className="hover:bg-secondary/30">
                  <TableCell className="font-mono text-gold">
                    {game.score?.toLocaleString() ?? "—"}
                  </TableCell>
                  <TableCell className="text-mana">{game.player_name}</TableCell>
                  <TableCell>
                    <div className="font-mono text-health">{game.race?.substring(0, 2)}{game.background?.substring(0, 2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {game.race} {game.background}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{game.god || "—"}</TableCell>
                  <TableCell className="font-mono">{game.character_level}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        game.runes_count >= 15
                          ? "bg-health/20 border-health/30 text-health"
                          : game.runes_count >= 3
                          ? "bg-mana/20 border-mana/30 text-mana"
                          : "bg-secondary/50 border-border text-muted-foreground"
                      }
                    >
                      {game.runes_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {game.total_turns?.toLocaleString() ?? "—"}
                  </TableCell>
                  <TableCell>
                    {game.is_win ? (
                      <Badge className="bg-health/20 border-health/30 text-health">Win</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Death</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {game.version?.split("-")[0] ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {sortedData.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No games match your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
