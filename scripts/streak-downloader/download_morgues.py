#!/usr/bin/env python3
"""
Download DCSS morgue files from a streaks HTML page.

This script:
1. Fetches or reads an HTML page containing streak data
2. Extracts all morgue file URLs from the page
3. Downloads them to an output directory with rate limiting and error caching
"""

import argparse
import csv
import fcntl
import os
import random
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


# Default name for the URL mapping CSV file
URL_MAPPING_FILENAME = "url_mapping.csv"


@dataclass
class ProgressTracker:
    """Track download progress and estimate remaining time."""
    total: int
    delay_seconds: float = 0.0  # Delay between downloads (included in ETA)
    completed: int = 0
    successful_downloads: int = 0  # Successful downloads only
    errors: int = 0  # Failed network requests
    skipped: int = 0  # Items skipped (already exist, host failed)
    start_time: float = field(default_factory=time.time)
    # Track time spent on successful downloads only (not including delay)
    download_time: float = 0.0
    _last_download_start: float = 0.0
    
    # Minimum successful downloads before showing ETA (need enough data for accuracy)
    MIN_DOWNLOADS_FOR_ETA: int = 3
    
    def start_item(self) -> None:
        """Mark the start of processing an item."""
        self._last_download_start = time.time()
    
    def record_result(self, result_type: str) -> None:
        """
        Record the result of processing an item.
        
        result_type should be one of:
        - 'downloaded': successful download
        - 'error': network error or invalid content
        - 'skipped': file exists or host failed
        """
        self.completed += 1
        
        if result_type == 'downloaded':
            self.successful_downloads += 1
            # Only count time for successful downloads
            if self._last_download_start > 0:
                self.download_time += time.time() - self._last_download_start
        elif result_type == 'error':
            self.errors += 1
        else:  # skipped
            self.skipped += 1
    
    def elapsed_seconds(self) -> float:
        """Return seconds elapsed since start."""
        return time.time() - self.start_time
    
    def time_per_download(self) -> float:
        """
        Calculate average seconds per successful download, including the delay.
        
        This represents the real-world time for each download cycle:
        HTTP request time + mandatory delay.
        """
        if self.successful_downloads == 0:
            return 0.0
        avg_request_time = self.download_time / self.successful_downloads
        return avg_request_time + self.delay_seconds
    
    def downloads_per_minute(self) -> float:
        """Calculate successful downloads per minute (including delay time)."""
        time_per = self.time_per_download()
        if time_per < 0.1:
            return 0.0
        return 60.0 / time_per
    
    def estimated_minutes_remaining(self) -> Optional[float]:
        """
        Estimate minutes remaining based on successful download pace.
        
        Only shows ETA after MIN_DOWNLOADS_FOR_ETA successful downloads
        to ensure the estimate is meaningful.
        
        Includes the delay between downloads in the calculation.
        """
        if self.successful_downloads < self.MIN_DOWNLOADS_FOR_ETA:
            return None
        
        # Average time per successful download (including delay)
        time_per_download = self.time_per_download()
        
        # Remaining items to process (excluding already completed)
        remaining_items = self.total - self.completed
        
        # Estimate remaining time assuming all remaining items need downloading
        # This is conservative but more accurate than assuming the skip rate continues
        remaining_seconds = remaining_items * time_per_download
        return remaining_seconds / 60
    
    def format_time(self, minutes: float) -> str:
        """Format minutes into a human-readable string."""
        if minutes < 1:
            return f"{minutes * 60:.0f}s"
        elif minutes < 60:
            return f"{minutes:.1f}m"
        else:
            hours = int(minutes // 60)
            mins = minutes % 60
            if hours >= 24:
                days = int(hours // 24)
                hours = hours % 24
                return f"{days}d {hours}h {mins:.0f}m"
            return f"{hours}h {mins:.0f}m"
    
    def progress_line(self) -> str:
        """Generate a progress status line."""
        pct = (self.completed / self.total * 100) if self.total > 0 else 0
        
        parts = [f"[{self.completed}/{self.total}] ({pct:.1f}%)"]
        
        # Show skip count if any
        if self.skipped > 0:
            parts.append(f"[{self.skipped} skipped]")
        
        # Only show rate/ETA after we have enough successful downloads
        if self.successful_downloads >= self.MIN_DOWNLOADS_FOR_ETA:
            dpm = self.downloads_per_minute()
            eta = self.estimated_minutes_remaining()
            
            parts.append(f"| {dpm:.1f} downloads/min")
            
            if eta is not None:
                parts.append(f"| ETA: {self.format_time(eta)}")
        elif self.successful_downloads > 0:
            # Show that we're collecting data
            parts.append(f"| {self.successful_downloads}/{self.MIN_DOWNLOADS_FOR_ETA} downloads for ETA...")
        
        return " ".join(parts)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download DCSS morgue files from a streaks HTML page"
    )
    parser.add_argument(
        "url",
        help="URL to fetch the streaks HTML page from",
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=Path,
        default=Path("outputs"),
        help="Directory to save morgue files (default: outputs)",
    )
    parser.add_argument(
        "-d", "--delay",
        type=float,
        default=10.0,
        help="Delay in seconds between downloads (default: 10)",
    )
    parser.add_argument(
        "-s", "--sample",
        type=int,
        default=None,
        help="Download only this many randomly-selected morgues (for testing)",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output",
    )
    parser.add_argument(
        "--max-host-errors",
        type=int,
        default=2,
        help="Number of errors before a host is marked as failed (default: 2)",
    )
    return parser.parse_args()


def fetch_html(url: str, verbose: bool = False) -> str:
    """Fetch HTML content from URL."""
    if verbose:
        print(f"Fetching HTML from {url}")
    
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.text


def extract_morgue_urls(html: str, verbose: bool = False) -> list[str]:
    """Extract all morgue file URLs from the HTML."""
    soup = BeautifulSoup(html, "html.parser")
    
    morgue_urls = []
    # Find all links that contain 'morgue' and end with '.txt'
    for link in soup.find_all("a", href=True):
        href = link["href"]
        if "morgue" in href and href.endswith(".txt"):
            morgue_urls.append(href)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_urls = []
    for url in morgue_urls:
        if url not in seen:
            seen.add(url)
            unique_urls.append(url)
    
    if verbose:
        print(f"Found {len(unique_urls)} unique morgue file URLs")
    
    return unique_urls


def get_filename_from_url(url: str) -> str:
    """Extract the filename from a morgue URL."""
    parsed = urlparse(url)
    return os.path.basename(parsed.path)


class DownloadResult:
    """Result of a download attempt."""
    DOWNLOADED = "downloaded"
    SKIPPED_EXISTS = "skipped_exists"
    SKIPPED_HOST_FAILED = "skipped_host_failed"
    ERROR = "error"
    INVALID_CONTENT = "invalid_content"


def is_valid_morgue_content(content: str) -> tuple[bool, str]:
    """
    Check if the content looks like a valid morgue file.
    
    Returns:
        (is_valid, reason)
    """
    # Check for HTML content (expired domains, error pages, etc.)
    content_lower = content[:1000].lower()  # Only check beginning
    if "<html" in content_lower or "<!doctype" in content_lower:
        return False, "Content is HTML, not a morgue file"
    
    # Check for common morgue file markers
    if "Dungeon Crawl Stone Soup" not in content[:500]:
        return False, "Content doesn't look like a morgue file"
    
    return True, ""


def record_host_error(
    host: str,
    host_error_counts: dict[str, int],
    failed_hosts: set[str],
    max_errors: int,
) -> None:
    """Record an error for a host and mark as failed if threshold reached."""
    host_error_counts[host] = host_error_counts.get(host, 0) + 1
    if host_error_counts[host] >= max_errors:
        failed_hosts.add(host)


class UrlMappingTracker:
    """
    Tracks the mapping between downloaded morgue files and their source URLs.
    
    Uses a CSV file to persist the mapping. The CSV is updated atomically
    to ensure consistency even if the script is interrupted.
    """
    
    def __init__(self, csv_path: Path):
        self.csv_path = csv_path
        self._existing_files: set[str] = set()
        self._load_existing()
    
    def _load_existing(self) -> None:
        """Load existing mappings from the CSV file."""
        if not self.csv_path.exists():
            return
        
        with open(self.csv_path, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self._existing_files.add(row["filename"])
    
    def has_mapping(self, filename: str) -> bool:
        """Check if a mapping already exists for this filename."""
        return filename in self._existing_files
    
    def add_mapping(self, filename: str, url: str) -> None:
        """
        Add a new mapping to the CSV file.
        
        This operation is atomic - it uses file locking and flushes
        immediately to ensure the entry is persisted before returning.
        """
        file_exists = self.csv_path.exists()
        
        with open(self.csv_path, "a", newline="", encoding="utf-8") as f:
            # Lock the file to prevent concurrent writes
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            try:
                writer = csv.writer(f)
                
                # Write header if this is a new file
                if not file_exists:
                    writer.writerow(["filename", "url"])
                
                writer.writerow([filename, url])
                f.flush()
                os.fsync(f.fileno())  # Ensure data is written to disk
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        
        self._existing_files.add(filename)


def download_morgue(
    url: str,
    output_dir: Path,
    failed_hosts: set[str],
    host_error_counts: dict[str, int],
    max_host_errors: int,
    url_tracker: UrlMappingTracker,
    verbose: bool = False,
) -> tuple[str, Optional[str]]:
    """
    Download a single morgue file.
    
    Returns:
        (result_type, error_message)
    """
    parsed = urlparse(url)
    host = parsed.netloc
    
    # Skip if we've already had too many errors from this host
    if host in failed_hosts:
        if verbose:
            print(f"  Skipping (host previously failed)")
        return DownloadResult.SKIPPED_HOST_FAILED, f"Host {host} previously failed"
    
    filename = get_filename_from_url(url)
    output_path = output_dir / filename
    
    # Skip if file already exists
    if output_path.exists():
        if verbose:
            print(f"  Skipping (already exists)")
        return DownloadResult.SKIPPED_EXISTS, None
    
    try:
        if verbose:
            print(f"  Downloading from {host}...")
        
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Validate content before saving
        is_valid, reason = is_valid_morgue_content(response.text)
        if not is_valid:
            error_msg = f"Invalid content: {reason}"
            record_host_error(host, host_error_counts, failed_hosts, max_host_errors)
            print(f"  ERROR: {error_msg}")
            return DownloadResult.INVALID_CONTENT, error_msg
        
        # Write to file atomically (write to temp file, then rename)
        # This prevents partial files if interrupted by Ctrl+C
        temp_path = output_path.with_suffix(".txt.tmp")
        temp_path.write_text(response.text, encoding="utf-8")
        
        # Record the URL mapping BEFORE renaming the temp file to final.
        # This ensures we never have a file without a mapping entry.
        # If interrupted after this point but before rename, we'll have
        # a mapping entry but no file (or a .tmp file), which is recoverable.
        url_tracker.add_mapping(filename, url)
        
        temp_path.rename(output_path)
        
        if verbose:
            print(f"  Saved {filename}")
        
        return DownloadResult.DOWNLOADED, None
    
    except requests.exceptions.ConnectionError as e:
        error_msg = f"Connection error for {host}: {e}"
        record_host_error(host, host_error_counts, failed_hosts, max_host_errors)
        print(f"  ERROR: {error_msg}")
        return DownloadResult.ERROR, error_msg
    
    except requests.exceptions.Timeout as e:
        error_msg = f"Timeout for {host}: {e}"
        record_host_error(host, host_error_counts, failed_hosts, max_host_errors)
        print(f"  ERROR: {error_msg}")
        return DownloadResult.ERROR, error_msg
    
    except requests.exceptions.HTTPError as e:
        error_msg = f"HTTP error: {e}"
        # Count toward host failure if:
        # - 5xx errors (server issues)
        # - 401/403 (host is blocking access)
        if response.status_code >= 500 or response.status_code in (401, 403):
            record_host_error(host, host_error_counts, failed_hosts, max_host_errors)
        print(f"  ERROR: {error_msg}")
        return DownloadResult.ERROR, error_msg
    
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(f"  ERROR: {error_msg}")
        return DownloadResult.ERROR, error_msg


def main() -> int:
    args = parse_args()
    
    # Fetch the HTML
    try:
        html = fetch_html(args.url, verbose=args.verbose)
    except Exception as e:
        print(f"Error fetching HTML: {e}", file=sys.stderr)
        return 1
    
    # Extract morgue URLs
    morgue_urls = extract_morgue_urls(html, verbose=args.verbose)
    
    if not morgue_urls:
        print("No morgue file URLs found in the HTML")
        return 1
    
    # Sample if requested
    if args.sample is not None:
        if args.sample < len(morgue_urls):
            print(f"Sampling {args.sample} morgues from {len(morgue_urls)} total")
            morgue_urls = random.sample(morgue_urls, args.sample)
        else:
            print(f"Sample size ({args.sample}) >= total morgues ({len(morgue_urls)}), downloading all")
    
    # Create output directory
    args.output_dir.mkdir(parents=True, exist_ok=True)
    
    # Initialize URL mapping tracker
    url_mapping_path = args.output_dir / URL_MAPPING_FILENAME
    url_tracker = UrlMappingTracker(url_mapping_path)
    
    # Track failed hosts and error counts
    failed_hosts: set[str] = set()
    host_error_counts: dict[str, int] = {}
    
    # Initialize progress tracker
    total = len(morgue_urls)
    progress = ProgressTracker(total=total, delay_seconds=args.delay)
    
    # Print initial status
    print()
    print(f"Starting download of {total} morgue files...")
    print(f"Output directory: {args.output_dir.absolute()}")
    print(f"URL mapping file: {url_mapping_path.absolute()}")
    print(f"Delay between downloads: {args.delay}s")
    print()
    
    # Download morgues
    downloaded_count = 0
    skipped_exists_count = 0
    skipped_host_count = 0
    error_count = 0
    
    for i, url in enumerate(morgue_urls, 1):
        filename = get_filename_from_url(url)
        
        # Show progress with filename
        print(f"{progress.progress_line()} - {filename}")
        
        # Start timing this item
        progress.start_item()
        
        result, error = download_morgue(
            url,
            args.output_dir,
            failed_hosts,
            host_error_counts,
            args.max_host_errors,
            url_tracker,
            verbose=args.verbose,
        )
        
        if result == DownloadResult.DOWNLOADED:
            downloaded_count += 1
        elif result == DownloadResult.SKIPPED_EXISTS:
            skipped_exists_count += 1
        elif result == DownloadResult.SKIPPED_HOST_FAILED:
            skipped_host_count += 1
        else:
            # ERROR or INVALID_CONTENT
            error_count += 1
        
        # Delay between downloads, but only if we actually made a network request
        # (i.e., we downloaded, got an error, or got invalid content - not if we skipped)
        made_request = result in (
            DownloadResult.DOWNLOADED,
            DownloadResult.ERROR,
            DownloadResult.INVALID_CONTENT,
        )
        
        # Record progress with result type
        if result == DownloadResult.DOWNLOADED:
            progress.record_result('downloaded')
        elif result in (DownloadResult.ERROR, DownloadResult.INVALID_CONTENT):
            progress.record_result('error')
        else:
            progress.record_result('skipped')
        
        if i < total and args.delay > 0 and made_request:
            if args.verbose:
                print(f"  Waiting {args.delay}s...")
            time.sleep(args.delay)
    
    # Final summary
    elapsed_min = progress.elapsed_seconds() / 60
    download_time_min = progress.download_time / 60
    print()
    print("=" * 50)
    print(f"Download complete!")
    print(f"  Total time: {progress.format_time(elapsed_min)}")
    if progress.successful_downloads > 0:
        print(f"  Time spent downloading: {progress.format_time(download_time_min)}")
    print(f"  Total URLs: {total}")
    print(f"  Downloaded: {downloaded_count}")
    print(f"  Skipped (already exist): {skipped_exists_count}")
    print(f"  Skipped (host failed): {skipped_host_count}")
    print(f"  Errors: {error_count}")
    if progress.successful_downloads > 0:
        print(f"  Average download rate: {progress.downloads_per_minute():.1f} downloads/min")
    if failed_hosts:
        print(f"  Failed hosts: {', '.join(sorted(failed_hosts))}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
