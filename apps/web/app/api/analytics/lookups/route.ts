import { NextResponse } from 'next/server';
import { query } from '@crawl-crawler/game-data-db';
import {
  LEGACY_SPECIES_NAMES,
  LEGACY_BACKGROUND_NAMES,
} from 'dcss-game-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all lookup tables in parallel
    const [racesResult, backgroundsResult, godsResult, skillsResult, versionsResult] = await Promise.all([
      query<{ id: number; name: string; code: string }>('SELECT id, name, code FROM races ORDER BY name'),
      query<{ id: number; name: string; code: string }>('SELECT id, name, code FROM backgrounds ORDER BY name'),
      query<{ id: number; name: string }>('SELECT id, name FROM gods ORDER BY name'),
      query<{ id: number; name: string }>('SELECT id, name FROM skills ORDER BY name'),
      query<{ id: number; version: string; major: number; minor: number }>('SELECT id, version, major, minor FROM game_versions ORDER BY major DESC, minor DESC'),
    ]);
    
    return NextResponse.json({
      races: racesResult.rows,
      backgrounds: backgroundsResult.rows,
      gods: godsResult.rows,
      skills: skillsResult.rows,
      versions: versionsResult.rows,
      // Include legacy data from dcss-game-data package
      legacySpecies: [...LEGACY_SPECIES_NAMES],
      legacyBackgrounds: [...LEGACY_BACKGROUND_NAMES],
    });
  } catch (error) {
    console.error('Lookups API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lookup data' },
      { status: 500 }
    );
  }
}
