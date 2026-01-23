import { NextResponse } from 'next/server';
import { query } from '@crawl-crawler/game-data-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get service metadata from database
    const result = await query<{ key: string; value: string; updated_at: Date }>(
      'SELECT key, value, updated_at FROM service_metadata'
    );

    const metadata: Record<string, { value: string; updatedAt: string }> = {};
    for (const row of result.rows) {
      metadata[row.key] = {
        value: row.value,
        updatedAt: row.updated_at.toISOString(),
      };
    }

    // Also get total games count
    const gamesResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM games'
    );
    const totalGamesCount = parseInt(gamesResult.rows[0]?.count ?? '0', 10);

    return NextResponse.json({
      metadata,
      totalGamesCount,
    });
  } catch (error) {
    console.error('Service metadata API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service metadata' },
      { status: 500 }
    );
  }
}
