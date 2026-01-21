import { NextRequest, NextResponse } from 'next/server';
import { query } from '@crawl-crawler/game-data-db';
import type { MorgueData } from 'dcss-morgue-parser';

export const dynamic = 'force-dynamic';

// Validate that the hash looks like a valid SHA-256 hex string
function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    
    // Validate hash format
    if (!isValidHash(hash)) {
      return NextResponse.json(
        { error: 'Invalid hash format' },
        { status: 400 }
      );
    }
    
    // Query for the parsed morgue JSON
    const result = await query<{ parsed_json: MorgueData }>(`
      SELECT parsed_json
      FROM parsed_morgue_json
      WHERE morgue_hash = $1
    `, [hash.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Morgue not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]!.parsed_json,
    });
  } catch (error) {
    console.error('Morgue API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch morgue data' },
      { status: 500 }
    );
  }
}
