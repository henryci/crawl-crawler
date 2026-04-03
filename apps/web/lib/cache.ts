export const DB_CACHE_TAG = 'db-data';
export const DB_CACHE_REVALIDATE_SECONDS = 60 * 60 * 24;

interface CacheDebugHeadersInput {
  route: string;
  cacheable: boolean;
  cachedAtUnixMs?: number;
  revalidateSeconds?: number | null;
}

export function buildCacheDebugHeaders(input: CacheDebugHeadersInput): HeadersInit {
  const headers = new Headers();
  headers.set('x-crawl-cache-route', input.route);
  headers.set('x-crawl-cacheable', input.cacheable ? '1' : '0');
  headers.set(
    'x-crawl-cache-revalidate-seconds',
    input.revalidateSeconds === null
      ? 'none'
      : String(input.revalidateSeconds ?? DB_CACHE_REVALIDATE_SECONDS)
  );
  headers.set('x-crawl-instance', `${process.env.HOSTNAME ?? 'unknown'}:${process.pid}`);

  if (!input.cacheable || input.cachedAtUnixMs === undefined) {
    headers.set('x-crawl-cache-status', 'bypass');
    return headers;
  }

  const cacheAgeSeconds = Math.max(
    0,
    Math.floor((Date.now() - input.cachedAtUnixMs) / 1000)
  );
  headers.set('x-crawl-cache-status', cacheAgeSeconds > 0 ? 'hit' : 'miss-or-fresh');
  headers.set('x-crawl-cache-created-at', new Date(input.cachedAtUnixMs).toISOString());
  headers.set('x-crawl-cache-age-seconds', String(cacheAgeSeconds));

  return headers;
}
