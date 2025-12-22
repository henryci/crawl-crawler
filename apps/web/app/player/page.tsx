"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  AlertCircle,
  Search,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Crown,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlayerData, Win, ComboStats } from "dcss-player-parser";

// We'll use dynamic import for the parser to ensure it only runs client-side
let parsePlayerPage: ((html: string) => PlayerData) | null = null;

export default function PlayerSummaryPage() {
  return (
    <Suspense fallback={<PlayerSummaryLoading />}>
      <PlayerSummaryContent />
    </Suspense>
  );
}

function PlayerSummaryLoading() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="absolute inset-0 texture-noise pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PlayerSummaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const urlFromParams = searchParams.get("url") || "";
  const [url, setUrl] = useState(urlFromParams);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

  const fetchAndParse = useCallback(async (targetUrl: string) => {
    if (!targetUrl) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Dynamically import the parser
      if (!parsePlayerPage) {
        const module = await import("dcss-player-parser");
        parsePlayerPage = module.parsePlayerPage;
      }

      // Use our own API route to proxy the request (avoids CORS issues)
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const data = parsePlayerPage(html);
      setPlayerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load if URL is provided in query params
  useEffect(() => {
    if (urlFromParams && !hasAutoLoaded) {
      setUrl(urlFromParams);
      setHasAutoLoaded(true);
      fetchAndParse(urlFromParams);
    }
  }, [urlFromParams, hasAutoLoaded, fetchAndParse]);

  const handleFetchAndParse = async () => {
    // Update URL params when user clicks Analyze
    const newParams = new URLSearchParams();
    newParams.set("url", url);
    router.push(`/player?${newParams.toString()}`, { scroll: false });
    
    await fetchAndParse(url);
  };

  const [searchExpanded, setSearchExpanded] = useState(!playerData);

  // Collapse search when data loads
  useEffect(() => {
    if (playerData) {
      setSearchExpanded(false);
    }
  }, [playerData]);

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="absolute inset-0 texture-noise pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {/* URL Input - Collapsible */}
        <div className="mb-6">
          {searchExpanded ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Search className="w-5 h-5 text-health" />
                    Enter Player Scoring Page URL
                  </CardTitle>
                  {playerData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchExpanded(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="https://crawl.akrasiac.org/scoring/players/playername.html"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchAndParse()}
                    className="bg-secondary/50 flex-1"
                  />
                  <Button 
                    onClick={handleFetchAndParse} 
                    disabled={loading}
                    className="bg-health hover:bg-health/80 text-primary-foreground"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-2 p-4 rounded-md bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">Error</p>
                      <p className="text-muted-foreground">{error}</p>
                    </div>
                  </div>
                )}

                <p className="mt-4 text-xs text-muted-foreground">
                  Enter a player scoring page URL from crawl.akrasiac.org (CAO), crawl.xtahua.com (CXC), or similar servers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => setSearchExpanded(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search for another player</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Player Data Display */}
        {playerData && <PlayerDataDisplay data={playerData} />}
      </div>
    </div>
  );
}

