"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
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
  Scroll,
  Wand2,
  Crown,
  Heart,
  Droplet,
  Bug,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
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

function MorgueViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlFromParams = searchParams.get("url") || "";
  const [url, setUrl] = useState(urlFromParams);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [morgueData, setMorgueData] = useState<MorgueData | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

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
      const result = parseMorgue(morgueText);
      setParseResult(result);
      setMorgueData(result.data);
      setLoadingState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoadingState("error");
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

  const handleParseMorgue = async () => {
    // Update URL params when user clicks Parse
    const newParams = new URLSearchParams();
    newParams.set("url", url);
    router.push(`/morgue?${newParams.toString()}`, { scroll: false });

    await fetchAndParse(url);
  };

  return (
    <PageWrapper>
      {/* Header */}
      <PageHeader
        title="Morgue Viewer"
        subtitle="Parse and visualize DCSS morgue files"
        icon={FileText}
        variant="health"
      />

      {/* URL Input Section */}
      <Card className="mb-8 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-mana" />
            Load Morgue File
          </CardTitle>
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
              className="font-mono text-sm bg-secondary border-border flex-1"
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

      {/* Parsed Morgue Display */}
      {morgueData && <MorgueDisplay data={morgueData} />}

      {/* Info Section (show when no data loaded) */}
      {!morgueData && (
        <Card className="bg-secondary/30 border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="w-4 h-4 text-muted-foreground" />
              What is a Morgue File?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              A morgue file is a detailed text dump generated when your DCSS character dies (or wins!). It contains a
              comprehensive record of your run including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Character stats, skills, and equipment</li>
              <li>Spells known and abilities acquired</li>
              <li>Mutations and god gifts</li>
              <li>Dungeon progress and discovered areas</li>
              <li>Kill counts and notable events</li>
              <li>Message history from the final moments</li>
            </ul>
            <p className="mt-4">
              Morgue files are hosted on public servers like{" "}
              <code className="px-1 py-0.5 rounded bg-secondary text-foreground">crawl.akrasiac.org</code> and{" "}
              <code className="px-1 py-0.5 rounded bg-secondary text-foreground">crawl.xtahua.com</code>.
            </p>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}

/**
 * Main component to display parsed morgue data.
 */
function MorgueDisplay({ data }: { data: MorgueData }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="gap-1.5">
            <User className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="equipment" className="gap-1.5">
            <Shield className="w-4 h-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-1.5">
            <BookOpen className="w-4 h-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="spells" className="gap-1.5">
            <Wand2 className="w-4 h-4" />
            Spells
          </TabsTrigger>
          <TabsTrigger value="dungeon" className="gap-1.5">
            <Map className="w-4 h-4" />
            Dungeon
          </TabsTrigger>
          <TabsTrigger value="debug" className="gap-1.5">
            <Bug className="w-4 h-4" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="equipment">
          <EquipmentTab data={data} />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsTab data={data} />
        </TabsContent>

        <TabsContent value="spells">
          <SpellsTab data={data} />
        </TabsContent>

        <TabsContent value="dungeon">
          <DungeonTab data={data} />
        </TabsContent>

        <TabsContent value="debug">
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
  const isVictory = runesCollected >= 3;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Character Info Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
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
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
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
              <span className="text-danger">
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
              <span className="text-muted-foreground">Gold</span>
              <span className="text-gold">{stats?.gold?.toLocaleString() ?? "?"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Str</span>
              <span className="text-foreground">{stats?.str ?? "?"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Int</span>
              <span className="text-foreground">{stats?.int ?? "?"}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">Dex</span>
              <span className="text-foreground">{stats?.dex ?? "?"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Info Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
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
        <Card className="bg-card border-border md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
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
                  className="text-special border-special/30 bg-special/10 font-mono text-xs"
                >
                  {rune}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gems Card (0.32+) */}
      {gemsCollected > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gem className="w-4 h-4 text-special" />
              Gems ({gemsCollected})
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Gods Worshipped */}
      {data.godsWorshipped && data.godsWorshipped.length > 0 && (
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-special" />
              Gods Worshipped
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
    </div>
  );
}

/**
 * Equipment tab showing all worn items.
 */
function EquipmentTab({ data }: { data: MorgueData }) {
  const equipment = data.equipment;

  if (!equipment) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No equipment data available</p>
        </CardContent>
      </Card>
    );
  }

  const slots = [
    { name: "Weapon", value: equipment.weapon, icon: Swords },
    { name: "Body Armour", value: equipment.bodyArmour, icon: Shield },
    { name: "Shield", value: equipment.shield, icon: Shield },
    { name: "Helmet", value: equipment.helmet, icon: Crown },
    { name: "Cloak", value: equipment.cloak, icon: Sparkles },
    { name: "Gloves", value: equipment.gloves, icon: Sparkles },
    { name: "Boots", value: equipment.boots, icon: Sparkles },
    { name: "Amulet", value: equipment.amulet, icon: Gem },
    { name: "Left Ring", value: equipment.ringLeft, icon: Gem },
    { name: "Right Ring", value: equipment.ringRight, icon: Gem },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {slots.map((slot) => {
        const Icon = slot.icon;
        return (
          <Card
            key={slot.name}
            className={`bg-card border-border ${!slot.value ? "opacity-50" : ""}`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-md bg-secondary">
                <Icon className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{slot.name}</p>
                <p className="font-mono text-sm text-foreground truncate">
                  {slot.value || "Empty"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Skills tab showing skill levels.
 */
function SkillsTab({ data }: { data: MorgueData }) {
  const skills = data.endingSkills;

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

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-mana" />
          Skills
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSkills.map(([skill, level]) => (
            <div
              key={skill}
              className="flex items-center justify-between p-2 rounded bg-secondary/50"
            >
              <span className="text-sm text-foreground">{skill}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mana rounded-full transition-all"
                    style={{ width: `${Math.min((level / 27) * 100, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-sm text-mana w-8 text-right">{level.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Spells tab showing memorized spells.
 */
function SpellsTab({ data }: { data: MorgueData }) {
  const spells = data.endingSpells;

  if (!spells || spells.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Scroll className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No spells memorized</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-special" />
          Spells ({spells.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {spells.map((spell) => (
            <div
              key={spell.slot}
              className="flex items-center gap-4 p-3 rounded bg-secondary/50"
            >
              <span className="font-mono text-muted-foreground w-6">{spell.slot})</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{spell.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {spell.schools.map((school) => (
                    <Badge
                      key={school}
                      variant="outline"
                      className="text-xs text-muted-foreground border-border"
                    >
                      {school}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm text-special">Lv {spell.level ?? "?"}</p>
                <p className="font-mono text-xs text-muted-foreground">{spell.failure}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
          </CardTitle>
          {data.levelsSeenCount !== null && (
            <CardDescription className="font-mono">
              {data.levelsSeenCount} total levels seen
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sortedBranches.map(([branch, info]) => (
              <div
                key={branch}
                className="flex items-center justify-between p-3 rounded bg-secondary/50"
              >
                <span className="text-foreground font-medium">{branch}</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {info.levelsSeen ?? info.deepest ?? "?"}/{info.levelsTotal ?? "?"}
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
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(data.xpProgression)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([xl, info]) => (
                  <div
                    key={xl}
                    className="flex items-center justify-between p-2 rounded bg-secondary/50 font-mono text-sm"
                  >
                    <span className="text-health">XL {xl}</span>
                    <span className="text-muted-foreground">{info.location}</span>
                  </div>
                ))}
            </div>
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
