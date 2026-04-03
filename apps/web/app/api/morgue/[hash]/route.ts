import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { query } from '@crawl-crawler/game-data-db';
import type { MorgueData } from 'dcss-morgue-parser';
import { DB_CACHE_TAG, buildCacheDebugHeaders } from '@/lib/cache';

function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

const fetchMorgueData = unstable_cache(
  async (hash: string): Promise<{ data: MorgueData | null; cachedAtUnixMs: number }> => {
    const result = await query<{ parsed_json: MorgueData }>(`
      SELECT parsed_json
      FROM parsed_morgue_json
      WHERE morgue_hash = $1
    `, [hash]);

    return {
      data: result.rows[0]?.parsed_json ?? null,
      cachedAtUnixMs: Date.now(),
    };
  },
  ['morgue'],
  { tags: [DB_CACHE_TAG] }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    if (!isValidHash(hash)) {
      return NextResponse.json(
        { error: 'Invalid hash format' },
        { status: 400 }
      );
    }

    const cached = await fetchMorgueData(hash.toLowerCase());

    if (!cached.data) {
      return NextResponse.json(
        { error: 'Morgue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: cached.data },
      {
        headers: buildCacheDebugHeaders({
          route: '/api/morgue/[hash]',
          cacheable: true,
          cachedAtUnixMs: cached.cachedAtUnixMs,
          revalidateSeconds: null,
        }),
      }
    );
  } catch (error) {
    console.error('Morgue API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch morgue data' },
      { status: 500 }
    );
  }
}
