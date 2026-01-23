"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2, Trophy, Calendar } from "lucide-react";

interface ServiceData {
  streakGamesCount: number | null;
  comboRecordsLastUpdated: string | null;
  loading: boolean;
  error: string | null;
}

export function ServiceStats() {
  const [data, setData] = useState<ServiceData>({
    streakGamesCount: null,
    comboRecordsLastUpdated: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch streak games count from analytics API
        const [analyticsRes, comboRecordsRes] = await Promise.all([
          fetch("/api/analytics?limit=0"),
          fetch("/data/combo-records.json"),
        ]);

        let streakGamesCount: number | null = null;
        let comboRecordsLastUpdated: string | null = null;

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          streakGamesCount = analyticsData.totalGamesCount ?? null;
        }

        if (comboRecordsRes.ok) {
          const comboData = await comboRecordsRes.json();
          // Get the most recent date from the records
          if (comboData.records && comboData.records.length > 0) {
            const dates = comboData.records
              .map((r: { date?: string }) => r.date)
              .filter(Boolean)
              .sort()
              .reverse();
            if (dates.length > 0) {
              comboRecordsLastUpdated = dates[0];
            }
          }
        }

        setData({
          streakGamesCount,
          comboRecordsLastUpdated,
          loading: false,
          error: null,
        });
      } catch (err) {
        setData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load service stats",
        }));
      }
    }

    fetchStats();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Database className="w-5 h-5 text-health" />
          Service Information
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        {data.loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.error ? (
          <p className="text-sm text-muted-foreground text-center py-4">{data.error}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Streak Games Count */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-gold" />
                <h3 className="font-medium text-foreground">Streak Games</h3>
              </div>
              <p className="text-2xl font-bold text-primary">
                {data.streakGamesCount !== null ? formatNumber(data.streakGamesCount) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total games from verified winning streaks
              </p>
            </div>

            {/* Combo Records Last Updated */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-mana" />
                <h3 className="font-medium text-foreground">Combo Records</h3>
              </div>
              <p className="text-2xl font-bold text-primary">
                {data.comboRecordsLastUpdated ? formatDate(data.comboRecordsLastUpdated) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Most recent record date</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
