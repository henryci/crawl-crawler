"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Database, Loader2 } from "lucide-react";

interface ServiceData {
  streakGamesCount: number | null;
  streakDownloadDate: string | null;
  comboRecordsDownloadDate: string | null;
  loading: boolean;
  error: string | null;
}

export function ServiceStats() {
  const [data, setData] = useState<ServiceData>({
    streakGamesCount: null,
    streakDownloadDate: null,
    comboRecordsDownloadDate: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/service-metadata");

        if (!response.ok) {
          throw new Error("Failed to fetch service metadata");
        }

        const result = await response.json();

        setData({
          streakGamesCount: result.totalGamesCount ?? null,
          streakDownloadDate: result.metadata?.streak_download_date?.value ?? null,
          comboRecordsDownloadDate: result.metadata?.combo_records_download_date?.value ?? null,
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
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <Card className="bg-card border-border mb-6 py-0 gap-0">
      <div className="border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 text-base font-semibold">
          <Database className="w-4 h-4 text-health" />
          Service Information
        </div>
      </div>
      <div className="px-4 py-2">
        {data.loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : data.error ? (
          <p className="text-sm text-muted-foreground">{data.error}</p>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-sm text-center">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Streak Games</p>
              <p className="text-foreground font-medium">
                {data.streakGamesCount !== null ? formatNumber(data.streakGamesCount) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Streaks Updated</p>
              <p className="text-foreground font-medium">
                {data.streakDownloadDate ? formatDate(data.streakDownloadDate) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Combo Records Updated</p>
              <p className="text-foreground font-medium">
                {data.comboRecordsDownloadDate ? formatDate(data.comboRecordsDownloadDate) : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
