# Morgue Loader

Parses DCSS morgue files and loads them into a PostgreSQL database for analysis and querying.

## Prerequisites

1. **PostgreSQL database**: You need a running PostgreSQL instance with the schema applied.

2. **Run migrations**: Before loading morgues, ensure the database schema is up to date:
   ```bash
   cd packages/game-data-db
   PGDATABASE=crawl_crawler pnpm migrate
   ```

3. **Morgue files**: A directory containing `.txt` morgue files (typically downloaded using the `streak-downloader` script).

## Usage

```bash
cd scripts/morgue-loader
PGDATABASE=crawl_crawler pnpm load <directory>
```

### Environment Variables

The loader uses standard PostgreSQL environment variables for connection:

| Variable | Description | Default |
|----------|-------------|---------|
| `PGHOST` | Database host | `localhost` |
| `PGPORT` | Database port | `5432` |
| `PGDATABASE` | Database name | (required) |
| `PGUSER` | Database user | current user |
| `PGPASSWORD` | Database password | (none) |

### Examples

```bash
# Load morgues from the streak-downloader output directory
PGDATABASE=crawl_crawler pnpm load ../streak-downloader/outputs

# With full connection details
PGHOST=localhost PGPORT=5432 PGDATABASE=crawl_crawler PGUSER=myuser pnpm load /path/to/morgues
```

## URL Mapping Integration

If the morgue directory contains a `url_mapping.csv` file (created by the `streak-downloader` script), the loader will automatically:

1. Read the CSV to get the source URL for each morgue file
2. Pass the URL to the parser
3. Store the URL in the database's `source_url` field

This allows the UI to link back to the original morgue file on the server.

### CSV Format

```csv
filename,url
morgue-player1-20231015-123456.txt,http://crawl.akrasiac.org/rawdata/player1/morgue-player1-20231015-123456.txt
morgue-player2-20231016-234567.txt,http://crawl.berotato.org/crawl/morgue/player2/morgue-player2-20231016-234567.txt
```

## Deduplication

The loader prevents duplicate entries using two mechanisms:

1. **Filename uniqueness**: Each `morgue_filename` must be unique in the database.

2. **Content hash**: Each morgue file's SHA-256 hash (`morgue_hash`) is stored and checked. This catches duplicates even if the same morgue is downloaded with a different filename.

Running the loader multiple times over the same directory is safe - existing files will be skipped.

## Output

The loader provides progress output:

```
Found 1250 morgue files to process
Loaded 500 URL mappings from /path/to/outputs/url_mapping.csv
  [1/1250] Loaded morgue-player1-20231015-123456.txt -> game #1
  [50/1250] Loaded morgue-player50-20231020-111111.txt -> game #50
  ...

Complete!
  Loaded: 1100
  Skipped (already loaded or invalid): 145
  Failed: 5
```

## What Gets Loaded

The loader extracts and stores:

- **Core info**: Player name, score, version, race, background, character level, title
- **Game outcome**: Win/loss, dates, duration, turns
- **Character stats**: HP, MP, AC, EV, SH, attributes, gold
- **Runes and gems**: List of collected runes/gems
- **God worship**: Full history of gods worshipped during the game
- **Skills**: Final skill levels and progression by XL
- **Spells**: Memorized spells with schools and failure rates
- **Branches**: Visited branches with depth information
- **XP progression**: Turn and location for each XL reached
- **Time stats**: Time spent in each branch (for newer morgues)
- **Actions**: Combat and ability usage statistics
- **Equipment**: Items equipped at game end

## Troubleshooting

### "No player name" skips

Some morgue files may be incomplete or corrupted. These are skipped with a message like:
```
Skipping morgue-xxx.txt (no player name)
```

### Connection errors

Ensure PostgreSQL is running and the connection details are correct:
```bash
# Test connection
psql -h $PGHOST -p $PGPORT -d $PGDATABASE -c "SELECT 1"
```

### Migration errors

If you see errors about missing columns, run the migrations:
```bash
cd packages/game-data-db
PGDATABASE=crawl_crawler pnpm migrate
```
