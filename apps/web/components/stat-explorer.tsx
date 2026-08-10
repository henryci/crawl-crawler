"use client";

/**
 * Stat Trade-off Explorer.
 *
 * The equipment view answers "which items should I wear for objective
 * X?". This view answers the question that comes before it: "what
 * combinations of my priorities and Str/Int/Dex can my inventory even
 * reach, and what does one cost in terms of the others?"
 *
 * It renders a multi-dimensional Pareto frontier computed by the
 * optimizer worker. The dimensions are the user's non-stat objective
 * tiers (e.g. "Total Elemental Resistances") plus Str/Int/Dex; every
 * table row is a combination no legal loadout beats outright.
 *
 * Objective rows come first and their sliders DEFAULT TO THE BEST
 * REACHABLE VALUE (ladder order), so combinations that would sacrifice
 * the user's priorities start dimmed — demanding stats never silently
 * costs resistances. Lowering an objective slider is the explicit way
 * to trade it away. Stat sliders start unconstrained and mirror the
 * shared Str/Int/Dex floors from the Equipment view; objective
 * minimums are view-only filters (every row already carries the
 * maximum objective value achievable for its stats, so equipping a row
 * reproduces its objective value without extra constraints).
 */

import { useMemo } from "react";
import type { ParsedItem } from "dcss-morgue-parser";
import type { ContributionMap, PropertyKey } from "dcss-game-data";
import type { FrontierPoint } from "dcss-loadout-optimizer";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanItemName } from "@/lib/item-name";

export const STAT_PROPS = ["Str", "Int", "Dex"] as const;
export type StatProp = (typeof STAT_PROPS)[number];

/** One dimension of the frontier, as constructed by the panel. */
export interface ExplorerDim {
  /** Stable identity: props joined with '+'. */
  key: string;
  /** Full name for tooltips ("Total Elemental Resistances"). */
  label: string;
  /** Compact name for row labels and column headers ("Resists"). */
  short: string;
  props: PropertyKey[];
  kind: "objective" | "stat";
}

/** A frontier result paired with the dims it was computed under. */
export interface FrontierView {
  points: FrontierPoint[];
  loadoutsEvaluated: number;
  dims: ExplorerDim[];
}

interface DimStyle {
  label: string;
  accent: string;
}

const STAT_STYLE: Record<StatProp, DimStyle> = {
  Str: { label: "text-rose-400", accent: "accent-rose-500" },
  Int: { label: "text-sky-400", accent: "accent-sky-500" },
  Dex: { label: "text-emerald-400", accent: "accent-emerald-500" },
};

const OBJECTIVE_STYLE: DimStyle = {
  label: "text-amber-400",
  accent: "accent-amber-500",
};

function dimStyle(dim: ExplorerDim): DimStyle {
  if (dim.kind === "stat") {
    return STAT_STYLE[dim.props[0] as StatProp] ?? OBJECTIVE_STYLE;
  }
  return OBJECTIVE_STYLE;
}

/** Sort key for the Σstats column (any dim key is also a valid sort key). */
export const STATS_TOTAL_SORT_KEY = "__stats_total__";

