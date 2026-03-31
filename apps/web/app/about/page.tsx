import { ExternalLink, AlertTriangle, HelpCircle, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageWrapper } from "@/components/page-wrapper";
import { ServiceStats } from "./service-stats";

export default function AboutPage() {
  return (
    <PageWrapper className="max-w-4xl">
      {/* Beta Warning */}
      <div className="rounded-md bg-destructive/10 border border-destructive/30 mb-6 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-0.5">Test Software</h3>
            <p className="text-xs text-muted-foreground">
              CrawlCrawler is still very much a test project. The big thing to watch out for is that the morgue parser is very fragile, so there will be data errors.
              I also have no sense of what load this service will see, so don't be surprised if it's slow, or down.
              If you encounter any bugs or have suggestions, please send me an email at: me(at)henrycipolla.com.
            </p>
          </div>
        </div>
      </div>

      {/* Service Stats */}
      <ServiceStats />

      {/* About */}
      <Card className="bg-card border-border mb-6 py-0 gap-0">
        <div className="border-b border-border px-4 py-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <HelpCircle className="w-4 h-4 text-primary" />
            What is this?
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground">
            CrawlCrawler is a proof of concept for what's possible with{" "}
            <a href="https://crawl.develz.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">DCSS</a>{" "}
            data. As a turn-based game, every action in every game is recorded — giving us a depth
            of data that most games simply don't have, and making it possible to build search and
            analytics experiences that are unique to our community. It's built on a shaky
            foundation — parsing morgue files is genuinely hard, and the parser is far from
            perfect — but it's enough to show what's possible. Check out{" "}
            <a href="/appeal" className="text-primary hover:underline">the Appeal</a>{" "}
            for ideas on what we can build together.
          </p>
        </div>
      </Card>

      {/* Related Projects */}
      <Card className="bg-card border-border mb-6 py-0 gap-0">
        <div className="border-b border-border px-4 py-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Link2 className="w-4 h-4 text-mana" />
            Other DCSS Projects
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground mb-3">
            These are other tools I use, shoot me note if you'd like yours added.
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
        </div>
      </Card>
    </PageWrapper>
  );
}
