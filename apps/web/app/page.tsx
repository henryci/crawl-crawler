import Link from "next/link"
import { ArrowRight, Compass } from "lucide-react"
import { DungeonMap } from "@/components/dungeon-map"
import { QuestionList } from "@/components/question-list"
import { featuredQuestions } from "@/lib/questions"

export default function HomePage() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center">
      {/* Dungeon background texture */}
      <div className="absolute inset-0 texture-noise pointer-events-none" />
      
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-mana/5 rounded-full blur-3xl" />

      {/* Main content */}
      <div className="relative px-4 py-8 lg:py-16">
        <DungeonMap />
      </div>

      {/* Start with a question */}
      <section
        aria-labelledby="start-with-a-question"
        className="relative w-full max-w-2xl px-4 pb-16"
      >
        <div className="mb-3 flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          <h2 id="start-with-a-question" className="text-sm font-semibold text-foreground">
            Or start with a question
          </h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Each link opens a page with the filters and tab already set. Change anything and copy the
          URL to share what you found.
        </p>
        <QuestionList questions={featuredQuestions()} />
        <Link
          href="/blog"
          className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          More findings on the blog
          <ArrowRight className="w-3 h-3" />
        </Link>
      </section>
    </div>
  )
}
