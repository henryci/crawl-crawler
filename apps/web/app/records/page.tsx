"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Loader2,
  AlertCircle,
  Ghost,
  Calendar,
  X,
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
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
import { SortIcon } from "@/components/sort-icon";
import { useSortable } from "@/hooks/use-sortable";
import type {
  ComboRecordsWithAnalytics,
  ComboRecord,
} from "dcss-combo-records-parser";
import {
  getSpeciesName,
  getBackgroundName,
  isSpeciesRemoved,
  isBackgroundRemoved,
  isRecordLegacy,
} from "dcss-combo-records-parser";

type SortField = keyof ComboRecord;

// Age thresholds in days
const AGE_ANCIENT_DAYS = 2555; // ~7 years
const AGE_VERY_OLD_DAYS = 1825; // ~5 years
const AGE_OLD_DAYS = 1095; // ~3 years

function getRunesBadgeClass(runes: number): string {
  if (runes >= 15) return "bg-health/20 border-health/30 text-health";
  if (runes >= 5) return "bg-mana/20 border-mana/30 text-mana";
  return "bg-secondary/50 border-border text-muted-foreground";
}

function formatDate(dateStr: string): string {
  return dateStr.split("T")[0];
}

function formatFetchedAt(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getAgeClass(days: number): string {
  if (days >= AGE_ANCIENT_DAYS) return "text-special font-bold";
  if (days >= AGE_VERY_OLD_DAYS) return "text-danger";
  if (days >= AGE_OLD_DAYS) return "text-gold";
  return "text-muted-foreground";
}

export default function RecordsPage() {
  const [data, setData] = useState<ComboRecordsWithAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/data/combo-records.json");
        if (!response.ok) throw new Error("Failed to load combo records data");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <PageHeader
          title="Combo Records"
          subtitle="Analyzing top combo scores..."
          icon={Trophy}
          variant="gold"
        />
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
            <p className="mt-4 text-muted-foreground">Loading combo records...</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper>
        <PageHeader
          title="Combo Records"
          subtitle="Top combo score analytics"
          icon={Trophy}
          variant="gold"
        />
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Failed to Load Data</h3>
            <p className="text-muted-foreground">{error || "No data available"}</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Combo Records"
        subtitle={`${data.totalRecords.toLocaleString()} combo high scores`}
        icon={Trophy}
        variant="gold"
      />

      {/* Last Updated Banner */}
      {data.fetchedAt && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Data last updated: {formatFetchedAt(data.fetchedAt)}</span>
        </div>
      )}

      {/* Main Records Table */}
      <RecordsTable data={data} />

      {/* Data Source Info */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          Data from{" "}
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mana hover:underline"
          >
            crawl.akrasiac.org
          </a>
        </p>
      </div>
    </PageWrapper>
  );
}

