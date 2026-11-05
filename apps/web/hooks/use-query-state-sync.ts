"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Two-way sync between a page's state and its query string.
 *
 * `params` is the page state serialized as a query string; whenever it
 * changes it is written to the URL with router.replace. When the URL
 * changes from outside (browser back/forward, or a link to the same page
 * such as a guide's example question), `onExternalChange` receives the new
 * params so the page can adopt them.
 *
 * Both directions compare against the query string the state was last
 * synced to (written or adopted), never against the live URL alone. That
 * keeps the page's own writes from being reported back as external, and
 * keeps a render that still holds the old state from writing it over a URL
 * that just changed from outside (which would otherwise revert the
 * navigation, or after Back flip between the two URLs indefinitely).
 */
export function useQueryStateSync(
  pathname: string,
  params: string,
  onExternalChange: (searchParams: URLSearchParams) => void,
): void {
  const router = useRouter();
  const current = useSearchParams().toString();
  // The query string the page state corresponds to.
  const syncedRef = useRef(current);
  // The query string the external-change effect last looked at.
  const seenRef = useRef(current);
  const adopt = useEffectEvent(onExternalChange);

  useEffect(() => {
    if (params === syncedRef.current) return;
    syncedRef.current = params;
    if (params !== current) {
      router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false });
    }
  }, [params, current, pathname, router]);

  useEffect(() => {
    if (current === seenRef.current) return;
    seenRef.current = current;
    if (current === syncedRef.current) return;
    syncedRef.current = current;
    adopt(new URLSearchParams(current));
  }, [current]);
}
