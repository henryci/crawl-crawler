/**
 * Centralized tooltip content for the application.
 * Edit this file to update tooltip text across the entire app.
 */

// =============================================================================
// NAVIGATION TOOLTIPS
// =============================================================================

export const navTooltips = {
  analytics: "Filter through streak games looking for insights. For example, what skills do DrEE typically train?",
  morgueViewer: "A morgue file viewer, bare-bones today but has potential",
  playerSummary: "A view of a player's games with basic sorting and filtering",
  records: "Sortable, filterable list of combo records. Find your next goal",
  blog: "Findings from the data, each one linked to the live view that shows it, plus what changed on the site",
  about: "Site status, words from me, limited value",
  appeal: "Three proposals for the DCSS dev community",
} as const;

// =============================================================================
// ANALYTICS TAB TOOLTIPS
// =============================================================================

export const analyticsTabTooltips = {
  games: "Browse individual games matching your filters",
  breakdown: "Break down the data by dimensions and compare metrics",
  trends: "See changes over time (work in progress)",
  skills: "Skill training patterns",
  spells: "See which spells are most commonly used",
  equipment: "What the characters were wearing when the game ended, slot by slot, plus their resistances",
} as const;

// =============================================================================
// FIRST-VISIT HINTS
// One line shown the first time a tab is opened, then dismissed for good.
// =============================================================================

export const tabHints = {
  analyticsBreakdown:
    "Pick up to three dimensions to group by and the metrics to compare. With exactly two dimensions, the Pivot view lays them out as a grid.",
  analyticsTrends:
    "Each line follows one value of the tracked dimension across game versions. Top N keeps only the most common values so the chart stays readable.",
  analyticsSkills:
    "The heatmap shows which skills were being trained at each XL; final skills shows where they ended up. Narrow the filters first: the picture is sharpest for a single combo.",
  analyticsEquipment:
    "Everything here is the state at the end of the game: the off-hand split, the most common item per slot, and the resistance totals reached. Filter to your own species and background to get a kit to aim for.",
  analyticsSpells:
    "Counts how many games had each spell memorised at the end. Filter to a background or god to see a realistic spellbook.",
  morgueOptimizer:
    "Pick what to maximize, add any \"require at least\" constraints, then press Optimize. Lock worn items you want to keep and ban backpack items you don't want suggested.",
} as const;

// =============================================================================
// POINT-OF-USE HELP
// Short explanations attached to individual controls via <HelpTip>.
// =============================================================================

export const optimizerTooltips = {
  maximize:
    "The optimizer searches every legal combination of your inventory for the loadout that scores highest here. Add rows to break ties: a lower row only matters once the rows above it can't be improved.",
  requireAtLeast:
    "Hard constraints. Loadouts that miss any of these are discarded before scoring, so an impossible constraint means no result rather than a near miss.",
  viewToggle:
    "Equipment shows the single best loadout. Stat Explorer maps the trade-offs instead: how much of your objective each extra point of Str, Int or Dex costs.",
  lock: "Locked items stay equipped through every optimize pass.",
  ban: "Banned items are removed from the candidate pool entirely.",
  editTags:
    "The parser occasionally misses a property. Click an item's tags to correct them; edits feed straight into the optimizer.",
  sample:
    "Loads a bundled 0.34 character dump so you can try the optimizer without a dump of your own.",
} as const;

export const analyticsControlTooltips = {
  skillFilter:
    "Keep games where the character's final skill level meets the condition. Combine up to three to describe a build, e.g. Fighting ≥ 20 and Spellcasting < 5.",
  presets:
    "Default shows wins only, which is what streak analysis is usually about. Clear removes every filter, including the win requirement.",
  excludeLegacy: "Hide species and backgrounds that have since been removed from the game.",
  shareLink:
    "Every filter, tab and tab setting is in the page URL, so copying it shares exactly this view.",
} as const;
