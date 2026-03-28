"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  Search,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Link,
  BookOpen,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
import { PageGuide } from "@/components/page-guide";
import {
  OverallStatsSection,
  HighscoresSection,
  WinsTable,
  WinsTimeline,
  StreaksSection,
  ComboStatsSection,
  RecentGamesSection,
} from "@/components/player";
import type { PlayerData } from "dcss-player-parser";

const CAO_BASE_URL = "https://crawl.akrasiac.org/scoring/players/";

// Detect if input looks like a URL or a username
function isUrl(input: string): boolean {
  return input.includes("://") || input.includes("/") || input.includes(".");
}

// Build the full URL from input
function buildUrl(input: string): string {
  if (!input.trim()) return "";
  if (isUrl(input)) return input;
  // It's a username - build CAO URL
  return `${CAO_BASE_URL}${input.toLowerCase()}.html`;
}

// We'll use dynamic import for the parser to ensure it only runs client-side
let parsePlayerPage: ((html: string) => PlayerData) | null = null;

const playerGuide = (
  <PageGuide
    title="Player Summary"
    description="Look up any DCSS player's stats from their public scoring page."
    icon={Search}
    variant="health"
    sections={[
      {
        icon: BookOpen,
        title: "What is this?",
        content:
          "An interactive view of a given player. Probably inferior in every way to <a href=`https://dcss-stats.com/`>DCSS Stats</a>",
      },
      {
        icon: Target,
        title: "How to use it",
        content:
          'Enter a CAO username (e.g. "henryci") or paste a full player scoring page URL.',
      },
      {
        icon: Lightbulb,
        title: "Tips",
        content:
          "This was organized to highlight the things I'm focusing on. Your mileage may vary.",
      },
      {
        icon: AlertTriangle,
        title: "Keep in mind",
        content:
          "Currently defaults to CAO for username lookups.",
      },
    ]}
  />
);

export default function PlayerSummaryPage() {
  return (
    <Suspense fallback={<PlayerSummaryLoading />}>
      <PlayerSummaryContent />
    </Suspense>
  );
}

function PlayerSummaryLoading() {
  return (
    <PageWrapper>
      <PageHeader
        title="Player Summary"
        subtitle="Look up any player's stats and history"
        icon={Search}
        variant="health"
        action={playerGuide}
      />
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

function PlayerSummaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlFromParams = searchParams.get("url") || "";
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [lastLoadedUrl, setLastLoadedUrl] = useState<string | null>(null);

  // Determine if current input is a URL or username
  const inputIsUrl = useMemo(() => isUrl(input), [input]);
  const resolvedUrl = useMemo(() => buildUrl(input), [input]);

  const fetchAndParse = useCallback(async (targetUrl: string) => {
    if (!targetUrl) {
      setError("Please enter a username or URL");
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
        throw new Error(
          errorData.error || `Failed to fetch: ${response.status} ${response.statusText}`
        );
      }

      const html = await response.text();
      const data = parsePlayerPage(html);
      setPlayerData(data);
      setLastLoadedUrl(targetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load when URL param changes (including browser back/forward navigation)
  useEffect(() => {
    if (urlFromParams && urlFromParams !== lastLoadedUrl) {
      // Try to extract username from CAO URL for cleaner display
      const caoMatch = urlFromParams.match(/crawl\.akrasiac\.org\/scoring\/players\/([^.]+)\.html/);
      if (caoMatch) {
        setInput(caoMatch[1]);
      } else {
        setInput(urlFromParams);
      }
      fetchAndParse(urlFromParams);
    }
  }, [urlFromParams, lastLoadedUrl, fetchAndParse]);

  const handleFetchAndParse = async () => {
    const targetUrl = resolvedUrl;
    if (!targetUrl) return;
    
    // Update URL params when user clicks Analyze
    const newParams = new URLSearchParams();
    newParams.set("url", targetUrl);
    router.push(`/player?${newParams.toString()}`, { scroll: false });

    await fetchAndParse(targetUrl);
  };

  const [searchExpanded, setSearchExpanded] = useState(!playerData);

  // Collapse search when data loads
  useEffect(() => {
    if (playerData) {
      setSearchExpanded(false);
    }
  }, [playerData]);

  return (
    <PageWrapper>
      <PageHeader
        title="Player Summary"
        subtitle="Look up any player's stats and history"
        icon={Search}
        variant="health"
        action={playerGuide}
      />

      {/* URL Input - Collapsible */}
      <div className="mb-6">
        {searchExpanded ? (
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="w-5 h-5 text-health" />
                  Look Up Player
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
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {inputIsUrl ? (
                      <Link className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <Input
                    type="text"
                    placeholder="username or full URL"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchAndParse()}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={handleFetchAndParse}
                  disabled={loading || !input.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

              {/* Show resolved URL preview when typing a username */}
              {input.trim() && !inputIsUrl && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">Will fetch:</span>
                  <code className="bg-secondary/50 px-2 py-1 rounded text-[11px] truncate">
                    {resolvedUrl}
                  </code>
                </div>
              )}

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
                Enter a CAO username or a full player scoring page URL from crawl.akrasiac.org (CAO), crawl.xtahua.com
                (CXC), or similar servers.
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
    </PageWrapper>
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
      {(data.comboHighscores.length > 0 ||
        data.speciesHighscores.length > 0 ||
        data.classHighscores.length > 0) && <HighscoresSection data={data} />}

      {/* Tabs for different views */}
      <Tabs defaultValue="wins" className="w-full">
        <TabsList className="bg-transparent gap-2 p-0">
          <TabsTrigger
            value="wins"
            className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Wins ({data.wins.length})
          </TabsTrigger>
          {data.recentGames.length > 0 && (
            <TabsTrigger
              value="recent"
              className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
            >
              <Clock className="w-4 h-4 mr-2" />
              Recent Games ({data.recentGames.length})
            </TabsTrigger>
          )}
          <TabsTrigger
            value="timeline"
            className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger
            value="streaks"
            className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Streaks ({data.streaks.length})
          </TabsTrigger>
          <TabsTrigger
            value="combos"
            className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
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

        {data.recentGames.length > 0 && (
          <TabsContent value="recent" className="mt-6">
            <RecentGamesSection games={data.recentGames} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
