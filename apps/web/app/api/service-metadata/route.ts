import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { query } from '@crawl-crawler/game-data-db';
import { DB_CACHE_TAG } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const fetchServiceMetadata = unstable_cache(
  async () => {
    const [result, gamesResult] = await Promise.all([
      query<{ key: string; value: string; updated_at: Date }>(
        'SELECT key, value, updated_at FROM service_metadata'
      ),
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM games'
      ),
    ]);

    const metadata: Record<string, { value: string; updatedAt: string }> = {};
    for (const row of result.rows) {
      metadata[row.key] = {
        value: row.value,
        updatedAt: row.updated_at.toISOString(),
      };
    }

    const totalGamesCount = parseInt(gamesResult.rows[0]?.count ?? '0', 10);

    return { metadata, totalGamesCount };
  },
  ['service-metadata'],
  { tags: [DB_CACHE_TAG] }
);

export async function GET() {
  try {
    const data = await fetchServiceMetadata();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Service metadata API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service metadata' },
      { status: 500 }
    );
  }
}
