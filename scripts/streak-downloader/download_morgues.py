#!/usr/bin/env python3
"""
Download DCSS morgue files from a streaks HTML page.

This script:
1. Fetches or reads an HTML page containing streak data
2. Extracts all morgue file URLs from the page
3. Downloads them to an output directory with rate limiting and error caching
"""

import argparse
import os
import random
import sys
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


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


def download_morgue(
    url: str,
    output_dir: Path,
    failed_hosts: set[str],
    host_error_counts: dict[str, int],
    max_host_errors: int,
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
        
        # Write to file
        output_path.write_text(response.text, encoding="utf-8")
        
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
    
    # Track failed hosts and error counts
    failed_hosts: set[str] = set()
    host_error_counts: dict[str, int] = {}
    
    # Download morgues
    downloaded_count = 0
    skipped_exists_count = 0
    skipped_host_count = 0
    error_count = 0
    
    total = len(morgue_urls)
    for i, url in enumerate(morgue_urls, 1):
        print(f"[{i}/{total}] {get_filename_from_url(url)}")
        
        result, error = download_morgue(
            url,
            args.output_dir,
            failed_hosts,
            host_error_counts,
            args.max_host_errors,
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
        if i < total and args.delay > 0 and made_request:
            if args.verbose:
                print(f"  Waiting {args.delay}s...")
            time.sleep(args.delay)
    
    # Summary
    print()
    print("=" * 50)
    print(f"Download complete!")
    print(f"  Total URLs: {total}")
    print(f"  Downloaded: {downloaded_count}")
    print(f"  Skipped (already exist): {skipped_exists_count}")
    print(f"  Skipped (host failed): {skipped_host_count}")
    print(f"  Errors: {error_count}")
    if failed_hosts:
        print(f"  Failed hosts: {', '.join(sorted(failed_hosts))}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
