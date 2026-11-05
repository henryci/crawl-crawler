"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, Shapes, CircleOff, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EquipmentResult, EquipmentSlot, ResistRow } from "@/app/api/analytics/equipment/route";

interface EquipmentPanelProps {
  queryString: string;
}

/**
 * What the filtered games were wearing when they ended: the off-hand split,
 * the most common item in each slot, and the resistance totals reached.
 */
export function EquipmentPanel({ queryString }: EquipmentPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EquipmentResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analytics/equipment?${queryString}`);
        if (!response.ok) throw new Error("Failed to load equipment data");
        const json: EquipmentResult = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-mana" />
          <p className="mt-4 text-muted-foreground">Loading equipment data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.totalGames === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center text-muted-foreground">
          {error ?? "No equipment data for the current filters."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <OffhandCard data={data} />
        <ResistsCard data={data} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.slots.map((slot) => (
          <SlotCard key={slot.slot} slot={slot} totalGames={data.totalGames} />
        ))}
      </div>
    </div>
  );
}

function pct(n: number, of: number): number {
  return of > 0 ? Math.round((n / of) * 100) : 0;
}

function OffhandCard({ data }: { data: EquipmentResult }) {
  const { shield, orb, none } = data.offhand;
  const total = shield + orb + none;
  const segments = [
    { label: "Shield", value: shield, icon: Shield, color: "bg-mana", text: "text-mana" },
    { label: "Orb", value: orb, icon: Shapes, color: "bg-gold", text: "text-gold" },
    { label: "Empty", value: none, icon: CircleOff, color: "bg-secondary", text: "text-muted-foreground" },
  ];
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Off-hand at the end</CardTitle>
        <p className="text-xs text-muted-foreground">
          Across {data.totalGames.toLocaleString()} games. Orbs were added in 0.30.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary/30">
          {segments.map((s) => (
            <div
              key={s.label}
              className={`${s.color} h-3`}
              style={{ width: `${pct(s.value, total)}%` }}
              title={`${s.label}: ${pct(s.value, total)}%`}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {segments.map((s) => (
            <div key={s.label} className="rounded-md border border-border bg-secondary/20 px-3 py-2">
              <div className={`flex items-center gap-1.5 text-xs ${s.text}`}>
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-foreground">
                {pct(s.value, total)}%
              </div>
              <div className="text-xs text-muted-foreground">{s.value.toLocaleString()} games</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const LEVEL_LABELS: Record<1 | 2 | 3, string> = { 1: "+", 2: "++", 3: "+++" };

function ResistsCard({ data }: { data: EquipmentResult }) {
  const { games, rows } = data.resists;
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-mana" />
          Resistances at the end
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Share of games finishing at or above each level. Totals are recorded from 0.28 onward
          {games > 0 ? ` (${games.toLocaleString()} games here)` : ""}; see invisible from 0.31.
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No resistance totals for these games.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-1 text-left font-medium">Property</th>
                {([1, 2, 3] as const).map((level) => (
                  <th key={level} className="py-1 text-right font-mono font-medium">
                    {LEVEL_LABELS[level]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ResistTableRow key={row.prop} row={row} />
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

/** Properties that only have one level; higher columns are shown blank. */
const SINGLE_LEVEL_PROPS = new Set(["rPois", "rElec", "rCorr", "SInv"]);

function ResistTableRow({ row }: { row: ResistRow }) {
  const single = SINGLE_LEVEL_PROPS.has(row.prop);
  return (
    <tr className="border-t border-border/50">
      <td className="py-1.5">
        <span className="font-mono text-foreground">{row.prop}</span>
        <span className="ml-2 text-xs text-muted-foreground">{row.label}</span>
      </td>
      {([1, 2, 3] as const).map((level) => (
        <td key={level} className="py-1.5 text-right font-mono">
          {single && level > 1 ? (
            <span className="text-muted-foreground/40">—</span>
          ) : (
            <span className={row.atLeast[level] >= 75 ? "text-mana" : "text-foreground"}>
              {row.atLeast[level]}%
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}

function SlotCard({ slot, totalGames }: { slot: EquipmentSlot; totalGames: number }) {
  const top = slot.items[0];
  return (
    <Card className="bg-card border-border py-4 gap-3">
      <CardHeader className="pb-0">
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="text-base">{slot.label}</CardTitle>
          <span className="text-xs text-muted-foreground">
            filled in <span className="font-mono text-foreground">{pct(slot.filled, totalGames)}%</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {slot.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing recorded in this slot.</p>
        ) : (
          <ul className="space-y-1.5">
            {slot.items.map((item) => (
              <li key={item.name} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-foreground">{item.name}</span>
                  <span className="shrink-0 font-mono text-xs text-mana">{item.pct}%</span>
                </div>
                <div className="mt-0.5 h-1.5 w-full rounded-full bg-secondary/30">
                  <div
                    className="h-1.5 rounded-full bg-mana/70"
                    style={{ width: `${top ? Math.min(100, (item.games / top.games) * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
