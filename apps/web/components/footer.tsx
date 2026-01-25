"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useState } from "react"

export function Footer() {
  const [tosOpen, setTosOpen] = useState(false)

  return (
    <>
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/images/analyst-sprite.jpg"
                alt="Crawl Crawler logo"
                width={20}
                height={20}
                className="rounded-sm"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="font-mono text-sm text-muted-foreground">
                Crawl<span className="text-primary">Crawler</span>
              </span>
              <span className="text-xs text-muted-foreground">
                by{" "}
                <Link
                  href="/player?url=https%3A%2F%2Fcrawl.akrasiac.org%2Fscoring%2Fplayers%2Fhenryci.html"
                  className="text-primary hover:underline"
                >
                  henryci
                </Link>
              </span>
            </div>

            {/* Tagline */}
            <p
              className="text-xs text-muted-foreground/60 italic font-mono"
              title="This app crawls data from the game Crawl, where players go on crawls (runs)"
            >
              {'"Crawl Crawler crawls Crawl crawls"'}
            </p>

            <button
              onClick={() => setTosOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Terms of Service Modal */}
      <Dialog open={tosOpen} onOpenChange={setTosOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-2xl font-serif tracking-wide text-center">
              TERMS OF SERVICE
            </DialogTitle>
            <DialogDescription className="text-center text-xs uppercase tracking-widest pt-2">
              CrawlCrawler Legal Agreement
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-6">
            {/* Formal preamble */}
            <div className="text-sm text-muted-foreground text-center italic">
              <p>Effective Date: The Beginning of Time</p>
              <p>Last Updated: Whenever We Felt Like It</p>
            </div>

            {/* Section header */}
            <div className="border-t border-b border-border py-4">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground text-center mb-2">
                Article I — Complete Terms and Conditions
              </h3>
            </div>

            {/* The actual terms */}
            <div className="text-center py-8">
              <p className="text-3xl font-serif text-foreground">
                "Don't be an ass."
              </p>
            </div>

            {/* Formal closing */}
            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground italic">
                By using this service, you acknowledge that you have read, understood,
                and agree to be bound by the foregoing terms in their entirety.
              </p>
            </div>

            {/* Signature line */}
            <div className="pt-6 flex justify-center">
              <div className="text-center">
                <div className="w-48 border-t border-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  The Management
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
