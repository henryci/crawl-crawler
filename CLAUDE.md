# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What This Repo Is

Crawl Crawler is a pnpm-workspace monorepo for [Dungeon Crawl Stone Soup (DCSS)](https://crawl.develz.org/) data tooling:

- Parse DCSS morgue files into structured JSON
- Parse DCSS player pages
- Load and query game data in PostgreSQL
- Serve analytics and UI via Next.js

## First Steps For Any Task

1. Read this file before making changes.
2. Identify the smallest package(s) affected.
3. Prefer targeted commands/tests over full-repo runs unless asked.
4. Keep changes minimal and local; avoid broad refactors unless requested.
5. Run relevant tests/lint for touched code before finishing.

## Monorepo Layout

```text
apps/web/                         Next.js 16 app (App Router, React 19)
packages/dcss-morgue-parser/      Raw morgue text -> MorgueData
packages/dcss-player-parser/      Player page HTML -> PlayerData
packages/dcss-game-data/          Canonical static game data (species/gods/branches/etc)
packages/dcss-combo-records-parser/
packages/game-data-db/            PostgreSQL access + migrations
packages/sample_morgues/          Test/reference morgue files
scripts/morgue-loader/            Parse morgues and insert into DB
scripts/streak-downloader/        Download morgues for streak analysis (Python)
scripts/combo-records-updater/
scripts/morgue-parser-diagnostic/ Troubleshoot parser failures
```

## Core Data Flow

1. Morgues are downloaded by `scripts/streak-downloader/`.
2. `scripts/morgue-loader/load.ts` parses with `@crawl-crawler/dcss-morgue-parser`.
3. Parsed output is inserted into PostgreSQL via `@crawl-crawler/game-data-db`.
4. `apps/web` API routes query DB and frontend pages visualize data.
5. `/player` and `/morgue` intentionally do client-side parsing for ad-hoc lookups.

## High-Value Commands

```bash
# Install deps
pnpm install

# Dev app
pnpm dev

# Build all workspaces
pnpm build

# Parser-only build + tests
pnpm build:parser
pnpm test:parser
pnpm --filter dcss-morgue-parser test:watch

# Whole-repo lint
pnpm lint

# DB migration lifecycle
pnpm db:migrate
pnpm db:migrate:down
pnpm db:reset

# Data jobs
pnpm load:morgues
pnpm download:combo-records

# Parser diagnostics
pnpm diagnose:morgue
pnpm diagnose:morgue:verbose
```

## Package-Specific Working Notes

### `packages/dcss-morgue-parser`

- Primary extractor-based parser (header, branches, skills, spells, etc.).
- Prefer fixing extractor logic close to the failing section instead of adding parser-wide hacks.
- Add/update vitest coverage in `packages/dcss-morgue-parser/tests/` whenever behavior changes.
- Use `pnpm test:parser` first; use `pnpm diagnose:morgue` for hard edge cases.

### `packages/dcss-game-data`

- Source of canonical names and abbreviations.
- Keep naming compatibility for legacy variants where possible.
- Changes here can affect parser normalization and analytics grouping.

### `apps/web`

- API routes live under `apps/web/app/api/`.
- Frontend pages use App Router and Tailwind.
- `next.config.mjs` has `typescript.ignoreBuildErrors: true`; do not treat this as permission to ship type regressions.

### `packages/game-data-db`

- Migrations are numbered files in `packages/game-data-db/src/migrations/`.
- DB config comes from `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.
- Remote DB connections automatically use SSL.

## Code Style Expectations (TypeScript)

- Remove dead code completely (do not leave commented-out blocks).
- Avoid duplicated logic; extract shared helpers only when reuse is real.
- Explicitly type exported/public function boundaries.
- Prefer `unknown` over `any`, then narrow with guards.
- Prefer type guards over broad type assertions.
- Keep React components presentation-focused; move heavy transforms to helpers/hooks.
- Derive values from existing state instead of introducing sync-prone parallel state.

## Testing & Validation Expectations

- Run the narrowest relevant test command for touched areas.
- If parser output changes, add or update tests to document the new behavior.
- If DB code changes, validate migrations and basic query path.
- If API/frontend code changes, smoke test the related route/page.

## Safety Rules For Automated Edits

- Do not delete unrelated changes in a dirty working tree.
- Do not run destructive git commands unless explicitly requested.
- Do not add dependencies if existing workspace packages already provide what is needed.
- Keep commits focused and scoped to the requested task.

## Environment Notes

- Package manager: `pnpm` (workspace repo).
- Main app env file: `apps/web/.env`.
- Some root scripts may load env via `--env-file=apps/web/.env`.
- Deployment target is Vercel with root directory `apps/web`.
