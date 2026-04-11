import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed hosts for the proxy.
 * Only DCSS-related servers are permitted to prevent abuse.
 */
const ALLOWED_HOSTS = [
  'crawl.akrasiac.org',
  'crawl.xtahua.com',
  'underhound.eu',
  'crawl.dcss.io',
  'cbro.berotato.org',
  'crawl.kelbi.org',
  'crawl.project357.org',
  'lazy-life.ddo.jp',
  'crawl.develz.org',
];

const UNDERHOUND_HOST = 'underhound.eu';
const UNDERHOUND_USERNAME_ENV = 'UNDERHOUND_BASIC_AUTH_USERNAME';
const UNDERHOUND_PASSWORD_ENV = 'UNDERHOUND_BASIC_AUTH_PASSWORD';

/**
 * Check if a URL's host is in our allowlist.
 */
function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ALLOWED_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

function isUnderhoundHost(hostname: string): boolean {
  return hostname === UNDERHOUND_HOST || hostname.endsWith(`.${UNDERHOUND_HOST}`);
}

function getAuthHeaderForUrl(urlString: string): string | undefined {
  const url = new URL(urlString);
  if (!isUnderhoundHost(url.hostname)) {
    return undefined;
  }

  const username = process.env[UNDERHOUND_USERNAME_ENV];
  const password = process.env[UNDERHOUND_PASSWORD_ENV];

  if (!username || !password) {
    console.warn(
      `Missing underhound credentials. Set ${UNDERHOUND_USERNAME_ENV} and ${UNDERHOUND_PASSWORD_ENV}.`
    );
    return undefined;
  }

  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json(
      { error: 'URL not allowed. Only DCSS server URLs are permitted.' },
      { status: 403 }
    );
  }

  try {
    const authHeader = getAuthHeaderForUrl(targetUrl);
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CrawlCrawler/1.0)',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const text = await response.text();

    // Determine content type based on URL or response
    const contentType = targetUrl.endsWith('.txt')
      ? 'text/plain; charset=utf-8'
      : 'text/html; charset=utf-8';

    return new NextResponse(text, {
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}
