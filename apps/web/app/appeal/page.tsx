import {
  FileJson,
  Database,
  Play,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageWrapper } from "@/components/page-wrapper";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appeal to Devs | Crawl Crawler",
  description:
    "Three proposals for making DCSS game data more accessible: structured morgue files, centralized game data, and deterministic replays.",
};

export default function AppealPage() {
  return (
    <PageWrapper className="max-w-3xl">
      <Link
        href="/about"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to About
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-md border flex items-center justify-center bg-mana/10 border-mana/30">
            <MessageSquare className="w-5 h-5 text-mana" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            An Appeal to the Dev Community
          </h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          DCSS generates an extraordinary amount of data with every game played.
          Right now, most of it is trapped in formats that are hard to work with
          and scattered across servers with no unified access. Below are three
          proposals — ranging from practical to ambitious — that would unlock
          this data for players and tool builders alike. I would be happy to 
          work on any of these if we agree on the requirements.
        </p>
      </div>

      {/* Proposal 1: Structured Morgue Files */}
      <Card className="bg-card border-border mb-6 py-0 gap-0">
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border flex items-center justify-center bg-health/10 border-health/30">
              <FileJson className="w-4 h-4 text-health" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                1. Structured Morgue Files
              </h2>
              <p className="text-xs text-muted-foreground">
                Save morgues in a parseable format alongside the text version
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Morgue files are the richest record of a DCSS game, but they&apos;re
            plain text formatted for human reading. The format has changed across
            versions with no schema, making reliable parsing a nightmare. I
            built a parser for this project and it is of medium quality at best
            &mdash; years of format drift mean edge cases are everywhere.
          </p>
          <p>
            If the game emitted a <strong className="text-foreground">JSON</strong> (or
            even <strong className="text-foreground">XML</strong>) morgue alongside the
            text one, every downstream tool &mdash; stats sites, analytics
            dashboards, personal trackers &mdash; would get reliable data for
            free. The text morgue stays for people who love reading them; the
            structured version exists for machines.
          </p>
          <p>
            XML might actually be interesting here: with an XSLT stylesheet
            bundled alongside, players could open a morgue file in their browser
            and get a nicely formatted, interactive view of their game without
            any server or app at all. Drop-in local morgue viewer, zero setup.
          </p>
          <p className="text-xs border-l-2 border-health/40 pl-3 text-muted-foreground/80">
            <strong className="text-foreground/70">Impact:</strong> Every tool
            that consumes morgue data becomes trivial to write. The data is
            already there inside the game at the point where the morgue is
            generated &mdash; it just needs to be serialized differently.
          </p>
        </div>
      </Card>

      {/* Proposal 2: Centralized Game Data */}
      <Card className="bg-card border-border mb-6 py-0 gap-0">
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border flex items-center justify-center bg-gold/10 border-gold/30">
              <Database className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                2. Centralized Game Data Access
              </h2>
              <p className="text-xs text-muted-foreground">
                A unified way to discover and fetch game records across servers
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Today, game data lives on individual servers (CAO, CKO, CBR2,
            etc.) with different directory structures and access patterns.
            Projects like{" "}
            <a
              href="https://dcss-stats.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              dcss-stats
            </a>{" "}
            do the heroic work of crawling each server independently, but every
            new tool has to rediscover and re-implement this logic.
          </p>
          <p>
            If there were a standardized API or feed &mdash; even something as
            simple as an aggregated listing endpoint or a shared event stream
            &mdash; tools could subscribe to game completions across all servers
            without custom crawling per-server. The data format from Proposal 1
            would make each entry immediately useful.
          </p>
          <p>
            This would mean that a project like mine could immediately work with{" "}
            <em>every game ever played</em>, not just the subset I&apos;ve
            managed to download. The kind of analysis this enables is meaningful:
            &ldquo;What equipment is most common in games where the player dies
            in Vaults versus when they make it through?&rdquo; That question is
            answerable today in theory, but practically impossible without
            spending weeks on data collection.
          </p>
          <p className="text-xs border-l-2 border-gold/40 pl-3 text-muted-foreground/80">
            <strong className="text-foreground/70">Impact:</strong> Lowers the
            barrier for new DCSS tools from &ldquo;months of scraping&rdquo; to
            &ldquo;point at an API.&rdquo; Good for the ecosystem, good for
            players who want richer tools.
          </p>
        </div>
      </Card>

      {/* Proposal 3: Deterministic Replays */}
      <Card className="bg-card border-border mb-6 py-0 gap-0">
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border flex items-center justify-center bg-special/10 border-special/30">
              <Play className="w-4 h-4 text-special" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                3. Deterministic Replays
              </h2>
              <p className="text-xs text-muted-foreground">
                Save seed + inputs to enable jumping into any moment of any game
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            This one is more ambitious and isn&apos;t immediately related to
            data access, but it&apos;s about what becomes possible once we think
            of games as replayable artifacts.
          </p>
          <p>
            <a
              href="https://liquipedia.net/starcraft2/Replay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              StarCraft 2 replays
            </a>{" "}
            work by recording the random seed, game version, and every player
            input. The replay file is tiny because it&apos;s just a list of
            commands — the game engine deterministically reproduces the full
            state. Players can jump to any moment in a match.
          </p>
          <p>
            DCSS could do the same: record the RNG seed, version, and every
            keystroke. A replay file would be small (a few KB per game) and
            would let anyone:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-foreground">Watch any game</strong> in
              webtiles without needing the original ttyrec
            </li>
            <li>
              <strong className="text-foreground">Jump to any turn</strong>{" "}
              instead of fast-forwarding through hours of play
            </li>
            <li>
              <strong className="text-foreground">Share &ldquo;puzzle&rdquo;
              moments</strong> &mdash; &ldquo;Can you survive this
              situation?&rdquo; &mdash; where others load in at a specific turn
              and try to play it out
            </li>
            <li>
              <strong className="text-foreground">Analyze decision points</strong>{" "}
              from the game state itself, not from a text summary after the fact
            </li>
          </ul>
          <p>
            These replay games obviously wouldn&apos;t count for server points.
            This is purely about making games into a reusable, shareable
            resource.
          </p>
          <p className="text-xs border-l-2 border-special/40 pl-3 text-muted-foreground/80">
            <strong className="text-foreground/70">Impact:</strong> Turns every
            game of DCSS into a permanent, interactive artifact. Transforms the
            community&apos;s relationship with game history from &ldquo;read a
            text dump&rdquo; to &ldquo;step into the game.&rdquo;
          </p>
        </div>
      </Card>

      {/* Closing */}
      <div className="mt-8 mb-4 text-sm text-muted-foreground leading-relaxed space-y-3">
        <p>
          None of these proposals require rethinking the game. They&apos;re
          about treating the data DCSS already produces as a first-class output
          &mdash; structured, accessible, and replayable.
        </p>
        <p>
          I built CrawlCrawler as a proof of concept for what even a fragile
          parser on a subset of games can do. Imagine what becomes possible when
          the data is clean and complete.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Questions or thoughts? Start a{" "}
          <a
            href="https://github.com/henryci/crawl-crawler/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub discussion
          </a>{" "}
          or message me on{" "}
          <a
            href="https://www.reddit.com/user/henryci/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Reddit (@henryci)
          </a>
          .
        </p>
      </div>
    </PageWrapper>
  );
}
