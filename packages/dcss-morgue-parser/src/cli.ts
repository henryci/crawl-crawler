#!/usr/bin/env node
/**
 * DCSS Morgue Parser CLI
 *
 * Command-line interface for parsing DCSS morgue files.
 *
 * Usage:
 *     npx dcss-morgue-parser morgue.txt              # Print JSON to stdout
 *     npx dcss-morgue-parser morgue.txt -o output/   # Write JSON to output/
 *     npx dcss-morgue-parser /path/to/directory/     # Process all .txt files
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseMorgue, VERSION } from './parser.js';

interface CliOptions {
  paths: string[];
  outputDir: string | null;
  verbose: boolean;
  quiet: boolean;
  help: boolean;
  version: boolean;
}

/**
 * Parse command line arguments.
 */
function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    paths: [],
    outputDir: null,
    verbose: false,
    quiet: false,
    help: false,
    version: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '-q' || arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '--version') {
      options.version = true;
    } else if (arg === '-o' || arg === '--output-dir') {
      i++;
      const nextArg = args[i];
      if (nextArg) {
        options.outputDir = nextArg;
      }
    } else if (arg && !arg.startsWith('-')) {
      options.paths.push(arg);
    }

    i++;
  }

  return options;
}

/**
 * Print usage information.
 */
function printHelp(): void {
  const help = `
DCSS Morgue Parser v${VERSION}

Parse Dungeon Crawl Stone Soup morgue files and convert to JSON.

USAGE:
    dcss-morgue-parser [OPTIONS] <PATHS>...

ARGUMENTS:
    <PATHS>...    Path(s) to morgue file(s) or directory containing .txt files

OPTIONS:
    -o, --output-dir <DIR>    Output directory for JSON files (must exist)
                              Without this option, prints JSON to stdout
    -v, --verbose             Enable verbose output
    -q, --quiet               Suppress non-error output
    -h, --help                Print help information
    --version                 Print version information

EXAMPLES:
    dcss-morgue-parser morgue.txt                    # Print JSON to stdout
    dcss-morgue-parser morgue.txt -o output/         # Write JSON to output/
    dcss-morgue-parser /path/to/morgues/ -o output/  # Process directory

OUTPUT:
    Without -o: Prints JSON to stdout (useful for piping)
    With -o: Writes JSON files to the specified directory
             The output directory must already exist
`;
  process.stdout.write(help);
}

/**
 * Log a message (respects quiet mode).
 */
function log(message: string, options: CliOptions): void {
  if (!options.quiet) {
    process.stderr.write(message + '\n');
  }
}

/**
 * Log an error message.
 */
function logError(message: string): void {
  process.stderr.write(`ERROR: ${message}\n`);
}

/**
 * Process a single morgue file.
 */
async function processFile(inputPath: string, options: CliOptions): Promise<boolean> {
  if (!existsSync(inputPath)) {
    logError(`File not found: ${inputPath}`);
    return false;
  }

  const stat = statSync(inputPath);
  if (!stat.isFile()) {
    logError(`Not a file: ${inputPath}`);
    return false;
  }

  // Check output directory exists (if specified)
  if (options.outputDir && !existsSync(options.outputDir)) {
    logError(`Output directory does not exist: ${options.outputDir}`);
    return false;
  }

  // Only log processing info when writing to file (not stdout)
  if (options.outputDir) {
    log(`Processing: ${inputPath}`, options);
  }

  try {
    // Read input file
    const content = readFileSync(inputPath, 'utf-8');

    // Parse the morgue file
    const result = await parseMorgue(content);

    // Verbose output
    if (options.verbose && options.outputDir) {
      const data = result.data;
      log(`  Version: ${data.version}`, options);
      log(`  Player: ${data.playerName} the ${data.title}`, options);
      log(`  Race/Background: ${data.race} ${data.background}`, options);
      log(`  Level: ${data.characterLevel}`, options);
      log(`  Score: ${data.score}`, options);
    }

    // Write JSON output
    const jsonOutput = JSON.stringify(result.data, null, 2);

    if (options.outputDir) {
      const outputFileName = basename(inputPath).replace(/\.txt$/i, '.json');
      const outputPath = join(options.outputDir, outputFileName);
      writeFileSync(outputPath, jsonOutput, 'utf-8');
      log(`Output written to: ${outputPath}`, options);

      // Report any parse errors
      if (result.data.parseErrors.length > 0) {
        log(`WARNING: Parse errors encountered: ${result.data.parseErrors.join(', ')}`, options);
      }
    } else {
      // No output dir - dump JSON to stdout
      process.stdout.write(jsonOutput + '\n');
    }

    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logError(`Failed to process ${inputPath}: ${message}`);
    return false;
  }
}

/**
 * Process all .txt files in a directory.
 */
async function processDirectory(dirPath: string, options: CliOptions): Promise<{ success: number; fail: number }> {
  if (!existsSync(dirPath)) {
    logError(`Directory not found: ${dirPath}`);
    return { success: 0, fail: 0 };
  }

  const stat = statSync(dirPath);
  if (!stat.isDirectory()) {
    logError(`Not a directory: ${dirPath}`);
    return { success: 0, fail: 0 };
  }

  const files = readdirSync(dirPath).filter((f) => f.endsWith('.txt'));

  if (files.length === 0) {
    log(`No .txt files found in: ${dirPath}`, options);
    return { success: 0, fail: 0 };
  }

  log(`Found ${files.length} .txt files in ${dirPath}`, options);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = join(dirPath, file);
    if (await processFile(filePath, options)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  return { success: successCount, fail: failCount };
}

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.version) {
    process.stdout.write(`dcss-morgue-parser v${VERSION}\n`);
    process.exit(0);
  }

  if (options.help || options.paths.length === 0) {
    printHelp();
    process.exit(options.help ? 0 : 1);
  }

  let totalSuccess = 0;
  let totalFail = 0;

  for (const path of options.paths) {
    const stat = existsSync(path) ? statSync(path) : null;

    if (stat?.isDirectory()) {
      const { success, fail } = await processDirectory(path, options);
      totalSuccess += success;
      totalFail += fail;
    } else {
      if (await processFile(path, options)) {
        totalSuccess++;
      } else {
        totalFail++;
      }
    }
  }

  // Summary
  if (!options.quiet && totalSuccess + totalFail > 1) {
    log(
      `Processed ${totalSuccess + totalFail} files: ${totalSuccess} successful, ${totalFail} failed`,
      options
    );
  }

  // Exit with error code if any failures
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write(`Fatal error: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});

