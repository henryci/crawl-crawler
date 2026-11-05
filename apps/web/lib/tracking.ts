/**
 * Thin wrapper over gtag for custom GA4 events.
 *
 * Every event name and parameter key used by the app is declared here so the
 * set stays small and reportable. GA4 only reports an event parameter once
 * it is registered as a custom dimension on the property; register these
 * (all event-scoped):
 *
 *   page, operation, source, tab, view, preset, objective, result,
 *   filters, dimensions, metrics, field, message
 *
 * Values are kept low-cardinality on purpose (names of fields, tabs and
 * views, never user-entered text or full URLs) so reports do not fragment
 * and GA's 100-character parameter limit is never hit.
 */

export type TrackingEventName =
  | "app_error"
  | "morgue_loaded"
  | "morgue_tab_changed"
  | "player_loaded"
  | "analytics_filters_applied"
  | "analytics_preset_applied"
  | "analytics_tab_changed"
  | "breakdown_run"
  | "breakdown_view_changed"
  | "trends_run"
  | "optimizer_run"
  | "optimizer_result"
  | "records_filters_applied"
  | "records_sorted"
  | "share_link_copied";

export type TrackingParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: TrackingParams) => void;
  }
}

const MAX_PARAM_LENGTH = 100;

function isTrackingEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.gtag === "function" &&
    process.env.NODE_ENV === "production"
  );
}

function clampParams(params: TrackingParams): TrackingParams {
  const clamped: TrackingParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    clamped[key] = typeof value === "string" ? value.slice(0, MAX_PARAM_LENGTH) : value;
  }
  return clamped;
}

/** Send a custom event. A no-op outside production or when gtag is absent. */
export function trackEvent(name: TrackingEventName, params: TrackingParams = {}): void {
  if (!isTrackingEnabled()) return;
  try {
    window.gtag?.("event", name, clampParams(params));
  } catch {
    // Analytics must never break the page.
  }
}

/**
 * Report a caught failure. `operation` names what the user was doing
 * ("fetch_morgue", "load_counts"); the message is the user-facing error.
 */
export function trackError(page: string, operation: string, error: unknown, extra: TrackingParams = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  trackEvent("app_error", { page, operation, message, ...extra });
}

/**
 * The keys of a filter object that are in play, as a stable string
 * ("gods,isWin,races"). A key counts when its value differs from the
 * default (or, with no defaults, when it is non-empty). This describes
 * which filters are used without sending their values.
 */
export function activeFilterKeys<T extends object>(filters: T, defaults?: T): string {
  const defaultValues = defaults ? new Map<string, unknown>(Object.entries(defaults)) : null;
  return Object.entries(filters)
    .filter(([key, value]) =>
      defaultValues?.has(key) ? !sameValue(value, defaultValues.get(key)) : !isEmpty(value),
    )
    .map(([key]) => key)
    .sort()
    .join(",");
}

/** Hostname of a URL, for "which server" breakdowns; "invalid" if unparsable. */
export function hostOf(url: string): string {
  try {
    return new URL(url, typeof window === "undefined" ? "http://localhost" : window.location.href).hostname;
  } catch {
    return "invalid";
  }
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "" || value === false) return true;
  return Array.isArray(value) && value.length === 0;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => item === b[i]);
  }
  return a === b;
}
