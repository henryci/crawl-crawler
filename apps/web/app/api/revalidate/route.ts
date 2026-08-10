import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { DB_CACHE_TAG } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const instance = `${process.env.HOSTNAME ?? 'unknown'}:${process.pid}`;
  const secret = request.headers.get('x-revalidate-secret');

  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured on server', instance },
      { status: 500 }
    );
  }

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret', instance }, { status: 401 });
  }

  // Next 16 requires a cache-life profile. `{ expire: 0 }` keeps this
  // webhook's original semantics — a hard purge, so the next request
  // fetches fresh rows — rather than the stale-while-revalidate that a
  // named profile like 'max' would give (which serves the stale entry
  // once more and refreshes behind it). `updateTag` is not an option:
  // it throws outside a Server Action.
  revalidateTag(DB_CACHE_TAG, { expire: 0 });

  return NextResponse.json(
    { revalidated: true, tag: DB_CACHE_TAG, instance },
    { headers: { 'x-crawl-instance': instance } }
  );
}
