import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import { PostBanner } from "@/components/blog/post-banner";
import { POSTS, getPost } from "@/content/blog";
import { formatPostDate } from "@/app/blog/format-date";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.meta.title} | Crawl Crawler`,
    description: post.meta.description,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const { Content, meta } = post;

  return (
    <PageWrapper className="max-w-3xl">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="w-3 h-3" />
        All posts
      </Link>
      <article>
        <header className="mb-8 border-b border-border pb-6">
          {(meta.banner || meta.cover) && (
            <div className="mb-5">
              <PostBanner meta={meta} slug={post.slug} />
            </div>
          )}
          <div className="mb-3 flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <time dateTime={meta.date}>{formatPostDate(meta.date)}</time>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{meta.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
        </header>
        <Content />
      </article>
    </PageWrapper>
  );
}
