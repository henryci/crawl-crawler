import { FileText, LinkIcon, User, Map, Swords, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageWrapper } from "@/components/page-wrapper";
import { PageHeader } from "@/components/page-header";
import { AlertBanner } from "@/components/alert-banner";

// Sample morgue data to show intended layout
const sampleMorgueData = {
  character: {
    name: "Atomikkrab",
    title: "Spellweaver",
    species: "Deep Elf",
    background: "Conjurer",
    level: 27,
    god: "Vehumet",
    piety: "******",
  },
  stats: {
    hp: "0/187",
    mp: "45/45",
    ac: 12,
    ev: 24,
    sh: 0,
    str: 8,
    int: 38,
    dex: 18,
  },
  game: {
    turns: 78234,
    time: "4:23:15",
    version: "0.32.1",
    result: "Escaped with the Orb!",
    score: 892145,
  },
};

export default function MorgueViewerPage() {
  return (
    <PageWrapper>
      {/* Header */}
      <PageHeader
        title="Morgue Viewer"
        subtitle="Parse and visualize DCSS morgue files"
        icon={FileText}
        variant="health"
      />

      {/* URL Input Section */}
      <Card className="mb-8 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-mana" />
            Load Morgue File
          </CardTitle>
          <CardDescription>Enter the URL to a DCSS morgue file to parse and display its contents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="url"
              placeholder="https://crawl.akrasiac.org/rawdata/username/morgue-username-date.txt"
              className="font-mono text-sm bg-secondary border-border flex-1"
            />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Parse Morgue</Button>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-4">
            <AlertBanner
              title="Coming Soon"
              message="Morgue parsing functionality is under development. Below is a preview of how parsed data will be displayed."
              variant="mana"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sample Parsed Data Display */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>Sample Output Preview</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Character Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Character Info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-gold" />
                Character
              </CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground">{sampleMorgueData.character.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title</span>
                <span className="text-gold">{sampleMorgueData.character.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Species</span>
                <span className="text-foreground">{sampleMorgueData.character.species}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Background</span>
                <span className="text-foreground">{sampleMorgueData.character.background}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="text-health">{sampleMorgueData.character.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">God</span>
                <span className="text-special">
                  {sampleMorgueData.character.god} {sampleMorgueData.character.piety}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Swords className="w-4 h-4 text-danger" />
                Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HP</span>
                  <span className="text-danger">{sampleMorgueData.stats.hp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MP</span>
                  <span className="text-mana">{sampleMorgueData.stats.mp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AC</span>
                  <span className="text-foreground">{sampleMorgueData.stats.ac}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EV</span>
                  <span className="text-foreground">{sampleMorgueData.stats.ev}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SH</span>
                  <span className="text-foreground">{sampleMorgueData.stats.sh}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Str</span>
                  <span className="text-foreground">{sampleMorgueData.stats.str}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Int</span>
                  <span className="text-foreground">{sampleMorgueData.stats.int}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dex</span>
                  <span className="text-foreground">{sampleMorgueData.stats.dex}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-mana" />
                Game
              </CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Result</span>
                <Badge variant="outline" className="text-health border-health/30 bg-health/10">
                  Victory
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score</span>
                <span className="text-gold">{sampleMorgueData.game.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Turns</span>
                <span className="text-foreground">{sampleMorgueData.game.turns.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="text-foreground">{sampleMorgueData.game.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="text-muted-foreground">{sampleMorgueData.game.version}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What is a Morgue File */}
        <Card className="bg-secondary/30 border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="w-4 h-4 text-muted-foreground" />
              What is a Morgue File?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              A morgue file is a detailed text dump generated when your DCSS character dies (or wins!). It contains a
              comprehensive record of your run including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Character stats, skills, and equipment</li>
              <li>Spells known and abilities acquired</li>
              <li>Mutations and god gifts</li>
              <li>Dungeon progress and discovered areas</li>
              <li>Kill counts and notable events</li>
              <li>Message history from the final moments</li>
            </ul>
            <p className="mt-4">
              Morgue files are hosted on public servers like{" "}
              <code className="px-1 py-0.5 rounded bg-secondary text-foreground">crawl.akrasiac.org</code> and{" "}
              <code className="px-1 py-0.5 rounded bg-secondary text-foreground">crawl.xtahua.com</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
