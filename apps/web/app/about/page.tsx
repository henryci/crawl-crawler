import { Info, Database, ExternalLink, AlertTriangle, HelpCircle, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ServiceStats } from "./service-stats";

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

      {/* Beta Warning */}
      <Card className="bg-destructive/10 border-destructive/30 mb-6">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Beta Software</h3>
              <p className="text-sm text-muted-foreground">
                CrawlCrawler is still very much in beta. Things may break, data may be incomplete,
                and features may change. If you encounter any bugs or have suggestions, please
                report them on{" "}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub
                </a>{" "}
                or reach out in the DCSS community channels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what">
              <AccordionTrigger>What is this?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  CrawlCrawler is a collection of analytics and exploration tools for Dungeon Crawl
                  Stone Soup (DCSS). It provides insights into winning streaks, combo records,
                  player statistics, and morgue file analysis. Think of it as a data nerd&apos;s
                  companion for one of the best roguelikes ever made.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="why">
              <AccordionTrigger>Why is this?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Because data is beautiful, and DCSS generates a lot of interesting data. We
                  wanted to answer questions like &ldquo;What species/background combos are most
                  common in winning streaks?&rdquo; and &ldquo;How do players&apos; god choices
                  evolve over a streak?&rdquo; Plus, parsing morgue files by hand is tedious.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how">
              <AccordionTrigger>How is this?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  The streak analytics data comes from parsing thousands of morgue files from
                  verified winning streaks. Combo records are sourced from the community-maintained
                  records pages. Player summaries are fetched from official DCSS scoring servers.
                  Everything is held together with TypeScript, Next.js, and an unreasonable amount
                  of regex.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="is">
              <AccordionTrigger>Is this?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">Yes.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Service Stats */}
      <ServiceStats />

      {/* Related Projects */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Link2 className="w-5 h-5 text-mana" />
            Other DCSS Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground mb-4">
            CrawlCrawler isn&apos;t the only community project for DCSS. Check out these other
            excellent tools:
          </p>
          <div className="space-y-3">
            <a
              href="https://dcss-stats.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors group"
            >
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  DCSS Stats
                </h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive statistics and leaderboards for DCSS players
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <a
              href="https://dcss-ttyrec-player.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors group"
            >
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  DCSS TTYRec Player
                </h3>
                <p className="text-sm text-muted-foreground">
                  Watch recorded DCSS games in your browser
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Database className="w-5 h-5 text-gold" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Streak Analytics:</strong> Sourced from morgue
              files of games that are part of verified winning streaks. We parse these to extract
              character builds, progression, and outcomes.
            </p>
            <p>
              <strong className="text-foreground">Combo Records:</strong> Sourced from the
              community-maintained combo high scores pages across multiple servers.
            </p>
            <p>
              <strong className="text-foreground">Player Summaries:</strong> Fetched from official
              DCSS scoring servers (CAO, CXC, CBR2, and others).
            </p>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
