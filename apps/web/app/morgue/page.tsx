"use client";

import { useState, useCallback, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  LinkIcon,
  User,
  Swords,
  Clock,
  Shield,
  Sparkles,
  BookOpen,
  Map,
  Loader2,
  AlertCircle,
  Trophy,
  Gem,
  Wand2,
  Crown,
  Heart,
  Droplet,
  Bug,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Wind,
  Footprints,
  Hand,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageWrapper } from "@/components/page-wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseMorgue, type MorgueData, type ParseResult } from "dcss-morgue-parser";

type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Format seconds to HH:MM:SS string.
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get the color classes for a rune based on its name.
 * Colors match the in-game rune display.
 */
function getRuneColorClasses(runeName: string): string {
  const name = runeName.toLowerCase();
  
  // Green runes
  if (["decaying", "serpentine", "slimy", "glowing"].includes(name)) {
    return "text-health border-health/30 bg-health/10";
  }
  // Red runes
  if (["demonic", "fiery"].includes(name)) {
    return "text-danger border-danger/30 bg-danger/10";
  }
  // Cyan runes
  if (["icy"].includes(name)) {
    return "text-cyan-400 border-cyan-400/30 bg-cyan-400/10";
  }
  // Blue runes
  if (["iron", "gossamer"].includes(name)) {
    return "text-mana border-mana/30 bg-mana/10";
  }
  // Magenta/purple runes
  if (["abyssal", "magical"].includes(name)) {
    return "text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/10";
  }
  // Gold/yellow runes
  if (["golden"].includes(name)) {
    return "text-gold border-gold/30 bg-gold/10";
  }
  // Brown/orange runes
  if (["obsidian", "barnacled"].includes(name)) {
    return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  }
  // White/gray runes (silver, dark, bone)
  if (["silver", "dark", "bone"].includes(name)) {
    return "text-foreground border-foreground/30 bg-foreground/10";
  }
  
  // Default fallback
  return "text-special border-special/30 bg-special/10";
}

export default function MorgueViewerPage() {
  return (
    <Suspense fallback={<MorgueViewerLoading />}>
      <MorgueViewerContent />
    </Suspense>
  );
}

