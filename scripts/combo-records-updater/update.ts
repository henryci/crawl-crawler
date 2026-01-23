#!/usr/bin/env tsx
/**
 * Combo Records Updater Script
 *
 * Downloads the latest combo records from the DCSS scoring page,
 * saves them to the web app's public data folder, and records
 * the download timestamp in the database.
 *
 * Usage:
 *   PGDATABASE=crawl_crawler pnpm update
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseComboRecordsWithAnalytics } from 'dcss-combo-records-parser';
import { closePool, recordComboRecordsDownloadDate } from '@crawl-crawler/game-data-db';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_URL = 'https://crawl.akrasiac.org/scoring/top-combo-scores.html';

// Output path relative to web app
const OUTPUT_PATH = resolve(__dirname, '../../apps/web/public/data/combo-records.json');

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let url = DEFAULT_URL;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' || args[i] === '-u') {
      url = args[++i]!;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Combo Records Updater

Downloads combo records, saves to web app, and records timestamp in database.

Usage:
  pnpm update [options]

Options:
  -u, --url <url>   URL to fetch combo records from
                    (default: ${DEFAULT_URL})
  -h, --help        Show this help message

Environment:
  PGDATABASE        PostgreSQL database name (required)
  PGHOST            PostgreSQL host (default: localhost)
  PGUSER            PostgreSQL user (default: current user)
  PGPASSWORD        PostgreSQL password (if required)
`);
      process.exit(0);
    }
  }

  console.log(`Fetching combo records from: ${url}`);

  try {
    // Fetch and parse combo records
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Downloaded ${html.length} bytes`);

    console.log('Parsing combo records...');
    const data = parseComboRecordsWithAnalytics(html, url);

    console.log(`Parsed ${data.totalRecords} combo records`);
    console.log(`Found ${data.speciesStats.length} unique species`);
    console.log(`Found ${data.backgroundStats.length} unique backgrounds`);

    // Ensure output directory exists
    const outputDir = dirname(OUTPUT_PATH);
    mkdirSync(outputDir, { recursive: true });

    // Write the output
    writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
    console.log(`Saved to: ${OUTPUT_PATH}`);

    // Record the download timestamp in the database
    console.log('\nRecording combo records download date...');
    await recordComboRecordsDownloadDate();
    console.log('  ✓ Combo records download date recorded');

    // Print some summary stats
    const removedSpecies = data.speciesStats.filter(s => s.isRemoved).length;
    const removedBgs = data.backgroundStats.filter(b => b.isRemoved).length;

    if (removedSpecies > 0 || removedBgs > 0) {
      console.log(`\nNote: Found ${removedSpecies} removed species and ${removedBgs} removed backgrounds`);
    }

    // Find oldest and newest records
    const sortedByDate = [...data.records].sort((a, b) => a.date.localeCompare(b.date));
    if (sortedByDate.length > 0) {
      const oldest = sortedByDate[0]!;
      const newest = sortedByDate[sortedByDate.length - 1]!;
      console.log(`\nOldest record: ${oldest.character} by ${oldest.player} (${oldest.date.split('T')[0]})`);
      console.log(`Newest record: ${newest.character} by ${newest.player} (${newest.date.split('T')[0]})`);
    }

    console.log('\n✓ Combo records update complete!');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
