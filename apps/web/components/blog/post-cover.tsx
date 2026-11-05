import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A strip of dungeon floor tiles with DCSS item glyphs scattered across it,
 * in the style of the start page's map. Layout is deterministic from the
 * post slug so a cover never changes between renders or builds.
 */

interface PostCoverProps {
  glyphs: string;
  seed: string;
  cols?: number;
  rows?: number;
  /** Tile size in pixels. Ignored when `fluid`. */
  size?: number;
  /** Stretch to the container's width with square tiles. */
  fluid?: boolean;
  className?: string;
}

/** Colour per glyph, following the game's own conventions where it has one. */
const GLYPH_COLORS: Record<string, string> = {
  ")": "text-mana",        // weapons
  "(": "text-stone-300",   // missiles
  "[": "text-stone-200",   // armour
  "=": "text-gold",        // rings
  '"': "text-special",     // amulets
  "|": "text-health",      // staves
  "!": "text-special",     // potions
  "?": "text-foreground",  // scrolls
  "/": "text-mana",        // wands
  "$": "text-gold",        // gold
  "%": "text-stone-400",   // corpses
  "}": "text-health",      // misc evocables
  ">": "text-foreground",  // stairs down
  "<": "text-foreground",  // stairs up
  "_": "text-gold",        // altars
  "†": "text-muted-foreground",
};

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tile = { kind: "floor" } | { kind: "wall" } | { kind: "glyph"; glyph: string } | { kind: "player" };

function layout(glyphs: string, seed: string, cols: number, rows: number): Tile[][] {
  const random = rng(hashSeed(seed));
  const grid: Tile[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (random() < 0.14 ? { kind: "wall" } : { kind: "floor" })),
  );
  // Scatter the glyphs across the width: each glyph gets its own vertical
  // band so they spread out instead of clustering, with a random row.
  const cells = [...glyphs].slice(0, Math.floor((cols * rows) / 3));
  const band = cols / Math.max(cells.length, 1);
  cells.forEach((glyph, i) => {
    const x = Math.min(cols - 1, Math.floor(i * band + random() * band));
    const y = Math.floor(random() * rows);
    grid[y]![x] = glyph === "@" ? { kind: "player" } : { kind: "glyph", glyph };
  });
  return grid;
}

export function PostCover({
  glyphs,
  seed,
  cols = 12,
  rows = 3,
  size = 28,
  fluid = false,
  className,
}: PostCoverProps) {
  const grid = layout(glyphs, seed, cols, rows);
  return (
    <div
      aria-hidden
      className={cn("grid gap-0.5 rounded-md bg-black/40 p-1.5 border border-border/70", className)}
      style={
        fluid
          ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
          : {
              gridTemplateColumns: `repeat(${cols}, ${size}px)`,
              gridTemplateRows: `repeat(${rows}, ${size}px)`,
            }
      }
    >
      {grid.flatMap((row, y) =>
        row.map((tile, x) => (
          <div
            key={`${x}-${y}`}
            className={cn(
              "flex items-center justify-center font-mono leading-none",
              fluid && "aspect-square",
              tile.kind === "wall"
                ? "bg-stone-900 border border-stone-800"
                : "bg-stone-800/50 border border-stone-700/30",
            )}
            style={{ fontSize: fluid ? "clamp(11px, 1.5vw, 19px)" : Math.round(size * 0.6) }}
          >
            {tile.kind === "glyph" && (
              <span className={cn("font-semibold", GLYPH_COLORS[tile.glyph] ?? "text-foreground")}>
                {tile.glyph}
              </span>
            )}
            {tile.kind === "player" && (
              <Image
                src="/images/analyst-sprite.jpg"
                alt=""
                width={size - 6}
                height={size - 6}
                className={cn("rounded-sm border border-primary/70", fluid && "h-[78%] w-[78%]")}
                style={{ imageRendering: "pixelated" }}
              />
            )}
          </div>
        )),
      )}
    </div>
  );
}
