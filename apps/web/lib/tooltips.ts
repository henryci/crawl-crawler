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
  about: "Site status, words from me, limited value",
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
} as const;