export interface StatExplorerProps {
  frontier: FrontierView | null;
  /** True while the worker is (re)computing the frontier. */
  pending: boolean;
  /** True while an optimize (equip) request is in flight. */
  optimizePending: boolean;
  /**
   * Whether frontier stat values are absolute (base stats known from
   * the morgue) or equipment-only bonuses.
   */
  hasAbsoluteStats: boolean;
  /** Current per-stat minimums (mirrors the shared Str/Int/Dex floors). */
  statFloors: Partial<Record<StatProp, number>>;
  /** value === null clears the stat's minimum. */
  onStatFloorChange: (prop: StatProp, value: number | null) => void;
  onResetStatFloors: () => void;
  /** Equip a frontier point: pins its stat values as floors and optimizes. */
  onApplyPoint: (point: FrontierPoint) => void;
  /** The current loadout's capped totals, for "now" markers and deltas. */
  currentTotals: ContributionMap | null;
  /** Non-stat floors the frontier was computed under (e.g. rF ≥ 2). */
  honoredFloors: [PropertyKey, number][];
  /** Ids of locked/talisman items included in every combination. */
  pinnedIds: ReadonlySet<string>;
  frontierElapsedMs: number | null;
  /**
   * User-moved objective minimums, keyed by dim key — overrides on top
   * of the ladder-max defaults. Hoisted to the panel so a view toggle
   * (which unmounts this component) doesn't silently reset them. Dims
   * that disappear (priorities changed) are simply ignored.
   */
  objMinOverrides: Record<string, number>;
  onObjMinOverridesChange: (next: Record<string, number>) => void;
  /** Table sort, hoisted for the same reason. */
  sortKey: string;
  onSortKeyChange: (key: string) => void;
}

