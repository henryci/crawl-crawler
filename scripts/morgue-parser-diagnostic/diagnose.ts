#!/usr/bin/env tsx
/**
 * Morgue Parser Diagnostic Tool
 *
 * Parses all morgue files in a directory and reports:
 * - Version range (lowest and highest game versions)
 * - Missing critical sections (runes, equipment, gods, skills, branches)
 * - Parsing errors
 * - Total parsing time
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { parseMorgue, type MorgueData, type ParseResult } from "dcss-morgue-parser";

// Configuration
const DEFAULT_MORGUE_DIR = "../streak-downloader/outputs";
const CRITICAL_SECTIONS = ["equipment", "godsWorshipped", "endingSkills", "branches"] as const;

type CriticalSection = (typeof CRITICAL_SECTIONS)[number];

interface MissingSectionInfo {
  file: string;
  version: string | null;
  missingSections: CriticalSection[];
}

interface ParseErrorInfo {
  file: string;
  version: string | null;
  errors: string[];
}

interface DiagnosticResult {
  totalFiles: number;
  parsedSuccessfully: number;
  parsedWithErrors: number;
  versionLowest: string | null;
  versionHighest: string | null;
  versionsFound: Map<string, number>;
  missingSections: Map<CriticalSection, MissingSectionInfo[]>;
  parseErrors: ParseErrorInfo[];
  noRunesFiles: { file: string; version: string | null; characterLevel: number | null }[];
  parsingTimeMs: number;
}

/**
 * Compare two version strings.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
function compareVersions(a: string, b: string): number {
  // Extract major.minor version (e.g., "0.32" from "0.32-a0-123-gabcdef")
  const extractVersion = (v: string): [number, number] => {
    const match = v.match(/^(\d+)\.(\d+)/);
    if (!match) return [0, 0];
    return [parseInt(match[1], 10), parseInt(match[2], 10)];
  };

  const [aMajor, aMinor] = extractVersion(a);
  const [bMajor, bMinor] = extractVersion(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  return aMinor - bMinor;
}

/**
 * Get all morgue files in a directory.
 */
function getMorgueFiles(dir: string): string[] {
  const files = fs.readdirSync(dir);
  return files
    .filter((f) => f.endsWith(".txt") && f.startsWith("morgue-"))
    .map((f) => path.join(dir, f))
    .sort();
}

/**
 * Check which critical sections are missing from a parsed morgue.
 */
function getMissingSections(data: MorgueData): CriticalSection[] {
  const missing: CriticalSection[] = [];

  for (const section of CRITICAL_SECTIONS) {
    const value = data[section];
    if (value === null || value === undefined) {
      missing.push(section);
    } else if (Array.isArray(value) && value.length === 0) {
      // Empty array is still considered "present" - some games legitimately have no gods worshipped
      // But for equipment, skills, branches, we'd expect something
      if (section !== "godsWorshipped") {
        missing.push(section);
      }
    } else if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
      missing.push(section);
    }
  }

  return missing;
}

/**
 * Parse all morgue files and collect diagnostic information.
 */
function runDiagnostics(morgueDir: string, verbose: boolean): DiagnosticResult {
  const result: DiagnosticResult = {
    totalFiles: 0,
    parsedSuccessfully: 0,
    parsedWithErrors: 0,
    versionLowest: null,
    versionHighest: null,
    versionsFound: new Map(),
    missingSections: new Map(),
    parseErrors: [],
    noRunesFiles: [],
    parsingTimeMs: 0,
  };

  // Initialize missing sections map
  for (const section of CRITICAL_SECTIONS) {
    result.missingSections.set(section, []);
  }

  const morgueFiles = getMorgueFiles(morgueDir);
  result.totalFiles = morgueFiles.length;

  if (result.totalFiles === 0) {
    console.log(`No morgue files found in ${morgueDir}`);
    return result;
  }

  console.log(`Found ${result.totalFiles} morgue files\n`);

  const startTime = performance.now();

  for (const filePath of morgueFiles) {
    const fileName = path.basename(filePath);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parseResult: ParseResult = parseMorgue(content);
      const data = parseResult.data;

      // Track version
      if (data.version) {
        const majorMinor = data.version.match(/^(\d+\.\d+)/)?.[1] || data.version;
        result.versionsFound.set(majorMinor, (result.versionsFound.get(majorMinor) || 0) + 1);

        if (!result.versionLowest || compareVersions(data.version, result.versionLowest) < 0) {
          result.versionLowest = data.version;
        }
        if (!result.versionHighest || compareVersions(data.version, result.versionHighest) > 0) {
          result.versionHighest = data.version;
        }
      }

      // Check for parse errors
      if (data.parseErrors.length > 0) {
        result.parsedWithErrors++;
        result.parseErrors.push({
          file: fileName,
          version: data.version,
          errors: data.parseErrors,
        });
        if (verbose) {
          console.log(`⚠️  ${fileName} (v${data.version || "unknown"}): ${data.parseErrors.length} parse error(s)`);
        }
      } else {
        result.parsedSuccessfully++;
        if (verbose) {
          console.log(`✅ ${fileName} (v${data.version || "unknown"})`);
        }
      }

      // Check for missing critical sections
      const missing = getMissingSections(data);
      if (missing.length > 0) {
        for (const section of missing) {
          result.missingSections.get(section)!.push({
            file: fileName,
            version: data.version,
            missingSections: missing,
          });
        }
      }

      // Check for games with no runes (might indicate a parsing issue or very early death)
      if (!data.runesList || data.runesList.length === 0) {
        result.noRunesFiles.push({
          file: fileName,
          version: data.version,
          characterLevel: data.characterLevel,
        });
      }
    } catch (e) {
      result.parsedWithErrors++;
      const errorMessage = e instanceof Error ? e.message : String(e);
      result.parseErrors.push({
        file: fileName,
        version: null,
        errors: [`Fatal error: ${errorMessage}`],
      });
      if (verbose) {
        console.log(`❌ ${fileName}: Fatal error - ${errorMessage}`);
      }
    }
  }

  const endTime = performance.now();
  result.parsingTimeMs = endTime - startTime;

  return result;
}

