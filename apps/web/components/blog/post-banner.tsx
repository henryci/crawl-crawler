import { EntranceBanner } from "@/components/blog/entrance-banner";
import { ItemsBanner } from "@/components/blog/items-banner";
import { PostCover } from "@/components/blog/post-cover";
import type { PostMeta } from "@/content/blog/types";

interface PostBannerProps {
  meta: PostMeta;
  slug: string;
  size?: "full" | "compact";
}

/** Picks the right visual for a post: a bespoke banner if declared, else its glyph cover. */
export function PostBanner({ meta, slug, size = "full" }: PostBannerProps) {
  if (meta.banner === "entrance") return <EntranceBanner size={size} />;
  if (meta.banner && typeof meta.banner === "object") return <ItemsBanner items={meta.banner.items} size={size} />;
  if (size === "compact") {
    return <PostCover glyphs={meta.cover?.glyphs ?? "@"} seed={slug} cols={8} rows={3} size={24} className="shrink-0 w-max" />;
  }
  return <PostCover glyphs={meta.cover?.glyphs ?? "@"} seed={slug} cols={28} rows={4} fluid />;
}
