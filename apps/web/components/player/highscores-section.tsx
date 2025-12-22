"use client";

import { Trophy, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlayerData } from "dcss-player-parser";

interface HighscoresSectionProps {
  data: PlayerData;
}

export function HighscoresSection({ data }: HighscoresSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-gold/5 to-special/5 border-gold/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold">
          <Crown className="w-5 h-5" />
          Server Highscores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {data.comboHighscores.map((hs, i) => (
            <a
              key={`combo-${i}`}
              href={hs.morgueUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Badge
                variant="outline"
                className="bg-gold/10 border-gold/30 text-gold hover:bg-gold/20 transition-colors px-3 py-1"
              >
                <Trophy className="w-3 h-3 mr-1" />
                {hs.character}
                {hs.isWin && "*"} Combo
                <span className="ml-2 text-muted-foreground">
                  ({hs.score.toLocaleString()})
                </span>
              </Badge>
            </a>
          ))}
          {data.speciesHighscores.map((hs, i) => (
            <a
              key={`species-${i}`}
              href={hs.morgueUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge
                variant="outline"
                className="bg-mana/10 border-mana/30 text-mana hover:bg-mana/20 transition-colors px-3 py-1"
              >
                <Trophy className="w-3 h-3 mr-1" />
                {hs.species} Species
                <span className="ml-2 text-muted-foreground">
                  ({hs.score.toLocaleString()})
                </span>
              </Badge>
            </a>
          ))}
          {data.classHighscores.map((hs, i) => (
            <a
              key={`class-${i}`}
              href={hs.morgueUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge
                variant="outline"
                className="bg-special/10 border-special/30 text-special hover:bg-special/20 transition-colors px-3 py-1"
              >
                <Trophy className="w-3 h-3 mr-1" />
                {hs.background} Class
                <span className="ml-2 text-muted-foreground">
                  ({hs.score.toLocaleString()})
                </span>
              </Badge>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

