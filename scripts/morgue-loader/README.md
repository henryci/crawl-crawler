# Morgue Loader

Parses DCSS morgue files and loads them into a PostgreSQL database for analysis and querying.

## Prerequisites

1. **PostgreSQL database**: You need a running PostgreSQL instance with the schema applied.

2. **Environment configuration**: Create `apps/web/.env` with your database connection details:
   ```
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=crawl_crawler
   PGUSER=your_username
   PGPASSWORD=your_password
   ```

3. **Run migrations**: Before loading morgues, ensure the database schema is up to date:
   ```bash
   pnpm db:migrate
   ```

4. **Morgue files**: A directory containing `.txt` morgue files (typically downloaded using the `streak-downloader` script).

## Usage

There are two ways to load morgues:

### Option 1: CSV Generation + COPY (Recommended for bulk loading)

For large datasets (1000+ morgues), generate CSV files and use PostgreSQL's `COPY` command for much faster loading:

```bash
cd scripts/morgue-loader

# Generate CSV files (no database connection needed)
pnpm generate-csv <morgue-directory> <output-directory>

# Load into PostgreSQL
psql -d crawl_crawler -f <output-directory>/load.sql
```

**Example:**
```bash
pnpm generate-csv ../streak-downloader/outputs ./csv-output
psql -d crawl_crawler -f ./csv-output/load.sql
```

This generates:
- CSV files for all database tables (lookup tables, games, detail tables)
- A `load.sql` script that loads all CSVs in the correct order

**Why use this method?**
- ~100x faster than individual INSERTs for large datasets
- 30,000 morgues load in minutes instead of hours
- Single pass through files, no transaction overhead per row

### Option 2: Direct Database Loading (For incremental updates)

For smaller batches or incremental updates where you want to preserve existing data, run from the repository root:

```bash
pnpm load:morgues <directory>
```

**Example:**
```bash
pnpm load:morgues scripts/streak-downloader/outputs
```

This uses the `.env` file for database connection and inserts records directly.

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

Ensure PostgreSQL is running and your `.env` file has the correct connection details:
```bash
# Test connection
psql -d crawl_crawler -c "SELECT 1"
```

### Migration errors

If you see errors about missing columns, run the migrations:
```bash
pnpm db:migrate
```

### CSV COPY errors

If the `load.sql` script fails:

1. **Check for existing data**: The script truncates all tables by default. If you want to append instead, comment out the `TRUNCATE` section in `load.sql`.

2. **Permission errors**: Ensure the PostgreSQL user has permission to read the CSV files. The generated script uses `\copy` (client-side) which reads files from your local machine.

3. **Data type mismatches**: If you see type errors, check that the CSV files aren't corrupted. Re-run `generate-csv` to regenerate them.
