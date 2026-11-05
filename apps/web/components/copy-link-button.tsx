"use client";

import { useEffect, useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/tracking";

interface CopyLinkButtonProps {
  /** URL to copy. Defaults to the page's current URL at click time. */
  href?: string;
  label?: string;
  className?: string;
}

/**
 * Copies a shareable link to the clipboard. Pages that encode their state
 * in the URL (analytics tabs, optimizer settings, loaded morgues) render
 * this so a view can be handed to someone else as-is.
 */
export function CopyLinkButton({ href, label = "Copy link", className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleClick = async () => {
    const target = href
      ? new URL(href, window.location.origin).toString()
      : window.location.href;
    trackEvent("share_link_copied", { page: window.location.pathname });
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
    } catch {
      // Clipboard API unavailable (insecure context, denied permission):
      // fall back to a prompt the user can copy from.
      window.prompt("Copy this link", target);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
        className,
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-health" />
      ) : (
        <LinkIcon className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
