import { TrendingUp, Search, Filter, Trophy, User, ArrowUpDown, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock streak data
const mockStreaks = [
  {
    rank: 1,
    player: "Yermak",
    streak: 27,
    species: "Various",
    backgrounds: "Various",
    server: "CAO",
    startDate: "2024-08-12",
    endDate: "2024-11-03",
    status: "active",
  },
  {
    rank: 2,
    player: "Ge0ff",
    streak: 21,
    species: "Gargoyle",
    backgrounds: "Fighter",
    server: "CUE",
    startDate: "2024-06-01",
    endDate: "2024-09-15",
    status: "ended",
  },
  {
    rank: 3,
    player: "MrMan",
    streak: 19,
    species: "Minotaur",
    backgrounds: "Berserker",
    server: "CAO",
    startDate: "2024-07-20",
    endDate: "2024-10-01",
    status: "ended",
  },
  {
    rank: 4,
    player: "SilvereR",
    streak: 17,
    species: "Various",
    backgrounds: "Various",
    server: "CXC",
    startDate: "2024-09-01",
    endDate: "ongoing",
    status: "active",
  },
  {
    rank: 5,
    player: "Implojin",
    streak: 15,
    species: "Deep Elf",
    backgrounds: "Various",
    server: "CAO",
    startDate: "2024-05-15",
    endDate: "2024-07-28",
    status: "ended",
  },
]

export default function StreaksPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="absolute inset-0 texture-noise pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-gold/10 border border-gold/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Streak Explorer</h1>
              <p className="text-sm text-muted-foreground">Search and explore player win streaks</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mb-6 flex items-start gap-2 p-4 rounded-md bg-gold/10 border border-gold/20">
          <AlertCircle className="w-5 h-5 text-gold mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gold">Coming Soon</p>
            <p className="text-muted-foreground">
              Live streak data integration is under development. Below is a preview with sample data showing the
              intended functionality.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Player Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search player..." className="pl-9 bg-secondary border-border font-mono" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Minimum Streak</label>
                <Select>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Any length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3+ wins</SelectItem>
                    <SelectItem value="5">5+ wins</SelectItem>
                    <SelectItem value="10">10+ wins</SelectItem>
                    <SelectItem value="15">15+ wins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Server</label>
                <Select>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="All servers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cao">CAO (akrasiac)</SelectItem>
                    <SelectItem value="cue">CUE (underhound)</SelectItem>
                    <SelectItem value="cxc">CXC (xtahua)</SelectItem>
                    <SelectItem value="cbro">CBRO (berotato)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Select>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Apply Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold" />
                Streak Leaderboard
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort by Streak
              </Button>
            </div>
            <CardDescription>Showing top win streaks across all servers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead className="w-16 font-mono text-muted-foreground">#</TableHead>
                    <TableHead className="font-mono text-muted-foreground">Player</TableHead>
                    <TableHead className="font-mono text-muted-foreground text-center">Streak</TableHead>
                    <TableHead className="font-mono text-muted-foreground hidden md:table-cell">Species/BG</TableHead>
                    <TableHead className="font-mono text-muted-foreground hidden lg:table-cell">Server</TableHead>
                    <TableHead className="font-mono text-muted-foreground hidden lg:table-cell">Period</TableHead>
                    <TableHead className="font-mono text-muted-foreground text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockStreaks.map((streak) => (
                    <TableRow key={streak.rank} className="hover:bg-secondary/30">
                      <TableCell className="font-mono text-muted-foreground">{streak.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center">
                            <User className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="font-mono text-foreground">{streak.player}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-lg font-bold text-gold">{streak.streak}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-sm text-muted-foreground">
                          {streak.species} / {streak.backgrounds}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="font-mono text-xs">
                          {streak.server}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">
                          {streak.startDate} → {streak.endDate}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            streak.status === "active"
                              ? "text-health border-health/30 bg-health/10"
                              : "text-muted-foreground border-border"
                          }
                        >
                          {streak.status === "active" ? "Active" : "Ended"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination placeholder */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing 1-5 of 250 streaks</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
