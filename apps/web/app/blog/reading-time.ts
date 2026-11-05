import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Rough reading time for a post, from its MDX source. Only runs on the
 * server at render/build time, so the file read never reaches the client.
 */
export function readingMinutes(slug: string): number {
  try {
    const source = readFileSync(path.join(process.cwd(), "content", "blog", `${slug}.mdx`), "utf8");
    const prose = source
      .replace(/^import .*$/gm, "")
      .replace(/^export const [\s\S]*?;$/gm, "")
      .replace(/<[^>]+>/g, " ");
    const words = prose.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  } catch {
    return 1;
  }
}
