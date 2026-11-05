import type { CSSProperties, ReactNode } from "react";

/**
 * Small, static charts for blog posts. Server-rendered HTML with the data
 * baked in, so a post never shows a loading state and reads the same in a
 * feed reader. Colours are the site's palette, stepped for the dark card
 * surface and validated for colour-vision deficiency (blue vs gold passes;
 * blue vs purple does not, so posts never pair those two).
 */

const VIZ_STYLE: CSSProperties = {
  // Series 1: the site's mana blue. Series 2: the site's gold, stepped
  // darker into the dark-surface lightness band. Light: a lighter step of
  // series 1 for ordinal "at least" ramps. Muted: the remainder segment.
  ["--viz-1" as string]: "#009ed8",
  ["--viz-1-light" as string]: "#2f6a85",
  ["--viz-2" as string]: "#ba8900",
  ["--viz-muted" as string]: "#474e53",
};

type SeriesColor = "1" | "1-light" | "2" | "muted";

function fill(color: SeriesColor): string {
  return `var(--viz-${color})`;
}

interface FigureProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Table twin of the chart, rendered inside a disclosure. */
  table: ReactNode;
}

function Figure({ title, subtitle, children, table }: FigureProps) {
  return (
    <figure
      style={VIZ_STYLE}
      className="my-6 rounded-lg border border-border bg-card px-4 py-4 sm:px-5"
    >
      <figcaption className="mb-3">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
      </figcaption>
      {children}
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none hover:text-foreground">Show as table</summary>
        <div className="mt-2 overflow-x-auto">{table}</div>
      </details>
    </figure>
  );
}

