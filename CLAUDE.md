# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crawl Crawler is a monorepo of tools for [DCSS (Dungeon Crawl Stone Soup)](https://crawl.develz.org/), a roguelike game. It provides morgue file parsing, player statistics, win streak analytics, and a web frontend. Uses **pnpm workspaces**.

## Commands

```bash
# Install dependencies
pnpm install

# Run web app (Next.js dev server)
pnpm dev

# Build everything
pnpm build

# Build just the morgue parser library
pnpm build:parser

# Run morgue parser tests
pnpm test:parser

# Run tests in watch mode (inside dcss-morgue-parser package)
pnpm --filter dcss-morgue-parser test:watch

# Lint
pnpm lint

# Database migrations
pnpm db:migrate        # run pending migrations
pnpm db:migrate:down   # rollback
pnpm db:reset          # reset all

# Load parsed morgue files into DB
pnpm load:morgues

# Download and update combo records JSON
pnpm download:combo-records

# Diagnose a morgue parsing issue
pnpm diagnose:morgue
pnpm diagnose:morgue:verbose
```

## Architecture

### Monorepo Structure

```
apps/web/               # Next.js 16 web application (App Router, React 19)
packages/
  dcss-morgue-parser/   # Parses raw morgue .txt files → structured MorgueData
  dcss-player-parser/   # Parses player HTML pages from DCSS servers → PlayerData
  dcss-combo-records-parser/ # Parses combo records JSON from CAO
  dcss-game-data/       # Static DCSS game data: species, backgrounds, gods, branches, combos
  game-data-db/         # PostgreSQL connection pool + migration runner
  sample_morgues/       # Sample morgue files used for testing
scripts/
  morgue-loader/        # load.ts: reads morgue files from disk, parses, inserts into DB
  streak-downloader/    # Python script to download morgue files for win streaks
  combo-records-updater/
```

### Data Flow

1. **Data ingestion**: `scripts/streak-downloader/` (Python) downloads morgue `.txt` files from DCSS servers. `scripts/morgue-loader/load.ts` parses them via `dcss-morgue-parser` and inserts into PostgreSQL (`game-data-db`).

2. **Web backend** (`apps/web/app/api/`): Next.js Route Handlers query PostgreSQL via `@crawl-crawler/game-data-db`. Key APIs:
   - `/api/analytics` — filtered game analytics (species, background, god filters, sorting, pagination)
   - `/api/analytics/aggregate` — aggregate stats
   - `/api/analytics/trends` — time-series trends
   - `/api/analytics/skills` and `/api/analytics/spells` — skill/spell usage data
   - `/api/morgue/[hash]` — retrieve stored parsed morgue JSON by hash
   - `/api/proxy` — allowlisted proxy to DCSS server URLs (for client-side fetching)
   - `/api/service-metadata` — last update timestamps

3. **Web frontend pages** (`apps/web/app/`):
   - `/` — home page with dungeon map navigation UI
   - `/player` — client-side player lookup: fetches player HTML from DCSS servers via `/api/proxy`, parses it client-side with `dcss-player-parser`, displays stats/wins/streaks
   - `/morgue` — client-side morgue file parser: fetches a morgue URL via `/api/proxy`, parses it client-side with `dcss-morgue-parser`, shows full game breakdown
   - `/records` — combo records
   - `/analytics` — server/client hybrid analytics dashboard querying the DB

### Key Package Roles

- **`dcss-morgue-parser`**: Core parsing library. Takes raw morgue text → `MorgueData`. Has extractors per section (header, skills, branches, actions, spells, etc.). Uses vitest for tests. Can also run as a CLI.
- **`dcss-player-parser`**: Parses player scoring pages (HTML) from DCSS servers into `PlayerData` (wins, streaks, stats). Client-side only (no server dependency).
- **`dcss-game-data`**: Pure data: all valid species, backgrounds, gods, branches, and their abbreviations/names. Used by parsers and the analytics API for legacy name mapping.
- **`game-data-db`**: Thin wrapper around `pg` (PostgreSQL). Exports `query()`, `withTransaction()`, migration runner. DB config comes from `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` env vars. Remote DBs (non-localhost) auto-enable SSL.

### Database

PostgreSQL. Migrations live in `packages/game-data-db/src/migrations/` (numbered `.ts` files). The `apps/web/.env` file provides DB connection variables for the web app; the root-level scripts use the same variables loaded via `--env-file=apps/web/.env`.

### Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI primitives), Recharts
- **Package manager**: pnpm (v9) with workspaces
- **Testing**: vitest (only in `dcss-morgue-parser` and `dcss-player-parser`)
- **Deployment**: Vercel (set root directory to `apps/web`)

### Notes

- `next.config.mjs` has `typescript.ignoreBuildErrors: true` — TypeScript errors won't block builds.
- The `/api/proxy` route only permits fetching from an allowlist of known DCSS servers.
- Client-side parsing (player page, morgue page) is intentional — avoids server load for ad-hoc user lookups.
- `pnpm -r` runs a command recursively across all workspace packages.

## TypeScript Conventions

**No dead code.** Delete unused variables, imports, functions, and types rather than commenting them out or leaving them in place. If something is removed, remove it fully.

**No duplicated logic.** Before writing a new helper, check whether the logic already exists in the codebase. Inline trivial one-liners rather than creating a helper for them; extract a shared helper only when the same non-trivial logic is genuinely needed in multiple places.

**Prefer explicit types at boundaries.** Function parameters and return types should be typed explicitly when the function is exported or part of an API boundary. Internal/local variables can rely on inference.

**Use `unknown` over `any`.** When a type is truly unknown, use `unknown` and narrow it. Avoid `any` — it silently defeats type checking.

**Narrow with type guards, not casts.** Prefer `if (typeof x === 'string')` or a typed predicate function over `x as string`. Only use `as` when you have information TypeScript can't infer and narrowing is impractical.

**Keep components focused.** React components should render UI. Extract data-fetching, filtering, and transformation logic into hooks or plain functions rather than embedding it inline in JSX.

**Derive, don't sync.** Prefer computing derived values directly from existing state rather than introducing a parallel piece of state that must be kept in sync with `useEffect`.
