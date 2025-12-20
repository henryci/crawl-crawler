import Link from "next/link"
import Image from "next/image"
import { FileText, Trophy, TrendingUp, MessageSquare, ArrowRight, Terminal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const tools = [
  {
    title: "Morgue Viewer",
    description: "Parse and visualize DCSS morgue files in a readable, organized format.",
    href: "/morgue",
    icon: FileText,
    color: "text-health",
    borderColor: "border-health/30 hover:border-health/50",
  },
  {
    title: "Streak Explorer",
    description: "Search and explore player win streaks across the community.",
    href: "/streaks",
    icon: TrendingUp,
    color: "text-gold",
    borderColor: "border-gold/30 hover:border-gold/50",
  },
  {
    title: "Records Explorer",
    description: "Discover game records: fastest wins, most kills, and more.",
    href: "/records",
    icon: Trophy,
    color: "text-mana",
    borderColor: "border-mana/30 hover:border-mana/50",
  },
  {
    title: "Data Format Appeal",
    description: "An open letter to the DCSS dev team about data accessibility.",
    href: "/appeal",
    icon: MessageSquare,
    color: "text-special",
    borderColor: "border-special/30 hover:border-special/50",
  },
]

export default function HomePage() {
  return (
    <div className="relative">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 texture-noise pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-primary/10 border border-primary/30 mb-6 overflow-hidden">
            <Image
              src="/images/analyst-sprite.jpg"
              alt="Crawl Crawler analyst sprite"
              width={64}
              height={64}
              className="pixelated"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Crawl<span className="text-primary">Crawler</span>
          </h1>

          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Analytics and exploration tools for{" "}
            <span className="text-foreground font-medium">Dungeon Crawl Stone Soup</span>. Parse morgue files, explore
            win streaks, and discover game records.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group">
              <Card
                className={`h-full bg-card border ${tool.borderColor} transition-all duration-200 hover:bg-secondary/30`}
              >
                <CardHeader>
                  <div
                    className={`w-10 h-10 rounded-md bg-secondary flex items-center justify-center mb-2 ${tool.color}`}
                  >
                    <tool.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-foreground group-hover:text-primary transition-colors">
                    {tool.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">{tool.description}</CardDescription>
                  <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore</span>
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* What is DCSS Section */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm mb-4">
            <Terminal className="w-4 h-4" />
            <span>New to DCSS?</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-4">What is Dungeon Crawl Stone Soup?</h2>

          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            DCSS is a free, open-source roguelike game known for its deep tactical gameplay, permadeath, and
            procedurally generated dungeons. Players choose from dozens of species and backgrounds, fighting their way
            through the Dungeon to retrieve the legendary Orb of Zot.
          </p>

          <Button variant="outline" asChild>
            <a href="https://crawl.develz.org/" target="_blank" rel="noopener noreferrer">
              Learn more about DCSS
              <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
