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

- **Progress tracking**: Shows real-time progress with items/minute, downloads/minute, and estimated time remaining
- **Rate limiting**: Configurable delay between downloads to be polite to servers
- **Resume support**: Skips files that already exist in the output directory
- **Host failure caching**: After N errors from a host, skips remaining URLs from that host
- **Content validation**: Rejects responses that are HTML (expired domains, error pages) instead of morgue files
- **Sampling mode**: Download a random subset for testing

## Progress Output

The script displays real-time progress information during downloads:

```
Starting download of 1250 morgue files...
Output directory: /path/to/outputs
Delay between downloads: 10s

[0/1250] (0.0%) - morgue-player1-20231015-123456.txt
[1/1250] (0.1%) - morgue-player2-20231016-234567.txt
[2/1250] (0.2%) | 5.8 items/min (5.8 downloads/min) | ETA: 3h 35m - morgue-player3-20231017-345678.txt
...

==================================================
Download complete!
  Total time: 3h 28m
  Total URLs: 1250
  Downloaded: 1100
  Skipped (already exist): 120
  Skipped (host failed): 25
  Errors: 5
  Average download rate: 5.3 downloads/min
```

The progress line shows:
- **Items processed / Total**: How many URLs have been processed
- **Percentage**: Completion percentage  
- **Items/min**: Total processing rate (including skips)
- **Downloads/min**: Actual network download rate
- **ETA**: Estimated time remaining based on current pace