export function StatExplorer({
  frontier,
  pending,
  optimizePending,
  hasAbsoluteStats,
  statFloors,
  onStatFloorChange,
  onResetStatFloors,
  onApplyPoint,
  currentTotals,
  honoredFloors,
  pinnedIds,
  frontierElapsedMs,
  objMinOverrides,
  onObjMinOverridesChange,
  sortKey,
  onSortKeyChange,
}: StatExplorerProps) {
  const points = frontier?.points ?? [];
  const dims = frontier?.dims ?? [];

  // Per-dim achievable range across the whole frontier.
  const bounds = useMemo(
    () =>
      dims.map((_, i) => {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (const p of points) {
          const v = p.values[i] ?? 0;
          if (v < min) min = v;
          if (v > max) max = v;
        }
        return points.length > 0 ? { min, max } : { min: 0, max: 0 };
      }),
    [dims, points],
  );

  // Effective minimum per dim.
  //
  //   - Objective dims default to the LADDER MAX: the best value
  //     reachable given the minimums already fixed for earlier
  //     objective dims. This is what "priorities dominate" means — the
  //     explorer starts from the loadouts that don't sacrifice them.
  //   - Stat dims default to their range minimum (unconstrained) and
  //     read the shared floors.
  const effectiveMins = useMemo(() => {
    const mins = new Array<number>(dims.length).fill(0);
    // Fix objective dims first, in dim order, narrowing the pool.
    let pool = points;
    dims.forEach((dim, i) => {
      if (dim.kind !== "objective") return;
      const { min, max } = bounds[i]!;
      const override = objMinOverrides[dim.key];
      let value: number;
      if (override !== undefined) {
        value = Math.min(Math.max(override, min), max);
      } else {
        value = pool.length
          ? pool.reduce((best, p) => Math.max(best, p.values[i] ?? 0), min)
          : min;
      }
      mins[i] = value;
      pool = pool.filter((p) => (p.values[i] ?? 0) >= value);
    });
    dims.forEach((dim, i) => {
      if (dim.kind !== "stat") return;
      const { min } = bounds[i]!;
      const raw = statFloors[dim.props[0] as StatProp];
      // Deliberately NOT clamped to the range max: a floor above what
      // the inventory can reach must read as infeasible here, because
      // the optimizer will enforce the real value. Clamping would show
      // feasible rows while Optimize fails.
      mins[i] = raw === undefined ? min : Math.max(raw, min);
    });
    return mins;
  }, [dims, points, bounds, objMinOverrides, statFloors]);

  const meetsMins = useMemo(
    () => (point: FrontierPoint) =>
      effectiveMins.every((min, i) => (point.values[i] ?? 0) >= min),
    [effectiveMins],
  );

  // For each dim: the best value reachable among points that satisfy
  // every OTHER dim's minimum — the number that answers "how high can
  // this go, given what I've demanded of the rest?".
  const reachable = useMemo(
    () =>
      dims.map((_, i) => {
        let best: number | null = null;
        for (const p of points) {
          const ok = effectiveMins.every(
            (min, j) => j === i || (p.values[j] ?? 0) >= min,
          );
          if (!ok) continue;
          const v = p.values[i] ?? 0;
          if (best === null || v > best) best = v;
        }
        return best;
      }),
    [dims, points, effectiveMins],
  );

  const statDimIndices = useMemo(
    () =>
      dims
        .map((d, i) => (d.kind === "stat" ? i : -1))
        .filter((i) => i !== -1),
    [dims],
  );
  const statsTotal = (p: FrontierPoint) =>
    statDimIndices.reduce((n, i) => n + (p.values[i] ?? 0), 0);

  const sortedPoints = useMemo(() => {
    const keyIndex = dims.findIndex((d) => d.key === sortKey);
    const valueOf = (p: FrontierPoint) =>
      keyIndex === -1 ? statsTotal(p) : (p.values[keyIndex] ?? 0);
    return [...points].sort((a, b) => {
      const diff = valueOf(b) - valueOf(a);
      if (diff !== 0) return diff;
      const totalDiff = statsTotal(b) - statsTotal(a);
      if (totalDiff !== 0) return totalDiff;
      for (let i = 0; i < a.values.length; i++) {
        if (a.values[i] !== b.values[i]) return (b.values[i] ?? 0) - (a.values[i] ?? 0);
      }
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, dims, sortKey, statDimIndices]);

  const anyFeasible = sortedPoints.some(meetsMins);
  const hasObjectiveDims = dims.some((d) => d.kind === "objective");
  // "Reset" is offered when the user moved anything off its default.
  const hasAdjustments =
    STAT_PROPS.some((p) => statFloors[p] !== undefined) ||
    Object.keys(objMinOverrides).length > 0;

  const fmt = (dim: ExplorerDim, v: number) =>
    dim.kind === "stat" && !hasAbsoluteStats && v >= 0 ? `+${v}` : String(v);

  const currentValueFor = (dim: ExplorerDim): number | null => {
    if (!currentTotals) return null;
    return dim.props.reduce((n, p) => n + (currentTotals[p] ?? 0), 0);
  };

  const handleMinChange = (dim: ExplorerDim, i: number, value: number) => {
    if (dim.kind === "stat") {
      onStatFloorChange(
        dim.props[0] as StatProp,
        value <= bounds[i]!.min ? null : value,
      );
    } else {
      onObjMinOverridesChange({ ...objMinOverrides, [dim.key]: value });
    }
  };

  const handleReset = () => {
    onObjMinOverridesChange({});
    onResetStatFloors();
  };

  // Equips must not fire from a stale table: while a recompute is in
  // flight the rows may reference banned items or miss fresh locks.
  const applyDisabled = optimizePending || pending;

  return (
    <Card className="bg-card border-border py-3 gap-2">
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Stat Trade-offs
          </span>
          <div className="flex items-center gap-2">
            {pending && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                mapping combinations…
              </span>
            )}
            {hasAdjustments && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                title="Clear stat minimums and restore objective rows to their best reachable values"
              >
                <RotateCcw className="w-3 h-3" />
                reset minimums
              </button>
            )}
          </div>
        </div>

        {!frontier ? (
          <div className="text-sm text-muted-foreground italic py-8 text-center">
            {pending
              ? "Enumerating every legal loadout to map your options…"
              : "Waiting for inventory data…"}
          </div>
        ) : points.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No legal loadout satisfies the current constraints — relax a
            &quot;require at least&quot; entry and the explorer will recompute.
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground leading-snug">
              Every row below is a combination nothing else in your inventory
              beats — gaining one number past it means giving up another.
              {hasObjectiveDims && (
                <>
                  {" "}
                  Your objective rows start at the best value they can reach,
                  so combinations that would sacrifice them start dimmed;
                  lower those sliders to trade them away deliberately.
                </>
              )}
            </div>

            <div className="space-y-2">
              {dims.map((dim, i) => (
                <SliderRow
                  key={dim.key}
                  dim={dim}
                  min={bounds[i]!.min}
                  max={bounds[i]!.max}
                  value={effectiveMins[i]!}
                  reachable={reachable[i] ?? null}
                  current={currentValueFor(dim)}
                  fmt={(v) => fmt(dim, v)}
                  onChange={(v) => handleMinChange(dim, i, v)}
                />
              ))}
            </div>

            {!anyFeasible && (
              <div className="rounded border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                No combination reaches every minimum at once. Lower a slider,
                or click a row below to jump straight to it.
              </div>
            )}

            <FrontierTable
              points={sortedPoints}
              dims={dims}
              meetsMins={meetsMins}
              statsTotal={statsTotal}
              currentTotals={currentTotals}
              sortKey={sortKey}
              onSortKeyChange={onSortKeyChange}
              onApplyPoint={onApplyPoint}
              optimizePending={applyDisabled}
              pinnedIds={pinnedIds}
              fmt={fmt}
            />

            <ExplorerFootnotes
              honoredFloors={honoredFloors}
              pinnedCount={pinnedIds.size}
              hasAbsoluteStats={hasAbsoluteStats}
              evaluated={frontier.loadoutsEvaluated}
              elapsedMs={frontierElapsedMs}
              pointCount={points.length}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Slider row: one dimension's minimum + live "up to" readout
// ────────────────────────────────────────────────────────────────────────

function SliderRow({
  dim,
  min,
  max,
  value,
  reachable,
  current,
  fmt,
  onChange,
}: {
  dim: ExplorerDim;
  min: number;
  max: number;
  value: number;
  reachable: number | null;
  current: number | null;
  fmt: (v: number) => string;
  onChange: (value: number) => void;
}) {
  const style = dimStyle(dim);
  const constrained = value > min;
  const fixed = min === max;
  // A shared floor can sit above what the inventory reaches; show it
  // honestly (red, real value) rather than clamping it down — the
  // optimizer will enforce the real number.
  const overMax = value > max;
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn("font-mono text-sm w-16 shrink-0 truncate", style.label)}
        title={
          dim.kind === "objective"
            ? `${dim.label} — an objective from your Maximize list. Starts at the best reachable value; lower it to trade it for stats.`
            : dim.label
        }
      >
        {dim.short}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={Math.min(value, max)}
        disabled={fixed}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={`Minimum ${dim.label}`}
        className={cn(
          "flex-1 h-1.5 cursor-pointer disabled:cursor-default",
          style.accent,
        )}
      />
      <span
        className={cn(
          "font-mono text-xs w-14 shrink-0",
          overMax
            ? "text-red-400"
            : constrained
              ? "text-foreground"
              : "text-muted-foreground/60",
        )}
        title={
          overMax
            ? `This "require at least" minimum is above the best ${dim.short} your inventory can reach (${fmt(max)}) — no combination satisfies it, and Optimize will refuse to change the loadout. Lower the constraint.`
            : constrained
              ? `Only combinations with ${dim.short} ≥ ${fmt(value)} count as feasible`
              : `No minimum set for ${dim.short}`
        }
      >
        {constrained ? `≥ ${fmt(value)}` : "any"}
      </span>
      <span
        className="font-mono text-xs w-24 shrink-0 text-right"
        title={`Best ${dim.short} among combinations meeting the other minimums${
          current !== null ? ` (current loadout: ${fmt(current)})` : ""
        }`}
      >
        {fixed ? (
          <span className="text-muted-foreground/60">fixed {fmt(min)}</span>
        ) : reachable === null ? (
          <span className="text-red-400">unreachable</span>
        ) : (
          <>
            <span className="text-muted-foreground">up to </span>
            <span className={style.label}>{fmt(reachable)}</span>
          </>
        )}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Frontier table: every Pareto-optimal combination
// ────────────────────────────────────────────────────────────────────────

function FrontierTable({
  points,
  dims,
  meetsMins,
  statsTotal,
  currentTotals,
  sortKey,
  onSortKeyChange,
  onApplyPoint,
  optimizePending,
  pinnedIds,
  fmt,
}: {
  points: FrontierPoint[];
  dims: ExplorerDim[];
  meetsMins: (point: FrontierPoint) => boolean;
  statsTotal: (point: FrontierPoint) => number;
  currentTotals: ContributionMap | null;
  sortKey: string;
  onSortKeyChange: (key: string) => void;
  onApplyPoint: (point: FrontierPoint) => void;
  optimizePending: boolean;
  pinnedIds: ReadonlySet<string>;
  fmt: (dim: ExplorerDim, v: number) => string;
}) {
  const gridTemplateColumns = `repeat(${dims.length}, minmax(2.9rem, auto)) 3.5rem minmax(0, 1fr) 4rem`;

  const headerButton = (key: string, label: string, className?: string) => (
    <button
      key={key}
      type="button"
      onClick={() => onSortKeyChange(key)}
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider text-left hover:text-foreground transition-colors",
        sortKey === key ? "text-foreground" : "text-muted-foreground",
        className,
      )}
      title={`Sort by ${label}`}
    >
      {label}
      {sortKey === key ? " ↓" : ""}
    </button>
  );

  const currentDimValues = currentTotals
    ? dims.map((d) => d.props.reduce((n, p) => n + (currentTotals[p] ?? 0), 0))
    : null;

  return (
    <div className="border border-border rounded overflow-hidden">
      <div
        className="grid items-center gap-2 px-3 py-1.5 bg-secondary/30 border-b border-border"
        style={{ gridTemplateColumns }}
      >
        {dims.map((d) => headerButton(d.key, d.short, dimStyle(d).label))}
        {headerButton(STATS_TOTAL_SORT_KEY, "Σstats")}
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Gear
        </span>
        <span />
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
        {points.map((point, idx) => {
          const feasible = meetsMins(point);
          const isCurrent =
            currentDimValues !== null &&
            dims.every((_, i) => (point.values[i] ?? 0) === currentDimValues[i]);
          return (
            <FrontierRow
              key={idx}
              point={point}
              dims={dims}
              gridTemplateColumns={gridTemplateColumns}
              feasible={feasible}
              isCurrent={isCurrent}
              statsTotal={statsTotal(point)}
              currentDimValues={currentDimValues}
              onApply={() => onApplyPoint(point)}
              optimizePending={optimizePending}
              pinnedIds={pinnedIds}
              fmt={fmt}
            />
          );
        })}
      </div>
    </div>
  );
}

function FrontierRow({
  point,
  dims,
  gridTemplateColumns,
  feasible,
  isCurrent,
  statsTotal,
  currentDimValues,
  onApply,
  optimizePending,
  pinnedIds,
  fmt,
}: {
  point: FrontierPoint;
  dims: ExplorerDim[];
  gridTemplateColumns: string;
  feasible: boolean;
  isCurrent: boolean;
  statsTotal: number;
  currentDimValues: number[] | null;
  onApply: () => void;
  optimizePending: boolean;
  pinnedIds: ReadonlySet<string>;
  fmt: (dim: ExplorerDim, v: number) => string;
}) {
  const gear = point.items.filter((i) => !pinnedIds.has(i.id));
  return (
    <div
      className={cn(
        "grid items-center gap-2 px-3 py-2 transition-colors",
        feasible ? "hover:bg-secondary/30" : "opacity-40 hover:opacity-70",
        isCurrent && "bg-amber-950/20",
      )}
      style={{ gridTemplateColumns }}
      title={
        feasible
          ? undefined
          : "Outside the current minimums — equipping it moves the sliders here"
      }
    >
      {dims.map((dim, i) => (
        <DimCell
          key={dim.key}
          dim={dim}
          value={point.values[i] ?? 0}
          current={currentDimValues?.[i] ?? null}
          fmt={fmt}
        />
      ))}
      <span className="font-mono text-sm text-foreground tabular-nums">
        {statsTotal}
        {isCurrent && (
          <span
            className="ml-1 text-[9px] uppercase tracking-wider text-amber-400"
            title="Your current loadout reaches exactly this combination"
          >
            now
          </span>
        )}
      </span>
      <GearSummary gear={gear} />
      <button
        type="button"
        onClick={onApply}
        disabled={optimizePending}
        className="font-mono text-[11px] px-2 py-1 rounded border border-amber-600/50 text-amber-300 hover:bg-amber-950/40 hover:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Pin this combination's stats as minimums and optimize the full loadout for it"
      >
        equip
      </button>
    </div>
  );
}

/**
 * One dimension's value in a row, with a tiny delta vs the current
 * loadout so the cost/gain of switching is visible at a glance.
 */
function DimCell({
  dim,
  value,
  current,
  fmt,
}: {
  dim: ExplorerDim;
  value: number;
  current: number | null;
  fmt: (dim: ExplorerDim, v: number) => string;
}) {
  const delta = current === null ? null : value - current;
  return (
    <span className="font-mono text-sm tabular-nums">
      <span className={dimStyle(dim).label}>{fmt(dim, value)}</span>
      {delta !== null && delta !== 0 && (
        <span
          className={cn(
            "ml-1 text-[9px]",
            delta > 0 ? "text-green-400/90" : "text-red-400/90",
          )}
          title={`${delta > 0 ? "+" : ""}${delta} vs your current loadout`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </span>
  );
}

function GearSummary({ gear }: { gear: ParsedItem[] }) {
  if (gear.length === 0) {
    return (
      <span className="text-[11px] text-muted-foreground/60 italic">
        no gear needed
      </span>
    );
  }
  const names = gear.map((i) => cleanItemName(i.rawText));
  return (
    <div className="min-w-0" title={names.join("\n")}>
      {names.slice(0, 3).map((name, i) => (
        <div
          key={i}
          className="font-mono text-[11px] text-muted-foreground truncate leading-snug"
        >
          {name}
        </div>
      ))}
      {names.length > 3 && (
        <div className="text-[10px] text-muted-foreground/60">
          +{names.length - 3} more
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Footnotes
// ────────────────────────────────────────────────────────────────────────

function ExplorerFootnotes({
  honoredFloors,
  pinnedCount,
  hasAbsoluteStats,
  evaluated,
  elapsedMs,
  pointCount,
}: {
  honoredFloors: [PropertyKey, number][];
  pinnedCount: number;
  hasAbsoluteStats: boolean;
  evaluated: number;
  elapsedMs: number | null;
  pointCount: number;
}) {
  return (
    <div className="space-y-1 text-[10px] text-muted-foreground border-t border-border pt-2">
      {honoredFloors.length > 0 && (
        <div>
          Honoring:{" "}
          <span className="font-mono">
            {honoredFloors.map(([prop, v]) => `${prop} ≥ ${v}`).join(" · ")}
          </span>{" "}
          — every combination shown satisfies these.
        </div>
      )}
      {pinnedCount > 0 && (
        <div>
          {pinnedCount} locked/talisman item{pinnedCount === 1 ? "" : "s"} stay
          equipped in every combination.
        </div>
      )}
      {!hasAbsoluteStats && (
        <div className="italic">
          Base stats weren&apos;t found in this morgue, so stat values are
          equipment bonuses (+N), not final stats.
        </div>
      )}
      <div className="italic">
        Bans, locks, and tag edits from the Equipment view apply here too.
      </div>
      <div className="font-mono">
        {pointCount} distinct option{pointCount === 1 ? "" : "s"} ·{" "}
        {evaluated.toLocaleString()} loadouts mapped
        {elapsedMs !== null ? ` · ${Math.round(elapsedMs)}ms` : ""}
      </div>
    </div>
  );
}
