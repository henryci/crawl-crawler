/**
 * Example questions: the "try this" links shown on the home page and in
 * each page's guide. This file is meant to be edited by hand.
 *
 * Each entry is a question a player might actually ask, plus a link to the
 * view that answers it. Links are built with the helpers in lib/links.ts so
 * parameter names stay correct; every filter, tab and tab setting a page
 * supports can be expressed there.
 *
 * To add a question: append an entry. Set `featured: true` to show it on
 * the home page (keep the featured set to three or four). To check a link,
 * open it: the page should load with the filters and tab already applied.
 */

import {
  analyticsLink,
  morgueLink,
  recordsLink,
  playerLink,
  SAMPLE_CHARACTER_URL,
} from "@/lib/links";

export type QuestionPage = "analytics" | "morgue" | "records" | "player";

export interface Question {
  /** Stable id, used as a React key. */
  id: string;
  /** The question as a player would ask it. */
  question: string;
  /** One sentence on what the linked view shows, or what to look for in it. */
  blurb: string;
  /** Which page answers it; the guide on that page lists it. */
  page: QuestionPage;
  href: string;
  /** Show on the home page. */
  featured?: boolean;
  /** Keep in the file but render nowhere (e.g. a feature not yet announced). */
  unlisted?: boolean;
}

