"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Lightbulb, X } from "lucide-react";

const STORAGE_PREFIX = "cc-hint-dismissed:";

interface FirstVisitHintProps {
  /** Stable key; once dismissed, the hint stays hidden on this browser. */
  id: string;
  children: ReactNode;
}

/**
 * One-line hint shown the first time someone opens a view. Renders
 * nothing on the server and on later visits, so it never shifts layout
 * for returning users.
 */
export function FirstVisitHint({ id, children }: FirstVisitHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_PREFIX + id) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [id]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_PREFIX + id, "1");
    } catch {
      // Best effort: without storage the hint simply returns next visit.
    }
  };

  if (!visible) return null;

  return (
    <div className="relative mb-4 flex items-start gap-2 rounded-md border border-gold/30 bg-gold/5 px-3 py-2 pr-9 text-xs text-muted-foreground">
      <Lightbulb className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss hint"
        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
