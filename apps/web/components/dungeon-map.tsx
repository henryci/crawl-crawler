"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { BarChart3, FileText, User, Trophy, Info } from "lucide-react"

// Map dimensions (odd numbers for center positioning)
const MAP_WIDTH = 9
const MAP_HEIGHT = 7

// Tile types
type TileType = "floor" | "wall" | "location" | "stairs"

interface Location {
  name: string
  href: string
  icon: typeof BarChart3
  color: string
  description: string
}

// Define locations on the map
const locations: Record<string, Location> = {
  "2,1": {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    color: "text-gold",
    description: "Explore game statistics and trends",
  },
  "6,1": {
    name: "Morgue Viewer",
    href: "/morgue",
    icon: FileText,
    color: "text-health",
    description: "Parse and view morgue files",
  },
  "1,5": {
    name: "Player Summary",
    href: "/player",
    icon: User,
    color: "text-mana",
    description: "Look up player statistics",
  },
  "4,5": {
    name: "Records",
    href: "/records",
    icon: Trophy,
    color: "text-gold",
    description: "Browse game records",
  },
  "7,5": {
    name: "About",
    href: "/about",
    icon: Info,
    color: "text-special",
    description: "Learn about CrawlCrawler",
  },
}

// Generate the map layout
function generateMap(): TileType[][] {
  const map: TileType[][] = []

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: TileType[] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      const key = `${x},${y}`
      if (locations[key]) {
        row.push("location")
      } else if (
        // Walls around edges
        x === 0 ||
        x === MAP_WIDTH - 1 ||
        y === 0 ||
        y === MAP_HEIGHT - 1
      ) {
        // Leave openings near locations
        const isNearLocation = Object.keys(locations).some((locKey) => {
          const [lx, ly] = locKey.split(",").map(Number)
          return Math.abs(x - lx) <= 1 && Math.abs(y - ly) <= 1
        })
        row.push(isNearLocation ? "floor" : "wall")
      } else {
        row.push("floor")
      }
    }
    map.push(row)
  }

  return map
}

const map = generateMap()

// Check if a position is walkable
function isWalkable(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false
  const tile = map[y][x]
  return tile === "floor" || tile === "location"
}

// Get location at position
function getLocationAt(x: number, y: number): Location | null {
  return locations[`${x},${y}`] || null
}

