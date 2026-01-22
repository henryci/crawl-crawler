import { Info, BarChart3, FileText, Database, ExternalLink, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

export default function AboutPage() {
  return (
    <PageWrapper className="max-w-4xl">
      {/* Header */}
      <PageHeader
        title="About CrawlCrawler"
        subtitle="Analytics and exploration tools for Dungeon Crawl Stone Soup"
        icon={Info}
        variant="special"
      />

      {/* What is CrawlCrawler */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-5 h-5 text-primary" />
            What is CrawlCrawler?
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              CrawlCrawler is a collection of tools for exploring and analyzing data from{" "}
              <a
                href="https://crawl.develz.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Dungeon Crawl Stone Soup
              </a>
              , a free open-source roguelike game.
            </p>
            <p>
              Our flagship feature is the <strong className="text-foreground">Analytics</strong> tool, which lets you
              explore patterns and insights from winning streak games. Discover which species and background
              combinations are most successful, what gods players choose, and how strategies evolve over the course of
              a streak.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tools Overview */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-health" />
            Available Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h3 className="font-semibold text-foreground mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Explore aggregate data from winning streak games. Filter by species, background, god, and more to
                discover patterns and trends in successful play.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h3 className="font-semibold text-foreground mb-1">Morgue Viewer</h3>
              <p className="text-sm text-muted-foreground">
                Parse and visualize DCSS morgue files in a clean, organized format. Paste a morgue URL or text to see
                character details, inventory, skills, and more.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h3 className="font-semibold text-foreground mb-1">Player Summary</h3>
              <p className="text-sm text-muted-foreground">
                Look up any player&apos;s statistics and game history. View win rates, favorite combos, and career
                highlights.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h3 className="font-semibold text-foreground mb-1">Records Explorer</h3>
              <p className="text-sm text-muted-foreground">
                Browse game records including fastest wins, highest scores, and other achievements from the community.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Database className="w-5 h-5 text-mana" />
            Where Does the Data Come From?
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              The Analytics data is sourced from morgue files of games that are part of verified winning streaks. We
              parse these morgue files to extract detailed information about character builds, progression, and
              outcomes.
            </p>
            <p>
              Player summaries are fetched from the official DCSS scoring servers, which track games played on public
              servers like CAO (crawl.akrasiac.org), CUE (underhound.eu), and others.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appeal Section */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-5 h-5 text-special" />
            A Call for Better Data
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Building tools like CrawlCrawler is challenging because DCSS data exists primarily in human-readable
              formats (morgue files, HTML pages) rather than machine-readable formats. We&apos;d love to see:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-special">•</span>
                <span>Standardized machine-readable morgue formats (JSON alongside plaintext)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-special">•</span>
                <span>API endpoints for accessing player data and game history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-special">•</span>
                <span>Structured data exports for game statistics and records</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-special">•</span>
                <span>Documentation for existing data formats</span>
              </li>
            </ul>
            <p>
              If you&apos;re involved with DCSS development and interested in discussing data accessibility
              improvements, we&apos;d love to hear from you!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" asChild>
          <a href="https://github.com/crawl/crawl" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            DCSS GitHub
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://crawl.develz.org/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Official DCSS Website
          </a>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </div>
    </PageWrapper>
  );
}
