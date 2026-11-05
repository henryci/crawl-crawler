import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

/**
 * Styling for blog posts written in MDX. Next.js picks this file up by
 * name; every element an .mdx file renders goes through this map.
 */

function Anchor({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const className = "text-primary underline underline-offset-2 hover:text-primary/80 transition-colors";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

function Heading({ level, children }: { level: 2 | 3; children?: ReactNode }) {
  if (level === 2) {
    return <h2 className="mt-10 mb-3 text-xl font-semibold text-foreground">{children}</h2>;
  }
  return <h3 className="mt-6 mb-2 text-base font-semibold text-foreground">{children}</h3>;
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => <Heading level={2}>{children}</Heading>,
    h3: ({ children }) => <Heading level={3}>{children}</Heading>,
    p: ({ children }) => <p className="my-4 text-sm leading-7 text-muted-foreground">{children}</p>,
    a: Anchor,
    ul: ({ children }) => <ul className="my-4 ml-5 list-disc space-y-1.5 text-sm leading-7 text-muted-foreground">{children}</ul>,
    ol: ({ children }) => <ol className="my-4 ml-5 list-decimal space-y-1.5 text-sm leading-7 text-muted-foreground">{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-2 border-primary/50 pl-4 text-sm italic text-muted-foreground">{children}</blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>
    ),
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-border px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</th>
    ),
    td: ({ children }) => <td className="border-b border-border/50 px-3 py-1.5 text-muted-foreground">{children}</td>,
    hr: () => <hr className="my-8 border-border" />,
    ...components,
  };
}
