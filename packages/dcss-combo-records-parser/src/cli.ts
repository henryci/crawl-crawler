#!/usr/bin/env node

import { parseComboRecordsWithAnalytics } from './parser.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

const DEFAULT_URL = 'https://crawl.akrasiac.org/scoring/top-combo-scores.html';
const DEFAULT_OUTPUT = './combo-records.json';

async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  let url = DEFAULT_URL;
  let outputPath = DEFAULT_OUTPUT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' || args[i] === '-u') {
      url = args[++i];
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
DCSS Combo Records Downloader

Downloads and parses the top combo scores from a DCSS scoring page.

Usage:
  dcss-combo-records [options]

Options:
  -u, --url <url>       URL to fetch combo records from
                        (default: ${DEFAULT_URL})
  -o, --output <path>   Output JSON file path
                        (default: ${DEFAULT_OUTPUT})
  -h, --help            Show this help message

Examples:
  dcss-combo-records
  dcss-combo-records --url https://crawl.akrasiac.org/scoring/top-combo-scores.html
  dcss-combo-records --output ./data/records.json
`);
      process.exit(0);
    }
  }

  console.log(`Fetching combo records from: ${url}`);

  try {
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
    const outputDir = dirname(resolve(outputPath));
    mkdirSync(outputDir, { recursive: true });

    // Write the output
    writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Saved to: ${resolve(outputPath)}`);

    // Print some summary stats
    const removedSpecies = data.speciesStats.filter(s => s.isRemoved).length;
    const removedBgs = data.backgroundStats.filter(b => b.isRemoved).length;

    if (removedSpecies > 0 || removedBgs > 0) {
      console.log(`\nNote: Found ${removedSpecies} removed species and ${removedBgs} removed backgrounds`);
    }

    // Find oldest records
    const sortedByDate = [...data.records].sort((a, b) => a.date.localeCompare(b.date));
    if (sortedByDate.length > 0) {
      const oldest = sortedByDate[0];
      console.log(`\nOldest record: ${oldest.character} by ${oldest.player} (${oldest.date.split('T')[0]})`);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

