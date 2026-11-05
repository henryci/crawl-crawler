import type { ComponentType } from "react";

/** Colour accents available to a post cover; these are the site's theme tokens. */
export type CoverAccent = "gold" | "mana" | "health" | "special";

export interface PostCover {
  /**
   * DCSS item glyphs scattered across the cover tiles, e.g. ")[=\"" for
   * weapons, armour, rings and amulets. "@" places the analyst sprite.
   */
  glyphs: string;
  /** Tints the card's tag and title hover. Defaults to gold. */
  accent?: CoverAccent;
}

export interface PostMeta {
  title: string;
  /** One sentence shown on the index and used as the page description. */
  description: string;
  /** ISO date, e.g. "2026-10-19". */
  date: string;
  /** Short label shown on the card, e.g. "Findings" or "Start here". */
  tag?: string;
  cover?: PostCover;
  /**
   * A banner that replaces the generated cover: the dungeon entrance scene,
   * or a row of item tiles by file name (see public/images/tiles/items).
   */
  banner?: "entrance" | { items: string[] };
}

export interface Post {
  slug: string;
  meta: PostMeta;
  Content: ComponentType;
}
