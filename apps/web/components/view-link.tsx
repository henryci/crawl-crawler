import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

interface ViewLinkProps {
  /** A link built with the helpers in lib/links.ts. */
  href: string;
  children?: ReactNode;
}

/**
 * Inline link from prose to a live view in the tool. Used by blog posts
 * so every claim can be checked, and changed, in the page that produced it.
 */
export function ViewLink({ href, children = "open this view" }: ViewLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 align-middle whitespace-nowrap"
    >
      {children}
      <ExternalLink className="w-3 h-3" />
    </Link>
  );
}