/**
 * Print the diagnostic results in a human-readable format.
 */
function printResults(result: DiagnosticResult): void {
  console.log("\n" + "=".repeat(80));
  console.log("MORGUE PARSER DIAGNOSTIC REPORT");
  console.log("=".repeat(80));

  // Summary
  console.log("\n📊 SUMMARY");
  console.log("-".repeat(40));
  console.log(`Total files:         ${result.totalFiles}`);
  console.log(`Parsed successfully: ${result.parsedSuccessfully} (${((result.parsedSuccessfully / result.totalFiles) * 100).toFixed(1)}%)`);
  console.log(`Parsed with errors:  ${result.parsedWithErrors} (${((result.parsedWithErrors / result.totalFiles) * 100).toFixed(1)}%)`);
  console.log(`Parsing time:        ${result.parsingTimeMs.toFixed(2)}ms (${(result.parsingTimeMs / result.totalFiles).toFixed(2)}ms/file)`);

  // Version range
  console.log("\n📦 VERSION RANGE");
  console.log("-".repeat(40));
  console.log(`Lowest version:  ${result.versionLowest || "N/A"}`);
  console.log(`Highest version: ${result.versionHighest || "N/A"}`);

  console.log("\nVersions found:");
  const sortedVersions = [...result.versionsFound.entries()].sort((a, b) => compareVersions(a[0], b[0]));
  for (const [version, count] of sortedVersions) {
    console.log(`  ${version.padEnd(8)} : ${count} file(s)`);
  }

  // Missing sections
  console.log("\n🔍 MISSING CRITICAL SECTIONS");
  console.log("-".repeat(40));

  for (const section of CRITICAL_SECTIONS) {
    const files = result.missingSections.get(section) || [];
    console.log(`\n${section}: ${files.length} file(s) missing`);

    if (files.length > 0 && files.length <= 10) {
      for (const info of files) {
        console.log(`  - ${info.file} (v${info.version || "unknown"})`);
      }
    } else if (files.length > 10) {
      // Group by version for easier diagnosis
      const byVersion = new Map<string, string[]>();
      for (const info of files) {
        const v = info.version?.match(/^(\d+\.\d+)/)?.[1] || "unknown";
        if (!byVersion.has(v)) byVersion.set(v, []);
        byVersion.get(v)!.push(info.file);
      }
      console.log("  By version:");
      for (const [version, fileList] of [...byVersion.entries()].sort((a, b) => compareVersions(a[0], b[0]))) {
        console.log(`    ${version}: ${fileList.length} file(s)`);
        // Show first 3 examples
        for (const f of fileList.slice(0, 3)) {
          console.log(`      - ${f}`);
        }
        if (fileList.length > 3) {
          console.log(`      ... and ${fileList.length - 3} more`);
        }
      }
    }
  }

  // No runes (might be legitimate or might indicate parsing issues)
  console.log("\n🔮 GAMES WITH NO RUNES");
  console.log("-".repeat(40));
  console.log(`Total: ${result.noRunesFiles.length} file(s)`);
  if (result.noRunesFiles.length > 0) {
    // Group by whether they seem like legitimate no-rune games (low level) or potential issues
    const lowLevel = result.noRunesFiles.filter((f) => f.characterLevel !== null && f.characterLevel < 14);
    const highLevel = result.noRunesFiles.filter((f) => f.characterLevel !== null && f.characterLevel >= 14);
    const unknownLevel = result.noRunesFiles.filter((f) => f.characterLevel === null);

    if (lowLevel.length > 0) {
      console.log(`\nLow level deaths (likely legitimate): ${lowLevel.length}`);
    }

    if (highLevel.length > 0) {
      console.log(`\n⚠️  High level (XL 14+) with no runes - might be parsing issue: ${highLevel.length}`);
      for (const f of highLevel.slice(0, 10)) {
        console.log(`  - ${f.file} (v${f.version || "unknown"}, XL ${f.characterLevel})`);
      }
      if (highLevel.length > 10) {
        console.log(`  ... and ${highLevel.length - 10} more`);
      }
    }

    if (unknownLevel.length > 0) {
      console.log(`\n❓ Unknown level: ${unknownLevel.length}`);
      for (const f of unknownLevel.slice(0, 5)) {
        console.log(`  - ${f.file} (v${f.version || "unknown"})`);
      }
    }
  }

  // Parse errors
  console.log("\n❌ PARSE ERRORS");
  console.log("-".repeat(40));
  console.log(`Total files with errors: ${result.parseErrors.length}`);

  if (result.parseErrors.length > 0) {
    // Group errors by error type
    const errorTypes = new Map<string, { count: number; files: { file: string; version: string | null }[] }>();

    for (const info of result.parseErrors) {
      for (const error of info.errors) {
        // Extract error type (e.g., "header:", "stats:", etc.)
        const errorType = error.split(":")[0] || "unknown";
        if (!errorTypes.has(errorType)) {
          errorTypes.set(errorType, { count: 0, files: [] });
        }
        const entry = errorTypes.get(errorType)!;
        entry.count++;
        if (entry.files.length < 5) {
          entry.files.push({ file: info.file, version: info.version });
        }
      }
    }

    console.log("\nErrors by type:");
    for (const [errorType, data] of [...errorTypes.entries()].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`\n  ${errorType}: ${data.count} occurrence(s)`);
      for (const f of data.files) {
        console.log(`    - ${f.file} (v${f.version || "unknown"})`);
      }
      if (data.count > 5) {
        console.log(`    ... and ${data.count - 5} more`);
      }
    }

    // Show full error details for first few files
    console.log("\n\nDetailed errors (first 10 files):");
    for (const info of result.parseErrors.slice(0, 10)) {
      console.log(`\n  📄 ${info.file} (v${info.version || "unknown"}):`);
      for (const error of info.errors) {
        console.log(`     • ${error}`);
      }
    }
  }

  // Final tips
  console.log("\n" + "=".repeat(80));
  console.log("💡 TIPS FOR FIXING ISSUES");
  console.log("=".repeat(80));
  console.log(`
1. Missing equipment/skills/branches in older versions (0.8-0.15) may be due to
   format changes - check the morgue format for those versions.

2. Parse errors in specific sections indicate extractor issues - check the
   corresponding extractor in packages/dcss-morgue-parser/src/extractors/

3. To examine a specific morgue file, use:
   pnpm --filter dcss-morgue-parser cli <path-to-morgue-file>

4. Files are sorted by version in the missing sections report to help identify
   version-specific parsing issues.
`);
}

// Main execution
function main(): void {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose") || args.includes("-v");
  const helpRequested = args.includes("--help") || args.includes("-h");

  // Get custom directory if provided
  const dirIndex = args.findIndex((a) => a === "--dir" || a === "-d");
  const morgueDir = dirIndex >= 0 && args[dirIndex + 1]
    ? path.resolve(args[dirIndex + 1])
    : path.resolve(import.meta.dirname || __dirname, DEFAULT_MORGUE_DIR);

  if (helpRequested) {
    console.log(`
Morgue Parser Diagnostic Tool

Usage: pnpm diagnose [options]

Options:
  -v, --verbose    Show per-file parsing results
  -d, --dir <path> Path to morgue files directory (default: ../streak-downloader/outputs)
  -h, --help       Show this help message

Examples:
  pnpm diagnose
  pnpm diagnose --verbose
  pnpm diagnose --dir /path/to/morgue/files
`);
    return;
  }

  console.log(`Parsing morgue files from: ${morgueDir}\n`);

  if (!fs.existsSync(morgueDir)) {
    console.error(`Error: Directory does not exist: ${morgueDir}`);
    process.exit(1);
  }

  const result = runDiagnostics(morgueDir, verbose);
  printResults(result);
}

main();
