# DCSS Morgue Downloader

Downloads morgue files (game logs) for Dungeon Crawl Stone Soup from a streaks HTML page.

## Requirements

```bash
pip install requests beautifulsoup4
```

## Usage

```bash
python download_morgues.py <url> [options]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `url` | URL to fetch the streaks HTML page from |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `-o, --output-dir` | `outputs` | Directory to save morgue files |
| `-d, --delay` | `10` | Delay in seconds between downloads |
| `-s, --sample` | None | Download only N randomly-selected morgues (for testing) |
| `-v, --verbose` | False | Enable verbose output |
| `--max-host-errors` | `2` | Number of errors before a host is marked as failed |

### Examples

```bash
# Download all morgues with default settings (10s delay)
python download_morgues.py "http://crawl.akrasiac.org/scoring/streaks.html"

# Download to a specific directory with 5s delay
python download_morgues.py -o ./morgues -d 5 "http://crawl.akrasiac.org/scoring/streaks.html"

# Test with 10 random morgues and verbose output
python download_morgues.py -s 10 -d 1 -v "http://crawl.akrasiac.org/scoring/streaks.html"

# Be more lenient with failing hosts (5 errors before skipping)
python download_morgues.py --max-host-errors 5 "http://crawl.akrasiac.org/scoring/streaks.html"
```

## Features

- **Rate limiting**: Configurable delay between downloads to be polite to servers
- **Resume support**: Skips files that already exist in the output directory
- **Host failure caching**: After N errors from a host, skips remaining URLs from that host
- **Content validation**: Rejects responses that are HTML (expired domains, error pages) instead of morgue files
- **Sampling mode**: Download a random subset for testing
