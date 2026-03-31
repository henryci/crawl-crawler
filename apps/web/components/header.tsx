"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navTooltips } from "@/lib/tooltips"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"

const navigation = [
  { name: "Streak Analytics", href: "/analytics", tooltipKey: "analytics" as const, secondary: false },
  { name: "Combo Records", href: "/records", tooltipKey: "records" as const, secondary: false },
  { name: "Player Summary", href: "/player", tooltipKey: "playerSummary" as const, secondary: false },
  { name: "Morgue Summary", href: "/morgue", tooltipKey: "morgueViewer" as const, secondary: false },
  { name: "About", href: "/about", tooltipKey: "about" as const, secondary: true },
  { name: "Appeal", href: "/appeal", tooltipKey: "appeal" as const, secondary: true },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-9 h-9 rounded bg-primary/10 border border-primary/30 group-hover:border-primary/50 transition-colors overflow-hidden">
              <Image
                src="/images/analyst-sprite.jpg"
                alt="Crawl Crawler analyst sprite"
                width={32}
                height={32}
                className="pixelated"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <span className="font-mono text-lg font-semibold text-foreground">
              Crawl<span className="text-primary">Crawler</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center">
            <div className="flex gap-1 items-center">
              {navigation.filter((item) => !item.secondary).map((item) => (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        pathname === item.href || pathname?.startsWith(item.href + "/")
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                      )}
                    >
                      {item.name}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {navTooltips[item.tooltipKey]}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="w-px h-4 bg-border mx-2" />
            <div className="flex gap-0.5 items-center">
              {navigation.filter((item) => item.secondary).map((item) => (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                        pathname === item.href || pathname?.startsWith(item.href + "/")
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-secondary/50",
                      )}
                    >
                      {item.name}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {navTooltips[item.tooltipKey]}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </nav>
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="space-y-1 px-4 py-3">
              {navigation.filter((item) => !item.secondary).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href || pathname?.startsWith(item.href + "/")
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-border my-1.5" />
              {navigation.filter((item) => item.secondary).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-3 py-2 text-xs font-medium rounded-md transition-colors",
                    pathname === item.href || pathname?.startsWith(item.href + "/")
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-secondary/50",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </TooltipProvider>
  )
}