function Legend({ items }: { items: { label: string; color: SeriesColor }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: fill(item.color) }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th
              key={h}
              className={`border-b border-border py-1 pr-3 font-medium text-muted-foreground ${i === 0 ? "text-left" : "text-right"}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={String(r[0])}>
            {r.map((c, i) => (
              <td
                key={i}
                className={`border-b border-border/40 py-1 pr-3 ${i === 0 ? "text-left text-foreground" : "text-right font-mono tabular-nums"}`}
              >
                {typeof c === "number" ? `${c}%` : c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const BAR_H = 14;

// ─────────────────────────────────────────────────────────────────────
// Part-to-whole: one stacked bar per row (e.g. shield / orb / empty)
// ─────────────────────────────────────────────────────────────────────

export interface ShareRow {
  label: string;
  /** Percentages in series order; they should sum to about 100. */
  parts: number[];
}

interface ShareBarChartProps {
  title: string;
  subtitle?: string;
  series: string[];
  rows: ShareRow[];
}

const SHARE_COLORS: SeriesColor[] = ["1", "2", "muted"];

/** Horizontal 100% stacked bars. The first series is the story and gets the tip label. */
export function ShareBarChart({ title, subtitle, series, rows }: ShareBarChartProps) {
  return (
    <Figure
      title={title}
      subtitle={subtitle}
      table={
        <DataTable head={["", ...series]} rows={rows.map((r) => [r.label, ...r.parts])} />
      }
    >
      <Legend items={series.map((s, i) => ({ label: s, color: SHARE_COLORS[i] ?? "muted" }))} />
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-xs">
            <span className="truncate text-foreground">{row.label}</span>
            <div className="flex w-full" style={{ height: BAR_H }}>
              {row.parts.map((p, i) => (
                <div
                  key={series[i]}
                  title={`${row.label}: ${series[i]} ${p}%`}
                  className={i === row.parts.length - 1 ? "rounded-r" : ""}
                  style={{
                    width: `${p}%`,
                    background: fill(SHARE_COLORS[i] ?? "muted"),
                    marginRight: i < row.parts.length - 1 ? 2 : 0,
                  }}
                />
              ))}
            </div>
            <span className="text-right font-mono tabular-nums text-muted-foreground">{row.parts[0]}%</span>
          </div>
        ))}
      </div>
    </Figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Magnitude: one series, horizontal bars, value at the tip
// ─────────────────────────────────────────────────────────────────────

export interface BarItem {
  label: string;
  value: number;
}

interface BarListProps {
  items: BarItem[];
  /** Scale maximum; defaults to the largest value so the top bar fills the track. */
  max?: number;
}

function BarList({ items, max }: BarListProps) {
  const scale = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-2 text-xs">
          <span className="truncate text-foreground">{item.label}</span>
          <div className="w-full" style={{ height: BAR_H }}>
            <div
              title={`${item.label}: ${item.value}%`}
              className="h-full rounded-r"
              style={{ width: `${Math.min(100, (item.value / scale) * 100)}%`, background: fill("1") }}
            />
          </div>
          <span className="text-right font-mono tabular-nums text-muted-foreground">{item.value}%</span>
        </div>
      ))}
    </div>
  );
}

interface BarListChartProps extends BarListProps {
  title: string;
  subtitle?: string;
}

export function BarListChart({ title, subtitle, items, max }: BarListChartProps) {
  return (
    <Figure
      title={title}
      subtitle={subtitle}
      table={<DataTable head={["", "Share"]} rows={items.map((i) => [i.label, i.value])} />}
    >
      <BarList items={items} max={max} />
    </Figure>
  );
}

interface BarPanelsChartProps {
  title: string;
  subtitle?: string;
  panels: { title: string; items: BarItem[] }[];
  /** Shared scale so the panels compare; defaults to 100. */
  max?: number;
}

/** Small multiples: the same single-series bar list, one panel per group. */
export function BarPanelsChart({ title, subtitle, panels, max = 100 }: BarPanelsChartProps) {
  return (
    <Figure
      title={title}
      subtitle={subtitle}
      table={
        <DataTable
          head={["", "Share"]}
          rows={panels.flatMap((p) => p.items.map((i) => [`${p.title}: ${i.label}`, i.value]))}
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {panels.map((panel) => (
          <div key={panel.title}>
            <div className="mb-1.5 text-xs font-medium text-foreground">{panel.title}</div>
            <BarList items={panel.items} max={max} />
          </div>
        ))}
      </div>
    </Figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Nested "at least" bars: + (light step) with ++ (full step) inside it
// ─────────────────────────────────────────────────────────────────────

export interface NestedRow {
  label: string;
  /** Share at or above the lower level, e.g. rF+. */
  outer: number;
  /** Share at or above the higher level, e.g. rF++. Omit for one-level properties. */
  inner?: number;
}

interface NestedBarChartProps {
  title: string;
  subtitle?: string;
  outerLabel: string;
  innerLabel: string;
  rows: NestedRow[];
}

export function NestedBarChart({ title, subtitle, outerLabel, innerLabel, rows }: NestedBarChartProps) {
  return (
    <Figure
      title={title}
      subtitle={subtitle}
      table={
        <DataTable
          head={["", outerLabel, innerLabel]}
          rows={rows.map((r) => [r.label, r.outer, r.inner ?? "—"])}
        />
      }
    >
      <Legend items={[{ label: outerLabel, color: "1-light" }, { label: innerLabel, color: "1" }]} />
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-2 text-xs">
            <span className="truncate text-foreground">{row.label}</span>
            <div className="relative w-full" style={{ height: BAR_H }}>
              <div
                title={`${row.label}: ${outerLabel} ${row.outer}%`}
                className="absolute inset-y-0 left-0 rounded-r"
                style={{ width: `${row.outer}%`, background: fill("1-light") }}
              />
              {row.inner !== undefined && (
                <div
                  title={`${row.label}: ${innerLabel} ${row.inner}%`}
                  className="absolute inset-y-0 left-0 rounded-r"
                  style={{ width: `${row.inner}%`, background: fill("1") }}
                />
              )}
            </div>
            <span className="text-right font-mono tabular-nums text-muted-foreground">
              {row.inner !== undefined ? `${row.inner}%` : `${row.outer}%`}
            </span>
          </div>
        ))}
      </div>
    </Figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Two-series comparison: paired thin bars per row
// ─────────────────────────────────────────────────────────────────────

export interface PairRow {
  label: string;
  a: number;
  b: number;
}

interface PairedBarChartProps {
  title: string;
  subtitle?: string;
  seriesA: string;
  seriesB: string;
  rows: PairRow[];
}

/** Grouped bars for two series. The second series is the story and gets the tip label. */
export function PairedBarChart({ title, subtitle, seriesA, seriesB, rows }: PairedBarChartProps) {
  return (
    <Figure
      title={title}
      subtitle={subtitle}
      table={<DataTable head={["", seriesA, seriesB]} rows={rows.map((r) => [r.label, r.a, r.b])} />}
    >
      <Legend items={[{ label: seriesA, color: "1" }, { label: seriesB, color: "2" }]} />
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-2 text-xs">
            <span className="truncate text-foreground">{row.label}</span>
            <div className="flex w-full flex-col gap-0.5">
              <div
                title={`${row.label}: ${seriesA} ${row.a}%`}
                className="rounded-r"
                style={{ height: 8, width: `${row.a}%`, background: fill("1") }}
              />
              <div
                title={`${row.label}: ${seriesB} ${row.b}%`}
                className="rounded-r"
                style={{ height: 8, width: `${row.b}%`, background: fill("2") }}
              />
            </div>
            <span className="text-right font-mono tabular-nums text-muted-foreground">{row.b}%</span>
          </div>
        ))}
      </div>
    </Figure>
  );
}
