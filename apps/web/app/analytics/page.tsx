"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Loader2,
  AlertCircle,
  Filter,
  ExternalLink,
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
import { MultiSelect } from "@/components/ui/multi-select";
import { Checkbox } from "@/components/ui/checkbox";

interface Lookups {
  races: { id: number; name: string; code: string }[];
  backgrounds: { id: number; name: string; code: string }[];
  gods: { id: number; name: string }[];
  skills: { id: number; name: string }[];
  versions: { id: number; version: string; major: number; minor: number }[];
  legacySpecies: string[];
  legacyBackgrounds: string[];
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
  morgue_hash: string | null;
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
  minVersion: string;
  maxVersion: string;
  excludeLegacy: boolean;
}

// Clear preset - no filters applied
const clearFilters: Filters = {
  races: [],
  backgrounds: [],
  gods: [],
  isWin: "",
  minRunes: "",
  maxRunes: "",
  minTurns: "",
  maxTurns: "",
  player: "",
  minVersion: "",
  maxVersion: "",
  excludeLegacy: false,
};

// Default preset - wins only, version 0.30+, exclude legacy
const defaultFilters: Filters = {
  races: [],
  backgrounds: [],
  gods: [],
  isWin: "true",
  minRunes: "",
  maxRunes: "",
  minTurns: "",
  maxTurns: "",
  player: "",
  minVersion: "0.30",
  maxVersion: "",
  excludeLegacy: true,
};

/**
 * Parse filters from URL search params
 */
function parseFiltersFromUrl(searchParams: URLSearchParams): Filters | null {
  // Check if there are any filter params - if not, return null to use defaults
  const hasFilterParams = [
    'races', 'backgrounds', 'gods', 'isWin', 'minRunes', 'maxRunes',
    'minTurns', 'maxTurns', 'player', 'minVersion', 'maxVersion', 'excludeLegacy'
  ].some(key => searchParams.has(key));
  
  if (!hasFilterParams) return null;
  
  return {
    races: searchParams.get('races')?.split(',').filter(Boolean) ?? [],
    backgrounds: searchParams.get('backgrounds')?.split(',').filter(Boolean) ?? [],
    gods: searchParams.get('gods')?.split(',').filter(Boolean) ?? [],
    isWin: searchParams.get('isWin') ?? "",
    minRunes: searchParams.get('minRunes') ?? "",
    maxRunes: searchParams.get('maxRunes') ?? "",
    minTurns: searchParams.get('minTurns') ?? "",
    maxTurns: searchParams.get('maxTurns') ?? "",
    player: searchParams.get('player') ?? "",
    minVersion: searchParams.get('minVersion') ?? "",
    maxVersion: searchParams.get('maxVersion') ?? "",
    excludeLegacy: searchParams.get('excludeLegacy') === 'true',
  };
}

/**
 * Convert filters to URL search params string
 */
function filtersToUrlParams(filters: Filters, tab: string, preset: "default" | "clear" | null): string {
  const params = new URLSearchParams();
  
  // If clear preset is active, add a marker so we know not to reset to defaults
  if (preset === "clear") {
    params.set("preset", "clear");
  }
  
  if (filters.races.length > 0) params.set("races", filters.races.join(","));
  if (filters.backgrounds.length > 0) params.set("backgrounds", filters.backgrounds.join(","));
  if (filters.gods.length > 0) params.set("gods", filters.gods.join(","));
  if (filters.isWin) params.set("isWin", filters.isWin);
  if (filters.minRunes) params.set("minRunes", filters.minRunes);
  if (filters.maxRunes) params.set("maxRunes", filters.maxRunes);
  if (filters.minTurns) params.set("minTurns", filters.minTurns);
  if (filters.maxTurns) params.set("maxTurns", filters.maxTurns);
  if (filters.player) params.set("player", filters.player);
  if (filters.minVersion) params.set("minVersion", filters.minVersion);
  if (filters.maxVersion) params.set("maxVersion", filters.maxVersion);
  if (filters.excludeLegacy) params.set("excludeLegacy", "true");
  if (tab !== "games") params.set("tab", tab);
  
  return params.toString();
}

/**
 * Check if two filter objects are equal
 */
