/**
 * Blog registry. To publish a post: add an .mdx file in this folder that
 * exports `meta` (title, description, date), import it below, and add one
 * entry. The slug becomes the URL: /blog/<slug>.
 */

import type { Post } from "./types";
import * as whatWinnersWear from "./what-winners-wear.mdx";
import * as welcome from "./welcome.mdx";

const ENTRIES: Post[] = [
  { slug: "what-winners-wear", meta: whatWinnersWear.meta, Content: whatWinnersWear.default },
  { slug: "welcome", meta: welcome.meta, Content: welcome.default },
];

/** Posts, newest first. */
export const POSTS: Post[] = [...ENTRIES].sort((a, b) => b.meta.date.localeCompare(a.meta.date));

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
