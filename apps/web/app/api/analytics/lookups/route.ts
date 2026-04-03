import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { query } from '@crawl-crawler/game-data-db';
import {
  LEGACY_SPECIES_NAMES,
  LEGACY_BACKGROUND_NAMES,
} from 'dcss-game-data';
import { DB_CACHE_TAG, buildCacheDebugHeaders } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const fetchLookupData = unstable_cache(
  async () => {
    const [racesResult, backgroundsResult, godsResult, skillsResult, versionsResult] = await Promise.all([
      query<{ id: number; name: string; code: string }>('SELECT id, name, code FROM races ORDER BY name'),
      query<{ id: number; name: string; code: string }>('SELECT id, name, code FROM backgrounds ORDER BY name'),
      query<{ id: number; name: string }>('SELECT id, name FROM gods ORDER BY name'),
      query<{ id: number; name: string }>('SELECT id, name FROM skills ORDER BY name'),
      query<{ id: number; version: string; major: number; minor: number }>('SELECT id, version, major, minor FROM game_versions ORDER BY major DESC, minor DESC'),
    ]);

    return {
      data: {
        races: racesResult.rows,
        backgrounds: backgroundsResult.rows,
        gods: godsResult.rows,
        skills: skillsResult.rows,
        versions: versionsResult.rows,
        legacySpecies: [...LEGACY_SPECIES_NAMES],
        legacyBackgrounds: [...LEGACY_BACKGROUND_NAMES],
      },
      cachedAtUnixMs: Date.now(),
    };
  },
  ['analytics-lookups'],
  { tags: [DB_CACHE_TAG] }
);

export async function GET() {
  try {
    const cached = await fetchLookupData();
    return NextResponse.json(cached.data, {
      headers: buildCacheDebugHeaders({
        route: '/api/analytics/lookups',
        cacheable: true,
        cachedAtUnixMs: cached.cachedAtUnixMs,
        revalidateSeconds: null,
      }),
    });
  } catch (error) {
    console.error('Lookups API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lookup data' },
      { status: 500 }
    );
  }
}
