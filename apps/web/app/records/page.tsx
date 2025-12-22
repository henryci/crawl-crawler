import { Trophy, Search, Filter, Medal, Crown, Zap, Skull, Clock, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
import { AlertBanner } from "@/components/alert-banner";

// Mock records data
const mockFastestWins = [
  {
    rank: 1,
    player: "Yermak",
    time: "0:27:34",
    turns: 8234,
    species: "Felid",
    background: "Transmuter",
    version: "0.32",
    date: "2024-10-15",
  },
  {
    rank: 2,
    player: "elliott",
    time: "0:31:12",
    turns: 9102,
    species: "Spriggan",
    background: "Berserker",
    version: "0.32",
    date: "2024-09-28",
  },
  {
    rank: 3,
    player: "p0werm0de",
    time: "0:33:45",
    turns: 10234,
    species: "Felid",
    background: "Chaos Knight",
    version: "0.31",
    date: "2024-08-12",
  },
  {
    rank: 4,
    player: "Ge0ff",
    time: "0:35:22",
    turns: 11456,
    species: "Gargoyle",
    background: "Fighter",
    version: "0.32",
    date: "2024-10-01",
  },
  {
    rank: 5,
    player: "MrMan",
    time: "0:38:01",
    turns: 12890,
    species: "Minotaur",
    background: "Berserker",
    version: "0.32",
    date: "2024-09-15",
  },
];

const mockHighScores = [
  {
    rank: 1,
    player: "manman",
    score: 12847234,
    species: "Deep Elf",
    background: "Conjurer",
    god: "Vehumet",
    version: "0.30",
    date: "2024-03-22",
  },
  {
    rank: 2,
    player: "Yermak",
    score: 11234567,
    species: "Minotaur",
    background: "Fighter",
    god: "Okawaru",
    version: "0.31",
    date: "2024-06-15",
  },
  {
    rank: 3,
    player: "Ge0ff",
    score: 10456789,
    species: "Gargoyle",
    background: "Earth Elementalist",
    god: "Jiyva",
    version: "0.32",
    date: "2024-10-08",
  },
  {
    rank: 4,
    player: "SilvereR",
    score: 9876543,
    species: "Vine Stalker",
    background: "Monk",
    god: "Wu Jian",
    version: "0.32",
    date: "2024-09-01",
  },
  {
    rank: 5,
    player: "Implojin",
    score: 9234567,
    species: "Formicid",
    background: "Venom Mage",
    god: "Kikubaaqudgha",
    version: "0.31",
    date: "2024-07-20",
  },
];

const recordCategories = [
  { id: "fastest", label: "Fastest Wins", icon: Zap },
  { id: "highscore", label: "High Scores", icon: Crown },
  { id: "kills", label: "Most Kills", icon: Skull },
  { id: "turns", label: "Fewest Turns", icon: Clock },
];

export default function RecordsPage() {
  return (
    <PageWrapper>
      {/* Header */}
      <PageHeader
        title="Records Explorer"
        subtitle="Discover game records and achievements"
        icon={Trophy}
        variant="mana"
      />

      {/* Coming Soon Notice */}
      <AlertBanner
        title="Coming Soon"
        message="Live records integration is under development. Below is a preview with sample data showing the intended functionality."
        variant="mana"
      />

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
              <label className="text-xs text-muted-foreground font-medium">Species</label>
              <Select>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="minotaur">Minotaur</SelectItem>
                  <SelectItem value="gargoyle">Gargoyle</SelectItem>
                  <SelectItem value="deep-elf">Deep Elf</SelectItem>
                  <SelectItem value="felid">Felid</SelectItem>
                  <SelectItem value="spriggan">Spriggan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Background</label>
              <Select>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All backgrounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Backgrounds</SelectItem>
                  <SelectItem value="fighter">Fighter</SelectItem>
                  <SelectItem value="berserker">Berserker</SelectItem>
                  <SelectItem value="conjurer">Conjurer</SelectItem>
                  <SelectItem value="monk">Monk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Version</label>
              <Select>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All versions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Versions</SelectItem>
                  <SelectItem value="0.32">0.32</SelectItem>
                  <SelectItem value="0.31">0.31</SelectItem>
                  <SelectItem value="0.30">0.30</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Tabs */}
      <Tabs defaultValue="fastest" className="space-y-6">
        <TabsList className="bg-secondary border border-border p-1 h-auto flex-wrap">
          {recordCategories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <category.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Fastest Wins Tab */}
        <TabsContent value="fastest">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gold" />
                  Fastest Wins (Real Time)
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </div>
              <CardDescription>Quickest victories by real-world time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="w-16 font-mono text-muted-foreground">#</TableHead>
                      <TableHead className="font-mono text-muted-foreground">Player</TableHead>
                      <TableHead className="font-mono text-muted-foreground text-center">Time</TableHead>
                      <TableHead className="font-mono text-muted-foreground text-center hidden sm:table-cell">
                        Turns
                      </TableHead>
                      <TableHead className="font-mono text-muted-foreground hidden md:table-cell">
                        Character
                      </TableHead>
                      <TableHead className="font-mono text-muted-foreground hidden lg:table-cell text-right">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockFastestWins.map((record) => (
                      <TableRow key={record.rank} className="hover:bg-secondary/30">
                        <TableCell className="font-mono">
                          {record.rank === 1 && <Medal className="w-4 h-4 text-gold" />}
                          {record.rank === 2 && <Medal className="w-4 h-4 text-muted-foreground" />}
                          {record.rank === 3 && <Medal className="w-4 h-4 text-amber-700" />}
                          {record.rank > 3 && <span className="text-muted-foreground">{record.rank}</span>}
                        </TableCell>
                        <TableCell className="font-mono text-foreground">{record.player}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono text-lg font-bold text-gold">{record.time}</span>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <span className="font-mono text-muted-foreground">{record.turns.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">
                            {record.species} {record.background}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          <span className="font-mono text-xs text-muted-foreground">{record.date}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* High Scores Tab */}
        <TabsContent value="highscore">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="w-4 h-4 text-gold" />
                  High Scores
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </div>
              <CardDescription>Highest scoring victories of all time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="w-16 font-mono text-muted-foreground">#</TableHead>
                      <TableHead className="font-mono text-muted-foreground">Player</TableHead>
                      <TableHead className="font-mono text-muted-foreground text-right">Score</TableHead>
                      <TableHead className="font-mono text-muted-foreground hidden md:table-cell">
                        Character
                      </TableHead>
                      <TableHead className="font-mono text-muted-foreground hidden lg:table-cell">God</TableHead>
                      <TableHead className="font-mono text-muted-foreground hidden lg:table-cell text-right">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockHighScores.map((record) => (
                      <TableRow key={record.rank} className="hover:bg-secondary/30">
                        <TableCell className="font-mono">
                          {record.rank === 1 && <Medal className="w-4 h-4 text-gold" />}
                          {record.rank === 2 && <Medal className="w-4 h-4 text-muted-foreground" />}
                          {record.rank === 3 && <Medal className="w-4 h-4 text-amber-700" />}
                          {record.rank > 3 && <span className="text-muted-foreground">{record.rank}</span>}
                        </TableCell>
                        <TableCell className="font-mono text-foreground">{record.player}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-lg font-bold text-gold">
                            {record.score.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="font-mono text-sm text-muted-foreground">
                            {record.species} {record.background}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="font-mono text-special border-special/30">
                            {record.god}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          <span className="font-mono text-xs text-muted-foreground">{record.date}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder tabs */}
        <TabsContent value="kills">
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Skull className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Most Kills Records</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turns">
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Fewest Turns Records</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
