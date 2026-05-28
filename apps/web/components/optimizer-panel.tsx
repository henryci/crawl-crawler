"use client";

/**
 * Equipment Optimizer panel.
 *
 * Three-column interactive editor:
 *
 *   ┌──────────────┬─────────────────┬─────────────────┐
 *   │  BACKPACK    │ WORN EQUIPMENT  │ OBJECTIVE       │
 *   │  (all items) │ (slots grid)    │ + LIVE TOTALS   │
 *   │              │                 │                 │
 *   │ click → equip│ click → unequip │ pick + compute  │
 *   └──────────────┴─────────────────┴─────────────────┘
 *
 * The loadout is editable: the user can equip/unequip items by clicking,
 * or click "Compute Best Loadout" to let the optimizer pick. Totals
 * update live as the loadout changes, including the non-equipment
 * baseline derived from the morgue's defenses block.
 */

import { useMemo, useRef, useState, useEffect, type ReactNode } from "react";
import type { MorgueData, ParsedItem } from "dcss-morgue-parser";
import {
  PROPERTIES,
  effectiveCapacity,
  getSpeciesCode,
  getSpeciesEquipmentRules,
  type ContributionMap,
  type ItemSlot,
  type PropertyKey,
  type SpeciesEquipmentRules,
} from "dcss-game-data";
import {
  computeBaseline,
  relevantProperties,
  scoreLoadout,
  type Objective,
  type LoadoutScore,
} from "dcss-loadout-optimizer";
import type {
  OptimizeRequest,
  OptimizeResponse,
} from "./optimize-loadout.worker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, AlertCircle, Lock, Unlock, Ban, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────
// Objective presets
// ────────────────────────────────────────────────────────────────────────

interface ObjectivePreset {
  id: string;
  label: string;
  /** Build the Objective WITHOUT floors. Floors are layered on at use. */
  build: () => Objective;
}

const OBJECTIVE_PRESETS: ObjectivePreset[] = [
  {
    id: "max-all-resist",
    label: "Total Elemental Resistances",
    build: () => ({
      kind: "maximize_sum",
      props: ["rF", "rC", "rN", "rPois", "rElec", "rCorr"],
    }),
  },
  { id: "max-rF", label: "Fire Resistance (rF)", build: () => ({ kind: "maximize", prop: "rF" }) },
  { id: "max-rC", label: "Cold Resistance (rC)", build: () => ({ kind: "maximize", prop: "rC" }) },
  { id: "max-rN", label: "Negative Energy (rN)", build: () => ({ kind: "maximize", prop: "rN" }) },
  { id: "max-rPois", label: "Poison Resistance", build: () => ({ kind: "maximize", prop: "rPois" }) },
  { id: "max-rElec", label: "Electric Resistance", build: () => ({ kind: "maximize", prop: "rElec" }) },
  { id: "max-rCorr", label: "Corrosion Resistance", build: () => ({ kind: "maximize", prop: "rCorr" }) },
  { id: "max-will", label: "Willpower", build: () => ({ kind: "maximize", prop: "Will" }) },
  { id: "max-stealth", label: "Stealth", build: () => ({ kind: "maximize", prop: "Stlth" }) },
  { id: "max-ac", label: "AC", build: () => ({ kind: "maximize", prop: "AC" }) },
  { id: "max-ev", label: "EV", build: () => ({ kind: "maximize", prop: "EV" }) },
  { id: "max-sh", label: "SH", build: () => ({ kind: "maximize", prop: "SH" }) },
  { id: "max-slay", label: "Slaying", build: () => ({ kind: "maximize", prop: "Slay" }) },
  { id: "max-str", label: "Strength", build: () => ({ kind: "maximize", prop: "Str" }) },
  { id: "max-int", label: "Intelligence", build: () => ({ kind: "maximize", prop: "Int" }) },
  { id: "max-dex", label: "Dexterity", build: () => ({ kind: "maximize", prop: "Dex" }) },
  { id: "max-hp", label: "HP", build: () => ({ kind: "maximize", prop: "HP" }) },
  { id: "max-mp", label: "MP", build: () => ({ kind: "maximize", prop: "MP" }) },
  { id: "max-regen", label: "HP Regen", build: () => ({ kind: "maximize", prop: "Regen" }) },
  { id: "max-regen-mp", label: "MP Regen", build: () => ({ kind: "maximize", prop: "RegenMP" }) },
];

/**
 * Properties the user can set floors on. Mirrors the morgue's defense
 * block plus the offensive/stat props that often matter.
 */
interface FloorOption {
  prop: PropertyKey;
  label: string;
  /** Max practical value for the inline number input. */
  max: number;
}

const FLOOR_OPTIONS: FloorOption[] = [
  { prop: "rF", label: "Fire Resistance (rF)", max: 3 },
  { prop: "rC", label: "Cold Resistance (rC)", max: 3 },
  { prop: "rN", label: "Negative Energy (rN)", max: 3 },
  { prop: "rPois", label: "Poison Resistance", max: 1 },
  { prop: "rElec", label: "Electric Resistance", max: 1 },
  { prop: "rCorr", label: "Corrosion Resistance", max: 1 },
  { prop: "rMut", label: "Mutation Resistance", max: 1 },
  { prop: "Will", label: "Willpower", max: 5 },
  { prop: "Stlth", label: "Stealth", max: 5 },
  { prop: "AC", label: "AC", max: 50 },
  { prop: "EV", label: "EV", max: 50 },
  { prop: "SH", label: "SH", max: 30 },
  { prop: "Slay", label: "Slaying", max: 20 },
  { prop: "Str", label: "Strength", max: 30 },
  { prop: "Int", label: "Intelligence", max: 30 },
  { prop: "Dex", label: "Dexterity", max: 30 },
  { prop: "SInv", label: "See Invisible (any)", max: 1 },
  { prop: "Fly", label: "Flight (any)", max: 1 },
];

interface Floor {
  id: number;
  prop: PropertyKey;
  value: number;
}

let nextFloorId = 1;
function makeFloor(prop: PropertyKey, value: number): Floor {
  return { id: nextFloorId++, prop, value };
}

// ────────────────────────────────────────────────────────────────────────
// Slot model
// ────────────────────────────────────────────────────────────────────────

const SLOT_LABEL: Record<ItemSlot, string> = {
  weapon: "Weapon",
  offhand: "Off-Hand",
  body_armour: "Body",
  helmet: "Helmet",
  gloves: "Gloves",
  boots: "Boots",
  barding: "Barding",
  cloak: "Cloak",
  ring: "Ring",
  amulet: "Amulet",
  gizmo: "Gizmo",
};

const SLOT_ORDER: ItemSlot[] = [
  "weapon",
  "offhand",
  "body_armour",
  "helmet",
  "cloak",
  "gloves",
  "boots",
  "barding",
  "amulet",
  "ring",
  "gizmo",
];

// ────────────────────────────────────────────────────────────────────────
// Color palette for property tags
// ────────────────────────────────────────────────────────────────────────

interface ChipStyle {
  /** Tailwind class string for the chip when it's an active property tag. */
  chip: string;
  /** Tailwind class for the property name in the LIVE TOTALS list. */
  label: string;
  /** Color used for filled pips in the LIVE TOTALS pip display. */
  pipFill: string;
  /** Border color used for empty pip outlines. */
  pipEmpty: string;
}

const NEUTRAL_CHIP: ChipStyle = {
  chip: "border-slate-600 text-slate-300 bg-slate-800/40",
  label: "text-slate-400",
  pipFill: "bg-slate-500 border-slate-400",
  pipEmpty: "border-slate-700",
};