function filtersEqual(a: Filters, b: Filters): boolean {
  return (
    a.isWin === b.isWin &&
    a.minRunes === b.minRunes &&
    a.maxRunes === b.maxRunes &&
    a.minTurns === b.minTurns &&
    a.maxTurns === b.maxTurns &&
    a.player === b.player &&
    a.minVersion === b.minVersion &&
    a.maxVersion === b.maxVersion &&
    a.excludeLegacy === b.excludeLegacy &&
    a.races.length === b.races.length &&
    a.backgrounds.length === b.backgrounds.length &&
    a.gods.length === b.gods.length &&
    a.races.every((r, i) => r === b.races[i]) &&
    a.backgrounds.every((bg, i) => bg === b.backgrounds[i]) &&
    a.gods.every((g, i) => g === b.gods[i])
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsLoading() {
  return (
    <PageWrapper>
      <PageHeader
        title="Game Analytics"
        subtitle="Loading..."
        icon={BarChart3}
        variant="mana"
      />
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-mana" />
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

function AnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const initialFilters = useMemo(() => {
    // Check for explicit clear preset first
    if (searchParams.get('preset') === 'clear') {
      return clearFilters;
    }
    const urlFilters = parseFiltersFromUrl(searchParams);
    return urlFilters ?? defaultFilters;
  }, []); // Only run once on mount
  
  const initialTab = searchParams.get('tab') ?? "games";
  
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [activePreset, setActivePreset] = useState<"default" | "clear" | null>(() => {
    // Check for explicit clear preset first
    if (searchParams.get('preset') === 'clear') return "clear";
    // Determine initial preset based on URL filters
    const urlFilters = parseFiltersFromUrl(searchParams);
    if (!urlFilters) return "default";
    if (filtersEqual(urlFilters, defaultFilters)) return "default";
    if (filtersEqual(urlFilters, clearFilters)) return "clear";
    return null;
  });
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Track if this is the initial load to avoid double-updating URL
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
  
  // Sync filters and tab to URL when they change
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    
    const newUrlParams = filtersToUrlParams(filters, activeTab, activePreset);
    const currentParams = searchParams.toString();
    
    // Only update URL if params actually changed
    if (newUrlParams !== currentParams) {
      const newUrl = newUrlParams ? `/analytics?${newUrlParams}` : '/analytics';
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, activeTab, activePreset, isInitialLoad, router, searchParams]);
  
  // Handle browser back/forward navigation
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl(searchParams);
    const urlTab = searchParams.get('tab') ?? "games";
    const urlPreset = searchParams.get('preset');
    
    // Update tab if it changed
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    
    // Check if the URL explicitly requests the clear preset
    if (urlPreset === "clear") {
      if (!filtersEqual(filters, clearFilters)) {
        setFilters(clearFilters);
      }
      if (activePreset !== "clear") {
        setActivePreset("clear");
      }
      return;
    }
    
    // Update filters if they changed (and URL has filter params)
    if (urlFilters && !filtersEqual(urlFilters, filters)) {
      setFilters(urlFilters);
      // Update preset indicator
      if (filtersEqual(urlFilters, defaultFilters)) {
        setActivePreset("default");
      } else if (filtersEqual(urlFilters, clearFilters)) {
        setActivePreset("clear");
      } else {
        setActivePreset(null);
      }
    } else if (!urlFilters && !filtersEqual(filters, defaultFilters)) {
      // URL has no filter params, reset to defaults
      setFilters(defaultFilters);
      setActivePreset("default");
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (filters.minVersion) params.set("minVersion", filters.minVersion);
    if (filters.maxVersion) params.set("maxVersion", filters.maxVersion);
    if (filters.excludeLegacy) params.set("excludeLegacy", "true");
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

  const applyPreset = useCallback((preset: "default" | "clear") => {
    if (preset === "default") {
      setFilters(defaultFilters);
      setActivePreset("default");
    } else {
      setFilters(clearFilters);
      setActivePreset("clear");
    }
  }, []);

  // When user manually changes filters, clear the active preset indicator
  const updateFilters = useCallback((updater: (prev: Filters) => Filters) => {
    setFilters(updater);
    setActivePreset(null);
  }, []);

  // Build options for multi-selects
  const raceOptions = useMemo(() => {
    if (!lookups) return [];
    const legacySet = new Set(lookups.legacySpecies);
    return lookups.races.map(race => ({
      value: race.name,
      label: `${race.name} (${race.code})${legacySet.has(race.name) ? ' ⚰️' : ''}`,
    }));
  }, [lookups]);

  const backgroundOptions = useMemo(() => {
    if (!lookups) return [];
    const legacySet = new Set(lookups.legacyBackgrounds);
    return lookups.backgrounds.map(bg => ({
      value: bg.name,
      label: `${bg.name} (${bg.code})${legacySet.has(bg.name) ? ' ⚰️' : ''}`,
    }));
  }, [lookups]);

  const godOptions = useMemo(() => {
    if (!lookups) return [];
    return lookups.gods.map(god => ({
      value: god.name,
      label: god.name,
    }));
  }, [lookups]);

  // Get unique versions for the version selector
  const versionOptions = useMemo(() => {
    if (!lookups) return [];
    // Group by minor version and get unique ones
    const seen = new Set<number>();
    return lookups.versions
      .filter(v => {
        if (seen.has(v.minor)) return false;
        seen.add(v.minor);
        return true;
      })
      .map(v => ({
        value: `0.${v.minor}`,
        label: `0.${v.minor}`,
      }));
  }, [lookups]);

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
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Filters</CardTitle>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant={activePreset === "default" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => applyPreset("default")}
                  className="h-7 text-xs"
                >
                  Default
                </Button>
                <Button
                  variant={activePreset === "clear" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => applyPreset("clear")}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Race Multi-Select */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Species</label>
                <MultiSelect
                  options={raceOptions}
                  selected={filters.races}
                  onChange={(races) => updateFilters(prev => ({ ...prev, races }))}
                  placeholder="All Species"
                  className="text-sm"
                />
              </div>

              {/* Background Multi-Select */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Background</label>
                <MultiSelect
                  options={backgroundOptions}
                  selected={filters.backgrounds}
                  onChange={(backgrounds) => updateFilters(prev => ({ ...prev, backgrounds }))}
                  placeholder="All Backgrounds"
                  className="text-sm"
                />
              </div>

              {/* God Multi-Select */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">God</label>
                <MultiSelect
                  options={godOptions}
                  selected={filters.gods}
                  onChange={(gods) => updateFilters(prev => ({ ...prev, gods }))}
                  placeholder="All Gods"
                  className="text-sm"
                />
              </div>

              {/* Win Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Outcome</label>
                <Select
                  value={filters.isWin || "all"}
                  onValueChange={(v) => updateFilters(prev => ({
                    ...prev,
                    isWin: v === "all" ? "" : v,
                  }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Games" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="true">Wins Only</SelectItem>
                    <SelectItem value="false">Deaths Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Version Range */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min Version</label>
                <Select
                  value={filters.minVersion || "all"}
                  onValueChange={(v) => updateFilters(prev => ({
                    ...prev,
                    minVersion: v === "all" ? "" : v,
                  }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    {versionOptions.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Version</label>
                <Select
                  value={filters.maxVersion || "all"}
                  onValueChange={(v) => updateFilters(prev => ({
                    ...prev,
                    maxVersion: v === "all" ? "" : v,
                  }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    {versionOptions.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
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
                  onChange={(e) => updateFilters(prev => ({ ...prev, minRunes: e.target.value }))}
                  className="h-9 text-sm"
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
                  onChange={(e) => updateFilters(prev => ({ ...prev, maxRunes: e.target.value }))}
                  className="h-9 text-sm"
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
                  onChange={(e) => updateFilters(prev => ({ ...prev, minTurns: e.target.value }))}
                  className="h-9 text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Turns</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.maxTurns}
                  onChange={(e) => updateFilters(prev => ({ ...prev, maxTurns: e.target.value }))}
                  className="h-9 text-sm"
                  min={0}
                />
              </div>

              {/* Player Search */}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Player Name</label>
                <Input
                  placeholder="Search by player name..."
                  value={filters.player}
                  onChange={(e) => updateFilters(prev => ({ ...prev, player: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>

              {/* Exclude Legacy Checkbox */}
              <div className="md:col-span-2 flex items-center gap-2 pt-5">
                <Checkbox
                  id="exclude-legacy"
                  checked={filters.excludeLegacy}
                  onCheckedChange={(checked) => updateFilters(prev => ({
                    ...prev,
                    excludeLegacy: checked === true,
                  }))}
                />
                <label
                  htmlFor="exclude-legacy"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Exclude legacy species & backgrounds
                </label>
              </div>
            </div>
          </CardContent>
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
  const router = useRouter();
  const { sortedData, sortDir, handleSort, isSortedBy } = useSortable(games, {
    initialField: "score" as keyof Game,
    initialDirection: "desc",
  });

  const handleRowClick = useCallback((game: Game) => {
    if (game.morgue_hash) {
      router.push(`/morgue?hash=${game.morgue_hash}`);
    }
  }, [router]);

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
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((game) => (
                <TableRow
                  key={game.id}
                  className={`hover:bg-secondary/30 ${game.morgue_hash ? "cursor-pointer" : ""}`}
                  onClick={() => handleRowClick(game)}
                >
                  <TableCell className="font-mono text-gold">
                    {game.score != null ? Number(game.score).toLocaleString() : "—"}
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
                  <TableCell>
                    {game.morgue_hash && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    )}
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
