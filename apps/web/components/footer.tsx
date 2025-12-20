import Image from "next/image"

export function Footer() {
  return (
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
          </div>

          {/* Tagline */}
          <p
            className="text-xs text-muted-foreground/60 italic font-mono"
            title="This app crawls data from the game Crawl, where players go on crawls (runs)"
          >
            {'"Crawl Crawler crawls Crawl crawls"'}
          </p>

          <p className="text-xs text-muted-foreground">Built for the DCSS community</p>
        </div>
      </div>
    </footer>
  )
}
