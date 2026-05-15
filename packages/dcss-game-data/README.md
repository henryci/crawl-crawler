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

## Equipment Data

Equipment-related data for the equipment optimizer feature lives under
`src/equipment/` and is split between:

- **Curated** files (hand-written semantic metadata) — `properties.ts`,
  `brands.ts`, `egos.ts`, `jewelry.ts`, `staves.ts`, `species-equip.ts`,
  `multi-slot.ts`.
- **Generated** files (auto-extracted from DCSS C++ source) under
  `src/equipment/generated/` — `artp.ts` (and, as the extract surface
  expands, `brand.ts`, `sparm.ts`, weapon/armor base tables, unrand data).

Generated files are committed to the repo so consumers don't need a local
DCSS source checkout. The pinned DCSS commit lives in `dcss-version.json`.

See `EQUIPMENT_OPTIMIZER_DESIGN.md` in this package for the full design.

### Updating to a new DCSS version

When DCSS releases new content (new ARTPs, brands, egos, items, species
rules), follow this procedure:

```bash
# 1. Update the local DCSS source to the target commit.
cd ../../../source/crawl
git fetch origin
git checkout <target-sha>

# 2. From the repo root, extract enums and tables from DCSS source.
cd -
pnpm --filter dcss-game-data extract

# 3. Check for unmapped new entries.
pnpm --filter dcss-game-data verify
# On failure, the script prints which file needs a curated entry and
# which DCSS enum value is missing. For each, add a curated entry to
# the named file. (For ARTPs: extend CURATED_ARTP_META in properties.ts.)

# 4. Re-run verify until it passes.
pnpm --filter dcss-game-data verify

# 5. Run typecheck and any relevant tests.
pnpm --filter dcss-game-data typecheck
pnpm --filter dcss-morgue-parser test

# 6. Update the pinned SHA in dcss-version.json.

# 7. Commit the changes:
#    - dcss-version.json
#    - src/equipment/generated/*.ts (regenerated)
#    - any new curated entries in src/equipment/*.ts
```

### Verify script: what it checks

`pnpm --filter dcss-game-data verify` fails if any of:

1. The pinned `dcss-version.json` SHA doesn't match `git rev-parse HEAD`
   in the local DCSS source. Catches "I updated the source but forgot to
   bump the version."
2. A non-legacy ARTP_* from DCSS source lacks a curated entry in
   `properties.ts`. (Legacy ARTPs — those guarded by
   `#if TAG_MAJOR_VERSION == 34` — are accepted silently.)
3. A curated entry references an ARTP_* that no longer exists in DCSS.

Future checks (added as the extract surface expands): SPWPN_* coverage,
SPARM_* coverage, weapon/armor base table coverage, unrand list coverage.

### Why this split?

Mechanical extraction handles things that follow regular C++ patterns
(enum declarations, struct tables, flat data files like `art-data.txt`).
Hand-curation handles things that don't (an ego's actual effects are
implemented imperatively across many source files; we have to read DCSS
and write our model).

By keeping the curated layer separate from the generated layer, we get:

- Stable, reviewable hand-written semantics.
- Mechanical detection of "DCSS added a thing we haven't mapped yet."
- A short feedback loop when updating: `extract` → `verify` → fix → repeat.

## License

MIT
