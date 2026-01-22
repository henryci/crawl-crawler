import { DungeonMap } from "@/components/dungeon-map"

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center">
      {/* Dungeon background texture */}
      <div className="absolute inset-0 texture-noise pointer-events-none" />
      
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-mana/5 rounded-full blur-3xl" />

      {/* Main content */}
      <div className="relative px-4 py-8 lg:py-16">
        <DungeonMap />
      </div>
    </div>
  )
}
