# Morgue Parser Diagnostic Tool

A diagnostic tool for testing the `dcss-morgue-parser` library against a collection of morgue files to identify parsing issues across different game versions.

## Features

- Parses all morgue files in a directory
- Reports the lowest and highest game versions found
- Tracks which files are missing critical sections (equipment, gods, skills, branches)
- Reports all parsing errors grouped by type
- Tracks games with no runes (potential parsing issues vs. legitimate early deaths)
- Reports total parsing time and per-file average

## Usage

### From the root of the monorepo

```bash
# Run diagnostics (builds parser first)
pnpm diagnose:morgue

# Run with verbose output (per-file results)
pnpm diagnose:morgue:verbose
```

### From this directory

```bash
# Install dependencies first
pnpm install

# Run diagnostics
pnpm diagnose

# Run with verbose output
pnpm diagnose --verbose
# or
pnpm diagnose -v

# Use a custom morgue directory
pnpm diagnose --dir /path/to/morgue/files
```

## Default Morgue Directory

By default, the tool looks for morgue files in:

```
../streak-downloader/outputs/
```

## Output

The tool produces a detailed report including:

1. **Summary** - Total files, success/error counts, parsing time
2. **Version Range** - Lowest and highest game versions found
3. **Missing Critical Sections** - Files grouped by which sections are missing
4. **Games with No Runes** - Separated by character level to distinguish legitimate vs. potential issues
5. **Parse Errors** - Errors grouped by type with example files
6. **Tips** - Guidance on how to fix identified issues

## Example Output

```
================================================================================
MORGUE PARSER DIAGNOSTIC REPORT
================================================================================

📊 SUMMARY
----------------------------------------
Total files:         68
Parsed successfully: 65 (95.6%)
Parsed with errors:  3 (4.4%)
Parsing time:        156.42ms (2.30ms/file)

📦 VERSION RANGE
----------------------------------------
Lowest version:  0.8.0
Highest version: 0.34-a0-123-gabcdef

Versions found:
  0.8      : 2 file(s)
  0.15     : 5 file(s)
  0.23     : 12 file(s)
  ...
```
