import Image from "next/image";
import { PostCover } from "@/components/blog/post-cover";
import { cn } from "@/lib/utils";

interface ItemsBannerProps {
  /** Tile file names under public/images/tiles/items, without extension. */
  items: string[];
  /** Compact for list cards; full for the featured card and the post header. */
  size?: "full" | "compact";
  className?: string;
}

/**
 * A row of DCSS item tiles laid on dungeon floor, scaled up pixel-crisp.
 * The middle tile is drawn larger so a post can lead with its headline item.
 */
export function ItemsBanner({ items, size = "full", className }: ItemsBannerProps) {
  const full = size === "full";
  const shown = full ? items.slice(0, 9) : items.slice(0, 4);
  const mid = Math.floor(shown.length / 2);
  const base = full ? 64 : 30;
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md",
        full ? "h-44 sm:h-48" : "h-[88px] w-[192px] shrink-0",
        className,
      )}
    >
      <PostCover glyphs="" seed={items.join(",")} cols={full ? 28 : 8} rows={full ? 6 : 3} fluid className="absolute inset-0 rounded-md" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, color-mix(in oklab, var(--gold) 30%, transparent) 0%, color-mix(in oklab, var(--gold) 10%, transparent) 35%, transparent 70%)",
        }}
      />
      <div className={cn("absolute inset-0 flex items-end justify-center", full ? "gap-3 pb-5 sm:gap-4" : "gap-1.5 pb-3")}>
        {shown.map((name, i) => {
          const px = full && i === mid ? Math.round(base * 1.5) : base;
          return (
            <Image
              key={`${name}-${i}`}
              src={`/images/tiles/items/${name}.png`}
              alt=""
              width={px}
              height={px}
              className={cn(full && i === mid && "drop-shadow-[0_0_16px_rgba(245,186,20,0.45)]")}
              style={{ imageRendering: "pixelated" }}
            />
          );
        })}
      </div>
    </div>
  );
}
