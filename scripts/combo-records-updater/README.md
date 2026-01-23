# Combo Records Updater

Downloads the latest DCSS combo records and saves them to the web app's public data folder. Also records the download timestamp in the database for display in the About page.

## Usage

```bash
# From the script directory
cd scripts/combo-records-updater
pnpm install
PGDATABASE=crawl_crawler pnpm run-update

# Or from the repo root
pnpm --filter combo-records-updater run-update
```

## Options

- `-u, --url <url>` - URL to fetch combo records from (default: https://crawl.akrasiac.org/scoring/top-combo-scores.html)
- `-h, --help` - Show help message

## Environment Variables

- `PGDATABASE` - PostgreSQL database name (required)
- `PGHOST` - PostgreSQL host (default: localhost)
- `PGUSER` - PostgreSQL user (default: current user)
- `PGPASSWORD` - PostgreSQL password (if required)

## Output

The script writes to `apps/web/public/data/combo-records.json` and updates the `service_metadata` table with the download timestamp.
