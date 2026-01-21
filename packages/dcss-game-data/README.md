# dcss-game-data

Centralized game data definitions for Dungeon Crawl Stone Soup (DCSS).

This package provides canonical data for species, backgrounds, gods, branches, and related game configuration. It serves as the single source of truth for DCSS game data across all packages in this monorepo.

## Installation

```bash
pnpm add dcss-game-data
```

## Usage

### Species (Races)

```typescript
import {
  SPECIES,
  getSpeciesName,
  getSpeciesCode,
  isSpeciesRemoved,
  parseRaceBackground,
} from 'dcss-game-data';

// Get all species
console.log(SPECIES.length); // All species including removed ones

// Get species name from code
getSpeciesName('Mi'); // "Minotaur"
getSpeciesName('Gn', '0.13'); // "Gnome" (version-aware)
getSpeciesName('Gn', '0.32'); // "Gnoll" (version-aware)

// Get species code from name
getSpeciesCode('Minotaur'); // "Mi"
getSpeciesCode('Black Draconian'); // "Dr" (handles draconian colors)

// Check if species is removed
isSpeciesRemoved('Ce'); // true (Centaur was removed in 0.25)
isSpeciesRemoved('Mi'); // false (Minotaur is still playable)

// Parse "Race Background" string
parseRaceBackground('Deep Dwarf Healer');
// { race: 'Deep Dwarf', background: 'Healer' }
```

### Backgrounds (Classes)

```typescript
import {
  BACKGROUNDS,
  getBackgroundName,
  getBackgroundCode,
  isBackgroundRemoved,
} from 'dcss-game-data';

// Get background name from code
getBackgroundName('Fi'); // "Fighter"

// Get background code from name
getBackgroundCode('Berserker'); // "Be"

// Check if background is removed
isBackgroundRemoved('He'); // true (Healer was removed in 0.20)
```

### Gods

```typescript
import { GODS, cleanGodName, GODS_BY_NAME } from 'dcss-game-data';

// Clean god name (remove epithets)
cleanGodName('Makhleb the Destroyer'); // "Makhleb"
cleanGodName('Warmaster Okawaru'); // "Okawaru"

// Look up god
GODS_BY_NAME.get('kiku'); // God object for Kikubaaqudgha
```

### Branches

```typescript
import {
  BRANCHES,
  getCanonicalBranchName,
  PORTAL_BRANCHES,
} from 'dcss-game-data';

// Get canonical branch name from alias
getCanonicalBranchName('Orc'); // "Orcish Mines"
getCanonicalBranchName('D'); // "Dungeon"

// Check if branch is a portal
PORTAL_BRANCHES.includes('Sewer'); // true
```

### Combo Restrictions

```typescript
import { isComboRestricted, isRecordLegacy } from 'dcss-game-data';

// Check if combo is restricted
isComboRestricted('Dg', 'Be'); // true (Demigod Berserker)

// Check if a record is legacy (removed species/background or restricted combo)
isRecordLegacy('Ce', 'Fi'); // true (Centaur is removed)
```

### Legacy Config (Backwards Compatibility)

```typescript
import { buildLegacyConfig } from 'dcss-game-data';

// Build a LegacyConfig object for backwards compatibility
const config = buildLegacyConfig();
// {
//   removedSpecies: ['Ce', 'DD', ...],
//   removedBackgrounds: ['He', 'As', ...],
//   restrictedCombos: ['DgBe', 'DgCK', ...],
//   speciesNames: { Mi: 'Minotaur', ... },
//   backgroundNames: { Fi: 'Fighter', ... },
// }
```

## Data Structure

### Species

Each species has:
- `code`: Two-letter code (e.g., "Mi")
- `name`: Full name (e.g., "Minotaur")
- `aliases`: Alternative names (optional)
- `addedInVersion`: Version when added (optional)
- `removedInVersion`: Version when removed (optional)
- `previousCode`: Info about reused codes (optional)

### Backgrounds

Each background has:
- `code`: Two-letter code (e.g., "Fi")
- `name`: Full name (e.g., "Fighter")
- `aliases`: Alternative names (optional)
- `addedInVersion`: Version when added (optional)
- `removedInVersion`: Version when removed (optional)

### Gods

Each god has:
- `name`: Full canonical name
- `shortName`: Common short name (optional)
- `epithet`: Title/epithet (optional)
- `addedInVersion`: Version when added (optional)
- `removedInVersion`: Version when removed (optional)

### Branches

Each branch has:
- `name`: Full canonical name
- `shortName`: Short abbreviation
- `isPortal`: Whether it's a portal vault
- `addedInVersion`: Version when added (optional)
- `removedInVersion`: Version when removed (optional)

## Version-Aware Lookups

Some codes were reused for different species/backgrounds over time. The utility functions support version-aware lookups:

```typescript
// "Gn" was Gnome before 0.14, Gnoll from 0.14 onwards
getSpeciesName('Gn', '0.10'); // "Gnome"
getSpeciesName('Gn', '0.32'); // "Gnoll"
```

## License

MIT
