/**
 * Centralized tooltip content for the application.
 * Edit this file to update tooltip text across the entire app.
 */

// =============================================================================
// NAVIGATION TOOLTIPS
// =============================================================================

export const navTooltips = {
  analytics: "Explore patterns and insights from winning streak games",
  morgueViewer: "Parse and view DCSS morgue files in a readable format",
  playerSummary: "Look up any player's statistics and game history",
  records: "Browse game records: fastest wins, highest scores, and more",
  about: "Learn about CrawlCrawler and where the data comes from",
} as const;

// =============================================================================
// ANALYTICS TAB TOOLTIPS
// =============================================================================

export const analyticsTabTooltips = {
  games: "Browse individual games matching your filters",
  deepDive: "Build custom aggregations to analyze patterns in the data",
  trends: "See how species, backgrounds, and gods change over game versions",
  skills: "Explore skill training patterns across different builds",
  spells: "Discover which spells are most commonly used",
} as const;

// =============================================================================
// FILTER TOOLTIPS (for future use)
// =============================================================================

export const filterTooltips = {
  species: "Filter by character species (race)",
  background: "Filter by starting background (class)",
  god: "Filter by worshipped god at end of game",
  outcome: "Filter by game outcome (win or death)",
  minVersion: "Only include games from this version or newer",
  maxVersion: "Only include games up to this version",
  minRunes: "Minimum number of runes collected",
  maxRunes: "Maximum number of runes collected",
  minTurns: "Minimum number of turns taken",
  maxTurns: "Maximum number of turns taken",
  player: "Search for a specific player by name",
  excludeLegacy: "Hide species and backgrounds that have been removed from the game",
} as const;
