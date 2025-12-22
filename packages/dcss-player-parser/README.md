# dcss-player-parser

A TypeScript library for parsing DCSS (Dungeon Crawl Stone Soup) player scoring pages into structured JSON data.

## Features

- Parses player scoring HTML pages from servers like crawl.akrasiac.org
- Extracts comprehensive player statistics including:
  - Overall stats (total score, games, wins, win %)
  - Complete win history with detailed information
  - Win streaks with streak breaker identification
  - Recent games
  - Combo/species/class highscores
  - Detailed combo statistics for win rates

## Installation

```bash
npm install dcss-player-parser
# or
pnpm add dcss-player-parser
```

## Usage

```typescript
import { parsePlayerPage } from 'dcss-player-parser';

// Fetch the HTML content of a player page
const html = await fetch('https://crawl.akrasiac.org/scoring/players/playername.html')
  .then(res => res.text());

// Parse the HTML into structured data
const playerData = parsePlayerPage(html);

console.log(playerData.playerName);
console.log(`Wins: ${playerData.wins.length}`);
console.log(`Win rate: ${playerData.overallStats.winPercent}%`);
```

## API

### `parsePlayerPage(html: string): PlayerData`

Parses an HTML string from a DCSS player scoring page and returns structured data.

**Note:** This function requires a browser environment (uses `DOMParser`). For Node.js usage, you'll need to provide a DOM implementation like jsdom.

### Types

```typescript
interface PlayerData {
  playerName: string;
  overallStats: OverallStats;
  ongoingGame: OngoingGame | null;
  wins: Win[];
  streaks: Streak[];
  recentGames: RecentGame[];
  comboHighscores: Highscore[];
  speciesHighscores: Highscore[];
  classHighscores: Highscore[];
  comboStats: ComboStats[];
  speciesStats: SpeciesStats[];
  backgroundStats: BackgroundStats[];
  lastUpdated: string | null;
}
```

See [src/types.ts](./src/types.ts) for complete type definitions.

## Supported Servers

- crawl.akrasiac.org (CAO)
- Other servers using similar HTML format

