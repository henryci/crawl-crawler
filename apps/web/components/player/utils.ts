/**
 * Generate a URL to the morgue viewer page with the morgue URL pre-populated.
 */
export function getMorgueViewerUrl(morgueUrl: string | null | undefined): string | null {
  if (!morgueUrl) return null;
  return `/morgue?url=${encodeURIComponent(morgueUrl)}`;
}
