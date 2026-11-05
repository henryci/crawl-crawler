import Image from "next/image";
import { PostCover } from "@/components/blog/post-cover";
import { cn } from "@/lib/utils";

interface EntranceBannerProps {
  /** Compact for list cards; full for the featured card and the post header. */
  size?: "full" | "compact";
  className?: string;
}

/**
 * Banner for the welcome post: the dungeon's exit archway from the WebTiles
 * set, scaled up pixel-crisp over a floor of dungeon tiles, with the analyst
 * sprite at the threshold. The arch is the game's own "way out", repurposed
 * as the way in.
 */
export function EntranceBanner({ size = "full", className }: EntranceBannerProps) {
  const full = size === "full";
  const arch = full ? 128 : 56;
  const sprite = full ? 44 : 22;
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md",
        full ? "h-44 sm:h-48" : "h-[88px] w-[192px] shrink-0",
        className,
      )}
    >
      <PostCover glyphs="" seed="entrance" cols={full ? 28 : 8} rows={full ? 6 : 3} fluid className="absolute inset-0 rounded-md" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, color-mix(in oklab, var(--gold) 38%, transparent) 0%, color-mix(in oklab, var(--gold) 12%, transparent) 30%, transparent 62%)",
        }}
      />
      <div className="absolute inset-0 flex items-end justify-center gap-2 pb-3 sm:pb-4">
        <Image
          src="/images/analyst-sprite.jpg"
          alt=""
          width={sprite}
          height={sprite}
          className="rounded-sm border border-primary/70 shadow-lg shadow-primary/20"
          style={{ imageRendering: "pixelated", marginBottom: Math.round(arch * 0.08) }}
        />
        <Image
          src="/images/tiles/exit_dungeon.png"
          alt=""
          width={arch}
          height={arch}
          className="drop-shadow-[0_0_18px_rgba(245,186,20,0.35)]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}