function PlayerDataDisplay({ data }: { data: PlayerData }) {
  return (
    <div className="space-y-8">
      {/* Player Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{data.playerName}</h2>
          {data.lastUpdated && (
            <p className="text-sm text-muted-foreground">Last updated: {data.lastUpdated}</p>
          )}
        </div>
      </div>

      {/* Overall Stats */}
      <OverallStatsSection data={data} />

      {/* Highscores (if any) */}
      {(data.comboHighscores.length > 0 || data.speciesHighscores.length > 0 || data.classHighscores.length > 0) && (
        <HighscoresSection data={data} />
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="wins" className="w-full">
        <TabsList className="bg-transparent gap-2 p-0">
          <TabsTrigger 
            value="wins" 
            className="border border-border bg-secondary/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Wins ({data.wins.length})
          </TabsTrigger>
          <TabsTrigger 
            value="timeline" 
            className="border border-border bg-secondary/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger 
            value="streaks" 
            className="border border-border bg-secondary/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Streaks ({data.streaks.length})
          </TabsTrigger>
          <TabsTrigger 
            value="combos" 
            className="border border-border bg-secondary/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4"
          >
            <Target className="w-4 h-4 mr-2" />
            Combo Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wins" className="mt-6">
          <WinsTable wins={data.wins} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <WinsTimeline wins={data.wins} />
        </TabsContent>

        <TabsContent value="streaks" className="mt-6">
          <StreaksSection streaks={data.streaks} />
        </TabsContent>

        <TabsContent value="combos" className="mt-6">
          <ComboStatsSection data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverallStatsSection({ data }: { data: PlayerData }) {
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

function HighscoresSection({ data }: { data: PlayerData }) {
  return (
    <Card className="bg-gradient-to-r from-gold/5 to-special/5 border-gold/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold">
          <Crown className="w-5 h-5" />
          Server Highscores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {data.comboHighscores.map((hs, i) => (
            <a
              key={`combo-${i}`}
              href={hs.morgueUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Badge 
                variant="outline" 
                className="bg-gold/10 border-gold/30 text-gold hover:bg-gold/20 transition-colors px-3 py-1"
              >
                <Trophy className="w-3 h-3 mr-1" />
                {hs.character}{hs.isWin && "*"} Combo
                <span className="ml-2 text-muted-foreground">
                  ({hs.score.toLocaleString()})
                </span>
              </Badge>
            </a>
          ))}
          {data.speciesHighscores.map((hs, i) => (
            <a
              key={`species-${i}`}
              href={hs.morgueUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge 
                variant="outline" 
                className="bg-mana/10 border-mana/30 text-mana hover:bg-mana/20 transition-colors px-3 py-1"
              >
                <Trophy className="w-3 h-3 mr-1" />
                {hs.species} Species
                <span className="ml-2 text-muted-foreground">
                  ({hs.score.toLocaleString()})
                </span>
              </Badge>
            </a>
          ))}
          {data.classHighscores.map((hs, i) => (
            <a
              key={`class-${i}`}
              href={hs.morgueUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge 
                variant="outline" 
                className="bg-special/10 border-special/30 text-special hover:bg-special/20 transition-colors px-3 py-1"
              >
                <Trophy className="w-3 h-3 mr-1" />
                {hs.background} Class
                <span className="ml-2 text-muted-foreground">
                  ({hs.score.toLocaleString()})
                </span>
              </Badge>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WinsTable({ wins }: { wins: Win[] }) {
  const [sortField, setSortField] = useState<keyof Win>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    character: "",
    god: "",
    minRunes: 0,
    minScore: 0,
    maxTurns: 0,
  });

  const sortedAndFilteredWins = useMemo(() => {
    let result = [...wins];

    // Apply filters
    if (filters.character) {
      const search = filters.character.toLowerCase();
      result = result.filter(
        (w) => w.character.toLowerCase().includes(search) ||
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

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [wins, sortField, sortDir, filters]);

  const handleSort = (field: keyof Win) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: keyof Win }) => {
    if (field !== sortField) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  const hasActiveFilters = filters.character || filters.god || filters.minRunes > 0 || filters.minScore > 0 || filters.maxTurns > 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Wins 
              {sortedAndFilteredWins.length !== wins.length && (
                <span className="text-muted-foreground font-normal ml-2">
                  (showing {sortedAndFilteredWins.length} of {wins.length})
                </span>
              )}
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ character: "", god: "", minRunes: 0, minScore: 0, maxTurns: 0 })}
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
                onChange={(e) => setFilters({ ...filters, minRunes: parseInt(e.target.value) || 0 })}
                className="bg-secondary/50 h-8 text-sm"
              />
            </div>
            <div className="w-[100px]">
              <label className="text-xs text-muted-foreground mb-1 block">Min Score</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minScore || ""}
                onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) || 0 })}
                className="bg-secondary/50 h-8 text-sm"
              />
            </div>
            <div className="w-[100px]">
              <label className="text-xs text-muted-foreground mb-1 block">Max Turns</label>
              <Input
                type="number"
                placeholder="∞"
                value={filters.maxTurns || ""}
                onChange={(e) => setFilters({ ...filters, maxTurns: parseInt(e.target.value) || 0 })}
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
                <TableHead className="cursor-pointer" onClick={() => handleSort("rank")}>
                  #<SortIcon field="rank" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("character")}>
                  Combo<SortIcon field="character" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("score")}>
                  Score<SortIcon field="score" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("runes")}>
                  Runes<SortIcon field="runes" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("god")}>
                  God<SortIcon field="god" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("turns")}>
                  Turns<SortIcon field="turns" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("duration")}>
                  Duration<SortIcon field="duration" />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("time")}>
                  Date<SortIcon field="time" />
                </TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredWins.map((win) => (
                <TableRow key={win.rank} className="hover:bg-secondary/30">
                  <TableCell className="font-mono text-muted-foreground">{win.rank}</TableCell>
                  <TableCell>
                    <a
                      href={win.morgueUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-health hover:underline"
                    >
                      {win.character}
                    </a>
                    <span className="text-xs text-muted-foreground ml-2">{win.title}</span>
                  </TableCell>
                  <TableCell className="font-mono text-gold">{win.score.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRunesBadgeClass(win.runes)}>
                      {win.runes}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{win.god || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{win.turns.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-sm">{win.duration}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{win.time.split(" ")[0]}</TableCell>
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

function getRunesBadgeClass(runes: number): string {
  if (runes >= 15) return "bg-gold/20 border-gold/30 text-gold";
  if (runes >= 5) return "bg-mana/20 border-mana/30 text-mana";
  return "bg-secondary/50 border-border text-muted-foreground";
}

function WinsTimeline({ wins }: { wins: Win[] }) {
  // Group wins by year
  const winsByYear = useMemo(() => {
    const grouped = new Map<number, Win[]>();
    wins.forEach((win) => {
      const year = parseInt(win.time.split("-")[0]);
      if (!grouped.has(year)) grouped.set(year, []);
      grouped.get(year)!.push(win);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }, [wins]);

  const maxWinsInYear = Math.max(...winsByYear.map(([, w]) => w.length));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-mana" />
          Wins Over Time
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Year-based bar chart */}
        <div className="space-y-3">
          {winsByYear.map(([year, yearWins]) => (
            <div key={year} className="flex items-center gap-4">
              <span className="w-12 font-mono text-sm text-muted-foreground">{year}</span>
              <div className="flex-1 h-8 bg-secondary/30 rounded overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-health/60 to-health transition-all duration-500"
                  style={{ width: `${(yearWins.length / maxWinsInYear) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-sm font-medium">
                    {yearWins.length} win{yearWins.length !== 1 && "s"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap max-w-xs">
                {yearWins.slice(0, 10).map((win, i) => (
                  <a
                    key={i}
                    href={win.morgueUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${win.character} - ${win.score.toLocaleString()}`}
                    className="w-6 h-6 rounded bg-health/20 hover:bg-health/40 transition-colors flex items-center justify-center text-xs font-mono text-health"
                  >
                    {win.runes}
                  </a>
                ))}
                {yearWins.length > 10 && (
                  <span className="text-xs text-muted-foreground self-center">+{yearWins.length - 10}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats summary */}
        <div className="mt-8 pt-6 border-t border-border grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {winsByYear.length > 0 ? winsByYear[0][0] : "—"}
            </div>
            <div className="text-sm text-muted-foreground">First win year</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {winsByYear.length > 0 ? winsByYear[winsByYear.length - 1][0] : "—"}
            </div>
            <div className="text-sm text-muted-foreground">Most recent win year</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-health">
              {winsByYear.reduce((max, [, w]) => Math.max(max, w.length), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Most wins in a year</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StreaksSection({ streaks }: { streaks: PlayerData["streaks"] }) {
  const [sortBy, setSortBy] = useState<"length" | "start" | "end">("length");

  const sortedStreaks = useMemo(() => {
    const sorted = [...streaks];
    sorted.sort((a, b) => {
      if (sortBy === "length") {
        return b.wins - a.wins;
      } else if (sortBy === "start") {
        return new Date(b.start).getTime() - new Date(a.start).getTime();
      } else {
        return new Date(b.end).getTime() - new Date(a.end).getTime();
      }
    });
    return sorted;
  }, [streaks, sortBy]);

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

  const maxWins = Math.max(...streaks.map((s) => s.wins));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            Win Streaks
          </CardTitle>
          <div className="flex gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Sort:</span>
            {(["length", "start", "end"] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  sortBy === sort
                    ? "bg-gold/20 border-gold/50 text-foreground"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {sort === "length" ? "Length" : sort === "start" ? "Start Date" : "End Date"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {sortedStreaks.map((streak, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border transition-colors ${
                streak.wins === maxWins
                  ? "bg-gold/5 border-gold/30"
                  : "bg-secondary/30 border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`text-2xl font-bold ${
                      streak.wins === maxWins ? "text-gold" : "text-foreground"
                    }`}
                  >
                    {streak.wins}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      consecutive wins
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {streak.start.split(" ")[0]} → {streak.end.split(" ")[0]}
                    </div>
                  </div>
                </div>
                {streak.wins === maxWins && (
                  <Badge className="bg-gold/20 text-gold border-gold/30">
                    Best Streak
                  </Badge>
                )}
              </div>

              {/* Games in streak */}
              <div className="flex flex-wrap gap-2 mb-3">
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
                    <span className="self-center text-muted-foreground">→</span>
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ComboStatsSection({ data }: { data: PlayerData }) {
  const [viewMode, setViewMode] = useState<"species" | "background" | "combo">("species");
  const [sortBy, setSortBy] = useState<"wins" | "games" | "winPercent">("wins");

  const displayData = useMemo(() => {
    let items: Array<{ name: string; wins: number; games: number; winPercent: number; bestXL: number }> = [];

    if (viewMode === "species") {
      items = data.speciesStats.map((s) => ({
        name: s.species,
        wins: s.wins,
        games: s.games,
        winPercent: s.winPercent,
        bestXL: s.bestXL,
      }));
    } else if (viewMode === "background") {
      items = data.backgroundStats.map((b) => ({
        name: b.background,
        wins: b.wins,
        games: b.games,
        winPercent: b.winPercent,
        bestXL: b.bestXL,
      }));
    } else {
      items = data.comboStats.map((c) => ({
        name: `${c.species}${c.background}`,
        wins: c.wins,
        games: c.games,
        winPercent: c.winPercent,
        bestXL: c.bestXL,
      }));
    }

    // Filter out zero-game entries and sort
    items = items.filter((item) => item.games > 0);
    items.sort((a, b) => {
      if (sortBy === "winPercent") {
        // For win percent, only compare items with wins
        if (a.wins === 0 && b.wins === 0) return b.games - a.games;
        if (a.wins === 0) return 1;
        if (b.wins === 0) return -1;
      }
      return b[sortBy] - a[sortBy];
    });

    return items;
  }, [data, viewMode, sortBy]);

  const maxGames = Math.max(...displayData.map((d) => d.games), 1);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-special" />
            Character Statistics
          </CardTitle>
          <div className="flex flex-wrap gap-4">
            {/* View mode tabs - matching main tab style */}
            <div className="flex gap-2">
              {(["species", "background", "combo"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 text-sm rounded-md border transition-colors ${
                    viewMode === mode
                      ? "bg-health/20 border-health/50 text-foreground"
                      : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            {/* Sort tabs */}
            <div className="flex gap-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Sort:</span>
              {(["wins", "games", "winPercent"] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    sortBy === sort
                      ? "bg-gold/20 border-gold/50 text-foreground"
                      : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {sort === "winPercent" ? "Win %" : sort.charAt(0).toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-1">
          {displayData.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-4 py-1.5 px-2 rounded hover:bg-secondary/30 transition-colors"
            >
              <span className="w-14 font-mono text-sm font-medium text-foreground">
                {item.name}
              </span>
              
              {/* Bar */}
              <div className="flex-1 h-5 bg-secondary/30 rounded overflow-hidden relative">
                {/* Games bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-muted-foreground/20"
                  style={{ width: `${(item.games / maxGames) * 100}%` }}
                />
                {/* Wins portion */}
                {item.wins > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-health/60"
                    style={{ width: `${(item.wins / maxGames) * 100}%` }}
                  />
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-sm">
                <div className="w-14 text-right font-mono">
                  <span className="text-health">{item.wins}</span>
                  <span className="text-muted-foreground">/{item.games}</span>
                </div>
                <div className="w-12 text-right font-mono">
                  {item.wins > 0 ? (
                    <span className={item.winPercent >= 10 ? "text-gold" : "text-muted-foreground"}>
                      {item.winPercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-border flex gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-health/60 rounded" />
            <span>Wins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-muted-foreground/20 rounded" />
            <span>Games Played</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
