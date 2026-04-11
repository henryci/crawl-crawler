# Crawl Crawler

Tools for working with [Dungeon Crawl Stone Soup (DCSS)](https://crawl.develz.org/) data: parse morgue files, load them into PostgreSQL, analyze games, and browse results in a Next.js web app.

## What You Can Do Here

- Parse raw morgue `.txt` files into structured JSON
- Load parsed game data into a PostgreSQL schema built for analytics
- Run a web UI for player lookup, morgue breakdowns, records, and analytics
- Download morgues from scoring/streak pages for bulk ingestion

## Monorepo at a Glance

This repo uses [pnpm workspaces](https://pnpm.io/workspaces).

```text
crawl-crawler/
├── apps/
│   └── web/                          # Next.js app (UI + API routes)
├── packages/
│   ├── dcss-morgue-parser/           # Morgue text -> structured data
│   ├── dcss-player-parser/           # Player page HTML -> structured data
│   ├── dcss-combo-records-parser/    # Combo records parser/CLI
│   ├── dcss-game-data/               # Static DCSS reference data
│   └── game-data-db/                 # PostgreSQL schema + migrations
└── scripts/
    ├── streak-downloader/            # Download morgue files from streak pages
    ├── morgue-loader/                # Parse + load morgues into PostgreSQL
    ├── combo-records-updater/        # Refresh combo records JSON
    └── morgue-parser-diagnostic/     # Investigate parser edge cases
```

## Quick Start

### 1) Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL 14+ (for analytics/database-backed features)

### 2) Install dependencies

```bash
pnpm install
```

### 3) Configure database env

Create `apps/web/.env` with PostgreSQL connection details:

```bash
PGHOST=localhost
PGPORT=5432
PGDATABASE=crawl_crawler
PGUSER=your_username
PGPASSWORD=your_password
```

If you fetch morgues from `underhound.eu`, also set:

```bash
UNDERHOUND_BASIC_AUTH_USERNAME=your_underhound_username
UNDERHOUND_BASIC_AUTH_PASSWORD=your_underhound_password
```

### 4) Run migrations

```bash
pnpm db:migrate
```

### 5) Load combo records data

The `/records` page reads from `apps/web/public/data/combo-records.json`, so refresh that file after setup (and whenever you want newer records):

```bash
pnpm download:combo-records
```

### 6) Run the web app

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Analytics

This site uses Google Analytics to understand how people use the app and prioritize improvements.
It is not used for ads or monetization.

Google Analytics is only enabled in production when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
It does not run in local development.

## Load Data into the Database

If your main question is "how do I actually populate the DB?", start here.

### Step 0: Get morgue files first

Before loading, you need a directory of morgue `.txt` files.

If you do not already have morgues on disk, run the downloader:

```bash
cd scripts/streak-downloader
python download_morgues.py "http://crawl.akrasiac.org/scoring/streaks.html"
```

By default this writes files to `scripts/streak-downloader/outputs`.
See `scripts/streak-downloader/README.md` for options like sampling, output directory, and delay.

### Option A: Direct loading (simple, incremental)

```bash
pnpm load:morgues <directory-with-morgue-txt-files>
```

Example:

```bash
pnpm load:morgues scripts/streak-downloader/outputs
```

### Option B: CSV + PostgreSQL COPY (fast for bulk imports)

```bash
cd scripts/morgue-loader
pnpm generate-csv <morgue-directory> <output-directory>
psql -d crawl_crawler -f <output-directory>/load.sql
pnpm mark:streaks-updated
```

Use this method for large datasets because it is much faster than row-by-row inserts.
After CSV + COPY, run `pnpm mark:streaks-updated` so the About page shows the latest streak load date and analytics caches are invalidated.

## Load Combo Records Data

Combo records are not stored in PostgreSQL. They are downloaded to a JSON file used by the web app.

```bash
pnpm download:combo-records
```

This updates `apps/web/public/data/combo-records.json`.

### Typical end-to-end ingestion flow

1. Download morgues with `scripts/streak-downloader`
2. Run `pnpm db:migrate`
3. Load morgues via `pnpm load:morgues ...` (or CSV + COPY for bulk)
4. If you used CSV + COPY, run `pnpm mark:streaks-updated`
5. Run `pnpm download:combo-records`
6. Start the app with `pnpm dev`
7. Explore `/analytics` and `/records` in the web UI

## Common Commands (Workspace Root)

```bash
# App
pnpm dev
pnpm build
pnpm lint

# Parser package
pnpm build:parser
pnpm test:parser

# Database
pnpm db:migrate
pnpm db:migrate:down
pnpm db:reset
pnpm load:morgues <dir>
pnpm mark:streaks-updated

# Utilities
pnpm diagnose:morgue
pnpm diagnose:morgue:verbose
pnpm download:combo-records
```

## Documentation Map

### Core packages

- `packages/dcss-morgue-parser/README.md` - Morgue parser library and CLI
- `packages/dcss-player-parser/README.md` - Player page parser
- `packages/dcss-combo-records-parser/README.md` - Combo records parser
- `packages/dcss-game-data/README.md` - Static species/background/god/branch data
- `packages/game-data-db/README.md` - DB schema, migrations, and query utilities

### Scripts

- `scripts/streak-downloader/README.md` - Download morgue files from streak pages
- `scripts/morgue-loader/README.md` - Parse and load morgues into PostgreSQL
- `scripts/morgue-parser-diagnostic/README.md` - Troubleshoot parser behavior
- `scripts/combo-records-updater/README.md` - Update combo records data

## Contributing

- For bugs, features, and questions, open a GitHub issue using the provided templates.
- See `CONTRIBUTING.md` for contribution workflow and expectations.