export function DungeonMap() {
  const router = useRouter()
  const [playerPos, setPlayerPos] = useState({ x: 4, y: 3 }) // Center of map
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [showEnterPrompt, setShowEnterPrompt] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Update current location when player moves
  useEffect(() => {
    const loc = getLocationAt(playerPos.x, playerPos.y)
    setCurrentLocation(loc)
    setShowEnterPrompt(!!loc)
  }, [playerPos])

  // Handle keyboard movement
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Keys that we handle - prevent default immediately to stop page scroll
      const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "h", "j", "k", "l", " "]
      if (navigationKeys.includes(e.key)) {
        e.preventDefault()
      }

      if (isMoving) return

      let newX = playerPos.x
      let newY = playerPos.y

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "k":
          newY--
          break
        case "ArrowDown":
        case "s":
        case "j":
          newY++
          break
        case "ArrowLeft":
        case "a":
        case "h":
          newX--
          break
        case "ArrowRight":
        case "d":
        case "l":
          newX++
          break
        case "Enter":
        case " ":
          if (currentLocation) {
            router.push(currentLocation.href)
          }
          return
        default:
          return
      }

      if (isWalkable(newX, newY)) {
        setIsMoving(true)
        setPlayerPos({ x: newX, y: newY })
        setTimeout(() => setIsMoving(false), 100)
      }
    },
    [playerPos, isMoving, currentLocation, router]
  )

  // Add keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Handle tile click for movement
  const handleTileClick = (x: number, y: number) => {
    if (!isWalkable(x, y)) return

    // Simple pathfinding: move one step at a time towards target
    const dx = x - playerPos.x
    const dy = y - playerPos.y

    // Move one step towards the clicked tile
    let newX = playerPos.x
    let newY = playerPos.y

    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
      newX += dx > 0 ? 1 : -1
    } else if (dy !== 0) {
      newY += dy > 0 ? 1 : -1
    }

    if (isWalkable(newX, newY)) {
      setIsMoving(true)
      setPlayerPos({ x: newX, y: newY })
      setTimeout(() => setIsMoving(false), 100)
    }
  }

  // Handle location click (enter directly)
  const handleLocationClick = (loc: Location) => {
    router.push(loc.href)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-2">
          Crawl<span className="text-primary">Crawler</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Use <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">arrow keys</kbd> or{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">click</kbd> to move
        </p>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative select-none focus:outline-none"
        tabIndex={0}
        role="application"
        aria-label="Dungeon map navigation. Use arrow keys to move, Enter to enter a location."
      >
        {/* Map Grid */}
        <div
          className="grid gap-0.5 p-2 rounded-lg bg-black/40 border border-border shadow-2xl"
          style={{
            gridTemplateColumns: `repeat(${MAP_WIDTH}, 48px)`,
            gridTemplateRows: `repeat(${MAP_HEIGHT}, 48px)`,
          }}
        >
          {map.map((row, y) =>
            row.map((tile, x) => {
              const location = getLocationAt(x, y)
              const isPlayer = playerPos.x === x && playerPos.y === y
              const isHovered = hoveredTile?.x === x && hoveredTile?.y === y
              const isWalkableTile = isWalkable(x, y)

              return (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    "relative w-12 h-12 flex items-center justify-center transition-all duration-150",
                    tile === "wall" && "bg-stone-900 border border-stone-800",
                    tile === "floor" && "bg-stone-800/50 border border-stone-700/30",
                    tile === "location" && "bg-stone-700/60 border-2 border-primary/40",
                    isWalkableTile && !isPlayer && "cursor-pointer hover:bg-stone-700/80",
                    isHovered && isWalkableTile && "ring-2 ring-primary/50"
                  )}
                  onClick={() => {
                    if (location && isPlayer) {
                      handleLocationClick(location)
                    } else {
                      handleTileClick(x, y)
                    }
                  }}
                  onMouseEnter={() => setHoveredTile({ x, y })}
                  onMouseLeave={() => setHoveredTile(null)}
                >
                  {/* Wall texture */}
                  {tile === "wall" && (
                    <div className="absolute inset-0 opacity-30">
                      <svg className="w-full h-full" viewBox="0 0 48 48">
                        <pattern id={`brick-${x}-${y}`} width="12" height="8" patternUnits="userSpaceOnUse">
                          <rect width="12" height="8" fill="transparent" />
                          <rect x="0" y="0" width="11" height="3.5" fill="currentColor" className="text-stone-600" />
                          <rect x="6" y="4" width="11" height="3.5" fill="currentColor" className="text-stone-600" />
                        </pattern>
                        <rect width="48" height="48" fill={`url(#brick-${x}-${y})`} />
                      </svg>
                    </div>
                  )}

                  {/* Floor texture */}
                  {(tile === "floor" || tile === "location") && (
                    <div className="absolute inset-0.5 opacity-20">
                      <svg className="w-full h-full" viewBox="0 0 44 44">
                        <rect x="1" y="1" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1" className="text-stone-500" />
                      </svg>
                    </div>
                  )}

                  {/* Location icon */}
                  {location && !isPlayer && (
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center transition-transform",
                        isHovered && "scale-110"
                      )}
                    >
                      <location.icon className={cn("w-6 h-6", location.color)} />
                    </div>
                  )}

                  {/* Player sprite */}
                  {isPlayer && (
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center z-10 transition-transform",
                        isMoving && "scale-95"
                      )}
                    >
                      <div className="w-10 h-10 rounded overflow-hidden border-2 border-primary shadow-lg shadow-primary/30">
                        <Image
                          src="/images/analyst-sprite.jpg"
                          alt="Player"
                          width={40}
                          height={40}
                          className="pixelated"
                          style={{ imageRendering: "pixelated" }}
                          priority
                        />
                      </div>
                    </div>
                  )}

                  {/* Stairs indicator for locations */}
                  {location && (
                    <div className="absolute bottom-0.5 right-0.5 text-[8px] text-primary/60">▼</div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-gradient-to-br from-primary/50 via-transparent to-mana/30 rounded-3xl" />
      </div>

      {/* Location Info Panel - fixed height to prevent layout shift */}
      <div
        className={cn(
          "h-[100px] w-full max-w-md p-4 rounded-lg border transition-all duration-300 flex items-center justify-center",
          currentLocation
            ? "bg-card border-primary/50 shadow-lg shadow-primary/10"
            : "bg-card/50 border-border"
        )}
      >
        {currentLocation ? (
          <div className="text-center animate-in fade-in duration-200">
            <div className="flex items-center justify-center gap-2 mb-1">
              <currentLocation.icon className={cn("w-5 h-5", currentLocation.color)} />
              <h2 className="text-lg font-bold text-foreground">{currentLocation.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{currentLocation.description}</p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Press</span>
              <kbd className="px-2 py-1 rounded bg-primary/20 text-primary font-mono text-xs border border-primary/30">
                Enter
              </kbd>
              <span className="text-muted-foreground">or</span>
              <kbd className="px-2 py-1 rounded bg-primary/20 text-primary font-mono text-xs border border-primary/30">
                Click
              </kbd>
              <span className="text-muted-foreground">to enter</span>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Navigate to a location to explore</p>
            <p className="text-xs mt-1 opacity-70">
              Analytics • Morgue Viewer • Player Summary • Records • About
            </p>
          </div>
        )}
      </div>

      {/* DCSS Info */}
      <div className="text-center max-w-lg">
        <p className="text-xs text-muted-foreground">
          Analytics and exploration tools for{" "}
          <span className="text-foreground">Dungeon Crawl Stone Soup</span>
        </p>
      </div>
    </div>
  )
}