function MorgueViewerLoading() {
  return (
    <PageWrapper>
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

/**
 * Full-page loading overlay shown when fetching/parsing a morgue file.
 */
function LoadingOverlay({ url }: { url: string }) {
  // Extract filename from URL for display
  const filename = url ? url.split("/").pop() || "morgue file" : "morgue file";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 rounded-xl bg-card border border-border shadow-2xl max-w-md mx-4">
        {/* Animated spinner with pulsing glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Loading Morgue</h3>
          <p className="text-sm text-muted-foreground max-w-xs truncate font-mono">
            {filename}
          </p>
        </div>

        {/* Progress indicator dots */}
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>

        {/* Flavor text */}
        <p className="text-xs text-muted-foreground/60 italic text-center">
          Fetching and parsing your adventure...
        </p>
      </div>
    </div>
  );
}

function MorgueViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlFromParams = searchParams.get("url") || "";
  const hashFromParams = searchParams.get("hash") || "";
  const [url, setUrl] = useState(urlFromParams);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [morgueData, setMorgueData] = useState<MorgueData | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [lastLoadedUrl, setLastLoadedUrl] = useState<string | null>(null);
  const [lastLoadedHash, setLastLoadedHash] = useState<string | null>(null);

  const fetchFromHash = useCallback(async (hash: string) => {
    setLoadingState("loading");
    setError(null);
    setMorgueData(null);

    try {
      const response = await fetch(`/api/morgue/${hash}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to fetch morgue data: ${response.status}`);
      }

      const result = await response.json();
      setParseResult({ success: true, data: result.data });
      setMorgueData(result.data);
      setLoadingState("success");
      setLastLoadedHash(hash);
      // Update URL field if the morgue has a source URL
      if (result.data.sourceUrl) {
        setUrl(result.data.sourceUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoadingState("error");
    }
  }, []);

  const fetchAndParse = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      setError("Please enter a morgue file URL");
      return;
    }

    setLoadingState("loading");
    setError(null);
    setMorgueData(null);

    try {
      // Use the proxy route to fetch the morgue file (avoids CORS)
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to fetch morgue file: ${response.status}`);
      }

      const morgueText = await response.text();

      // Parse the morgue file client-side
      const result = await parseMorgue(morgueText, { sourceUrl: targetUrl });
      setParseResult(result);
      setMorgueData(result.data);
      setLoadingState("success");
      setLastLoadedUrl(targetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoadingState("error");
    }
  }, []);

  // Auto-load when hash param is present (priority over URL)
  useEffect(() => {
    if (hashFromParams && hashFromParams !== lastLoadedHash) {
      fetchFromHash(hashFromParams);
    }
  }, [hashFromParams, lastLoadedHash, fetchFromHash]);

  // Auto-load when URL param changes (including browser back/forward navigation)
  useEffect(() => {
    // Skip if we're loading from hash
    if (hashFromParams) return;
    if (urlFromParams && urlFromParams !== lastLoadedUrl) {
      setUrl(urlFromParams);
      fetchAndParse(urlFromParams);
    }
  }, [urlFromParams, lastLoadedUrl, fetchAndParse, hashFromParams]);

  const handleParseMorgue = async () => {
    // Update URL params when user clicks Parse
    const newParams = new URLSearchParams();
    newParams.set("url", url);
    router.push(`/morgue?${newParams.toString()}`, { scroll: false });

    await fetchAndParse(url);
  };

  const [formExpanded, setFormExpanded] = useState(!morgueData);

  // Collapse form when data loads
  useEffect(() => {
    if (morgueData) {
      setFormExpanded(false);
    }
  }, [morgueData]);

  return (
    <PageWrapper>
      {/* Full-page loading overlay */}
      {loadingState === "loading" && <LoadingOverlay url={url} />}

      {/* URL Input Section - Collapsible */}
      <div className="mb-6">
        {formExpanded ? (
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LinkIcon className="w-5 h-5 text-mana" />
                  Load Morgue File
                </CardTitle>
                {morgueData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormExpanded(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardDescription>Enter the URL to a DCSS morgue file to parse and display its contents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleParseMorgue()}
                  placeholder="https://crawl.akrasiac.org/rawdata/username/morgue-username-date.txt"
                  className="font-mono text-sm flex-1"
                />
                <Button
                  onClick={handleParseMorgue}
                  disabled={loadingState === "loading"}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loadingState === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    "Parse Morgue"
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 flex items-start gap-2 p-4 rounded-md border bg-destructive/10 border-destructive/20">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-destructive" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Error</p>
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                </div>
              )}

              {/* Parse Warnings */}
              {parseResult && !parseResult.success && morgueData && (
                <div className="mt-4 flex items-start gap-2 p-4 rounded-md border bg-gold/10 border-gold/20">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-gold" />
                  <div className="text-sm">
                    <p className="font-medium text-gold">Parse Warnings</p>
                    <p className="text-muted-foreground">
                      Some sections could not be fully parsed: {morgueData.parseErrors.join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <button
            onClick={() => setFormExpanded(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Load another morgue file</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Parsed Morgue Display */}
      {morgueData && <MorgueDisplay data={morgueData} />}

    </PageWrapper>
  );
}

/**
 * Main component to display parsed morgue data.
 */
function MorgueDisplay({ data }: { data: MorgueData }) {
  return (
    <div className="space-y-6">
      {/* Link to original morgue file */}
      {data.sourceUrl && (
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mana hover:text-mana/80 hover:underline flex items-center gap-1"
          >
            View original morgue file
            <LinkIcon className="w-3 h-3" />
          </a>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent gap-2 p-0 mb-6">
          <TabsTrigger
            value="overview"
            className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
          >
            <User className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Skills
          </TabsTrigger>
          <TabsTrigger
            value="dungeon"
            className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
          >
            <Map className="w-4 h-4 mr-2" />
            Dungeon
          </TabsTrigger>
          <TabsTrigger
            value="debug"
            className="border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/30 data-[state=active]:bg-health/20 data-[state=active]:border-health/50 px-4 transition-colors"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsTab data={data} />
        </TabsContent>

        <TabsContent value="dungeon" className="mt-6">
          <DungeonTab data={data} />
        </TabsContent>

        <TabsContent value="debug" className="mt-6">
          <DebugTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Overview tab with character info, stats, and game summary.
 */
function OverviewTab({ data }: { data: MorgueData }) {
  const stats = data.endingStats;
  const runesCollected = data.runesList?.length ?? 0;
  const gemsCollected = data.gemsList?.length ?? 0;
  // Use the parser's isWin field which is determined from the header text
  // (e.g., "Escaped with the Orb" indicates a win)
  const isVictory = data.isWin ?? false;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Character Info Card */}
      <Card className="bg-card border-border py-4 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-gold" />
            Character
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="text-foreground">{data.playerName ?? "Unknown"}</span>
          </div>
          {data.title && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Title</span>
              <span className="text-gold">{data.title}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Race</span>
            <span className="text-foreground">{data.race ?? "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Background</span>
            <span className="text-foreground">{data.background ?? "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Level</span>
            <span className="text-health">{data.characterLevel ?? "?"}</span>
          </div>
          {stats?.god && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">God</span>
              <span className="text-special">
                {stats.god}
                {stats.piety !== null && (
                  <span className="ml-1">{"\u2605".repeat(stats.piety)}</span>
                )}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card className="bg-card border-border py-4 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Swords className="w-4 h-4 text-danger" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Heart className="w-3 h-3" /> HP
              </span>
              <span className={
                stats?.hpCurrent == null || stats?.hpMax == null
                  ? "text-foreground"
                  : stats.hpCurrent >= stats.hpMax
                    ? "text-health"
                    : stats.hpCurrent / stats.hpMax < 0.5
                      ? "text-danger"
                      : "text-gold"
              }>
                {stats?.hpCurrent ?? "?"}/{stats?.hpMax ?? "?"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Droplet className="w-3 h-3" /> MP
              </span>
              <span className="text-mana">
                {stats?.mpCurrent ?? "?"}/{stats?.mpMax ?? "?"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AC</span>
              <span className="text-foreground">{stats?.ac ?? "?"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">EV</span>
              <span className="text-foreground">{stats?.ev ?? "?"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SH</span>
              <span className="text-foreground">{stats?.sh ?? "?"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Str</span>
              <span className="text-foreground">{stats?.str ?? "?"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Int</span>
              <span className="text-foreground">{stats?.int ?? "?"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dex</span>
              <span className="text-foreground">{stats?.dex ?? "?"}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">Gold</span>
              <span className="text-gold">{stats?.gold?.toLocaleString() ?? "?"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Info Card */}
      <Card className="bg-card border-border py-4 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-mana" />
            Game
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Result</span>
            <Badge
              variant="outline"
              className={
                isVictory
                  ? "text-health border-health/30 bg-health/10"
                  : "text-danger border-danger/30 bg-danger/10"
              }
            >
              {isVictory ? "Victory" : "Death"}
            </Badge>
          </div>
          {data.score !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Score</span>
              <span className="text-gold">{data.score.toLocaleString()}</span>
            </div>
          )}
          {data.totalTurns !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turns</span>
              <span className="text-foreground">{data.totalTurns.toLocaleString()}</span>
            </div>
          )}
          {data.gameDurationSeconds !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="text-foreground">{formatDuration(data.gameDurationSeconds)}</span>
            </div>
          )}
          {data.startDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started</span>
              <span className="text-foreground">{data.startDate}</span>
            </div>
          )}
          {data.endDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ended</span>
              <span className="text-foreground">{data.endDate}</span>
            </div>
          )}
          {data.version && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="text-muted-foreground">{data.version}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Runes Card (if any collected) */}
      {runesCollected > 0 && (
        <Card className="bg-card border-border md:col-span-2 lg:col-span-1 py-4 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              Runes ({runesCollected}/{data.runesPossible ?? 15})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.runesList?.map((rune) => (
                <Badge
                  key={rune}
                  variant="outline"
                  className={`font-mono text-xs ${getRuneColorClasses(rune)}`}
                >
                  {rune}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gods Worshipped */}
      {data.godsWorshipped && data.godsWorshipped.length > 0 && (
        <Card className="bg-card border-border py-4 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-special" />
              Gods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.godsWorshipped.map((god, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={
                    god.endedTurn === null
                      ? "text-special border-special/30 bg-special/10 font-mono text-xs"
                      : "text-muted-foreground border-border bg-muted/50 font-mono text-xs"
                  }
                >
                  {god.god}
                  {god.endedTurn === null && " (current)"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gems Card (always shown) */}
      <Card className="bg-card border-border py-4 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Gem className="w-4 h-4 text-special" />
            Gems {gemsCollected > 0 && `(${gemsCollected})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gemsCollected > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.gemsList?.map((gem) => (
                <Badge
                  key={gem}
                  variant="outline"
                  className="text-mana border-mana/30 bg-mana/10 font-mono text-xs"
                >
                  {gem}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No gems collected</p>
          )}
        </CardContent>
      </Card>

      {/* Compact Equipment Section */}
      <EquipmentSection data={data} />

      {/* Compact Spells Section */}
      <SpellsSection data={data} />
    </div>
  );
}

