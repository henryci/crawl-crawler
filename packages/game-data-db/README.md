# @crawl-crawler/game-data-db

PostgreSQL database schema and utilities for storing parsed DCSS (Dungeon Crawl Stone Soup) game data from morgue files.

## Overview

This package provides:
- A normalized PostgreSQL schema optimized for analytics queries
- Migration scripts for schema management
- Connection utilities for use in other packages

## Schema Design

The schema is designed for efficient querying of large game datasets (100k+ games) by:

1. **Using lookup tables** instead of storing strings repeatedly:
   - `races` - Species with 2-letter codes (Mi, Hu, DE, etc.)
   - `backgrounds` - Classes with codes (Be, Fi, FE, etc.)
   - `gods` - All DCSS gods
   - `skills` - All skills
   - `spells` - Spells with level info
   - `spell_schools` - Magic schools
   - `branches` - Dungeon branches
   - `runes` - All runes
   - `game_versions` - Parsed version strings

2. **Proper indexing** for common query patterns:
   - Race/background combo filtering
   - God filtering
   - Win/loss filtering
   - Score sorting
   - Date range queries

### Main Tables

#### `games`
The primary table storing one row per game with:
- Player name, score, character level
- Foreign keys to lookup tables (race, background, god, version)
- Game outcome (win/loss), dates, duration, turns
- Final stats (HP, MP, AC, EV, etc.)
- Rune/gem counts

#### Detail Tables
- `game_runes` - Runes collected (many-to-many)
- `game_gods` - Gods worshipped during the game (with order)
- `game_skills` - Final skill levels
- `game_skill_progression` - Skill levels by XL (for heatmaps)
- `game_spells` - Memorized spells at game end
- `game_branches` - Branch visit information
- `game_xp_progression` - XL progression (turn/location)
- `game_branch_time` - Time spent per branch
- `game_actions` - Action counts by category
- `game_equipment` - Equipped items

## Setup

### Prerequisites

- PostgreSQL 14+ running locally
- Node.js 18+

### Create Database

```bash
psql -h localhost -c "CREATE DATABASE crawl_crawler;"
```

### Run Migrations

```bash
# From workspace root
pnpm db:migrate

# Or from this package
PGDATABASE=crawl_crawler pnpm migrate
```

### Rollback Migrations

```bash
# From workspace root
pnpm db:migrate:down

# Or from this package
PGDATABASE=crawl_crawler pnpm migrate:down
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PGHOST` | `localhost` | PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGDATABASE` | `crawl_crawler` | Database name |
| `PGUSER` | `$USER` | Database user |
| `PGPASSWORD` | (none) | Database password |

## Usage

### Connection Pool

```typescript
import { getPool, query, closePool } from '@crawl-crawler/game-data-db';

// Simple query
const result = await query('SELECT * FROM games WHERE is_win = true LIMIT 10');
console.log(result.rows);

// With parameters
const games = await query(
  'SELECT * FROM games WHERE race_id = $1',
  [raceId]
);

// Close pool when done (e.g., in scripts)
await closePool();
```

### Transactions

```typescript
import { withTransaction } from '@crawl-crawler/game-data-db';

await withTransaction(async (client) => {
  await client.query('INSERT INTO games ...');
  await client.query('INSERT INTO game_skills ...');
  // Commits on success, rolls back on error
});
```

### Direct Client Access

```typescript
import { getClient } from '@crawl-crawler/game-data-db';

const client = await getClient();
try {
  await client.query('BEGIN');
  // ... multiple queries
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

## Schema Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   races     │     │ backgrounds │     │    gods     │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ code        │     │ code        │     │ name        │
│ name        │     │ name        │     │ is_removed  │
│ is_removed  │     │ is_removed  │     └──────┬──────┘
└──────┬──────┘     └──────┬──────┘            │
       │                   │                   │
       └─────────┬─────────┴───────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │    games     │
         ├──────────────┤
         │ id           │
         │ player_name  │
         │ score        │
         │ race_id ─────┼──► races
         │ background_id┼──► backgrounds
         │ god_id ──────┼──► gods
         │ version_id ──┼──► game_versions
         │ is_win       │
         │ runes_count  │
         │ ...stats...  │
         └──────┬───────┘
                │
    ┌───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
│game_   │ │game_   │ │game_   │ │game_skill_ │
│skills  │ │spells  │ │runes   │ │progression │
└────────┘ └────────┘ └────────┘ └────────────┘
```

## Adding Migrations

Create a new file in `src/migrations/` following the naming pattern `NNN_description.ts`:

```typescript
import type pg from 'pg';

export const name = '002_add_new_feature';

export async function up(client: pg.PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE games ADD COLUMN new_field TEXT;
  `);
}

export async function down(client: pg.PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE games DROP COLUMN new_field;
  `);
}
```

Then import and add it to the `migrations` array in `src/migrate.ts`.

## Security Considerations

### SQL Injection Prevention

All queries use **parameterized queries** via `pg`'s built-in parameter binding:

```typescript
// SAFE: Parameters are bound, not interpolated
await query('SELECT * FROM games WHERE player_name = $1', [playerName]);

// NEVER DO THIS - vulnerable to SQL injection
await query(`SELECT * FROM games WHERE player_name = '${playerName}'`);
```

### Secrets Management

Database credentials are loaded from environment variables, never hardcoded:

| Variable | Description |
|----------|-------------|
| `PGPASSWORD` | Database password (never commit to git) |
| `PGUSER` | Database user |
| `PGHOST` | Database host |

**Recommendations for production:**
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Use connection strings with SSL: `postgresql://user:pass@host/db?sslmode=require`
- Never log connection strings or passwords
- Use database roles with minimal required permissions

### Input Validation

The API routes validate and sanitize all user input:
- String length limits to prevent DoS
- Array length limits for multi-select filters
- Numeric range validation
- Type coercion with fallbacks

### Connection Security

For production deployments:

```typescript
const pool = new Pool({
  // ... other config
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem'),
  },
});
```

## Related Packages

- `dcss-morgue-parser` - Parses morgue files to JSON
- `morgue-loader` (script) - Loads parsed morgue data into this database