const PROP_STYLE: Record<string, ChipStyle> = {
  rF: {
    chip: "border-red-500 text-red-300 bg-red-950/40",
    label: "text-red-400",
    pipFill: "bg-red-500 border-red-400",
    pipEmpty: "border-red-900/60",
  },
  rC: {
    chip: "border-cyan-500 text-cyan-300 bg-cyan-950/40",
    label: "text-cyan-400",
    pipFill: "bg-cyan-500 border-cyan-400",
    pipEmpty: "border-cyan-900/60",
  },
  rN: {
    chip: "border-purple-500 text-purple-300 bg-purple-950/40",
    label: "text-purple-400",
    pipFill: "bg-purple-500 border-purple-400",
    pipEmpty: "border-purple-900/60",
  },
  rPois: {
    chip: "border-green-500 text-green-300 bg-green-950/40",
    label: "text-green-400",
    pipFill: "bg-green-500 border-green-400",
    pipEmpty: "border-green-900/60",
  },
  rElec: {
    chip: "border-yellow-500 text-yellow-300 bg-yellow-950/40",
    label: "text-yellow-400",
    pipFill: "bg-yellow-500 border-yellow-400",
    pipEmpty: "border-yellow-900/60",
  },
  rCorr: {
    chip: "border-amber-600 text-amber-300 bg-amber-950/40",
    label: "text-amber-400",
    pipFill: "bg-amber-600 border-amber-500",
    pipEmpty: "border-amber-900/60",
  },
  rMut: {
    chip: "border-pink-500 text-pink-300 bg-pink-950/40",
    label: "text-pink-400",
    pipFill: "bg-pink-500 border-pink-400",
    pipEmpty: "border-pink-900/60",
  },
  Will: {
    chip: "border-blue-500 text-blue-300 bg-blue-950/40",
    label: "text-blue-400",
    pipFill: "bg-blue-500 border-blue-400",
    pipEmpty: "border-blue-900/60",
  },
  Stlth: {
    chip: "border-slate-500 text-slate-300 bg-slate-800/40",
    label: "text-slate-400",
    pipFill: "bg-slate-400 border-slate-300",
    pipEmpty: "border-slate-700",
  },
  SInv: NEUTRAL_CHIP,
  // Stats — purple
  Str: { chip: "border-purple-500 text-purple-300 bg-purple-950/40", label: "text-purple-400", pipFill: "", pipEmpty: "" },
  Int: { chip: "border-purple-500 text-purple-300 bg-purple-950/40", label: "text-purple-400", pipFill: "", pipEmpty: "" },
  Dex: { chip: "border-purple-500 text-purple-300 bg-purple-950/40", label: "text-purple-400", pipFill: "", pipEmpty: "" },
  // Defenses — amber
  AC: { chip: "border-amber-500 text-amber-300 bg-amber-950/40", label: "text-amber-400", pipFill: "", pipEmpty: "" },
  EV: { chip: "border-amber-500 text-amber-300 bg-amber-950/40", label: "text-amber-400", pipFill: "", pipEmpty: "" },
  SH: { chip: "border-amber-500 text-amber-300 bg-amber-950/40", label: "text-amber-400", pipFill: "", pipEmpty: "" },
  // Offense — red
  Slay: { chip: "border-red-500 text-red-300 bg-red-950/40", label: "text-red-400", pipFill: "", pipEmpty: "" },
  // Pools — green for HP, blue for MP
  HP: { chip: "border-green-500 text-green-300 bg-green-950/40", label: "text-green-400", pipFill: "", pipEmpty: "" },
  MP: { chip: "border-blue-500 text-blue-300 bg-blue-950/40", label: "text-blue-400", pipFill: "", pipEmpty: "" },
  Regen: { chip: "border-emerald-500 text-emerald-300 bg-emerald-950/40", label: "text-emerald-400", pipFill: "", pipEmpty: "" },
  RegenMP: { chip: "border-sky-500 text-sky-300 bg-sky-950/40", label: "text-sky-400", pipFill: "", pipEmpty: "" },
};

function chipStyle(prop: PropertyKey): ChipStyle {
  if (PROP_STYLE[prop]) return PROP_STYLE[prop]!;
  const def = PROPERTIES[prop];
  if (def?.category === "downside") {
    // Dashed border + cool-rose hue + neutral dark background to stay
    // clearly distinct from rF (solid red) and rCorr (solid amber) on
    // dark backgrounds, while still reading as a "warning/negative" tag.
    return {
      chip: "border-dashed border-rose-500/70 text-rose-300 bg-zinc-900/40 italic",
      label: "text-rose-400",
      pipFill: "",
      pipEmpty: "",
    };
  }
  if (def?.category === "spell_school" || def?.category === "wizardry") {
    return {
      chip: "border-transparent text-slate-400/80 bg-transparent italic",
      label: "text-slate-400",
      pipFill: "",
      pipEmpty: "",
    };
  }
  return NEUTRAL_CHIP;
}

// ────────────────────────────────────────────────────────────────────────
// Top-level component
// ────────────────────────────────────────────────────────────────────────

