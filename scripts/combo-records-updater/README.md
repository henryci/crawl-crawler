# Combo Records Updater

Downloads the latest DCSS combo records and saves them to the web app's public data folder.

The download timestamp is stored in the JSON file itself (as `fetchedAt`), so no database connection is required.

## Usage

```bash
# From the script directory
cd scripts/combo-records-updater
pnpm install
pnpm run-update

# Or from the repo root
pnpm --filter combo-records-updater run-update
```

## Options

- `-u, --url <url>` - URL to fetch combo records from (default: https://crawl.akrasiac.org/scoring/top-combo-scores.html)
- `-h, --help` - Show help message

## Output

The script writes to `apps/web/public/data/combo-records.json`.
