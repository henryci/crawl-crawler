import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight, Clock } from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
import { PostBanner } from "@/components/blog/post-banner";
import { POSTS } from "@/content/blog";
import type { Post, CoverAccent } from "@/content/blog/types";
import { formatPostDate } from "@/app/blog/format-date";
import { readingMinutes } from "@/app/blog/reading-time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog | Crawl Crawler",
  description:
    "Findings from DCSS streak data, each linked to the live view that shows it, plus what changed on the site.",
};

const ACCENT_TEXT: Record<CoverAccent, string> = {
  gold: "text-gold",
  mana: "text-mana",
  health: "text-health",
  special: "text-special",
};

const ACCENT_BORDER: Record<CoverAccent, string> = {
  gold: "hover:border-gold/60",
  mana: "hover:border-mana/60",
  health: "hover:border-health/60",
  special: "hover:border-special/60",
};

export default function BlogIndexPage() {
  const [latest, ...older] = POSTS;
  return (
    <PageWrapper className="max-w-4xl">
      <PageHeader
        title="Blog"
        subtitle="Findings from the data, linked to the views that show them"
        icon={BookOpen}
        variant="gold"
      />

      {latest && <FeaturedCard post={latest} />}

      {older.length > 0 && (
        <section aria-label="Earlier posts" className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Earlier
          </h2>
          <ul className="space-y-3">
            {older.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageWrapper>
  );
}

function CardMeta({ post }: { post: Post }) {
  const accent = post.meta.cover?.accent ?? "gold";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {post.meta.tag && (
        <span className={cn("font-semibold uppercase tracking-wider", ACCENT_TEXT[accent])}>
          {post.meta.tag}
        </span>
      )}
      <time dateTime={post.meta.date} className="font-mono">
        {formatPostDate(post.meta.date)}
      </time>
      <span className="inline-flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {readingMinutes(post.slug)} min read
      </span>
    </div>
  );
}

function FeaturedCard({ post }: { post: Post }) {
  const accent = post.meta.cover?.accent ?? "gold";
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group block overflow-hidden rounded-lg border border-border bg-card transition-colors",
        ACCENT_BORDER[accent],
      )}
    >
      <div className="bg-black/30 px-4 pt-4">
        <PostBanner meta={post.meta} slug={post.slug} />
      </div>
      <div className="px-5 pb-5 pt-4">
        <CardMeta post={post} />
        <h2 className="mt-2 text-2xl font-bold text-foreground transition-colors group-hover:text-primary">
          {post.meta.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {post.meta.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Read the post
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: Post }) {
  const accent = post.meta.cover?.accent ?? "gold";
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors sm:flex-row sm:items-center",
        ACCENT_BORDER[accent],
      )}
    >
      <PostBanner meta={post.meta} slug={post.slug} size="compact" />
      <div className="min-w-0 flex-1">
        <CardMeta post={post} />
        <h3 className="mt-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {post.meta.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{post.meta.description}</p>
      </div>
      <ArrowRight className="hidden w-4 h-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
    </Link>
  );
}
