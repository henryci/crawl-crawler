# DCSS Combo Records Parser

A TypeScript library for parsing DCSS (Dungeon Crawl Stone Soup) top combo scores pages into structured JSON data.

## Features

- Parses the top combo scores HTML table from crawl.akrasiac.org
- Extracts detailed information for each combo record (score, player, runes, turns, etc.)
- Computes aggregate statistics by species and background
- Identifies removed/legacy species and backgrounds
- Includes CLI tool for downloading and saving records

## Installation

```bash
pnpm add dcss-combo-records-parser
```

## CLI Usage

Download combo records from the default source:

```bash
npx dcss-combo-records
```

Specify a custom URL and output path:

```bash
npx dcss-combo-records --url https://crawl.akrasiac.org/scoring/top-combo-scores.html --output ./data/records.json
```

### CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--url` | `-u` | URL to fetch combo records from | https://crawl.akrasiac.org/scoring/top-combo-scores.html |
| `--output` | `-o` | Output JSON file path | ./combo-records.json |
| `--help` | `-h` | Show help message | - |

## Library Usage

```typescript
import {
  parseComboRecords,
  parseComboRecordsWithAnalytics,
  defaultLegacyConfig,
  getSpeciesName,
  getBackgroundName,
  isSpeciesRemoved,
  isBackgroundRemoved,
} from 'dcss-combo-records-parser';

// Fetch and parse combo records
const response = await fetch('https://crawl.akrasiac.org/scoring/top-combo-scores.html');
const html = await response.text();

// Basic parsing
const data = parseComboRecords(html, 'https://crawl.akrasiac.org/scoring/top-combo-scores.html');
console.log(`Parsed ${data.totalRecords} records`);

// With analytics (species/background aggregates)
const dataWithAnalytics = parseComboRecordsWithAnalytics(html, sourceUrl);
console.log(`Found ${dataWithAnalytics.speciesStats.length} unique species`);

// Check if a species/background is removed
if (isSpeciesRemoved('Ce')) {
  console.log('Centaur is no longer playable');
}

// Get human-readable names
console.log(getSpeciesName('Mi')); // "Minotaur"
console.log(getBackgroundName('Be')); // "Berserker"
```

## Data Structures

### ComboRecord

```typescript
interface ComboRecord {
  rank: number;
  score: number;
  morgueUrl: string | null;
  character: string;      // e.g., "MiBe"
  species: string;        // e.g., "Mi"
  background: string;     // e.g., "Be"
  player: string;
  playerUrl: string | null;
  god: string;
  title: string;
  place: string;
  end: string;
  xl: number;
  turns: number;
  duration: string;
  runes: number;
  date: string;           // ISO format
  version: string;
  server: string;
  serverUrl: string | null;
}
```

### ComboRecordsWithAnalytics

Extends `ComboRecordsData` with:

```typescript
interface ComboRecordsWithAnalytics extends ComboRecordsData {
  speciesStats: SpeciesAggregate[];
  backgroundStats: BackgroundAggregate[];
  legacyConfig: LegacyConfig;
}
```

### Aggregate Statistics

```typescript
interface SpeciesAggregate {
  species: string;
  speciesName: string;
  isRemoved: boolean;
  recordCount: number;
  totalScore: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  oldestRecordDate: string;
  newestRecordDate: string;
  avgRunes: number;
}
```

## Legacy Configuration

The parser includes configuration for removed species and backgrounds, allowing you to identify records that can no longer be beaten:

### Removed Species (examples)
- Ce (Centaur) - removed in 0.25
- DD (Deep Dwarf) - removed in 0.27
- HO (Hill Orc) - removed in 0.27
- Mu (Mummy) - removed in 0.27
- Og (Ogre) - removed in 0.26

### Removed Backgrounds (examples)
- As (Assassin) - removed in 0.24
- St (Stalker) - removed in 0.26
- He (Healer) - removed in 0.20

You can provide a custom legacy config if needed:

```typescript
const customConfig = {
  ...defaultLegacyConfig,
  removedSpecies: [...defaultLegacyConfig.removedSpecies, 'XX'],
};

const data = parseComboRecordsWithAnalytics(html, url, customConfig);
```

## Scripts

From the monorepo root:

```bash
# Build the parser
pnpm build:combo-parser

# Download combo records to the web app's public data folder
pnpm download:combo-records
```

## License

MIT

