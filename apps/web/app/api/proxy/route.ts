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
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CrawlCrawler/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
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