export const QUESTIONS: Question[] = [
  // ───────────────────────── Streak Analytics ─────────────────────────
  {
    id: "mibe-skills",
    question: "What do Minotaur Berserkers train, and when?",
    blurb: "Skill training by XL across every Minotaur Berserker streak win, plus where the skills ended up.",
    page: "analytics",
    href: analyticsLink({
      tab: "skills",
      species: ["Minotaur"],
      backgrounds: ["Berserker"],
    }),
    featured: true,
  },
  {
    id: "fifteen-rune-gods",
    question: "Which gods carry 15-rune wins?",
    blurb: "15-rune streak wins grouped by god, with how many turns the median run took.",
    page: "analytics",
    href: analyticsLink({
      tab: "breakdown",
      minRunes: 15,
      breakdown: { groupBy: ["god"], metrics: ["count", "median_turns"] },
    }),
    featured: true,
  },
  {
    id: "where-streaks-die",
    question: "Where do streaks actually die?",
    blurb: "The game that ended each streak, grouped by rune count. Most never reach the first rune.",
    page: "analytics",
    href: analyticsLink({
      tab: "breakdown",
      outcome: "losses",
      breakdown: {
        groupBy: ["runes"],
        metrics: ["count", "avg_xl"],
        sortBy: "runes",
        sortDir: "asc",
      },
    }),
    featured: true,
  },
  {
    id: "species-meta-trend",
    question: "How has the species meta shifted across versions?",
    blurb: "The most-played species in streak wins, one line per species, across game versions.",
    page: "analytics",
    href: analyticsLink({
      tab: "trends",
      trends: { track: "species", metric: "count", topN: 8 },
    }),
  },
  {
    id: "species-god-pivot",
    question: "Which species and god pairings do streakers favor?",
    blurb: "A species-by-god grid of streak games. Switch the pivot's metric to compare win rates instead of counts.",
    page: "analytics",
    href: analyticsLink({
      tab: "breakdown",
      // Losses included: over wins alone every win rate would be 100%.
      outcome: "all",
      breakdown: { groupBy: ["species", "god"], view: "pivot" },
    }),
  },
  {
    id: "fastest-species",
    question: "Which species win fastest?",
    blurb: "Streak wins by species, sorted by median turn count.",
    page: "analytics",
    href: analyticsLink({
      tab: "breakdown",
      breakdown: {
        groupBy: ["species"],
        metrics: ["count", "median_turns", "avg_runes"],
        sortBy: "median_turns",
        sortDir: "asc",
      },
    }),
  },
  {
    id: "melee-only-species",
    question: "Which species win without casting?",
    blurb: "Wins that finished with Fighting at 20 or more and Spellcasting under 5, grouped by species.",
    page: "analytics",
    href: analyticsLink({
      tab: "breakdown",
      skills: [
        { name: "Fighting", level: 20 },
        { name: "Spellcasting", level: 5, mode: "lt" },
      ],
      breakdown: { groupBy: ["species"], metrics: ["count", "median_turns"] },
    }),
  },
  {
    id: "conjurer-offhand",
    question: "Do winning Conjurers carry a shield?",
    blurb: "The off-hand split, the most common item per slot and the resistances Conjurers finished with in wins since 0.30.",
    page: "analytics",
    href: analyticsLink({
      tab: "equipment",
      backgrounds: ["Conjurer"],
      minVersion: "0.30",
    }),
    featured: true,
  },
  {
    id: "minotaur-kit",
    question: "What are winning Minotaurs wearing at the end?",
    blurb: "Body armour, weapon and jewellery choices across Minotaur wins since 0.30, plus the resist totals they reached.",
    page: "analytics",
    href: analyticsLink({
      tab: "equipment",
      species: ["Minotaur"],
      minVersion: "0.30",
    }),
  },
  {
    id: "decj-spells",
    question: "What spells do Deep Elf Conjurers finish with?",
    blurb: "Spells memorised at the end of Deep Elf Conjurer streak wins, most common first.",
    page: "analytics",
    href: analyticsLink({
      tab: "spells",
      species: ["Deep Elf"],
      backgrounds: ["Conjurer"],
    }),
  },
  {
    id: "prolific-streakers",
    question: "Who has the most streak wins?",
    blurb: "Players ranked by number of wins inside tracked streaks. Put a name in the Player Name filter and open Games to see how they play.",
    page: "analytics",
    href: analyticsLink({
      tab: "breakdown",
      breakdown: {
        groupBy: ["player_name"],
        metrics: ["count", "avg_runes", "median_turns"],
        limit: 50,
      },
    }),
  },

  // ───────────────────── Morgue / Character Viewer ─────────────────────
  {
    id: "optimizer-resists",
    question: "What's the best resistance loadout for this character?",
    blurb: "A sample 0.34 character with the optimizer set to maximize total elemental resistances. Press Optimize and compare to what they're wearing.",
    page: "morgue",
    href: morgueLink({
      url: SAMPLE_CHARACTER_URL,
      optimizer: { priorities: ["max-all-resist"] },
    }),
    unlisted: true,
  },
  {
    id: "optimizer-ac-with-floors",
    question: "Max AC, but keep rF+ and rC+?",
    blurb: "The same character with AC as the objective and two \"require at least\" constraints. Constraints are hard: a loadout that misses one is discarded.",
    page: "morgue",
    href: morgueLink({
      url: SAMPLE_CHARACTER_URL,
      optimizer: {
        priorities: ["max-ac", "max-all-resist"],
        floors: [
          { prop: "rF", value: 1 },
          { prop: "rC", value: 1 },
        ],
      },
    }),
    unlisted: true,
  },
  {
    id: "optimizer-stat-explorer",
    question: "How much resistance does each point of Int cost?",
    blurb: "The Stat Explorer view: every trade-off between the objective and Str, Int and Dex that the inventory allows.",
    page: "morgue",
    href: morgueLink({
      url: SAMPLE_CHARACTER_URL,
      optimizer: { priorities: ["max-all-resist"], view: "stats" },
    }),
    unlisted: true,
  },
  {
    id: "top-scoring-win",
    question: "What did the highest-scoring streak win look like?",
    blurb: "A 15-rune Gnoll Air Elementalist of Cheibriados in under 24,000 turns. Check the Skills tab for the training order.",
    page: "morgue",
    href: morgueLink({
      hash: "d8543b11c493462cc13f3d5c55ebba84973ac9972fe1a7451d808ece5c93fb74",
      tab: "skills",
    }),
  },

  // ──────────────────────────── Combo Records ───────────────────────────
  {
    id: "mibe-record",
    question: "What is the Minotaur Berserker record?",
    blurb: "The combo table filtered to one species and background. Clear the background filter to see every Minotaur record.",
    page: "records",
    href: recordsLink({ species: "Mi", background: "Be" }),
  },
  {
    id: "yermak-records",
    question: "How many combo records does Yermak hold?",
    blurb: "Every record held by one player. Try your own name.",
    page: "records",
    href: recordsLink({ player: "Yermak" }),
  },

  // ─────────────────────────── Player Summary ───────────────────────────
  {
    id: "sergey-player",
    question: "What does the most prolific streaker's history look like?",
    blurb: "Sergey has the most wins inside tracked streaks. The summary shows wins over time, streaks and combo coverage.",
    page: "player",
    href: playerLink("Sergey"),
  },
];

export function questionsForPage(page: QuestionPage): Question[] {
  return QUESTIONS.filter((q) => q.page === page && !q.unlisted);
}

export function featuredQuestions(): Question[] {
  return QUESTIONS.filter((q) => q.featured && !q.unlisted);
}
