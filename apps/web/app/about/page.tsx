import { ExternalLink, AlertTriangle, HelpCircle, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageWrapper } from "@/components/page-wrapper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ServiceStats } from "./service-stats";
import { ZigDeathModal } from "./zig-death-modal";

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

      {/* FAQ Section */}
      <Card className="bg-card border-border mb-6 py-0 gap-0">
        <div className="border-b border-border px-4 py-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <HelpCircle className="w-4 h-4 text-primary" />
            Infrequently Asked Questions
          </div>
        </div>
        <div className="px-4 py-2">
          <Accordion type="single" collapsible defaultValue="what" className="w-full">
            <AccordionItem value="what">
              <AccordionTrigger>What is this?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">                  
                  CrawlCrawler is a collection of analytics and exploration tools for <a href="https://crawl.develz.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Dungeon Crawl
                  Stone Soup (DCSS)</a>.
                  It provides insights into what choices streak players are making and what combos records to go for.
                  I've also included updated player and morgue summary pages to reflect the info I typically need.
                  Perhaps most importantly, it's a proof of concept for what is possible with our game.
                  Please see <a href="/appeal" className="text-primary hover:underline">my appeal to the dev community</a> for my thoughts on what we can do.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="why">
              <AccordionTrigger>Why is this?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  I've been playing this game since <a href="/morgue?url=https%3A%2F%2Fcrawl.akrasiac.org%2Frawdata%2Fhenryci%2Fmorgue-henryci-20090627-221400.txt" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">2009</a>.
                  As the community has grown beyond 20 people in an IRC channel so to has all the data we have available.
                  I've been writing one off scripts to answer questions like "What species/background ruins the most streaks?" or "Which god do most people pick here?"
                  Recently, I killed a great character on <ZigDeathModal /> and decided to work out my frustration by putting together this app for people.
                  Perhaps it can serve to orient us more towards data. Let's make any moment from any game findable and replayable.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how">
              <AccordionTrigger>How is this?</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  This is an important question because the answer is kind of terrible.
                  I downloaded the streak files from CAO (over the course of a month so as not to create a bunch of load). Unfortunately, those 
                  are plain text files in a format that has undergone so many changes over the years. I had Claude read through a sample of them and develop a parser
                  which is of medium correctness. It is enough to provide some info but boy is is text not the best way to get this data into a database.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="is">
              <AccordionTrigger>Is this?</AccordionTrigger>
              <AccordionContent>
                {Math.random() < 0.5 ? (
                  <p className="text-muted-foreground">Yes.</p>
                ) : (
                  <p className="text-muted-foreground">No.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