export function OptimizerPanel({ data }: { data: MorgueData }) {
  const inventoryItems = data.inventoryItems;
  const rules = useMemo(() => speciesRulesFor(data), [data]);

  // Compute non-equipment baseline once per morgue load.
  const baseline = useMemo(() => {
    if (!data.runtimeTotals || !inventoryItems) return undefined;
    const equipped = inventoryItems.filter((i) => i.isEquipped);
    return computeBaseline(data.runtimeTotals, equipped);
  }, [data.runtimeTotals, inventoryItems]);

  // Initial loadout = whatever the player has equipped in the morgue.
  const initialLoadout = useMemo(() => {
    return (inventoryItems ?? []).filter((i) => i.isEquipped);
  }, [inventoryItems]);

  const [loadout, setLoadout] = useState<ParsedItem[]>(initialLoadout);
  const [priorityIds, setPriorityIds] = useState<string[]>([
    OBJECTIVE_PRESETS[0]!.id,
  ]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [lastOptimizeStats, setLastOptimizeStats] = useState<{
    evaluated: number;
    elapsedMs: number;
  } | null>(null);

  // Long-lived worker for the optimizer. Reused across clicks so we
  // pay the spin-up cost once. The activeRequestId guards against
  // stale results when the user clicks Optimize again mid-run, or
  // when the morgue changes while a compute is in flight.
  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef(0);
  const nextRequestIdRef = useRef(1);
  // Keep the latest inventory available to the persistent worker
  // handler. Without this, the handler would close over the
  // inventoryItems from the render it was attached on — and since
  // ParsedItem.id is just an inventory letter, IDs collide across
  // morgues and a stale result would silently pin wrong items.
  const inventoryItemsRef = useRef(inventoryItems);
  inventoryItemsRef.current = inventoryItems;

  useEffect(() => {
    const worker = new Worker(
      new URL("./optimize-loadout.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (event: MessageEvent<OptimizeResponse>) => {
      const { requestId, result, elapsedMs } = event.data;
      if (requestId !== activeRequestIdRef.current) return;
      const items = inventoryItemsRef.current;
      if (!items) return;
      // Items get structure-cloned across the worker boundary, so the
      // returned objects are new references. Map them back to the
      // current inventory's ParsedItems by id so reference-equality
      // checks in the rest of the UI keep working.
      const byId = new Map(items.map((i) => [i.id, i]));
      const restored = result.best.items
        .map((i) => byId.get(i.id))
        .filter((i): i is ParsedItem => i !== undefined);
      setLoadout(restored);
      setLastOptimizeStats({
        evaluated: result.loadoutsEvaluated,
        elapsedMs,
      });
      setPending(false);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // When morgue changes, reset loadout, clear locks/bans, and
  // invalidate any in-flight optimize so a late result doesn't
  // overwrite the new morgue's loadout with stale items.
  useEffect(() => {
    setLoadout(initialLoadout);
    setLockedIds(new Set());
    setBannedIds(new Set());
    activeRequestIdRef.current = nextRequestIdRef.current;
    setPending(false);
    setLastOptimizeStats(null);
  }, [initialLoadout]);

  // Drop stale lock ids when items get removed from the loadout.
  const loadoutIds = useMemo(() => new Set(loadout.map((i) => i.id)), [loadout]);
  useEffect(() => {
    setLockedIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (loadoutIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [loadoutIds]);

  const objective: Objective = useMemo(() => {
    const floorMap = buildFloorMap(floors);
    const priorities = priorityIds
      .map((id) => OBJECTIVE_PRESETS.find((p) => p.id === id))
      .filter((p): p is ObjectivePreset => p !== undefined)
      .map((p) => presetToPriority(p));
    if (priorities.length === 0) {
      priorities.push(presetToPriority(OBJECTIVE_PRESETS[0]!));
    }
    return {
      kind: "priorities",
      priorities,
      ...(floorMap ? { floors: floorMap } : {}),
    };
  }, [priorityIds, floors]);

  const relevant = useMemo(() => relevantProperties(objective), [objective]);

  const score = useMemo<LoadoutScore | null>(() => {
    if (!rules) return null;
    return scoreLoadout(loadout, rules, baseline);
  }, [loadout, rules, baseline]);

  if (!inventoryItems) {
    return <UnsupportedMessage reason="missing-inventory-data" />;
  }
  if (!rules) {
    return <UnsupportedMessage reason="unknown-species" race={data.race} />;
  }

  // ─── Handlers ────────────────────────────────────────────────────

  const toggleItem = (item: ParsedItem) => {
    // Locked items can't be removed via backpack click.
    if (lockedIds.has(item.id)) return;
    // Banned items can't be equipped.
    if (bannedIds.has(item.id)) return;
    setLoadout((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i !== item);
      }
      return addItemToLoadout(prev, item, rules, lockedIds);
    });
  };

  const removeFromSlot = (item: ParsedItem) => {
    if (lockedIds.has(item.id)) return;
    setLoadout((prev) => prev.filter((i) => i !== item));
  };

  const toggleLock = (item: ParsedItem) => {
    setLockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const toggleBan = (item: ParsedItem) => {
    setBannedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
        // Banning an equipped item auto-unequips it (and drops any lock).
        if (loadout.includes(item)) {
          setLoadout((p) => p.filter((i) => i !== item));
        }
        if (lockedIds.has(item.id)) {
          setLockedIds((p) => {
            const n = new Set(p);
            n.delete(item.id);
            return n;
          });
        }
      }
      return next;
    });
  };

  const handleClear = () => {
    setLoadout([]);
    setLockedIds(new Set());
    setBannedIds(new Set());
    setLastOptimizeStats(null);
  };

  const handleOptimize = () => {
    const worker = workerRef.current;
    if (!worker) return;
    // Items the user has locked stay equipped through optimization.
    // Talismans are implicitly locked: v1 surfaces them as read-only
    // (the player swaps forms in-game, not via the optimizer), so any
    // equipped talisman must survive an optimize pass.
    const userLocked = loadout.filter((i) => lockedIds.has(i.id));
    const equippedTalismans = loadout.filter((i) => i.category === "talisman");
    const lockedItems = [
      ...userLocked,
      ...equippedTalismans.filter((t) => !userLocked.includes(t)),
    ];
    // Banned items are excluded from the candidate pool entirely.
    const optimizerItems = inventoryItems.filter((i) => !bannedIds.has(i.id));

    const requestId = nextRequestIdRef.current++;
    activeRequestIdRef.current = requestId;
    setPending(true);

    const request: OptimizeRequest = {
      requestId,
      inputs: {
        items: optimizerItems,
        rules,
        objective,
        baseline,
        lockedItems,
      },
    };
    worker.postMessage(request);
  };

  return (
    <div className="space-y-4">
      <HeaderBar
        onClear={handleClear}
        onOptimize={handleOptimize}
        pending={pending}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <BackpackList
          items={inventoryItems}
          loadout={loadout}
          relevant={relevant}
          bannedIds={bannedIds}
          onToggle={toggleItem}
          onToggleBan={toggleBan}
        />
        <WornEquipment
          loadout={loadout}
          rules={rules}
          onRemove={removeFromSlot}
          onToggleLock={toggleLock}
          lockedIds={lockedIds}
          relevant={relevant}
          pending={pending}
        />
        <div className="space-y-4">
          <ObjectivePanel
            priorityIds={priorityIds}
            onPriorityIdsChange={setPriorityIds}
            floors={floors}
            onFloorsChange={setFloors}
          />
          <LiveTotals
            score={score}
            stats={lastOptimizeStats}
            hasBaseline={!!baseline}
            floors={floors}
          />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Header bar (title + inventory count + clear + compute)
// ────────────────────────────────────────────────────────────────────────

// Bump the suffix when the banner content changes meaningfully so
// previously-dismissed users see the new copy.
const BETA_WARNING_STORAGE_KEY = "crawl-crawler:optimizer-beta-warning-dismissed:v1";

function HeaderBar({
  onClear,
  onOptimize,
  pending,
}: {
  onClear: () => void;
  onOptimize: () => void;
  pending: boolean;
}) {
  // Start hidden on mount and reveal once we've consulted localStorage
  // — avoids a flash of the banner for users who previously dismissed
  // it. SSR renders nothing here; the banner appears post-hydration
  // for first-time visitors.
  const [warningVisible, setWarningVisible] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(BETA_WARNING_STORAGE_KEY) !== "1") {
        setWarningVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — show by default.
      setWarningVisible(true);
    }
  }, []);
  const dismissWarning = () => {
    setWarningVisible(false);
    try {
      localStorage.setItem(BETA_WARNING_STORAGE_KEY, "1");
    } catch {
      // Best-effort persistence; if it fails, banner returns on reload.
    }
  };

  return (
    <div className="space-y-3">
      {warningVisible && (
      <div className="relative rounded border border-amber-600/60 bg-amber-950/30 px-3 py-2 pr-8 text-xs text-amber-200 space-y-1.5">
        <button
          type="button"
          onClick={dismissWarning}
          aria-label="Dismiss known-issues notice"
          title="Dismiss"
          className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded text-amber-300/70 hover:text-amber-100 hover:bg-amber-900/40 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div>
          This is super beta and probably broken. Test it and{" "}
          <a
            href="https://www.reddit.com/r/dcss/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-100"
          >
            provide feedback on Reddit
          </a>{" "}
          or{" "}
          <a
            href="https://github.com/anthropics/crawl-crawler/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-100"
          >
            GitHub
          </a>
          !
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wider text-[10px] text-amber-300/80 mt-1">
            Known issues
          </div>
          <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-amber-200/90">
            <li>
              Armor isn&apos;t handled great — armor rating isn&apos;t used yet, so
              picks that should be obvious on AC grounds may look like ties.
            </li>
            <li>
              Some edge-case items (e.g. the macabre finger necklace) can break
              assumptions. Sanity-check the result before trusting it.
            </li>
            <li>
              Talismans are read-only. If you had one equipped when you dumped,
              its properties are included; if you didn&apos;t, they aren&apos;t.
              Re-dump after swapping forms in-game to see different numbers.
            </li>
          </ul>
        </div>
      </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          Equipment Optimizer
        </h2>
        <div className="flex items-end gap-3">
          <Button
            variant="ghost"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground"
          >
            clear
          </Button>
          <Button
            onClick={onOptimize}
            disabled={pending}
            className="bg-amber-500 text-black hover:bg-amber-400 disabled:bg-amber-500/80 disabled:text-black"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing…
              </>
            ) : (
              "Optimize"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Backpack list (left column)
// ────────────────────────────────────────────────────────────────────────

function BackpackList({
  items,
  loadout,
  relevant,
  bannedIds,
  onToggle,
  onToggleBan,
}: {
  items: ParsedItem[];
  loadout: ParsedItem[];
  relevant: Set<PropertyKey>;
  bannedIds: ReadonlySet<string>;
  onToggle: (item: ParsedItem) => void;
  onToggleBan: (item: ParsedItem) => void;
}) {
  const loadoutSet = new Set(loadout);
  // Talismans are read-only in v1 (player swaps forms in-game), so we
  // omit them from the interactive backpack list. They're shown in the
  // worn-equipment column as a fixed display row instead.
  const visibleItems = items.filter((i) => i.category !== "talisman");
  return (
    <Card className="bg-card border-border py-3 gap-2">
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between mb-2 gap-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Inventory ({visibleItems.length})
          </span>
          <span className="text-xs text-muted-foreground">
            click to equip · ban icon excludes from optimize
          </span>
        </div>
        <div className="space-y-1.5">
          {visibleItems.map((item) => (
            <BackpackItemRow
              key={item.id}
              item={item}
              equipped={loadoutSet.has(item)}
              banned={bannedIds.has(item.id)}
              relevant={itemIsRelevant(item, relevant)}
              onClick={() => onToggle(item)}
              onToggleBan={() => onToggleBan(item)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * One row in the backpack list. Shows glyph + name + inventory letter,
 * with contribution tags below. The trailing Ban icon toggles whether
 * the item is excluded from the optimizer's candidate pool.
 */
function BackpackItemRow({
  item,
  equipped,
  banned,
  relevant,
  onClick,
  onToggleBan,
}: {
  item: ParsedItem;
  equipped: boolean;
  banned: boolean;
  relevant: boolean;
  onClick: () => void;
  onToggleBan: () => void;
}) {
  return (
    <div
      className={cn(
        "w-full px-3 py-2 rounded border transition-colors flex items-start gap-2",
        "hover:border-foreground/30",
        banned
          ? "bg-secondary/10 border-red-900/50 opacity-50"
          : equipped
            ? "bg-amber-950/30 border-amber-600/70"
            : relevant
              ? "bg-secondary/30 border-amber-500/50 hover:bg-secondary/60"
              : "bg-secondary/20 border-border hover:bg-secondary/60",
      )}
    >
      <button
        type="button"
        onClick={banned ? undefined : onClick}
        disabled={banned}
        className={cn(
          "flex-1 min-w-0 text-left rounded",
          banned ? "cursor-not-allowed line-through" : "cursor-pointer",
        )}
        title={banned ? "Banned — click the ban icon to unban" : "Click to equip / unequip"}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-muted-foreground w-4 shrink-0">
            {glyphFor(item)}
          </span>
          <span className="font-mono text-sm text-foreground flex-1 min-w-0 truncate">
            {cleanItemName(item.rawText)}
          </span>
          <span className="font-mono text-xs text-muted-foreground w-4 text-right shrink-0">
            {item.id}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5 ml-6">
          {renderItemTags(item)}
        </div>
      </button>
      <button
        type="button"
        onClick={onToggleBan}
        className={cn(
          "shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors mt-0.5",
          banned
            ? "text-red-400 hover:bg-red-950/30"
            : "text-muted-foreground/30 hover:text-red-400 hover:bg-red-950/20",
        )}
        title={
          banned
            ? "Unban this item (the optimizer will consider it again)"
            : "Ban this item — the optimizer will never equip it"
        }
        aria-label={banned ? "Unban item" : "Ban item"}
      >
        <Ban className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * DCSS-style item glyph for a category. Not strictly accurate per-base-
 * type (mockup uses `(` for weapons, `)` for shields, `[` for armor)
 * but close enough as a visual cue.
 */
function glyphFor(item: ParsedItem): string {
  switch (item.category) {
    case "weapon":
      return "(";
    case "shield":
      return ")";
    case "armor":
      return "[";
    case "jewelry":
      return item.slots[0] === "amulet" ? '"' : "=";
    case "staff":
      return "/";
    case "talisman":
      return "}";
    default:
      return "?";
  }
}

/**
 * Strip the leading article and trailing slot marker from the raw text
 * for cleaner display. Keep the enchantment and item name.
 */
function cleanItemName(raw: string): string {
  return raw
    .replace(/^the\s+/i, "")
    .replace(/^a\s+/i, "")
    .replace(/^an\s+/i, "")
    .replace(/^cursed\s+/i, "")
    .replace(/\s*\([^)]+\)\s*$/g, "")
    .trim();
}

/**
 * Render the contribution chips for a single item: brand/ego as italic
 * gray, properties with their color palette.
 */
function renderItemTags(item: ParsedItem) {
  const tags: { label: string; style: ChipStyle; italic?: boolean }[] = [];

  if (item.brand) {
    tags.push({
      label: item.brand,
      style: {
        chip: "border-transparent text-slate-400/70 bg-transparent italic",
        label: "text-slate-400",
        pipFill: "",
        pipEmpty: "",
      },
      italic: true,
    });
  }

  if (item.ego) {
    // For non-artefact ego items we usually have the ego key but the
    // contributions encode the actual effect; skip duplicating the ego
    // name if it'd repeat a contribution token. Keep it as a subdued tag.
    tags.push({
      label: item.ego,
      style: {
        chip: "border-transparent text-slate-400/70 bg-transparent italic",
        label: "text-slate-400",
        pipFill: "",
        pipEmpty: "",
      },
      italic: true,
    });
  }

  for (const [prop, value] of Object.entries(item.contributions) as [
    PropertyKey,
    number,
  ][]) {
    if (value === 0) continue;
    tags.push({ label: formatChipLabel(prop, value), style: chipStyle(prop) });
  }

  return tags.map((t, i) => (
    <span
      key={i}
      className={cn(
        "font-mono text-[10px] px-1.5 py-0.5 rounded border",
        t.style.chip,
      )}
    >
      {t.label}
    </span>
  ));
}

/**
 * Format a single property+value into a chip label.
 *
 *   - bool:   just the key ("SInv", "+Blink")
 *   - pip:    key + pip string ("rF+", "rC++")
 *   - int:    key + signed number ("Str+3", "Slay-2")
 */
function formatChipLabel(prop: PropertyKey, value: number): string {
  const def = PROPERTIES[prop];
  if (!def) return `${prop}=${value}`;
  if (def.rendering === "bool") return prop;
  if (def.rendering === "pip") {
    if (value === 0) return prop;
    const sym = value > 0 ? "+" : "-";
    return `${prop}${sym.repeat(Math.min(Math.abs(value), 5))}`;
  }
  return `${prop}${value >= 0 ? "+" : ""}${value}`;
}

function itemIsRelevant(item: ParsedItem, relevant: Set<PropertyKey>): boolean {
  for (const prop of Object.keys(item.contributions)) {
    if (relevant.has(prop)) {
      const v = item.contributions[prop];
      if (v !== undefined && v !== 0) return true;
    }
  }
  return false;
}

// ────────────────────────────────────────────────────────────────────────
// Worn equipment (middle column)
// ────────────────────────────────────────────────────────────────────────

function WornEquipment({
  loadout,
  rules,
  onRemove,
  onToggleLock,
  lockedIds,
  relevant,
  pending,
}: {
  loadout: ParsedItem[];
  rules: SpeciesEquipmentRules;
  onRemove: (item: ParsedItem) => void;
  onToggleLock: (item: ParsedItem) => void;
  lockedIds: ReadonlySet<string>;
  relevant: Set<PropertyKey>;
  pending: boolean;
}) {
  // Build a list of (slot, capacity, items) rows. For ring with cap > 1,
  // emit one row per ring capacity slot, attributing items in order.
  const rows = useMemo(() => {
    const slotItems = new Map<ItemSlot, ParsedItem[]>();
    for (const item of loadout) {
      // For multi-slot items, attribute to the first slot to avoid
      // double-display; the "multi-slot" badge on the item explains the rest.
      const slot = item.slots[0];
      if (!slot) continue;
      if (!slotItems.has(slot)) slotItems.set(slot, []);
      slotItems.get(slot)!.push(item);
    }
    const rows: { slot: ItemSlot; label: string; item: ParsedItem | null }[] = [];
    // Effective capacity folds in any slot-granters worn in the loadout
    // (e.g. macabre finger necklace → +1 ring row, crown of Vainglory →
    // +2 ring rows). Recomputed whenever the loadout changes.
    const cap = effectiveCapacity(rules, loadout);
    for (const slot of SLOT_ORDER) {
      const slotCap = cap[slot] ?? 0;
      if (slotCap === 0) continue;
      const items = slotItems.get(slot) ?? [];
      for (let i = 0; i < slotCap; i++) {
        const label =
          slotCap === 1
            ? SLOT_LABEL[slot]
            : `${SLOT_LABEL[slot]} ${romanNumeral(i + 1)}`;
        rows.push({ slot, label, item: items[i] ?? null });
      }
    }
    return rows;
  }, [loadout, rules]);

  return (
    <Card className="bg-card border-border py-3 gap-2 relative">
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between mb-2 gap-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Worn Equipment
          </span>
          <span className="text-xs text-muted-foreground">
            click to unequip · lock icon pins through optimize
          </span>
        </div>
        <div
          className={cn(
            "space-y-1.5 transition-opacity",
            pending && "opacity-40 pointer-events-none",
          )}
          aria-busy={pending}
        >
          {rows.map((row, i) => (
            <SlotRow
              key={`${row.slot}-${i}`}
              label={row.label}
              item={row.item}
              locked={row.item ? lockedIds.has(row.item.id) : false}
              relevant={row.item ? itemIsRelevant(row.item, relevant) : false}
              onRemove={() => row.item && onRemove(row.item)}
              onToggleLock={() => row.item && onToggleLock(row.item)}
            />
          ))}
          {/* Talismans are read-only in v1: surface them as a fixed
              display row so totals stay correct. Form swapping happens
              in-game; re-dump to update. */}
          {loadout
            .filter((i) => i.category === "talisman")
            .map((t) => (
              <TalismanRow key={t.id} item={t} />
            ))}
        </div>
      </CardContent>
      {pending && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded bg-card/95 border border-amber-500/60 shadow-lg">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-sm font-medium text-amber-100">
              Computing best loadout…
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

function SlotRow({
  label,
  item,
  locked,
  relevant,
  onRemove,
  onToggleLock,
}: {
  label: string;
  item: ParsedItem | null;
  locked: boolean;
  relevant: boolean;
  onRemove: () => void;
  onToggleLock: () => void;
}) {
  const interactive = item !== null && !locked;
  const labelClasses =
    "font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 leading-none";
  return (
    <div
      className={cn(
        "w-full px-3 py-2 rounded border transition-colors flex items-start gap-2",
        item
          ? cn(
              "bg-secondary/30",
              locked
                ? "border-amber-500/70 bg-amber-950/20"
                : relevant
                  ? "border-amber-500/40"
                  : "border-border",
            )
          : "bg-secondary/10 border-dashed border-border",
      )}
    >
      {item ? (
        <>
          <button
            type="button"
            onClick={interactive ? onRemove : undefined}
            disabled={!interactive}
            className={cn(
              "flex-1 min-w-0 text-left rounded",
              interactive
                ? "hover:bg-red-950/30 cursor-pointer"
                : "cursor-not-allowed",
            )}
            title={locked ? "Locked — click the lock icon to unlock" : "Click to unequip"}
          >
            <div className={labelClasses}>{label}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-muted-foreground w-4 shrink-0">
                {glyphFor(item)}
              </span>
              <span className="font-mono text-sm text-foreground flex-1 min-w-0 truncate">
                {cleanItemName(item.rawText)}
              </span>
              <span className="font-mono text-xs text-muted-foreground w-4 text-right shrink-0">
                {item.id}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1 ml-6">
              {renderItemTags(item)}
            </div>
            {item.slots.length > 1 && (
              <div className="text-[10px] text-amber-400/80 mt-0.5 ml-6">
                Multi-slot: {item.slots.map((s) => SLOT_LABEL[s]).join(" + ")}
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={onToggleLock}
            className={cn(
              "shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors mt-0.5",
              locked
                ? "text-amber-400 hover:bg-amber-950/40"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-secondary/60",
            )}
            title={
              locked
                ? "Locked — Compute Best Loadout will keep this item"
                : "Lock this item so Compute Best Loadout doesn't change it"
            }
            aria-label={locked ? "Unlock item" : "Lock item"}
          >
            {locked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>
        </>
      ) : (
        <div className="flex-1">
          <div className={labelClasses}>{label}</div>
          <div className="font-mono text-xs text-muted-foreground italic mt-1">
            empty
          </div>
        </div>
      )}
    </div>
  );
}

function romanNumeral(n: number): string {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] ?? String(n);
}

/**
 * Read-only display for the currently-worn talisman. Same visual
 * vocabulary as SlotRow but no remove/lock affordances — the player
 * changes forms in the game, not here. The badges show the talisman's
 * contributions so the user can see why LIVE TOTALS look the way they
 * do (e.g. the death talisman's `rF-` lowering total fire resistance).
 */
function TalismanRow({ item }: { item: ParsedItem }) {
  return (
    <div
      className="w-full px-3 py-2 rounded border bg-secondary/20 border-border/70"
      title="Talismans are equipped in-game; re-run the dump after swapping forms"
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 leading-none">
          Talisman
        </div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50 leading-none">
          read-only
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="font-mono text-muted-foreground w-4 shrink-0">
          {glyphFor(item)}
        </span>
        <span className="font-mono text-sm text-foreground flex-1 min-w-0 truncate">
          {cleanItemName(item.rawText)}
        </span>
        <span className="font-mono text-xs text-muted-foreground w-4 text-right shrink-0">
          {item.id}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-1 ml-6">
        {renderItemTags(item)}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Objective panel (right column, top)
// ────────────────────────────────────────────────────────────────────────

function ObjectivePanel({
  priorityIds,
  onPriorityIdsChange,
  floors,
  onFloorsChange,
}: {
  priorityIds: string[];
  onPriorityIdsChange: (next: string[]) => void;
  floors: Floor[];
  onFloorsChange: (next: Floor[]) => void;
}) {
  const addFloor = () => {
    // Default to a prop not already in the list, falling back to the first.
    const used = new Set(floors.map((f) => f.prop));
    const candidate =
      FLOOR_OPTIONS.find((o) => !used.has(o.prop)) ?? FLOOR_OPTIONS[0]!;
    onFloorsChange([...floors, makeFloor(candidate.prop, 1)]);
  };

  const updateFloor = (id: number, updates: Partial<Floor>) => {
    onFloorsChange(
      floors.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const removeFloor = (id: number) => {
    onFloorsChange(floors.filter((f) => f.id !== id));
  };

  const addPriority = () => {
    const used = new Set(priorityIds);
    const candidate =
      OBJECTIVE_PRESETS.find((p) => !used.has(p.id)) ?? OBJECTIVE_PRESETS[0]!;
    onPriorityIdsChange([...priorityIds, candidate.id]);
  };

  const updatePriority = (idx: number, newId: string) => {
    onPriorityIdsChange(priorityIds.map((id, i) => (i === idx ? newId : id)));
  };

  const removePriority = (idx: number) => {
    if (priorityIds.length <= 1) return; // keep at least one
    onPriorityIdsChange(priorityIds.filter((_, i) => i !== idx));
  };

  const movePriority = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= priorityIds.length) return;
    const next = [...priorityIds];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    onPriorityIdsChange(next);
  };

  const hasMultiple = priorityIds.length > 1;

  return (
    <Card className="bg-card border-border py-3 gap-2">
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Maximize
          </div>
          {hasMultiple && (
            <div className="text-xs text-muted-foreground italic">
              Higher rows dominate lower rows. Each tier only breaks ties on
              the previous one — once a tier is maxed (e.g. resistances at
              cap), the next tier takes over.
            </div>
          )}
          <div className="space-y-1.5">
            {priorityIds.map((id, idx) => (
              <PriorityRow
                key={`${idx}-${id}`}
                index={idx}
                presetId={id}
                showOrdering={hasMultiple}
                canRemove={hasMultiple}
                canMoveUp={idx > 0}
                canMoveDown={idx < priorityIds.length - 1}
                onChange={(newId) => updatePriority(idx, newId)}
                onRemove={() => removePriority(idx)}
                onMoveUp={() => movePriority(idx, -1)}
                onMoveDown={() => movePriority(idx, 1)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addPriority}
            className="w-full text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 border border-dashed border-amber-600/40 hover:border-amber-500/70 rounded py-2 transition-colors"
          >
            + Add priority
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Require at least
          </div>
          {floors.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">
              No constraints. Add one to require a minimum level on a property
              (e.g. &quot;rN ≥ 3&quot;).
            </div>
          ) : (
            <div className="space-y-1.5">
              {floors.map((f) => (
                <FloorRow
                  key={f.id}
                  floor={f}
                  onChange={(updates) => updateFloor(f.id, updates)}
                  onRemove={() => removeFloor(f.id)}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addFloor}
            className="w-full text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 border border-dashed border-amber-600/40 hover:border-amber-500/70 rounded py-2 transition-colors"
          >
            + Add constraint
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function FloorRow({
  floor,
  onChange,
  onRemove,
}: {
  floor: Floor;
  onChange: (updates: Partial<Floor>) => void;
  onRemove: () => void;
}) {
  const option = FLOOR_OPTIONS.find((o) => o.prop === floor.prop);
  const max = option?.max ?? 10;
  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={floor.prop}
        onValueChange={(v) => onChange({ prop: v as PropertyKey })}
      >
        <SelectTrigger className="flex-1 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FLOOR_OPTIONS.map((opt) => (
            <SelectItem key={opt.prop} value={opt.prop}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">≥</span>
      <input
        type="number"
        min={1}
        max={max}
        value={floor.value}
        onChange={(e) => onChange({ value: Math.max(1, parseInt(e.target.value) || 1) })}
        className="w-12 h-8 text-xs font-mono text-center bg-background border border-border rounded"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-red-400 w-6 h-8 flex items-center justify-center"
        aria-label="Remove constraint"
      >
        ×
      </button>
    </div>
  );
}

function PriorityRow({
  index,
  presetId,
  showOrdering,
  canRemove,
  canMoveUp,
  canMoveDown,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  presetId: string;
  showOrdering: boolean;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (id: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {showOrdering && (
        <span className="font-mono text-xs text-muted-foreground w-4 text-center shrink-0">
          {index + 1}.
        </span>
      )}
      <Select value={presetId} onValueChange={onChange}>
        <SelectTrigger className="flex-1 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OBJECTIVE_PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showOrdering && (
        <>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed w-5 h-8 flex items-center justify-center"
            aria-label="Move priority up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed w-5 h-8 flex items-center justify-center"
            aria-label="Move priority down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="text-muted-foreground hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed w-6 h-8 flex items-center justify-center"
            aria-label="Remove priority"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Convert a Maximize preset into a priority-shape entry that
 * `evaluateObjective` understands for the `'priorities'` kind.
 */
function presetToPriority(
  preset: ObjectivePreset,
): { prop: PropertyKey } | { props: PropertyKey[] } {
  const obj = preset.build();
  switch (obj.kind) {
    case "maximize":
    case "maximize_with_floor":
      return { prop: obj.prop };
    case "maximize_sum":
      return { props: obj.props };
    case "priorities":
      // Defensive: presets only build simple kinds, but in case one
      // ever builds a priorities objective, take its first tier.
      return obj.priorities[0] ?? { prop: "rF" };
  }
}

/**
 * Collapse the user's floor rows into a single floors map. Returns
 * undefined when there are no constraints (so we can omit the `floors`
 * field rather than carry an empty map).
 */
function buildFloorMap(
  floors: Floor[],
): Partial<Record<PropertyKey, number>> | undefined {
  if (floors.length === 0) return undefined;
  const map: Partial<Record<PropertyKey, number>> = {};
  for (const f of floors) {
    const existing = map[f.prop];
    if (existing === undefined || f.value > existing) {
      map[f.prop] = f.value;
    }
  }
  return map;
}

// ────────────────────────────────────────────────────────────────────────
// Live totals (right column, bottom)
// ────────────────────────────────────────────────────────────────────────

const TOTALS_PROPS: PropertyKey[] = [
  "rF",
  "rC",
  "rElec",
  "rPois",
  "rN",
  "rCorr",
  "Will",
  "Stlth",
];


function LiveTotals({
  score,
  stats,
  hasBaseline,
  floors,
}: {
  score: LoadoutScore | null;
  stats: { evaluated: number; elapsedMs: number } | null;
  hasBaseline: boolean;
  floors: Floor[];
}) {
  return (
    <Card className="bg-card border-border py-3 gap-2">
      <CardContent className="space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Live Totals
        </div>
        <div className="text-[10px] text-muted-foreground/80 italic leading-snug">
          Equipment modifiers + non-equipment baseline. Does not include base
          armor AC, base shield SH, base EV, or skill-derived bonuses.
        </div>

        {floors.length > 0 && (
          <ConstraintStatus floors={floors} score={score} />
        )}

        <div className="grid grid-cols-3 gap-2 mb-2">
          <BigStat
            label="AC"
            value={score?.totals.AC ?? 0}
            equipment={score?.equipmentTotals.AC ?? 0}
            baseline={score?.baseline.AC ?? 0}
          />
          <BigStat
            label="EV"
            value={score?.totals.EV ?? 0}
            equipment={score?.equipmentTotals.EV ?? 0}
            baseline={score?.baseline.EV ?? 0}
          />
          <BigStat
            label="SH"
            value={score?.totals.SH ?? 0}
            equipment={score?.equipmentTotals.SH ?? 0}
            baseline={score?.baseline.SH ?? 0}
          />
        </div>

        <div className="space-y-1.5">
          {TOTALS_PROPS.map((prop) => (
            <PipRow
              key={prop}
              prop={prop}
              capped={score?.totals[prop] ?? 0}
              uncapped={score?.uncappedTotals[prop] ?? 0}
              equipment={score?.equipmentTotals[prop] ?? 0}
              baseline={score?.baseline[prop] ?? 0}
            />
          ))}
        </div>

        <OtherPropertiesSection score={score} />


        {score && score.violations.length > 0 && (
          <div className="border-t border-border pt-2 mt-2 text-xs text-red-400">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Illegal loadout</div>
                <ul className="list-disc list-inside text-[10px] mt-0.5">
                  {score.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="border-t border-border pt-2 mt-2 text-[10px] text-muted-foreground font-mono">
            Last optimize: {stats.evaluated.toLocaleString()} loadouts ·{" "}
            {Math.round(stats.elapsedMs)}ms
          </div>
        )}

        {hasBaseline && (
          <div className="text-[10px] text-muted-foreground italic">
            Totals include the player&apos;s non-equipment baseline.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Set of property keys already rendered as BigStats or PipRows above —
 * we'll skip them when listing "other" non-zero properties.
 */
const ALREADY_SHOWN_IN_TOTALS = new Set<PropertyKey>([
  "AC",
  "EV",
  "SH",
  ...TOTALS_PROPS,
]);

/**
 * Group "other" non-zero properties by display category for stable
 * sectioning. Order matters for readability.
 */
const CATEGORY_DISPLAY_ORDER: { category: string; label: string }[] = [
  { category: "resistance", label: "Resistances" }, // catches rMut etc.
  { category: "stat", label: "Stats" },
  { category: "offense", label: "Offense" },
  { category: "pool", label: "Pools" },
  { category: "regen", label: "Regeneration" },
  { category: "utility", label: "Utility" },
  { category: "wizardry", label: "Wizardry" },
  { category: "spell_school", label: "Spell Schools" },
  { category: "downside", label: "Downsides" },
];

function OtherPropertiesSection({ score }: { score: LoadoutScore | null }) {
  const grouped = useMemo(() => {
    const out = new Map<string, [PropertyKey, number][]>();
    if (!score) return out;
    for (const [prop, value] of Object.entries(score.totals) as [PropertyKey, number][]) {
      if (value === 0) continue;
      if (ALREADY_SHOWN_IN_TOTALS.has(prop)) continue;
      const def = PROPERTIES[prop];
      if (!def) continue;
      // Hide internal-only properties.
      if (def.legacy) continue;
      const category = def.category;
      if (!out.has(category)) out.set(category, []);
      out.get(category)!.push([prop, value]);
    }
    // Sort each group alphabetically by key for stable display.
    for (const list of out.values()) {
      list.sort((a, b) => a[0].localeCompare(b[0]));
    }
    return out;
  }, [score]);

  if (grouped.size === 0) return null;

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Other Properties
      </div>
      <div className="space-y-1.5">
        {CATEGORY_DISPLAY_ORDER.map(({ category, label }) => {
          const entries = grouped.get(category);
          if (!entries || entries.length === 0) return null;
          return (
            <div key={category}>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mb-0.5">
                {label}
              </div>
              <div className="flex flex-wrap gap-1">
                {entries.map(([prop, value]) => (
                  <span
                    key={prop}
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-0.5 rounded border",
                      chipStyle(prop).chip,
                    )}
                    title={formatPropertyTooltip(prop, value, score)}
                  >
                    {formatChipLabel(prop, value)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatPropertyTooltip(
  prop: PropertyKey,
  value: number,
  score: LoadoutScore | null,
): string {
  if (!score) return prop;
  const eq = score.equipmentTotals[prop] ?? 0;
  const base = score.baseline[prop] ?? 0;
  if (eq !== 0 && base !== 0) return `${prop}: ${value} (${eq} from equipment + ${base} baseline)`;
  if (eq !== 0) return `${prop}: ${value} (from equipment)`;
  if (base !== 0) return `${prop}: ${value} (from baseline)`;
  return `${prop}: ${value}`;
}

function ConstraintStatus({
  floors,
  score,
}: {
  floors: Floor[];
  score: LoadoutScore | null;
}) {
  const totals = score?.totals ?? {};
  // Collapse duplicate-prop floors (UI may allow them but the strictest
  // value is what matters).
  const effective = new Map<PropertyKey, number>();
  for (const f of floors) {
    const existing = effective.get(f.prop);
    if (existing === undefined || f.value > existing) {
      effective.set(f.prop, f.value);
    }
  }
  return (
    <div className="bg-secondary/20 rounded p-2 space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Constraints
      </div>
      {[...effective.entries()].map(([prop, floor]) => {
        const actual = totals[prop] ?? 0;
        const met = actual >= floor;
        return (
          <div
            key={prop}
            className="flex items-center justify-between text-xs font-mono"
          >
            <span className={chipStyle(prop).label}>
              {prop} ≥ {floor}
            </span>
            <span
              className={met ? "text-green-400" : "text-red-400"}
              title={met ? "Satisfied" : "Not met"}
            >
              {met ? "✓" : "✗"} {actual}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BigStat({
  label,
  value,
  equipment,
  baseline,
}: {
  label: string;
  value: number;
  equipment: number;
  baseline: number;
}) {
  return (
    <div className="bg-secondary/20 rounded px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-xl text-foreground">{value}</div>
      {(equipment !== 0 || baseline !== 0) && (
        <div className="text-[9px] text-muted-foreground font-mono">
          {equipment !== 0 && <span>{equipment} eq</span>}
          {equipment !== 0 && baseline !== 0 && <span> + </span>}
          {baseline !== 0 && <span>{baseline} base</span>}
        </div>
      )}
    </div>
  );
}

function PipRow({
  prop,
  capped,
  uncapped,
  equipment,
  baseline,
}: {
  prop: PropertyKey;
  capped: number;
  uncapped: number;
  equipment: number;
  baseline: number;
}) {
  const def = PROPERTIES[prop];
  const style = chipStyle(prop);
  const maxCap = def?.cap?.max ?? 1;
  const minCap = def?.cap?.min ?? 0;
  const isPip = def?.rendering === "pip";
  const totalPips = isPip ? Math.max(maxCap, 3) : 1;
  const filled = Math.max(0, Math.min(capped, totalPips));
  // Only show negative pips visually if the value is negative.
  const negativeFilled = capped < 0 ? Math.min(Math.abs(capped), Math.abs(minCap)) : 0;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn("font-mono text-xs", style.label)}>{prop}</span>
      <div className="flex items-center gap-2">
        {isPip ? (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: totalPips }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3.5 h-3 border rounded-sm",
                  i < filled
                    ? style.pipFill
                    : i < negativeFilled
                      ? "bg-red-900/40 border-red-500"
                      : style.pipEmpty,
                )}
              />
            ))}
          </div>
        ) : (
          <span className="font-mono text-xs text-foreground">
            {def?.rendering === "bool" ? (capped ? "yes" : "—") : capped}
          </span>
        )}
        {uncapped !== capped && (
          <span className="text-[10px] text-amber-400/80 font-mono">
            (raw {uncapped})
          </span>
        )}
        {(equipment !== 0 || baseline !== 0) && (
          <span
            className="text-[11px] font-mono text-right whitespace-nowrap"
            title={breakdownTooltip(equipment, baseline)}
          >
            {formatBreakdown(equipment, baseline)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatBreakdown(eq: number, base: number): ReactNode {
  if (eq === 0 && base === 0) return "";
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
  if (eq === 0) {
    return <span className="text-sky-400/80">{fmt(base)} base</span>;
  }
  if (base === 0) {
    return <span className="text-muted-foreground">{fmt(eq)} eq</span>;
  }
  return (
    <>
      <span className="text-muted-foreground">{fmt(eq)} eq</span>
      <span className="text-muted-foreground/60"> + </span>
      <span className="text-sky-400/80">{fmt(base)} base</span>
    </>
  );
}

function breakdownTooltip(eq: number, base: number): string {
  if (base !== 0 && eq !== 0) {
    return `${eq} from equipped items + ${base} from non-equipment baseline (species / god / mutations / form, derived from the morgue's defenses block)`;
  }
  if (base !== 0) {
    return `${base} from non-equipment baseline (species / god / mutations / form, derived from the morgue's defenses block)`;
  }
  return `${eq} from equipped items`;
}

// ────────────────────────────────────────────────────────────────────────
// Loadout modification helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * Add an item to the loadout, evicting whatever conflicts.
 *
 *   - Single-slot items replace the current occupant of that slot.
 *   - For ring slots (cap > 1), fill the next available; if full, evict
 *     the earliest ring.
 *   - Multi-slot items evict ALL items in their occupied slots.
 *   - Two-handed weapons evict the offhand slot (if rules require it).
 */
/**
 * Add an item to the loadout, evicting whatever conflicts. Locked items
 * are never evicted — if equipping `item` would require evicting a
 * locked item, the operation is a no-op and `current` is returned
 * unchanged. (Caller decides whether to surface a message; the UI
 * currently just silently refuses.)
 */
function addItemToLoadout(
  current: ParsedItem[],
  item: ParsedItem,
  rules: SpeciesEquipmentRules,
  lockedIds: ReadonlySet<string> = new Set(),
): ParsedItem[] {
  let next = [...current];
  const isLocked = (it: ParsedItem) => lockedIds.has(it.id);

  // Slots the new item occupies.
  const occupiedSlots = new Set<ItemSlot>(item.slots);

  // Two-handed weapon: also evict offhand if rule applies.
  const isTwoHander =
    item.category === "weapon" &&
    "hands" in item.baseType &&
    item.baseType.hands === 2 &&
    rules.twoHanderBlocksOffhand;
  if (isTwoHander) occupiedSlots.add("offhand");

  // Pre-check: any locked item in a slot we'd need to evict? Bail.
  // Use effective capacity of the post-state (next + item) so a granter
  // we're about to equip (e.g. macabre finger necklace) is credited
  // when checking ring availability.
  const postCap = effectiveCapacity(rules, [...next, item]);
  for (const slot of occupiedSlots) {
    const cap = postCap[slot] ?? 0;
    const inSlot = next.filter((e) => e.slots.includes(slot));
    const lockedInSlot = inSlot.filter(isLocked);
    if (lockedInSlot.length >= cap) return current;
    if (inSlot.length >= cap) {
      // We'd need to evict someone. If the only candidates are locked,
      // refuse.
      const evictable = inSlot.filter((e) => !isLocked(e));
      if (evictable.length === 0) return current;
    }
  }
  // 2h vs offhand: if equipping a 2h and there's a locked offhand, refuse.
  if (item.slots.includes("offhand") && rules.twoHanderBlocksOffhand) {
    const lockedTwoHanders = next.filter(
      (e) =>
        isLocked(e) &&
        e.category === "weapon" &&
        "hands" in e.baseType &&
        e.baseType.hands === 2,
    );
    if (lockedTwoHanders.length > 0) return current;
  }

  // If the new item is offhand and there's a non-locked 2h weapon equipped, evict it.
  if (item.slots.includes("offhand") && rules.twoHanderBlocksOffhand) {
    next = next.filter((existing) => {
      if (
        existing.category === "weapon" &&
        "hands" in existing.baseType &&
        existing.baseType.hands === 2
      ) {
        return false;
      }
      return true;
    });
  }

  // For each slot the item occupies, free up space — prefer to evict
  // non-locked items first. Use post-state effective cap so a granter
  // we're about to equip gets credit when judging how much to evict.
  for (const slot of occupiedSlots) {
    const cap = postCap[slot] ?? 0;
    const currentInSlot = next.filter((e) => e.slots.includes(slot)).length;
    if (currentInSlot >= cap) {
      const toRemove = currentInSlot - cap + 1;
      let removed = 0;
      // Evict non-locked first (oldest first).
      next = next.filter((e) => {
        if (removed >= toRemove) return true;
        if (e.slots.includes(slot) && !isLocked(e)) {
          removed++;
          return false;
        }
        return true;
      });
    }
  }

  next.push(item);

  // Granter-swap reconciliation: if we just evicted a slot-granter
  // (e.g. replaced the macabre finger necklace with a different
  // amulet) the rest of the loadout may now overflow another slot
  // (the granted ring slot vanished). Evict the oldest non-locked
  // items in any overflowing slot. If the overflow is entirely
  // locked items, leave the loadout in an over-capacity state — the
  // legality check will surface it; we don't silently drop the
  // user's pinned items.
  const finalCap = effectiveCapacity(rules, next);
  const slotsToCheck = new Set<ItemSlot>();
  for (const e of next) for (const s of e.slots) slotsToCheck.add(s);
  for (const slot of slotsToCheck) {
    const cap = finalCap[slot] ?? 0;
    let used = next.filter((e) => e.slots.includes(slot)).length;
    if (used <= cap) continue;
    next = next.filter((e) => {
      if (used <= cap) return true;
      if (e === item) return true; // never evict the just-added item
      if (e.slots.includes(slot) && !isLocked(e)) {
        used--;
        return false;
      }
      return true;
    });
  }

  return next;
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function speciesRulesFor(data: MorgueData): SpeciesEquipmentRules | null {
  if (!data.race) return null;
  const code = getSpeciesCode(data.race);
  if (!code) return null;
  return getSpeciesEquipmentRules(code);
}

function UnsupportedMessage({
  reason,
  race,
}: {
  reason: "missing-inventory-data" | "unknown-species";
  race?: string | null;
}) {
  return (
    <Card className="bg-card border-border py-4 gap-3">
      <CardContent className="text-sm text-muted-foreground flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          {reason === "missing-inventory-data" ? (
            <>
              This morgue doesn&apos;t have the structured inventory data the
              optimizer needs. Two common causes:
              <ul className="list-disc list-inside mt-1.5 space-y-1">
                <li>
                  The morgue is from DCSS pre-0.33 — older versions use a
                  different artefact format that isn&apos;t supported.
                </li>
                <li>
                  The morgue was parsed and cached before the optimizer feature
                  shipped, so the cached data is missing the new fields. Load
                  the source URL directly (paste it in the URL box above) to
                  re-parse it.
                </li>
              </ul>
            </>
          ) : (
            <>
              Couldn&apos;t identify species &quot;{race ?? "unknown"}&quot; for
              slot rules. This may be a character dump without the
              &quot;Began as…&quot; line; species-aware slot rules are disabled.
            </>
          )}
        </span>
      </CardContent>
    </Card>
  );
}

// `LoadoutScore` is imported only for the type annotation; keep the
// import side-effect-free for build tools.
export type { LoadoutScore };