function RecordsTable({ data }: { data: ComboRecordsWithAnalytics }) {
  const [filters, setFilters] = useState({
    search: "",
    player: "",
    species: "all",
    background: "all",
    hideLegacy: true,
  });

  const filteredRecords = useMemo(() => {
    let result = [...data.records];

    // Hide legacy by default
    if (filters.hideLegacy) {
      result = result.filter(
        (r) => !isRecordLegacy(r.species, r.background, data.legacyConfig, r.version)
      );
    }

    // Filter by player name (exact or partial match)
    if (filters.player) {
      const playerSearch = filters.player.toLowerCase();
      result = result.filter((r) => r.player.toLowerCase().includes(playerSearch));
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.character.toLowerCase().includes(search) ||
          r.player.toLowerCase().includes(search) ||
          r.god.toLowerCase().includes(search) ||
          getSpeciesName(r.species, data.legacyConfig, r.version).toLowerCase().includes(search) ||
          getBackgroundName(r.background, data.legacyConfig, r.version).toLowerCase().includes(search)
      );
    }
    if (filters.species !== "all") {
      result = result.filter((r) => r.species === filters.species);
    }
    if (filters.background !== "all") {
      result = result.filter((r) => r.background === filters.background);
    }

    return result;
  }, [data, filters]);

  const { sortedData, sortDir, handleSort, isSortedBy } = useSortable(filteredRecords, {
    initialField: "score" as SortField,
    initialDirection: "desc",
  });

  const hasActiveFilters =
    filters.search || filters.player || filters.species !== "all" || filters.background !== "all" || !filters.hideLegacy;

  // Get unique species and backgrounds for dropdowns
  const uniqueSpecies = useMemo(() => {
    const species = [...new Set(data.records.map((r) => r.species))];
    return species
      .map((sp) => ({
        code: sp,
        name: getSpeciesName(sp, data.legacyConfig),
        isRemoved: isSpeciesRemoved(sp, data.legacyConfig),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const uniqueBackgrounds = useMemo(() => {
    const backgrounds = [...new Set(data.records.map((r) => r.background))];
    return backgrounds
      .map((bg) => ({
        code: bg,
        name: getBackgroundName(bg, data.legacyConfig),
        isRemoved: isBackgroundRemoved(bg, data.legacyConfig),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Count legacy records
  const legacyCount = useMemo(() => {
    return data.records.filter(
      (r) => isRecordLegacy(r.species, r.background, data.legacyConfig, r.version)
    ).length;
  }, [data]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {sortedData.length === data.records.length
                ? `All ${data.records.length} Records`
                : `${sortedData.length} of ${data.records.length} Records`}
          </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({
                    search: "",
                    player: "",
                    species: "all",
                    background: "all",
                    hideLegacy: true,
                  })
                }
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Reset filters
              </Button>
            )}
              </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px] max-w-[280px]">
              <label className="text-xs text-muted-foreground mb-1 block">Search</label>
              <Input
                placeholder="Combo, god, race, class..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="bg-secondary/50 h-9 text-sm"
              />
            </div>
            <div className="w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Player</label>
              <Input
                placeholder="Player name..."
                value={filters.player}
                onChange={(e) => setFilters({ ...filters, player: e.target.value })}
                className="bg-secondary/50 h-9 text-sm"
              />
            </div>
            <div className="w-[180px]">
              <label className="text-xs text-muted-foreground mb-1 block">Species</label>
              <Select
                value={filters.species}
                onValueChange={(v) => setFilters({ ...filters, species: v })}
              >
                <SelectTrigger className="bg-secondary/50 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  {uniqueSpecies.map((sp) => (
                    <SelectItem
                      key={sp.code}
                      value={sp.code}
                      className={sp.isRemoved ? "text-muted-foreground" : ""}
                    >
                      {sp.name} ({sp.code}){sp.isRemoved && " ⚰️"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <label className="text-xs text-muted-foreground mb-1 block">Background</label>
              <Select
                value={filters.background}
                onValueChange={(v) => setFilters({ ...filters, background: v })}
              >
                <SelectTrigger className="bg-secondary/50 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Backgrounds</SelectItem>
                  {uniqueBackgrounds.map((bg) => (
                    <SelectItem
                      key={bg.code}
                      value={bg.code}
                      className={bg.isRemoved ? "text-muted-foreground" : ""}
                    >
                      {bg.name} ({bg.code}){bg.isRemoved && " ⚰️"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.hideLegacy}
                  onChange={(e) => setFilters({ ...filters, hideLegacy: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-secondary accent-health"
                />
                <span className="text-muted-foreground">
                  Hide legacy ({legacyCount})
                </span>
              </label>
            </div>
          </div>
              </div>
            </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
                <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="cursor-pointer hover:text-foreground w-[70px]"
                  onClick={() => handleSort("score" as SortField)}
                >
                  Score
                  <SortIcon active={isSortedBy("score" as SortField)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("character" as SortField)}
                >
                  Combo
                  <SortIcon active={isSortedBy("character" as SortField)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("player" as SortField)}
                >
                  Player
                  <SortIcon active={isSortedBy("player" as SortField)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("runes" as SortField)}
                >
                  Runes
                  <SortIcon active={isSortedBy("runes" as SortField)} direction={sortDir} />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("turns" as SortField)}
                >
                        Turns
                  <SortIcon active={isSortedBy("turns" as SortField)} direction={sortDir} />
                      </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("god" as SortField)}
                >
                  God
                  <SortIcon active={isSortedBy("god" as SortField)} direction={sortDir} />
                      </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("date" as SortField)}
                >
                        Date
                  <SortIcon active={isSortedBy("date" as SortField)} direction={sortDir} />
                      </TableHead>
                <TableHead className="w-[60px]">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
              {sortedData.map((record) => {
                const isLegacy = isRecordLegacy(
                  record.species,
                  record.background,
                  data.legacyConfig,
                  record.version
                );
                const ageDays = daysSince(record.date);
                const ageYears = (ageDays / 365).toFixed(1);

                return (
                  <TableRow
                    key={`${record.character}-${record.rank}`}
                    className={`hover:bg-secondary/30 ${isLegacy ? "opacity-60" : ""}`}
                  >
                    <TableCell className="font-mono text-gold">
                      {(record.score / 1000000).toFixed(1)}M
                        </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {record.morgueUrl ? (
                          <Link
                            href={`/morgue?url=${encodeURIComponent(record.morgueUrl)}`}
                            className="font-mono text-health hover:underline inline-flex items-center gap-1"
                          >
                            {record.character}
                          </Link>
                        ) : (
                          <span className="font-mono text-health">{record.character}</span>
                        )}
                        {isLegacy && (
                          <span title="Legacy combo (removed species, background, or restricted combination)">
                            <Ghost className="w-3 h-3 text-special" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getSpeciesName(record.species, data.legacyConfig, record.version)}{" "}
                        {getBackgroundName(record.background, data.legacyConfig, record.version)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.playerUrl ? (
                        <Link
                          href={`/player?url=${encodeURIComponent(record.playerUrl)}`}
                          className="text-mana hover:underline"
                        >
                          {record.player}
                        </Link>
                      ) : (
                        <span className="text-mana">{record.player}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRunesBadgeClass(record.runes)}>
                        {record.runes}
                          </Badge>
                        </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {record.turns.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[140px] truncate">
                      {record.god || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{formatDate(record.date)}</div>
                      <div className={`text-xs ${getAgeClass(ageDays)}`}>{ageYears}y ago</div>
                        </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{record.version}</TableCell>
                      </TableRow>
                );
              })}
                  </TableBody>
                </Table>
              </div>
        {sortedData.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No records match your filters.
          </div>
        )}
            </CardContent>
          </Card>
  );
}
