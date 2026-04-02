import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { DB_CACHE_TAG } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');

  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured on server' },
      { status: 500 }
    );
  }

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  revalidateTag(DB_CACHE_TAG);

  return NextResponse.json({ revalidated: true, tag: DB_CACHE_TAG });
}
