# DCSS Morgue Parser

A high-quality TypeScript library for parsing [Dungeon Crawl Stone Soup](https://crawl.develz.org/) morgue files. Works in both Node.js and browser environments.

## Features

- **Deterministic & Lossless**: Parses morgue files preserving all data, edge cases, and quirks
- **Universal**: Works in Node.js and modern browsers
- **Type-Safe**: Full TypeScript support with strict types
- **Framework-Agnostic**: Pure parsing logic with no side effects
- **Zero Dependencies**: No runtime dependencies for the core parser
- **CLI Included**: Command-line tool for batch processing
- **Content Hash**: Generates a SHA-256 hash of the morgue content for deduplication

## Installation

```bash
npm install dcss-morgue-parser
```

## Quick Start

### Node.js

```typescript
import { parseMorgue } from 'dcss-morgue-parser';
import { readFileSync } from 'fs';

const morgueText = readFileSync('morgue-Player-20250101.txt', 'utf-8');
const result = await parseMorgue(morgueText, {
  sourceUrl: 'http://crawl.akrasiac.org/rawdata/player/morgue.txt'
});

if (result.success) {
  console.log(`${result.data.playerName} the ${result.data.title}`);
  console.log(`Score: ${result.data.score}`);
  console.log(`Race: ${result.data.race} ${result.data.background}`);
  console.log(`Runes: ${result.data.runesList?.length ?? 0}`);
  console.log(`Hash: ${result.data.morgueHash}`);
  console.log(`Source: ${result.data.sourceUrl}`);
}
```

### Browser

```typescript
import { parseMorgue } from 'dcss-morgue-parser';

// From file input
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const result = await parseMorgue(text);
  
  // Use result.data to populate your UI
  displayCharacterInfo(result.data);
});

// From fetch
const response = await fetch('/morgues/example.txt');
const text = await response.text();
const result = await parseMorgue(text);
```

### CLI

```bash
# Print JSON to stdout
npx dcss-morgue-parser morgue.txt

# Write JSON to output directory
npx dcss-morgue-parser morgue.txt -o output/

# Process all .txt files in a directory
npx dcss-morgue-parser /path/to/morgues/ -o output/

# Verbose output
npx dcss-morgue-parser morgue.txt -v -o output/
```

## API Reference

### `parseMorgue(content: string, options?: ParseOptions): Promise<ParseResult>`

Parse a morgue file and return structured data with success status. The function is async because it computes a SHA-256 hash of the content using the Web Crypto API.

```typescript
interface ParseOptions {
  sourceUrl?: string;  // URL where the original morgue file can be found
}
```

```typescript
interface ParseResult {
  success: boolean;  // true if no parse errors occurred
  data: MorgueData;  // the parsed data
}
```

### `parseMorgueData(content: string, options?: ParseOptions): Promise<MorgueData>`

Convenience function that returns just the data without the result wrapper.

### Types

#### `MorgueData`

The main data structure containing all parsed information:

```typescript
interface MorgueData {
  // Parser metadata
  parserVersion: string;
  morgueHash: string;       // SHA-256 hash of original content (64 hex chars)
  sourceUrl: string | null; // URL where the original morgue can be found
  parseErrors: string[];

  // Header information
  version: string | null;           // DCSS version (e.g., "0.30.0")
  isWebtiles: boolean | null;       // Whether played on webtiles
  gameSeed: string | null;          // Game seed (0.19+)
  score: number | null;             // Final score
  playerName: string | null;        // Character name
  title: string | null;             // Title (e.g., "Archmage")
  race: string | null;              // Race (e.g., "Minotaur")
  background: string | null;        // Background (e.g., "Fighter")
  characterLevel: number | null;    // XL at game end
  startDate: string | null;         // Game start date
  endDate: string | null;           // Game end date
  gameDuration: string | null;      // Duration as "HH:MM:SS"
  gameDurationSeconds: number | null;
  totalTurns: number | null;
  runesCollected: number | null;
  runesList: string[] | null;
  gemsCollected: number | null;     // 0.32+
  gemsList: string[] | null;        // 0.32+
  branchesVisitedCount: number | null;
  levelsSeenCount: number | null;

  // Detailed sections
  endingStats: CharacterStats | null;
  equipment: Equipment | null;
  endingSkills: Record<string, number> | null;
  skillsByXl: Record<string, SkillProgression> | null;
  endingSpells: Spell[] | null;
  godsWorshipped: GodRecord[] | null;
  branches: Record<string, BranchInfo> | null;
  xpProgression: Record<string, XpProgression> | null;
  actions: Actions | null;
}
```

#### `CharacterStats`

```typescript
interface CharacterStats {
  hpCurrent: number | null;
  hpMax: number | null;
  mpCurrent: number | null;
  mpMax: number | null;
  ac: number | null;
  ev: number | null;
  sh: number | null;
  str: number | null;
  int: number | null;
  dex: number | null;
  gold: number | null;
  god: string | null;
  piety: number | null;  // 0-6 stars
}
```

#### `Equipment`

```typescript
interface Equipment {
  weapon: string | null;
  bodyArmour: string | null;
  shield: string | null;
  helmet: string | null;
  cloak: string | null;
  gloves: string | null;
  boots: string | null;
  amulet: string | null;
  rings: string[];
}
```

#### `Spell`

```typescript
interface Spell {
  slot: string;           // a-z
  name: string;
  schools: string[];      // e.g., ["Conjurations", "Earth"]
  level: number | null;   // 1-9
  failure: string;        // e.g., "1%"
}
```

#### `GodRecord`

```typescript
interface GodRecord {
  god: string;
  startedTurn: number | null;
  startedLocation: string | null;
  endedTurn: number | null;  // null if still worshipping
}
```

## Morgue File Format

DCSS morgue files are plain text files generated when a game ends. They contain:

1. **Header**: Version, score, player info, dates, runes
2. **Stats Block**: HP, MP, AC, EV, attributes, god
3. **Resistances**: Fire, cold, negative energy, etc.
4. **Inventory**: All items, with equipped items marked
5. **Skills**: Current skill levels
6. **Spells**: Memorized spells with schools and failure rates
7. **Dungeon Overview**: Branches visited, shops, portals
8. **Message History**: Recent game messages
9. **Vanquished Creatures**: Kill list
10. **Notes**: Chronological game events
11. **Action Table**: Combat and ability usage statistics (0.16+)
12. **Time Table**: Time spent in each branch (0.25+)

### Version Differences

The parser handles format differences across DCSS versions:

| Feature | Version |
|---------|---------|
| Game seed | 0.19+ |
| Gems | 0.32+ |
| Action table | 0.16+ |
| Time table (decaauts) | 0.25+ |
| Top levels by time | 0.29+ |
| Health/Magic labels | 0.23+ (older: HP/MP) |
| Skill table format | 0.23+ |

## Differences from Python Implementation

This TypeScript implementation aims for full parity with the original Python parser. Known differences:

- **Property naming**: Uses camelCase (TypeScript convention) instead of snake_case
- **Null handling**: Uses `null` instead of Python's `None`
- **Type safety**: All fields have explicit types; the Python version uses dynamic typing

## Building

```bash
npm install
npm run build
```

## Testing

```bash
npm test
```

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`npm test`)
2. TypeScript compiles without errors (`npm run typecheck`)
3. Code follows existing style conventions