/**
 * Compact equipment section for the Overview tab.
 */
function EquipmentSection({ data }: { data: MorgueData }) {
  const equipment = data.equipment;

  if (!equipment) {
    return null;
  }

  const slots = [
    { name: "Weapon", value: equipment.weapon, icon: Swords },
    { name: "Armour", value: equipment.bodyArmour, icon: Shield },
    { name: "Shield", value: equipment.shield, icon: Shield },
    { name: "Helmet", value: equipment.helmet, icon: Crown },
    { name: "Cloak", value: equipment.cloak, icon: Wind },
    { name: "Gloves", value: equipment.gloves, icon: Hand },
    { name: "Boots", value: equipment.boots, icon: Footprints },
    { name: "Amulet", value: equipment.amulet, icon: Gem },
    { name: "Ring L", value: equipment.ringLeft, icon: Gem },
    { name: "Ring R", value: equipment.ringRight, icon: Gem },
  ];

  // Filter to only show equipped items
  const equippedSlots = slots.filter((slot) => slot.value);

  if (equippedSlots.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border md:col-span-2 lg:col-span-3 py-4 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold" />
          Equipment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {equippedSlots.map((slot) => {
            const Icon = slot.icon;
            return (
              <div
                key={slot.name}
                className="flex items-center gap-2 p-2 rounded bg-secondary/50"
              >
                <Icon className="w-4 h-4 text-gold shrink-0" />
                <span className="text-xs text-muted-foreground w-14 shrink-0">{slot.name}</span>
                <span className="font-mono text-xs text-foreground">
                  {slot.value}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Color palette for skills - distinct, visually appealing colors
 */
const SKILL_COLORS = [
  "#22d3ee", // cyan
  "#f472b6", // pink
  "#a78bfa", // violet
  "#34d399", // emerald
  "#fb923c", // orange
  "#facc15", // yellow
  "#60a5fa", // blue
  "#f87171", // red
  "#4ade80", // green
  "#c084fc", // purple
  "#2dd4bf", // teal
  "#fbbf24", // amber
  "#818cf8", // indigo
  "#fb7185", // rose
  "#38bdf8", // sky
  "#a3e635", // lime
];

/**
 * Get a consistent color for a skill based on its index
 */
function getSkillColor(index: number): string {
  return SKILL_COLORS[index % SKILL_COLORS.length];
}

const ACTION_CATEGORY_COLORS: Record<string, string> = {
  Cast: "#3b82f6",
  Melee: "#ef4444",
  Evoke: "#f59e0b",
  Ability: "#8b5cf6",
  Drink: "#22c55e",
  Read: "#06b6d4",
  Throw: "#f97316",
  Stab: "#ec4899",
};

const SKIP_ACTION_CATEGORIES = new Set(["Attack", "Armour", "Dodge", "Block", "Form"]);
const XL_RANGES = ["1-3", "4-6", "7-9", "10-12", "13-15", "16-18", "19-21", "22-24", "25-27"];

const ACTION_ITEM_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6",
  "#a855f7", "#64748b", "#e879f9", "#fb923c", "#2dd4bf",
];

function ActionsChart({ actions }: { actions: Record<string, Record<string, Record<string, number>>> }) {
  const [hoveredRange, setHoveredRange] = useState<string | null>(null);

  // Build sorted categories with their totals
  const sortedCategories = useMemo(() => {
    const cats: { name: string; total: number }[] = [];
    for (const [category, items] of Object.entries(actions)) {
      if (SKIP_ACTION_CATEGORIES.has(category)) continue;
      let total = 0;
      for (const [, counts] of Object.entries(items)) {
        total += counts["total"] ?? 0;
      }
      if (total > 0) cats.push({ name: category, total });
    }
    return cats.sort((a, b) => b.total - a.total);
  }, [actions]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const activeCategory = selectedCategory ?? sortedCategories[0]?.name ?? null;

  // Build individual action data for the selected category
  const { actionNames, actionData } = useMemo(() => {
    if (!activeCategory || !actions[activeCategory]) return { actionNames: [], actionData: {} as Record<string, Record<string, number>> };

    const items = actions[activeCategory];
    const data: Record<string, Record<string, number>> = {};

    for (const [actionName, counts] of Object.entries(items)) {
      const rangeTotals: Record<string, number> = {};
      let hasAny = false;
      for (const range of XL_RANGES) {
        if (counts[range]) {
          rangeTotals[range] = counts[range];
          hasAny = true;
        }
      }
      if (hasAny) data[actionName] = rangeTotals;
    }

    const sorted = Object.keys(data).sort((a, b) => {
      const totalA = Object.values(data[a] ?? {}).reduce((s, v) => s + v, 0);
      const totalB = Object.values(data[b] ?? {}).reduce((s, v) => s + v, 0);
      return totalB - totalA;
    });

    return { actionNames: sorted, actionData: data };
  }, [actions, activeCategory]);

  const stackedData = useMemo(() => {
    return XL_RANGES.map((range) => {
      const total = actionNames.reduce((s, name) => s + (actionData[name]?.[range] ?? 0), 0);
      let cumPct = 0;
      const segments = actionNames.map((name) => {
        const value = actionData[name]?.[range] ?? 0;
        const pct = total > 0 ? value / total : 0;
        const segment = { name, value, pct, y0: cumPct, y1: cumPct + pct };
        cumPct += pct;
        return segment;
      });
      return { range, segments, total };
    });
  }, [actionData, actionNames]);

  const chartWidth = 900;
  const chartHeight = 220;
  const padding = { top: 24, right: 12, bottom: 28, left: 32 };
  const barAreaWidth = chartWidth - padding.left - padding.right;
  const barAreaHeight = chartHeight - padding.top - padding.bottom;
  const barGap = 8;
  const barWidth = (barAreaWidth - barGap * (XL_RANGES.length - 1)) / XL_RANGES.length;

  function formatTotal(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  const hoveredData = hoveredRange ? stackedData.find((d) => d.range === hoveredRange) : null;

  if (sortedCategories.length === 0) return null;

  return (
    <div>
      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {sortedCategories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeCategory === cat.name
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {cat.name}
            <span className="ml-1 opacity-70">{cat.total.toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="h-6 mb-1 flex items-center">
        {hoveredData ? (
          <div className="flex items-center gap-3 text-sm font-mono flex-wrap">
            <span className="text-health font-bold">XL {hoveredData.range}</span>
            <span className="text-muted-foreground">({hoveredData.total.toLocaleString()})</span>
            {hoveredData.segments
              .filter((s) => s.value > 0)
              .sort((a, b) => b.value - a.value)
              .slice(0, 6)
              .map((s) => {
                const idx = actionNames.indexOf(s.name);
                return (
                  <span key={s.name} style={{ color: ACTION_ITEM_COLORS[idx % ACTION_ITEM_COLORS.length] }}>
                    {s.name} {s.value}
                  </span>
                );
              })}
            {hoveredData.segments.filter((s) => s.value > 0).length > 6 && (
              <span className="text-muted-foreground">
                +{hoveredData.segments.filter((s) => s.value > 0).length - 6} more
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">Hover for details</span>
        )}
      </div>

      <div>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full"
          onMouseLeave={() => setHoveredRange(null)}
        >
          {[0.25, 0.5, 0.75].map((pct) => {
            const y = padding.top + barAreaHeight * (1 - pct);
            return (
              <line
                key={pct}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                className="stroke-border/20"
                strokeWidth={1}
              />
            );
          })}

          {stackedData.map((d, i) => {
            const x = padding.left + i * (barWidth + barGap);
            const isHovered = hoveredRange === d.range;
            const hasData = d.total > 0;

            return (
              <g key={d.range} onMouseEnter={() => setHoveredRange(d.range)}>
                {hasData && (
                  <text
                    x={x + barWidth / 2}
                    y={padding.top - 6}
                    textAnchor="middle"
                    className={`text-[9px] font-mono ${isHovered ? "fill-foreground" : "fill-muted-foreground/60"}`}
                  >
                    {formatTotal(d.total)}
                  </text>
                )}

                {hasData && (
                  <rect
                    x={x}
                    y={padding.top}
                    width={barWidth}
                    height={barAreaHeight}
                    className="fill-secondary/20"
                    rx={2}
                  />
                )}

                {d.segments.map((seg) => {
                  if (seg.value === 0) return null;
                  const idx = actionNames.indexOf(seg.name);
                  const y = padding.top + barAreaHeight * (1 - seg.y1);
                  const h = barAreaHeight * seg.pct;
                  return (
                    <rect
                      key={seg.name}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(1, h)}
                      fill={ACTION_ITEM_COLORS[idx % ACTION_ITEM_COLORS.length]}
                      opacity={hoveredRange === null || isHovered ? 0.85 : 0.35}
                      rx={1}
                      className="transition-opacity duration-100 cursor-pointer"
                    />
                  );
                })}

                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 14}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${isHovered ? "fill-foreground" : "fill-muted-foreground"}`}
                >
                  {d.range}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {actionNames.map((name, idx) => {
            const total = Object.values(actionData[name] ?? {}).reduce((s, v) => s + v, 0);
            return (
              <div key={name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: ACTION_ITEM_COLORS[idx % ACTION_ITEM_COLORS.length] }}
                />
                <span className="text-muted-foreground">{name}</span>
                <span className="font-mono text-muted-foreground/70">{total.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Skills tab showing skill levels and progression visualization.
 */
function SkillsTab({ data }: { data: MorgueData }) {
  const skills = data.endingSkills;
  const skillsByXl = data.skillsByXl;
  const [progressionView, setProgressionView] = useState<"chart" | "table">("chart");

  if (!skills || Object.keys(skills).length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No skill data available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort skills by level descending
  const sortedSkills = Object.entries(skills).sort(([, a], [, b]) => b - a);
  const hasProgression = skillsByXl && Object.keys(skillsByXl).length > 0;

  return (
    <div className="space-y-6">
      {/* Final Skills Grid */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-mana" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {sortedSkills.map(([skill, level]) => (
              <div
                key={skill}
                className="flex items-center justify-between py-1 px-2 rounded-sm bg-secondary/30"
              >
                <span className="text-sm text-foreground truncate">{skill}</span>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-mana rounded-full"
                      style={{ width: `${Math.min((level / 27) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-mana w-8 text-right">{level.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Progression */}
      {hasProgression && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                Skill Progression
              </CardTitle>
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                <button
                  onClick={() => setProgressionView("chart")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    progressionView === "chart"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setProgressionView("table")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    progressionView === "table"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {progressionView === "chart" ? (
              <SkillProgressionChart
                skillsByXl={skillsByXl}
                endingSkills={skills}
                maxXl={data.characterLevel ?? 27}
              />
            ) : (
              <SkillProgressionTable
                skillsByXl={skillsByXl}
                endingSkills={skills}
                maxXl={data.characterLevel ?? 27}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {data.actions && Object.keys(data.actions).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Swords className="w-4 h-4 text-danger" />
              Actions
            </CardTitle>
            <CardDescription className="font-mono">
              Action usage by experience level range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionsChart actions={data.actions} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Interactive skill progression chart showing how skills developed over XL.
 */
function SkillProgressionChart({
  skillsByXl,
  endingSkills,
  maxXl,
}: {
  skillsByXl: Record<string, Record<string, number>>;
  endingSkills: Record<string, number>;
  maxXl: number;
}) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [hoveredXl, setHoveredXl] = useState<number | null>(null);

  // Sort skills by final level descending
  const sortedSkillNames = Object.keys(endingSkills).sort(
    (a, b) => (endingSkills[b] ?? 0) - (endingSkills[a] ?? 0)
  );

  // Build complete progression data for each skill
  const progressionData = useMemo(() => {
    const data: Record<string, { xl: number; level: number }[]> = {};

    for (const skillName of sortedSkillNames) {
      const progression = skillsByXl[skillName];
      if (!progression) continue;

      const points: { xl: number; level: number }[] = [];
      let lastKnownLevel = 0;

      // Fill in all XL values from 1 to maxXl
      for (let xl = 1; xl <= maxXl; xl++) {
        const xlStr = String(xl);
        if (progression[xlStr] !== undefined) {
          lastKnownLevel = progression[xlStr];
        }
        points.push({ xl, level: lastKnownLevel });
      }

      data[skillName] = points;
    }

    return data;
  }, [skillsByXl, sortedSkillNames, maxXl]);

  // Get all XL values for the x-axis
  const xlValues = useMemo(() => {
    const values: number[] = [];
    for (let xl = 1; xl <= maxXl; xl++) {
      values.push(xl);
    }
    return values;
  }, [maxXl]);

  // Chart dimensions — fixed viewBox, SVG scales to fill container
  const chartHeight = 300;
  const chartPadding = { top: 20, right: 16, bottom: 40, left: 50 };
  const chartWidth = 900;

  // Scales
  const maxSkillLevel = 27;
  const xScale = (xl: number) =>
    chartPadding.left + ((xl - 1) / (maxXl - 1 || 1)) * (chartWidth - chartPadding.left - chartPadding.right);
  const yScale = (level: number) =>
    chartHeight - chartPadding.bottom - (level / maxSkillLevel) * (chartHeight - chartPadding.top - chartPadding.bottom);

  // Generate SVG path for a skill
  const generatePath = (skillName: string) => {
    const points = progressionData[skillName];
    if (!points || points.length === 0) return "";

    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.xl)} ${yScale(p.level)}`)
      .join(" ");
  };

  // Generate area path for a skill (for filled area under the line)
  const generateAreaPath = (skillName: string) => {
    const points = progressionData[skillName];
    if (!points || points.length === 0) return "";

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.xl)} ${yScale(p.level)}`)
      .join(" ");

    // Close the path along the bottom
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${linePath} L ${xScale(lastPoint.xl)} ${yScale(0)} L ${xScale(firstPoint.xl)} ${yScale(0)} Z`;
  };

  // Toggle skill selection
  const toggleSkill = (skillName: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillName)) {
        next.delete(skillName);
      } else {
        next.add(skillName);
      }
      return next;
    });
  };

  // Determine which skills to show (all if none selected, otherwise only selected)
  const visibleSkills = selectedSkills.size > 0 ? sortedSkillNames.filter((s) => selectedSkills.has(s)) : sortedSkillNames;

  // Get skill level at a specific XL for tooltip
  const getSkillAtXl = (skillName: string, xl: number) => {
    const points = progressionData[skillName];
    if (!points) return 0;
    const point = points.find((p) => p.xl === xl);
    return point?.level ?? 0;
  };

  return (
    <div>
      {/* Skill Legend / Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
          {sortedSkillNames.slice(0, 12).map((skillName, idx) => {
            const color = getSkillColor(idx);
            const isSelected = selectedSkills.has(skillName);
            const isVisible = selectedSkills.size === 0 || isSelected;
            const isHovered = hoveredSkill === skillName;

            return (
              <button
                key={skillName}
                onClick={() => toggleSkill(skillName)}
                onMouseEnter={() => setHoveredSkill(skillName)}
                onMouseLeave={() => setHoveredSkill(null)}
                className={`
                  flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all
                  ${isVisible ? "opacity-100" : "opacity-40"}
                  ${isHovered || isSelected ? "ring-1 ring-offset-1 ring-offset-background" : ""}
                `}
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                  borderColor: color,
                  ...(isHovered || isSelected ? { ringColor: color } : {}),
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {skillName}
                <span className="opacity-70">{endingSkills[skillName]?.toFixed(0)}</span>
              </button>
            );
          })}
          {sortedSkillNames.length > 12 && (
            <span className="text-xs text-muted-foreground self-center">
              +{sortedSkillNames.length - 12} more
            </span>
          )}
        </div>

        {/* Chart Container */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="block w-full"
            onMouseLeave={() => setHoveredXl(null)}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/30" />
              </pattern>
            </defs>
            <rect
              x={chartPadding.left}
              y={chartPadding.top}
              width={chartWidth - chartPadding.left - chartPadding.right}
              height={chartHeight - chartPadding.top - chartPadding.bottom}
              fill="url(#grid)"
              className="opacity-50"
            />

            {/* Y-axis labels */}
            {[0, 5, 10, 15, 20, 25, 27].map((level) => (
              <g key={level}>
                <line
                  x1={chartPadding.left}
                  y1={yScale(level)}
                  x2={chartWidth - chartPadding.right}
                  y2={yScale(level)}
                  className="stroke-border/50"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartPadding.left - 8}
                  y={yScale(level)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-xs font-mono"
                >
                  {level}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {xlValues.filter((xl) => xl === 1 || xl % 5 === 0 || xl === maxXl).map((xl) => (
              <text
                key={xl}
                x={xScale(xl)}
                y={chartHeight - chartPadding.bottom + 20}
                textAnchor="middle"
                className="fill-muted-foreground text-xs font-mono"
              >
                {xl}
              </text>
            ))}

            {/* X-axis title */}
            <text
              x={(chartWidth + chartPadding.left - chartPadding.right) / 2}
              y={chartHeight - 5}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              Experience Level (XL)
            </text>

            {/* Skill lines - render in reverse order so higher skills are on top */}
            {[...visibleSkills].reverse().map((skillName, i) => {
              const idx = sortedSkillNames.indexOf(skillName);
              const color = getSkillColor(idx);
              const isHighlighted = hoveredSkill === skillName || (selectedSkills.size > 0 && selectedSkills.has(skillName));
              const opacity = hoveredSkill
                ? hoveredSkill === skillName
                  ? 1
                  : 0.2
                : selectedSkills.size > 0
                  ? selectedSkills.has(skillName)
                    ? 1
                    : 0.2
                  : 0.7;

              return (
                <g
                  key={skillName}
                  onMouseEnter={() => setHoveredSkill(skillName)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Area fill */}
                  <path
                    d={generateAreaPath(skillName)}
                    fill={color}
                    opacity={opacity * 0.15}
                    className="transition-opacity duration-150"
                  />
                  {/* Line */}
                  <path
                    d={generatePath(skillName)}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHighlighted ? 3 : 2}
                    opacity={opacity}
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

            {/* Interactive hover overlay for XL */}
            {xlValues.map((xl) => (
              <rect
                key={xl}
                x={xScale(xl) - 15}
                y={chartPadding.top}
                width={30}
                height={chartHeight - chartPadding.top - chartPadding.bottom}
                fill="transparent"
                onMouseEnter={() => setHoveredXl(xl)}
              />
            ))}

            {/* Vertical line at hovered XL */}
            {hoveredXl !== null && (
              <line
                x1={xScale(hoveredXl)}
                y1={chartPadding.top}
                x2={xScale(hoveredXl)}
                y2={chartHeight - chartPadding.bottom}
                className="stroke-foreground/50"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}

            {/* Points at hovered XL */}
            {hoveredXl !== null &&
              visibleSkills.map((skillName) => {
                const idx = sortedSkillNames.indexOf(skillName);
                const color = getSkillColor(idx);
                const level = getSkillAtXl(skillName, hoveredXl);
                if (level === 0) return null;

                return (
                  <circle
                    key={skillName}
                    cx={xScale(hoveredXl)}
                    cy={yScale(level)}
                    r={hoveredSkill === skillName ? 6 : 4}
                    fill={color}
                    stroke="var(--background)"
                    strokeWidth={2}
                    className="transition-all duration-150"
                  />
                );
              })}
          </svg>

          {/* Tooltip */}
          {hoveredXl !== null && (
            <div
              className="absolute bg-card border border-border rounded-lg shadow-lg p-3 pointer-events-none z-10"
              style={{
                left: `min(${(xScale(hoveredXl) / chartWidth) * 100}% + 10px, 100% - 200px)`,
                top: `${(chartPadding.top / chartHeight) * 100}%`,
              }}
            >
              <div className="font-mono text-sm font-medium text-foreground mb-2">
                XL {hoveredXl}
              </div>
              <div className="space-y-1">
                {visibleSkills
                  .filter((s) => getSkillAtXl(s, hoveredXl) > 0)
                  .slice(0, 8)
                  .map((skillName) => {
                    const idx = sortedSkillNames.indexOf(skillName);
                    const color = getSkillColor(idx);
                    const level = getSkillAtXl(skillName, hoveredXl);

                    return (
                      <div key={skillName} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-muted-foreground flex-1">{skillName}</span>
                        <span className="font-mono" style={{ color }}>
                          {level.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                {visibleSkills.filter((s) => getSkillAtXl(s, hoveredXl) > 0).length > 8 && (
                  <div className="text-xs text-muted-foreground">
                    +{visibleSkills.filter((s) => getSkillAtXl(s, hoveredXl) > 0).length - 8} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {selectedSkills.size > 0 && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSkills(new Set())}
            className="text-xs text-muted-foreground"
          >
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Skill progression table showing skills by XL.
 */
function SkillProgressionTable({
  skillsByXl,
  endingSkills,
  maxXl,
}: {
  skillsByXl: Record<string, Record<string, number>>;
  endingSkills: Record<string, number>;
  maxXl: number;
}) {
  // Sort skills by final level descending
  const sortedSkillNames = Object.keys(endingSkills).sort(
    (a, b) => (endingSkills[b] ?? 0) - (endingSkills[a] ?? 0)
  );

  // Build XL columns - show key XL milestones
  const xlColumns = useMemo(() => {
    const columns: number[] = [];
    for (let xl = 1; xl <= maxXl; xl++) {
      // Show XL 1, then every 3 levels, and always show max XL
      if (xl === 1 || xl % 3 === 0 || xl === maxXl) {
        columns.push(xl);
      }
    }
    // Ensure max XL is included
    if (!columns.includes(maxXl)) {
      columns.push(maxXl);
    }
    return columns;
  }, [maxXl]);

  // Get skill level at a specific XL (carrying forward from previous XL)
  const getSkillAtXl = (skillName: string, targetXl: number): number => {
    const progression = skillsByXl[skillName];
    if (!progression) return 0;

    let lastKnownLevel = 0;
    for (let xl = 1; xl <= targetXl; xl++) {
      const xlStr = String(xl);
      if (progression[xlStr] !== undefined) {
        lastKnownLevel = progression[xlStr];
      }
    }
    return lastKnownLevel;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground sticky left-0 bg-card">
              Skill
            </th>
            {xlColumns.map((xl) => (
              <th
                key={xl}
                className="text-center py-2 px-2 font-mono text-muted-foreground min-w-[40px]"
              >
                {xl}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedSkillNames.map((skillName, idx) => {
            const color = getSkillColor(idx);
            return (
              <tr key={skillName} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-2 px-3 sticky left-0 bg-card">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-foreground">{skillName}</span>
                  </div>
                </td>
                {xlColumns.map((xl) => {
                  const level = getSkillAtXl(skillName, xl);
                  const prevLevel = xl > 1 ? getSkillAtXl(skillName, xlColumns[xlColumns.indexOf(xl) - 1] ?? 1) : 0;
                  const isNew = level > 0 && level !== prevLevel;

                  return (
                    <td
                      key={xl}
                      className={`text-center py-2 px-2 font-mono ${
                        level === 0
                          ? "text-muted-foreground/30"
                          : isNew
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                      }`}
                    >
                      {level > 0 ? level : "–"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Compact spells section for the Overview tab.
 */
function SpellsSection({ data }: { data: MorgueData }) {
  const spells = data.endingSpells;

  if (!spells || spells.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border md:col-span-2 lg:col-span-3 py-4 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-special" />
          Spells ({spells.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {spells.map((spell) => (
            <div
              key={spell.slot}
              className="flex items-center gap-2 p-2 rounded bg-secondary/50"
            >
              <span className="font-mono text-xs text-muted-foreground w-5">{spell.slot})</span>
              <span className="text-sm text-foreground truncate flex-1">{spell.name}</span>
              <span className="font-mono text-xs text-special shrink-0">L{spell.level ?? "?"}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const BRANCH_COLORS: Record<string, string> = {
  D: "#6b7280",
  Temple: "#eab308",
  Lair: "#22c55e",
  Orc: "#f97316",
  Swamp: "#166534",
  Shoals: "#06b6d4",
  Snake: "#84cc16",
  Spider: "#a16207",
  Slime: "#4ade80",
  Vaults: "#64748b",
  Crypt: "#a855f7",
  Depths: "#3b82f6",
  Zot: "#ef4444",
  Elf: "#818cf8",
  Tomb: "#b45309",
  Abyss: "#9333ea",
  Pan: "#dc2626",
  Hell: "#b91c1c",
  Dis: "#94a3b8",
  Geh: "#ea580c",
  Coc: "#0ea5e9",
  Tar: "#581c87",
  Zig: "#f59e0b",
};

const BRANCH_FULL_TO_SHORT: Record<string, string> = {
  Dungeon: "D", "Orcish Mines": "Orc", "Elven Halls": "Elf",
  "Snake Pit": "Snake", "Spider Nest": "Spider", "Slime Pits": "Slime",
  Pandemonium: "Pan", Gehenna: "Geh", Cocytus: "Coc", Tartarus: "Tar",
  Ziggurat: "Zig", "Ice Cave": "IceCv", "Wizard Laboratory": "WizLab",
  Labyrinth: "Lab", "Hall of Blades": "Blade", Desolation: "Desolation",
};

function getBranchColor(name: string): string {
  return BRANCH_COLORS[name] ?? BRANCH_COLORS[BRANCH_FULL_TO_SHORT[name] ?? ""] ?? "#6b7280";
}

interface XpEntry {
  xl: number;
  turn: number | null;
  location: string;
  branch: string;
  delta: number | null;
}

function XpProgressionChart({ xpProgression }: { xpProgression: Record<string, { turn: number | null; location: string }> }) {
  const [hoveredXl, setHoveredXl] = useState<number | null>(null);

  const entries: XpEntry[] = useMemo(() => {
    const sorted = Object.entries(xpProgression)
      .map(([xl, info]) => ({
        xl: Number(xl),
        turn: info.turn,
        location: info.location,
        branch: info.location.split(":")[0],
      }))
      .sort((a, b) => a.xl - b.xl);

    return sorted.map((entry, i) => {
      const prevTurn = i > 0 ? sorted[i - 1].turn : 0;
      const delta = entry.turn !== null && prevTurn !== null ? entry.turn - prevTurn : null;
      return { ...entry, delta };
    });
  }, [xpProgression]);

  const hasTurnData = entries.some((e) => e.delta !== null && e.delta > 0);
  const maxDelta = Math.max(...entries.map((e) => e.delta ?? 0), 1);

  const hoveredEntry = hoveredXl !== null ? entries.find((e) => e.xl === hoveredXl) : null;

  const branches = useMemo(() => {
    const seen = new Set<string>();
    return entries.reduce<string[]>((acc, e) => {
      if (!seen.has(e.branch)) {
        seen.add(e.branch);
        acc.push(e.branch);
      }
      return acc;
    }, []);
  }, [entries]);

  const yTicks = useMemo(() => {
    if (!hasTurnData) return [];
    const tickCount = 4;
    const rawStep = maxDelta / tickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [maxDelta, hasTurnData]);

  const effectiveMax = yTicks.length > 0 ? yTicks[yTicks.length - 1] : maxDelta;

  const padding = { top: 12, right: 8, bottom: 28, left: hasTurnData ? 44 : 12 };
  const maxXl = Math.max(...entries.map((e) => e.xl), 27);
  const chartWidth = 900;
  const barAreaWidth = chartWidth - padding.left - padding.right;
  const barGap = 3;
  const barWidth = (barAreaWidth - barGap * (maxXl - 1)) / maxXl;
  const chartHeight = hasTurnData ? 220 : 56;
  const barAreaHeight = chartHeight - padding.top - padding.bottom;

  function formatTick(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return String(n);
  }

  return (
    <div>
      <div className="h-6 mb-1 flex items-center">
        {hoveredEntry ? (
          <div className="flex items-center gap-3 text-sm font-mono">
            <span className="text-health font-bold">XL {hoveredEntry.xl}</span>
            <span style={{ color: BRANCH_COLORS[hoveredEntry.branch] ?? "#888" }}>
              {hoveredEntry.location}
            </span>
            {hoveredEntry.turn !== null && (
              <span className="text-muted-foreground">
                Turn <span className="text-foreground">{hoveredEntry.turn.toLocaleString()}</span>
              </span>
            )}
            {hoveredEntry.delta !== null && hoveredEntry.delta > 0 && (
              <span className="text-muted-foreground">
                (+{hoveredEntry.delta.toLocaleString()} turns)
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">Hover for details</span>
        )}
      </div>

      <div>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full"
          onMouseLeave={() => setHoveredXl(null)}
        >
          {hasTurnData &&
            yTicks.map((tick) => {
              const y = padding.top + barAreaHeight - (tick / effectiveMax) * barAreaHeight;
              return (
                <g key={tick}>
                  {tick > 0 && (
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      className="stroke-border/30"
                      strokeWidth={1}
                    />
                  )}
                  <text
                    x={padding.left - 6}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px] font-mono"
                  >
                    {formatTick(tick)}
                  </text>
                </g>
              );
            })}

          {entries.map((entry) => {
            const x = padding.left + (entry.xl - 1) * (barWidth + barGap);
            const color = BRANCH_COLORS[entry.branch] ?? "#888";
            const isHovered = hoveredXl === entry.xl;

            const barHeight =
              hasTurnData && entry.delta !== null
                ? Math.max(3, (entry.delta / effectiveMax) * barAreaHeight)
                : barAreaHeight;
            const y = padding.top + barAreaHeight - barHeight;

            return (
              <g key={entry.xl} onMouseEnter={() => setHoveredXl(entry.xl)}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  opacity={hoveredXl === null || isHovered ? 0.85 : 0.35}
                  rx={2}
                  className="transition-opacity duration-100 cursor-pointer"
                />
                {isHovered && (
                  <rect
                    x={x - 1}
                    y={y - 1}
                    width={barWidth + 2}
                    height={barHeight + 2}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    rx={3}
                  />
                )}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 14}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${isHovered ? "fill-foreground" : "fill-muted-foreground"}`}
                >
                  {entry.xl}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {branches.map((branch) => (
            <div key={branch} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: BRANCH_COLORS[branch] ?? "#888" }}
              />
              <span className="text-muted-foreground">{branch}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Dungeon tab showing branches visited.
 */
function DungeonTab({ data }: { data: MorgueData }) {
  const branches = data.branches;

  if (!branches || Object.keys(branches).length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Map className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No dungeon data available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort branches by deepest level descending
  const sortedBranches = Object.entries(branches).sort(
    ([, a], [, b]) => (b.deepest ?? 0) - (a.deepest ?? 0)
  );

  return (
    <div className="space-y-6">
      {/* Branch Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="w-4 h-4 text-health" />
            Branches Explored ({data.branchesVisitedCount ?? Object.keys(branches).length})
            {data.levelsSeenCount !== null && (
              <span className="text-xs font-normal text-muted-foreground font-mono ml-1">
                — {data.levelsSeenCount} levels seen
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {sortedBranches.map(([branch, info]) => (
              <div
                key={branch}
                className="flex items-center justify-between py-1 px-2 rounded-sm bg-secondary/30 border-l-2"
                style={{ borderLeftColor: getBranchColor(branch) }}
              >
                <span className="text-foreground text-sm truncate">{branch}</span>
                <span className="font-mono text-xs text-muted-foreground ml-2 shrink-0">
                  {info.levelsSeen ?? info.deepest ?? "?"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* XP Progression */}
      {data.xpProgression && Object.keys(data.xpProgression).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              XP Progression
            </CardTitle>
            <CardDescription className="font-mono">
              Turns between experience levels, colored by dungeon branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <XpProgressionChart xpProgression={data.xpProgression} />
          </CardContent>
        </Card>
      )}

      {/* Top Levels by Time */}
      {data.topLevelsByTime && data.topLevelsByTime.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-mana" />
              Most Time Spent (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topLevelsByTime.slice(0, 10).map((level, i) => (
                <div
                  key={level.level}
                  className="flex items-center gap-4 p-2 rounded bg-secondary/50"
                >
                  <span className="font-mono text-muted-foreground w-6">{i + 1}.</span>
                  <span className="flex-1 font-medium text-foreground">{level.level}</span>
                  <span className="font-mono text-sm text-mana">
                    {level.time.toLocaleString()} deca
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Debug tab showing raw JSON data with expand/collapse functionality.
 */
function DebugTab({ data }: { data: MorgueData }) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["root"]));

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const paths = new Set<string>(["root"]);
    const collectPaths = (obj: unknown, currentPath: string) => {
      if (obj && typeof obj === "object") {
        paths.add(currentPath);
        if (Array.isArray(obj)) {
          obj.forEach((item, i) => collectPaths(item, `${currentPath}[${i}]`));
        } else {
          Object.keys(obj).forEach((key) =>
            collectPaths((obj as Record<string, unknown>)[key], `${currentPath}.${key}`)
          );
        }
      }
    };
    collectPaths(data, "root");
    setExpandedPaths(paths);
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(["root"]));
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="w-4 h-4 text-muted-foreground" />
            Raw JSON Data
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
        <CardDescription>
          Parsed morgue data as JSON. Click on objects and arrays to expand/collapse.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-sm bg-secondary/50 rounded-lg p-4 overflow-x-auto max-h-[70vh] overflow-y-auto">
          <JsonNode
            data={data}
            path="root"
            expandedPaths={expandedPaths}
            onToggle={togglePath}
            isLast={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recursive component to render JSON nodes with expand/collapse.
 */
function JsonNode({
  data,
  path,
  expandedPaths,
  onToggle,
  keyName,
  isLast,
}: {
  data: unknown;
  path: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  keyName?: string;
  isLast: boolean;
}) {
  const isExpanded = expandedPaths.has(path);
  const isObject = data !== null && typeof data === "object";
  const isArray = Array.isArray(data);
  const comma = isLast ? "" : ",";

  // Render primitive values
  if (!isObject) {
    let valueClass = "text-foreground";
    let displayValue: string;

    if (typeof data === "string") {
      valueClass = "text-health";
      displayValue = `"${data}"`;
    } else if (typeof data === "number") {
      valueClass = "text-mana";
      displayValue = String(data);
    } else if (typeof data === "boolean") {
      valueClass = "text-special";
      displayValue = String(data);
    } else if (data === null) {
      valueClass = "text-muted-foreground";
      displayValue = "null";
    } else {
      displayValue = String(data);
    }

    return (
      <span>
        {keyName !== undefined && (
          <span className="text-gold">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-muted-foreground">: </span>}
        <span className={valueClass}>{displayValue}</span>
        <span className="text-muted-foreground">{comma}</span>
      </span>
    );
  }

  // Get entries for objects/arrays
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);

  const isEmpty = entries.length === 0;
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";

  // Empty object/array
  if (isEmpty) {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-gold">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-muted-foreground">: </span>}
        <span className="text-muted-foreground">{openBracket}{closeBracket}</span>
        <span className="text-muted-foreground">{comma}</span>
      </span>
    );
  }

  // Collapsed state
  if (!isExpanded) {
    const preview = isArray
      ? `${entries.length} items`
      : `${entries.length} keys`;

    return (
      <span
        className="cursor-pointer hover:bg-secondary/80 rounded px-1 -mx-1 inline-flex items-center gap-1"
        onClick={() => onToggle(path)}
      >
        <ChevronRight className="w-3 h-3 text-muted-foreground inline shrink-0" />
        {keyName !== undefined && (
          <span className="text-gold">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-muted-foreground">: </span>}
        <span className="text-muted-foreground">
          {openBracket} <span className="text-muted-foreground/70 italic text-xs">{preview}</span> {closeBracket}
        </span>
        <span className="text-muted-foreground">{comma}</span>
      </span>
    );
  }

  // Expanded state
  return (
    <div>
      <span
        className="cursor-pointer hover:bg-secondary/80 rounded px-1 -mx-1 inline-flex items-center gap-1"
        onClick={() => onToggle(path)}
      >
        <ChevronDown className="w-3 h-3 text-muted-foreground inline shrink-0" />
        {keyName !== undefined && (
          <span className="text-gold">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-muted-foreground">: </span>}
        <span className="text-muted-foreground">{openBracket}</span>
      </span>
      <div className="pl-4 border-l border-border/50 ml-1.5">
        {entries.map(([key, value], index) => {
          const childPath = isArray ? `${path}[${key}]` : `${path}.${key}`;
          const isLastEntry = index === entries.length - 1;

          return (
            <div key={key}>
              <JsonNode
                data={value}
                path={childPath}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                keyName={isArray ? undefined : key}
                isLast={isLastEntry}
              />
            </div>
          );
        })}
      </div>
      <span className="text-muted-foreground">{closeBracket}</span>
      <span className="text-muted-foreground">{comma}</span>
    </div>
  );
}
