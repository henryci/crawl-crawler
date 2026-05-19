/**
 * Extract DCSS C++ source data into TypeScript modules.
 *
 * Reads from the pinned DCSS source (path in dcss-version.json) and emits
 * deterministic files under src/equipment/generated/. The output is
 * committed to the repo so consumers don't need the DCSS source locally
 * to use the package.
 *
 * Usage:
 *   pnpm --filter dcss-game-data extract
 *
 * Currently handles:
 *   - ARTP_* enum + abbreviations + display semantics
 *
 * Roadmap (see EQUIPMENT_OPTIMIZER_DESIGN.md):
 *   - SPWPN_* (weapon brands)
 *   - SPARM_* (armor egos)
 *   - WPN_* and Weapon_prop[] (weapon base types)
 *   - ARM_* and Armour_prop[] (armor base types)
 *   - JEW_* and STAVE_*
 *   - art-data.txt (unrand list)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');
const VERSION_FILE = join(PACKAGE_ROOT, 'dcss-version.json');
const GENERATED_DIR = join(PACKAGE_ROOT, 'src', 'equipment', 'generated');

interface VersionInfo {
  commit: string;
  date: string;
  sourcePath: string;
}

function loadVersion(): VersionInfo {
  const raw = readFileSync(VERSION_FILE, 'utf-8');
  return JSON.parse(raw) as VersionInfo;
}

function resolveDcssSource(version: VersionInfo): string {
  return resolve(PACKAGE_ROOT, version.sourcePath, 'crawl-ref', 'source');
}

// ────────────────────────────────────────────────────────────────────────
// ARTP extraction
// ────────────────────────────────────────────────────────────────────────

interface ArtpEnumEntry {
  enumName: string;
  line: number;
  legacy: boolean;
}

interface ArtpDataEntry {
  enumName: string;
  abbreviation: string;
  valueType: 'any' | 'bool' | 'positive' | 'brand';
  line: number;
  legacy: boolean;
}

interface ArtpDescEntry {
  enumName: string;
  description: string;
  displayType: 'numeral' | 'symbolic' | 'plain';
  line: number;
}

/**
 * Parse the ordered ARTP_* enum from artefact-prop-type.h.
 * Tracks `#if TAG_MAJOR_VERSION == 34` blocks and marks entries inside
 * them as legacy. Skips the ARTP_NUM_PROPERTIES sentinel.
 */
function parseArtpEnum(filePath: string): ArtpEnumEntry[] {
  const text = readFileSync(filePath, 'utf-8');
  const lines = text.split('\n');
  const entries: ArtpEnumEntry[] = [];
  let inLegacy = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/^\s*#if\s+TAG_MAJOR_VERSION\s*==\s*34/.test(line)) {
      inLegacy = true;
      continue;
    }
    if (/^\s*#endif\b/.test(line)) {
      inLegacy = false;
      continue;
    }
    const m = /^\s*(ARTP_[A-Z_]+)\s*,?\s*(?:\/\/.*)?$/.exec(line);
    if (!m) continue;
    const name = m[1]!;
    if (name === 'ARTP_NUM_PROPERTIES') continue;
    entries.push({ enumName: name, line: i + 1, legacy: inLegacy });
  }

  if (entries.length === 0) {
    throw new Error(`No ARTP_* entries found in ${filePath}`);
  }
  return entries;
}

/**
 * Parse the artp_data[] table from artefact.cc.
 *
 * Each entry looks like one of:
 *   { "Brand", ARTP_VAL_BRAND, 0, nullptr, nullptr, 0, 0 }, // ARTP_BRAND,
 *   { "Str", ARTP_VAL_ANY, 100,     // ARTP_STRENGTH,
 *       _gen_good_stat_artp, _gen_bad_stat_artp, 7, 1 },
 *
 * Strategy: locate the array body, then walk it character-by-character
 * with brace-depth tracking to split into entries. For each entry, regex
 * out the first quoted string (abbreviation), the ARTP_VAL_* token, and
 * the trailing `// ARTP_FOO` comment.
 */
function parseArtpData(filePath: string): ArtpDataEntry[] {
  const text = readFileSync(filePath, 'utf-8');
  const startMatch = /static const artefact_prop_data artp_data\[\]\s*=\s*\{/.exec(text);
  if (!startMatch) {
    throw new Error(`Could not find artp_data[] in ${filePath}`);
  }
  const bodyStart = startMatch.index + startMatch[0].length;

  let depth = 1;
  let i = bodyStart;
  while (i < text.length && depth > 0) {
    const ch = text[i]!;
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const bodyEnd = i - 1; // position of the closing }
  const body = text.slice(bodyStart, bodyEnd);

  // Map character offset → line number within the body, so we can record
  // accurate source lines.
  const lineOffsetInFile = text.slice(0, bodyStart).split('\n').length;

  const entries: ArtpDataEntry[] = [];
  let pos = 0;
  let inLegacy = false;

  while (pos < body.length) {
    // Handle preprocessor directives on their own line.
    const restOfLineEnd = body.indexOf('\n', pos);
    const restOfLine = body.slice(pos, restOfLineEnd === -1 ? body.length : restOfLineEnd);

    if (/^\s*#if\s+TAG_MAJOR_VERSION\s*==\s*34/.test(restOfLine)) {
      inLegacy = true;
      pos = restOfLineEnd === -1 ? body.length : restOfLineEnd + 1;
      continue;
    }
    if (/^\s*#endif\b/.test(restOfLine)) {
      inLegacy = false;
      pos = restOfLineEnd === -1 ? body.length : restOfLineEnd + 1;
      continue;
    }

    // Find the next entry: starts with `{`, ends with the matching `}`.
    const openIdx = body.indexOf('{', pos);
    if (openIdx === -1) break;

    let entryDepth = 1;
    let j = openIdx + 1;
    while (j < body.length && entryDepth > 0) {
      const ch = body[j]!;
      if (ch === '{') entryDepth++;
      else if (ch === '}') entryDepth--;
      j++;
    }
    const closeIdx = j - 1;
    const entryText = body.slice(openIdx + 1, closeIdx);

    // After the closing `}` and any `,`, look for `// ARTP_FOO` on the
    // same line OR find it inside the entry text. Multi-line entries
    // tend to put the comment on the first line inline.
    const lineEndAfterClose = body.indexOf('\n', closeIdx);
    const tailEnd = lineEndAfterClose === -1 ? body.length : lineEndAfterClose;
    const tail = body.slice(closeIdx, tailEnd);

    const enumComment = /\/\/\s*(ARTP_[A-Z_]+)\s*,?/.exec(tail)
      ?? /\/\/\s*(ARTP_[A-Z_]+)\s*,?/.exec(entryText);
    if (!enumComment) {
      // Skip silently if we can't identify the entry — there might be
      // template/macro entries that don't follow the pattern.
      pos = (lineEndAfterClose === -1 ? body.length : lineEndAfterClose + 1);
      continue;
    }
    const enumName = enumComment[1]!;

    const abbrevMatch = /"([^"]*)"/.exec(entryText);
    if (!abbrevMatch) {
      throw new Error(`No abbreviation string found for ${enumName} in artp_data`);
    }
    const abbreviation = abbrevMatch[1]!;

    const valMatch = /ARTP_VAL_(BRAND|ANY|BOOL|POS)/.exec(entryText);
    if (!valMatch) {
      throw new Error(`No ARTP_VAL_* found for ${enumName} in artp_data`);
    }
    const valToken = valMatch[1]!;
    const valueType =
      valToken === 'BRAND' ? 'brand'
      : valToken === 'ANY' ? 'any'
      : valToken === 'BOOL' ? 'bool'
      : 'positive';

    const lineInBody = body.slice(0, openIdx).split('\n').length - 1;
    const line = lineOffsetInFile + lineInBody;

    entries.push({ enumName, abbreviation, valueType, line, legacy: inLegacy });

    pos = lineEndAfterClose === -1 ? body.length : lineEndAfterClose + 1;
  }

  return entries;
}

/**
 * Parse `_get_all_artp_desc_data()` from describe.cc.
 *
 * Each entry:
 *   { ARTP_AC,
 *       "It affects your AC (%d).",
 *       prop_note::numeral },
 */
function parseArtpDescData(filePath: string): ArtpDescEntry[] {
  const text = readFileSync(filePath, 'utf-8');
  const startMatch = /static const vector<property_descriptor>\s*&\s*_get_all_artp_desc_data\(\)/.exec(text);
  if (!startMatch) {
    throw new Error(`Could not find _get_all_artp_desc_data in ${filePath}`);
  }
  const dataStart = text.indexOf('vector<property_descriptor> data', startMatch.index);
  if (dataStart === -1) {
    throw new Error('Could not find data vector inside _get_all_artp_desc_data');
  }
  const bodyStart = text.indexOf('{', dataStart) + 1;
  let depth = 1;
  let i = bodyStart;
  while (i < text.length && depth > 0) {
    const ch = text[i]!;
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const bodyEnd = i - 1;
  const body = text.slice(bodyStart, bodyEnd);
  const lineOffsetInFile = text.slice(0, bodyStart).split('\n').length;

  const entries: ArtpDescEntry[] = [];
  let pos = 0;
  while (pos < body.length) {
    const openIdx = body.indexOf('{', pos);
    if (openIdx === -1) break;
    let d = 1;
    let j = openIdx + 1;
    while (j < body.length && d > 0) {
      const ch = body[j]!;
      if (ch === '{') d++;
      else if (ch === '}') d--;
      j++;
    }
    const closeIdx = j - 1;
    const entryText = body.slice(openIdx + 1, closeIdx);

    const enumMatch = /^\s*(ARTP_[A-Z_]+)/.exec(entryText);
    const propMatch = /prop_note::(numeral|symbolic|plain)/.exec(entryText);
    if (!enumMatch || !propMatch) {
      pos = closeIdx + 1;
      continue;
    }
    const enumName = enumMatch[1]!;
    const displayType = propMatch[1]! as 'numeral' | 'symbolic' | 'plain';

    // Concatenate all string literals in the entry (DCSS sometimes splits
    // long descriptions across multiple adjacent quoted strings).
    const strMatches = [...entryText.matchAll(/"((?:[^"\\]|\\.)*)"/g)];
    const description = strMatches.map((m) => m[1]!).join('');

    const lineInBody = body.slice(0, openIdx).split('\n').length - 1;
    const line = lineOffsetInFile + lineInBody;

    entries.push({ enumName, description, displayType, line });
    pos = closeIdx + 1;
  }

  return entries;
}

// ────────────────────────────────────────────────────────────────────────
// Output emission
// ────────────────────────────────────────────────────────────────────────

interface MergedArtp {
  enumName: string;
  abbreviation: string;
  valueType: 'any' | 'bool' | 'positive' | 'brand';
  renderingHint: 'int' | 'pip' | 'bool';
  description: string;
  legacy: boolean;
  sources: {
    enum: { file: string; line: number };
    artpData: { file: string; line: number };
    descData?: { file: string; line: number };
  };
}

function mergeArtp(
  enumEntries: ArtpEnumEntry[],
  dataEntries: ArtpDataEntry[],
  descEntries: ArtpDescEntry[],
): MergedArtp[] {
  const dataByName = new Map(dataEntries.map((e) => [e.enumName, e]));
  const descByName = new Map(descEntries.map((e) => [e.enumName, e]));

  return enumEntries.map((e) => {
    const data = dataByName.get(e.enumName);
    const desc = descByName.get(e.enumName);
    if (!data) {
      throw new Error(`${e.enumName}: enum entry has no corresponding artp_data entry`);
    }
    const renderingHint: 'int' | 'pip' | 'bool' =
      desc?.displayType === 'numeral' ? 'int'
      : desc?.displayType === 'symbolic' ? 'pip'
      : 'bool';
    return {
      enumName: e.enumName,
      abbreviation: data.abbreviation,
      valueType: data.valueType,
      renderingHint,
      description: desc?.description ?? '',
      legacy: e.legacy,
      sources: {
        enum: { file: 'artefact-prop-type.h', line: e.line },
        artpData: { file: 'artefact.cc', line: data.line },
        descData: desc ? { file: 'describe.cc', line: desc.line } : undefined,
      },
    };
  });
}

function emitArtp(entries: MergedArtp[], version: VersionInfo): string {
  const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit ${version.commit}
 * Extracted from: artefact-prop-type.h, artefact.cc, describe.cc
 * Re-run: \`pnpm --filter dcss-game-data extract\`
 */`;

  const interfaceDecl = `export interface ExtractedArtpEntry {
  /** DCSS enum name, e.g. 'ARTP_FIRE'. */
  enumName: string;
  /** Abbreviation as printed in morgue braces, e.g. 'rF'. */
  abbreviation: string;
  /** Value semantics from artp_data[].value_types. */
  valueType: 'any' | 'bool' | 'positive' | 'brand';
  /** prop_note display type from describe.cc, mapped to our rendering. */
  renderingHint: 'int' | 'pip' | 'bool';
  /** In-game description from _get_all_artp_desc_data. */
  description: string;
  /** True for TAG_MAJOR_VERSION == 34 entries (old save-file compat). */
  legacy: boolean;
  /** Source locations for traceability. */
  sources: {
    enum: { file: string; line: number };
    artpData: { file: string; line: number };
    descData?: { file: string; line: number };
  };
}`;

  const literal = JSON.stringify(entries, null, 2);

  return `${banner}\n\n${interfaceDecl}\n\nexport const ARTP_ENTRIES: ExtractedArtpEntry[] = ${literal};\n\nexport const ARTP_BY_NAME: Map<string, ExtractedArtpEntry> = new Map(\n  ARTP_ENTRIES.map((e) => [e.enumName, e]),\n);\n`;
}

// ────────────────────────────────────────────────────────────────────────
// Generic helpers (shared by SPWPN, SPARM, future extractors)
// ────────────────────────────────────────────────────────────────────────

interface EnumEntry {
  /** The C++ enum identifier (e.g. 'SPWPN_FLAMING'). */
  enumName: string;
  /**
   * Index in the underlying positional array (e.g. weapon_brands_terse[]).
   * Counts non-aliased entries from 0. Sentinel entries that are declared
   * inside the enum (e.g. NUM_REAL_SPECIAL_WEAPONS) DO occupy a position
   * because they advance the enum value counter.
   */
  index: number;
  legacy: boolean;
  line: number;
}

/**
 * Find the body of a named C++ enum. Returns the body text, the file
 * offset where the body starts, and the file offset where it ends.
 */
function findEnumBody(text: string, enumName: string): {
  body: string;
  bodyStart: number;
  bodyEnd: number;
} {
  const startRegex = new RegExp(`enum\\s+${enumName}\\b[^{]*\\{`);
  const m = startRegex.exec(text);
  if (!m) {
    throw new Error(`Could not find 'enum ${enumName}' in source.`);
  }
  const bodyStart = m.index + m[0].length;
  let depth = 1;
  let i = bodyStart;
  while (i < text.length && depth > 0) {
    const ch = text[i]!;
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const bodyEnd = i - 1;
  return { body: text.slice(bodyStart, bodyEnd), bodyStart, bodyEnd };
}

/**
 * Parse a C++ enum, returning every non-aliased entry with its index in
 * the underlying positional array. Aliases (entries with `= OTHER_NAME`)
 * and explicit-value entries (e.g. `FOO = -1`) are skipped, since they
 * don't occupy a unique array slot.
 *
 * `keep(name)` decides whether the entry should appear in the result;
 * unkept entries still advance the index counter so positional alignment
 * with arrays remains correct.
 */
function parseEnumWithIndices(
  filePath: string,
  enumName: string,
  keep: (name: string) => boolean,
): EnumEntry[] {
  const text = readFileSync(filePath, 'utf-8');
  const { body, bodyStart } = findEnumBody(text, enumName);
  const lineOffsetInFile = text.slice(0, bodyStart).split('\n').length;

  const entries: EnumEntry[] = [];
  let inLegacy = false;
  let index = 0;

  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/^\s*#if\s+TAG_MAJOR_VERSION\s*==\s*34/.test(line)) {
      inLegacy = true;
      continue;
    }
    if (/^\s*#if\s+TAG_MAJOR_VERSION\s*>\s*34/.test(line)) {
      // Modern-only block — same as no guard for our purposes.
      continue;
    }
    if (/^\s*#else\b/.test(line)) {
      inLegacy = !inLegacy;
      continue;
    }
    if (/^\s*#endif\b/.test(line)) {
      inLegacy = false;
      continue;
    }
    if (/^\s*#/.test(line)) continue;        // any other preprocessor
    if (/^\s*\/\//.test(line)) continue;     // line comment

    // Match enum entries. Capture name + optional `= value` clause.
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*(=\s*[^,]+)?\s*,?\s*(?:\/\/.*)?$/.exec(line);
    if (!m) continue;
    const name = m[1]!;
    const hasAssignment = !!m[2];
    if (hasAssignment) continue; // aliases / sentinels with explicit values

    if (keep(name)) {
      entries.push({
        enumName: name,
        index,
        legacy: inLegacy,
        line: lineOffsetInFile + i,
      });
    }
    index++;
  }

  if (entries.length === 0) {
    throw new Error(`No entries kept for enum ${enumName} in ${filePath}`);
  }
  return entries;
}

interface PositionalEntry {
  index: number;
  value: string;
  legacy: boolean;
}

/**
 * Parse a C++ `const char *NAME[] = { ... };` array. Returns one entry
 * per string literal, with `legacy: true` for entries inside
 * `#if TAG_MAJOR_VERSION == 34` blocks.
 *
 * Adjacent string concatenation (`"foo" "bar"` → `"foobar"`) is supported.
 */
function parsePositionalStringArray(filePath: string, arrayName: string): PositionalEntry[] {
  const text = readFileSync(filePath, 'utf-8');
  const startRegex = new RegExp(`(?:static\\s+)?const\\s+char\\s*\\*\\s*${arrayName}\\s*\\[\\s*\\]\\s*=\\s*\\{`);
  const m = startRegex.exec(text);
  if (!m) {
    throw new Error(`Could not find array '${arrayName}' in ${filePath}`);
  }
  const bodyStart = m.index + m[0].length;
  let depth = 1;
  let i = bodyStart;
  while (i < text.length && depth > 0) {
    const ch = text[i]!;
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const body = text.slice(bodyStart, i - 1);

  const entries: PositionalEntry[] = [];
  let inLegacy = false;
  let index = 0;

  // Walk the body, picking out string literals and tracking preprocessor
  // state. Concatenate adjacent strings into one entry.
  let pos = 0;
  while (pos < body.length) {
    const lineEnd = body.indexOf('\n', pos);
    const lineEndCapped = lineEnd === -1 ? body.length : lineEnd;
    const line = body.slice(pos, lineEndCapped);

    if (/^\s*#if\s+TAG_MAJOR_VERSION\s*==\s*34/.test(line)) {
      inLegacy = true;
      pos = lineEndCapped + 1;
      continue;
    }
    if (/^\s*#if\s+TAG_MAJOR_VERSION\s*>\s*34/.test(line)) {
      pos = lineEndCapped + 1;
      continue;
    }
    if (/^\s*#else\b/.test(line)) {
      inLegacy = !inLegacy;
      pos = lineEndCapped + 1;
      continue;
    }
    if (/^\s*#endif\b/.test(line)) {
      inLegacy = false;
      pos = lineEndCapped + 1;
      continue;
    }

    // Find string literals on this line, supporting adjacent concatenation.
    // Each string literal becomes one entry — adjacent strings on the same
    // line that aren't comma-separated get concatenated.
    const strRegex = /"((?:[^"\\]|\\.)*)"(\s*,)?/g;
    let lastEntry: PositionalEntry | undefined;
    let lineMatch;
    while ((lineMatch = strRegex.exec(line)) !== null) {
      const value = lineMatch[1]!;
      const hasComma = !!lineMatch[2];
      if (lastEntry && !hasComma) {
        // Continuation of previous (adjacent literals without comma).
        lastEntry.value += value;
      } else {
        const entry: PositionalEntry = { index, value, legacy: inLegacy };
        entries.push(entry);
        index++;
        lastEntry = hasComma ? undefined : entry;
      }
    }

    pos = lineEndCapped + 1;
  }

  if (entries.length === 0) {
    throw new Error(`No entries parsed from array '${arrayName}' in ${filePath}`);
  }
  return entries;
}

/**
 * Parse a `case FOO: return "bar";` switch block from a named function.
 *
 * Used for ego/brand name lookup tables that are implemented as switches
 * rather than positional arrays (e.g. `special_armour_type_name`).
 *
 * Returns a Map keyed by the case label (e.g. 'SPARM_FIRE_RESISTANCE'),
 * with the returned string literal as the value. Tracks
 * `#if TAG_MAJOR_VERSION == 34` blocks for the legacy flag.
 *
 * If the function contains multiple switches (e.g. an if/else with two
 * switches), `switchIndex` selects which one (0 = first, 1 = second).
 */
function parseCaseReturnTable(
  filePath: string,
  functionName: string,
  switchIndex: number,
): Map<string, { value: string; legacy: boolean; line: number }> {
  const text = readFileSync(filePath, 'utf-8');
  const fnRegex = new RegExp(`${functionName}\\s*\\([^)]*\\)\\s*\\{`);
  const fnMatch = fnRegex.exec(text);
  if (!fnMatch) {
    throw new Error(`Could not find function '${functionName}' in ${filePath}`);
  }

  // Locate `switch (...)` occurrences inside the function. Find the
  // function body bounds first.
  let fnDepth = 1;
  let j = fnMatch.index + fnMatch[0].length;
  while (j < text.length && fnDepth > 0) {
    const ch = text[j]!;
    if (ch === '{') fnDepth++;
    else if (ch === '}') fnDepth--;
    j++;
  }
  const fnBody = text.slice(fnMatch.index + fnMatch[0].length, j - 1);

  const switchStarts: number[] = [];
  const switchRegex = /switch\s*\([^)]+\)\s*\{/g;
  let sm: RegExpExecArray | null;
  while ((sm = switchRegex.exec(fnBody)) !== null) {
    switchStarts.push(sm.index + sm[0].length);
  }
  if (switchStarts.length <= switchIndex) {
    throw new Error(`Function ${functionName} has ${switchStarts.length} switches; wanted index ${switchIndex}`);
  }

  const switchStart = switchStarts[switchIndex]!;
  let depth = 1;
  let k = switchStart;
  while (k < fnBody.length && depth > 0) {
    const ch = fnBody[k]!;
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    k++;
  }
  const switchBody = fnBody.slice(switchStart, k - 1);
  const lineOffsetInFile = text.slice(0, fnMatch.index + fnMatch[0].length + switchStart).split('\n').length;

  const result = new Map<string, { value: string; legacy: boolean; line: number }>();
  let inLegacy = false;
  const lines = switchBody.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/^\s*#if\s+TAG_MAJOR_VERSION\s*==\s*34/.test(line)) {
      inLegacy = true;
      continue;
    }
    if (/^\s*#else\b/.test(line)) {
      inLegacy = !inLegacy;
      continue;
    }
    if (/^\s*#endif\b/.test(line)) {
      inLegacy = false;
      continue;
    }
    const m = /case\s+([A-Z_][A-Z0-9_]*)\s*:\s*return\s+"((?:[^"\\]|\\.)*)"\s*;/.exec(line);
    if (!m) continue;
    const label = m[1]!;
    const value = m[2]!;
    result.set(label, { value, legacy: inLegacy, line: lineOffsetInFile + i });
  }

  if (result.size === 0) {
    throw new Error(`No case-return entries found in ${functionName} switch ${switchIndex}`);
  }
  return result;
}

// ────────────────────────────────────────────────────────────────────────
// SPWPN (weapon brand) extraction
// ────────────────────────────────────────────────────────────────────────

interface MergedBrand {
  enumName: string;
  /** Brace-format brand name as it appears in artefact braces. */
  terseName: string;
  /** Item-name suffix ("of flaming"). */
  verboseName: string;
  /** Adjective form ("flaming sword"). */
  adjectiveName: string;
  /**
   * Whether this is a real brand a player might find on a weapon.
   * False for sentinels (SPWPN_NORMAL), debug entries (SPWPN_DEBUG_RANDART),
   * sentinels (NUM_REAL_SPECIAL_WEAPONS), and special-context brands
   * (SPWPN_ACID, SPWPN_CONFUSE, SPWPN_WEAKNESS, SPWPN_VULNERABILITY,
   * SPWPN_FOUL_FLAME — these are species/ability brands, not item brands).
   */
  realBrand: boolean;
  legacy: boolean;
  sources: {
    enum: { file: string; line: number };
  };
}

function extractBrands(sourceDir: string): MergedBrand[] {
  // Parse the enum, keeping every named entry (including sentinels) so
  // indices align with the name arrays.
  const enumEntries = parseEnumWithIndices(
    join(sourceDir, 'item-prop-enum.h'),
    'brand_type',
    () => true,
  );

  const terse = parsePositionalStringArray(join(sourceDir, 'item-name.cc'), 'weapon_brands_terse');
  const verbose = parsePositionalStringArray(join(sourceDir, 'item-name.cc'), 'weapon_brands_verbose');
  const adj = parsePositionalStringArray(join(sourceDir, 'item-name.cc'), 'weapon_brands_adj');

  // Sanity check: arrays must be the same length and align with enum count.
  if (terse.length !== verbose.length || terse.length !== adj.length) {
    throw new Error(
      `weapon_brand array length mismatch: terse=${terse.length}, ` +
      `verbose=${verbose.length}, adj=${adj.length}`,
    );
  }

  // Brands that aren't real findable weapon brands:
  const NON_REAL = new Set([
    'SPWPN_NORMAL',                   // no brand
    'NUM_REAL_SPECIAL_WEAPONS',       // sentinel
    'NUM_SPECIAL_WEAPONS',            // sentinel
    'SPWPN_ACID',                     // species ability brand (acid bite, Punk)
    'SPWPN_CONFUSE',                  // Confusing Touch spell
    'SPWPN_WEAKNESS',                 // Weakness Stinger
    'SPWPN_VULNERABILITY',            // Demonic Touch
    'SPWPN_FOUL_FLAME',               // Pan lords / Brilliance
    'SPWPN_DEBUG_RANDART',            // debug
  ]);

  const merged: MergedBrand[] = [];
  for (const e of enumEntries) {
    if (!e.enumName.startsWith('SPWPN_') && !e.enumName.startsWith('NUM_')) {
      continue;
    }
    const t = terse[e.index];
    const v = verbose[e.index];
    const a = adj[e.index];
    if (!t || !v || !a) {
      // The terminating sentinel (NUM_SPECIAL_WEAPONS) sits one past the
      // end of the array — skip it silently. Any other gap is a real bug.
      if (e.enumName === 'NUM_SPECIAL_WEAPONS') continue;
      throw new Error(`Brand ${e.enumName} (index ${e.index}) has no array entry`);
    }
    merged.push({
      enumName: e.enumName,
      terseName: t.value,
      verboseName: v.value,
      adjectiveName: a.value,
      realBrand: !NON_REAL.has(e.enumName) && !e.legacy,
      legacy: e.legacy,
      sources: {
        enum: { file: 'item-prop-enum.h', line: e.line },
      },
    });
  }

  return merged;
}

function emitBrands(entries: MergedBrand[], version: VersionInfo): string {
  const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit ${version.commit}
 * Extracted from: item-prop-enum.h (enum brand_type), item-name.cc
 *                 (weapon_brands_terse / verbose / adj arrays)
 * Re-run: \`pnpm --filter dcss-game-data extract\`
 */`;

  const interfaceDecl = `export interface ExtractedBrandEntry {
  /** DCSS enum name, e.g. 'SPWPN_FLAMING'. */
  enumName: string;
  /** Brace-format brand name as it appears in artefact braces ("flame"). */
  terseName: string;
  /** Item-name suffix ("flaming" — used as "weapon of flaming"). */
  verboseName: string;
  /** Adjective form ("flaming sword"). */
  adjectiveName: string;
  /**
   * True for brands a player can actually find on a weapon. Excludes
   * sentinels (SPWPN_NORMAL, NUM_*), debug entries, and species/ability
   * brands like SPWPN_ACID or SPWPN_CONFUSE.
   */
  realBrand: boolean;
  /** True for TAG_MAJOR_VERSION == 34 entries (old save-file compat). */
  legacy: boolean;
  /** Source locations for traceability. */
  sources: {
    enum: { file: string; line: number };
  };
}`;

  const literal = JSON.stringify(entries, null, 2);
  return `${banner}\n\n${interfaceDecl}\n\nexport const BRAND_ENTRIES: ExtractedBrandEntry[] = ${literal};\n\nexport const BRAND_BY_NAME: Map<string, ExtractedBrandEntry> = new Map(\n  BRAND_ENTRIES.map((e) => [e.enumName, e]),\n);\n`;
}

// ────────────────────────────────────────────────────────────────────────
// SPARM (armor ego) extraction
// ────────────────────────────────────────────────────────────────────────

interface MergedEgo {
  enumName: string;
  /** Brace-format ego name as it appears in item descriptions ("rF+"). */
  terseName: string;
  /** Item-name suffix ("fire resistance" — used as "armour of fire resistance"). */
  verboseName: string;
  realEgo: boolean;
  legacy: boolean;
  sources: {
    enum: { file: string; line: number };
    name: { file: string; line: number };
  };
}

function extractEgos(sourceDir: string): MergedEgo[] {
  const enumEntries = parseEnumWithIndices(
    join(sourceDir, 'item-prop-enum.h'),
    'special_armour_type',
    () => true,
  );

  // The terse-name switch is the second switch in the function (else-branch).
  const verbose = parseCaseReturnTable(
    join(sourceDir, 'item-name.cc'),
    'special_armour_type_name',
    0,
  );
  const terse = parseCaseReturnTable(
    join(sourceDir, 'item-name.cc'),
    'special_armour_type_name',
    1,
  );

  const NON_REAL = new Set([
    'SPARM_NORMAL',
    'NUM_REAL_SPECIAL_ARMOURS',
    'NUM_SPECIAL_ARMOURS',
  ]);

  const merged: MergedEgo[] = [];
  for (const e of enumEntries) {
    if (!e.enumName.startsWith('SPARM_') && !e.enumName.startsWith('NUM_')) {
      continue;
    }
    const t = terse.get(e.enumName);
    const v = verbose.get(e.enumName);
    merged.push({
      enumName: e.enumName,
      terseName: t?.value ?? '',
      verboseName: v?.value ?? '',
      realEgo: !NON_REAL.has(e.enumName) && !e.legacy && e.enumName.startsWith('SPARM_'),
      legacy: e.legacy,
      sources: {
        enum: { file: 'item-prop-enum.h', line: e.line },
        name: t ? { file: 'item-name.cc', line: t.line } : { file: 'item-name.cc', line: 0 },
      },
    });
  }

  return merged;
}

function emitEgos(entries: MergedEgo[], version: VersionInfo): string {
  const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit ${version.commit}
 * Extracted from: item-prop-enum.h (enum special_armour_type), item-name.cc
 *                 (special_armour_type_name switch tables)
 * Re-run: \`pnpm --filter dcss-game-data extract\`
 */`;

  const interfaceDecl = `export interface ExtractedEgoEntry {
  /** DCSS enum name, e.g. 'SPARM_FIRE_RESISTANCE'. */
  enumName: string;
  /**
   * Brace-format ego name as it appears in some morgue contexts ("rF+").
   * For standard egos this often is itself a property contribution that
   * can be tokenized.
   */
  terseName: string;
  /** Item-name suffix ("fire resistance"). */
  verboseName: string;
  /** True for real egos a player can find on armor (excludes sentinels). */
  realEgo: boolean;
  /** True for TAG_MAJOR_VERSION == 34 entries (old save-file compat). */
  legacy: boolean;
  /** Source locations for traceability. */
  sources: {
    enum: { file: string; line: number };
    name: { file: string; line: number };
  };
}`;

  const literal = JSON.stringify(entries, null, 2);
  return `${banner}\n\n${interfaceDecl}\n\nexport const EGO_ENTRIES: ExtractedEgoEntry[] = ${literal};\n\nexport const EGO_BY_NAME: Map<string, ExtractedEgoEntry> = new Map(\n  EGO_ENTRIES.map((e) => [e.enumName, e]),\n);\n`;
}

// ────────────────────────────────────────────────────────────────────────
// Struct array parsing (for Armour_prop[] and Weapon_prop[])
// ────────────────────────────────────────────────────────────────────────

interface StructArrayEntry {
  /** Raw text of the entry body (between { and }), with macros unresolved. */
  text: string;
  /** Position in the array, counting non-macro entries. */
  index: number;
  legacy: boolean;
  /** Line in the file where the entry opens. */
  line: number;
}

/**
 * Walk a C++ `static const T NAME[] = { {...}, {...}, ... };` array,
 * yielding one entry per top-level `{...}` block. Macro-only lines
 * (`DRAGON_ARMOUR(...)`) are skipped — they're rare and would require
 * macro expansion to parse correctly.
 */
function parseStructArray(filePath: string, arrayName: string): StructArrayEntry[] {
  const text = readFileSync(filePath, 'utf-8');
  const startRegex = new RegExp(
    `(?:static\\s+)?const\\s+\\w+\\s+${arrayName}\\s*\\[\\s*\\]\\s*=\\s*\\{`,
  );
  const m = startRegex.exec(text);
  if (!m) {
    throw new Error(`Could not find struct array '${arrayName}' in ${filePath}`);
  }
  const bodyStart = m.index + m[0].length;
  let depth = 1;
  let i = bodyStart;
  while (i < text.length && depth > 0) {
    const ch = text[i]!;
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const bodyEnd = i - 1;
  const body = text.slice(bodyStart, bodyEnd);
  const lineOffsetInFile = text.slice(0, bodyStart).split('\n').length;

  const entries: StructArrayEntry[] = [];
  let pos = 0;
  let inLegacy = false;
  let index = 0;

  while (pos < body.length) {
    // Skip whitespace and preprocessor directives.
    while (pos < body.length) {
      const restLine = body.slice(pos, body.indexOf('\n', pos) === -1 ? body.length : body.indexOf('\n', pos));
      if (/^\s*#if\s+TAG_MAJOR_VERSION\s*==\s*34/.test(restLine)) {
        inLegacy = true;
        pos = body.indexOf('\n', pos) + 1;
        continue;
      }
      if (/^\s*#if\s+TAG_MAJOR_VERSION\s*>\s*34/.test(restLine)) {
        pos = body.indexOf('\n', pos) + 1;
        continue;
      }
      if (/^\s*#endif\b/.test(restLine)) {
        inLegacy = false;
        pos = body.indexOf('\n', pos) + 1;
        continue;
      }
      if (/^\s*#else\b/.test(restLine)) {
        inLegacy = !inLegacy;
        pos = body.indexOf('\n', pos) + 1;
        continue;
      }
      if (body[pos] === undefined) break;
      if (/\s/.test(body[pos]!)) { pos++; continue; }
      if (body[pos] === '/' && body[pos + 1] === '/') {
        pos = body.indexOf('\n', pos);
        if (pos === -1) pos = body.length;
        else pos++;
        continue;
      }
      break;
    }
    if (pos >= body.length) break;

    if (body[pos] !== '{') {
      // DRAGON_ARMOUR(ID, "name", ac, evp, prc, res) macro expands to
      // a body-armour entry: ARM_<ID>_DRAGON_ARMOUR, "<name> dragon
      // scales", ac, evp, prc, SLOT_BODY_ARMOUR, ... Synthesize the
      // struct text so the downstream parser handles it like any other
      // armour entry.
      const dragonMatch = /^DRAGON_ARMOUR\(\s*([A-Z_]+)\s*,\s*"([^"]+)"\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/.exec(
        body.slice(pos),
      );
      if (dragonMatch) {
        const id = dragonMatch[1]!;
        const name = dragonMatch[2]!;
        const ac = dragonMatch[3]!;
        const evp = dragonMatch[4]!;
        const prc = dragonMatch[5]!;
        const synthText = ` ARM_${id}_DRAGON_ARMOUR, "${name} dragon scales", ${ac}, ${evp}, ${prc}, SLOT_BODY_ARMOUR, SIZE_LITTLE, SIZE_GIANT, false, 37 `;
        const lineInBody = body.slice(0, pos).split('\n').length - 1;
        entries.push({
          text: synthText,
          index,
          legacy: inLegacy,
          line: lineOffsetInFile + lineInBody,
        });
        index++;
        // Skip past the closing `)` of the macro call (paren-balanced).
        let depth = 0;
        let j = pos;
        while (j < body.length) {
          if (body[j] === '(') depth++;
          else if (body[j] === ')') {
            depth--;
            if (depth === 0) {
              j++;
              break;
            }
          }
          j++;
        }
        pos = j;
        while (pos < body.length && /[\s,]/.test(body[pos]!)) pos++;
        continue;
      }
      // Unrecognized non-struct content; advance to the next `{`.
      const next = body.indexOf('{', pos);
      if (next === -1) break;
      pos = next;
      continue;
    }

    const openIdx = pos;
    let entryDepth = 1;
    let j = openIdx + 1;
    while (j < body.length && entryDepth > 0) {
      const ch = body[j]!;
      if (ch === '{') entryDepth++;
      else if (ch === '}') entryDepth--;
      j++;
    }
    const closeIdx = j - 1;
    const entryText = body.slice(openIdx + 1, closeIdx);

    const lineInBody = body.slice(0, openIdx).split('\n').length - 1;
    entries.push({
      text: entryText,
      index,
      legacy: inLegacy,
      line: lineOffsetInFile + lineInBody,
    });
    index++;

    pos = closeIdx + 1;
    // Skip past the trailing comma.
    while (pos < body.length && /[\s,]/.test(body[pos]!)) pos++;
  }

  return entries;
}

// ────────────────────────────────────────────────────────────────────────
// Armor base types
// ────────────────────────────────────────────────────────────────────────

interface MergedArmor {
  enumName: string;
  displayName: string;
  baseAC: number;
  evPenalty: number;
  slot: string;
  isShield: boolean;
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}

function extractArmors(sourceDir: string): MergedArmor[] {
  const arrayEntries = parseStructArray(
    join(sourceDir, 'item-prop.cc'),
    'Armour_prop',
  );

  const merged: MergedArmor[] = [];
  for (const e of arrayEntries) {
    // First field: ARM_FOO. Skip if missing (e.g., macro-only entries).
    const idMatch = /^\s*(ARM_[A-Z_]+)\s*,/.exec(e.text);
    if (!idMatch) continue;
    const enumName = idMatch[1]!;

    const nameMatch = /,\s*"([^"]+)"\s*,/.exec(e.text);
    if (!nameMatch) continue;
    const displayName = nameMatch[1]!;

    // Fields are positional: id, name, ac, ev, price, slot, ...
    // Capture three signed integers after the name string.
    const numMatch = /"\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,/.exec(e.text);
    if (!numMatch) continue;
    const baseAC = parseInt(numMatch[1]!, 10);
    const evPenalty = parseInt(numMatch[2]!, 10);

    const slotMatch = /,\s*(SLOT_[A-Z_]+)\s*,/.exec(e.text);
    if (!slotMatch) continue;
    const slot = slotMatch[1]!;

    const isShield = enumName === 'ARM_BUCKLER'
      || enumName === 'ARM_KITE_SHIELD'
      || enumName === 'ARM_TOWER_SHIELD'
      || enumName === 'ARM_ORB';

    merged.push({
      enumName,
      displayName,
      baseAC,
      evPenalty,
      slot,
      isShield,
      legacy: e.legacy,
      sources: { entry: { file: 'item-prop.cc', line: e.line } },
    });
  }

  return merged;
}

function emitArmors(entries: MergedArmor[], version: VersionInfo): string {
  const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit ${version.commit}
 * Extracted from: item-prop.cc (Armour_prop[])
 * Re-run: \`pnpm --filter dcss-game-data extract\`
 */`;

  const interfaceDecl = `export interface ExtractedArmorEntry {
  /** DCSS enum name, e.g. 'ARM_PLATE_ARMOUR'. */
  enumName: string;
  /** Item display name as it appears in inventory. */
  displayName: string;
  /** Base AC contribution before enchantment / skill. */
  baseAC: number;
  /** EV penalty (negative numbers mean penalty; 0 means none). */
  evPenalty: number;
  /** DCSS equipment slot enum, e.g. 'SLOT_BODY_ARMOUR'. */
  slot: string;
  /** True for shields (ARM_BUCKLER, ARM_KITE_SHIELD, ARM_TOWER_SHIELD, ARM_ORB). */
  isShield: boolean;
  /** True for TAG_MAJOR_VERSION == 34 entries. */
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}`;

  const literal = JSON.stringify(entries, null, 2);
  return `${banner}\n\n${interfaceDecl}\n\nexport const ARMOR_ENTRIES: ExtractedArmorEntry[] = ${literal};\n\nexport const ARMOR_BY_NAME: Map<string, ExtractedArmorEntry> = new Map(\n  ARMOR_ENTRIES.map((e) => [e.enumName, e]),\n);\n`;
}

// ────────────────────────────────────────────────────────────────────────
// Weapon base types
// ────────────────────────────────────────────────────────────────────────

interface MergedWeapon {
  enumName: string;
  displayName: string;
  baseDamage: number;
  skill: string;
  /** Smallest size that can wield this weapon at all (needs 2h). */
  min2hSize: string;
  /** Smallest size that can wield 1h. NUM_SIZE_LEVELS = never 1h. */
  min1hSize: string;
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}

function extractWeapons(sourceDir: string): MergedWeapon[] {
  const arrayEntries = parseStructArray(
    join(sourceDir, 'item-prop.cc'),
    'Weapon_prop',
  );

  const merged: MergedWeapon[] = [];
  for (const e of arrayEntries) {
    const idMatch = /^\s*(WPN_[A-Z_]+)\s*,/.exec(e.text);
    if (!idMatch) continue;
    const enumName = idMatch[1]!;

    const nameMatch = /,\s*"([^"]+)"\s*,/.exec(e.text);
    if (!nameMatch) continue;
    const displayName = nameMatch[1]!;

    // After name: dam, hit, speed, skill, min_2h_size, min_1h_size, ...
    const numMatch = /"\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(SK_[A-Z_]+)\s*,\s*(SIZE_[A-Z_]+|NUM_SIZE_LEVELS)\s*,\s*(SIZE_[A-Z_]+|NUM_SIZE_LEVELS)/.exec(e.text);
    if (!numMatch) continue;
    const baseDamage = parseInt(numMatch[1]!, 10);
    const skill = numMatch[4]!;
    const min2hSize = numMatch[5]!;
    const min1hSize = numMatch[6]!;

    merged.push({
      enumName,
      displayName,
      baseDamage,
      skill,
      min2hSize,
      min1hSize,
      legacy: e.legacy,
      sources: { entry: { file: 'item-prop.cc', line: e.line } },
    });
  }

  return merged;
}

function emitWeapons(entries: MergedWeapon[], version: VersionInfo): string {
  const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit ${version.commit}
 * Extracted from: item-prop.cc (Weapon_prop[])
 * Re-run: \`pnpm --filter dcss-game-data extract\`
 */`;

  const interfaceDecl = `export interface ExtractedWeaponEntry {
  /** DCSS enum name, e.g. 'WPN_LONG_SWORD'. */
  enumName: string;
  /** Item display name as it appears in inventory. */
  displayName: string;
  /** Base damage before enchantment / skill. */
  baseDamage: number;
  /** Weapon skill enum, e.g. 'SK_LONG_BLADES'. */
  skill: string;
  /**
   * Smallest size that can wield this weapon at all (needs both hands).
   * Larger sizes may be able to wield one-handed (see min1hSize).
   */
  min2hSize: string;
  /**
   * Smallest size that can wield one-handed. 'NUM_SIZE_LEVELS' means the
   * weapon is always two-handed for everyone.
   */
  min1hSize: string;
  /** True for TAG_MAJOR_VERSION == 34 entries. */
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}`;

  const literal = JSON.stringify(entries, null, 2);
  return `${banner}\n\n${interfaceDecl}\n\nexport const WEAPON_ENTRIES: ExtractedWeaponEntry[] = ${literal};\n\nexport const WEAPON_BY_NAME: Map<string, ExtractedWeaponEntry> = new Map(\n  WEAPON_ENTRIES.map((e) => [e.enumName, e]),\n);\n`;
}

// ────────────────────────────────────────────────────────────────────────
// Jewelry types (rings + amulets)
// ────────────────────────────────────────────────────────────────────────

interface MergedJewelry {
  enumName: string;
  /** 'ring' or 'amulet' (derived from prefix). */
  kind: 'ring' | 'amulet';
  legacy: boolean;
  sources: { enum: { file: string; line: number } };
}

function extractJewelry(sourceDir: string): MergedJewelry[] {
  const entries = parseEnumWithIndices(
    join(sourceDir, 'item-prop-enum.h'),
    'jewellery_type',
    (name) => name.startsWith('RING_') || name.startsWith('AMU_'),
  );

  const merged: MergedJewelry[] = [];
  for (const e of entries) {
    // Skip the FIRST_* alias entries that some species use.
    if (e.enumName === 'RING_FIRST_RING' || e.enumName === 'AMU_FIRST_AMULET') continue;
    merged.push({
      enumName: e.enumName,
      kind: e.enumName.startsWith('RING_') ? 'ring' : 'amulet',
      legacy: e.legacy,
      sources: { enum: { file: 'item-prop-enum.h', line: e.line } },
    });
  }

  return merged;
}

function emitJewelry(entries: MergedJewelry[], version: VersionInfo): string {
  const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit ${version.commit}
 * Extracted from: item-prop-enum.h (enum jewellery_type)
 * Re-run: \`pnpm --filter dcss-game-data extract\`
 */`;

  const interfaceDecl = `export interface ExtractedJewelryEntry {
  /** DCSS enum name, e.g. 'RING_FIRE'. */
  enumName: string;
  /** 'ring' or 'amulet'. */
  kind: 'ring' | 'amulet';
  /** True for TAG_MAJOR_VERSION == 34 entries. */
  legacy: boolean;
  sources: { enum: { file: string; line: number } };
}`;

  const literal = JSON.stringify(entries, null, 2);
  return `${banner}\n\n${interfaceDecl}\n\nexport const JEWELRY_ENTRIES: ExtractedJewelryEntry[] = ${literal};\n\nexport const JEWELRY_BY_NAME: Map<string, ExtractedJewelryEntry> = new Map(\n  JEWELRY_ENTRIES.map((e) => [e.enumName, e]),\n);\n`;
}

// ────────────────────────────────────────────────────────────────────────
// Staff types
// ────────────────────────────────────────────────────────────────────────

interface MergedStaff {
  enumName: string;
  legacy: boolean;
  sources: { enum: { file: string; line: number } };
}

function extractStaves(sourceDir: string): MergedStaff[] {
  const entries = parseEnumWithIndices(
    join(sourceDir, 'item-prop-enum.h'),
    'stave_type',
    (name) => name.startsWith('STAFF_'),
  );

  const merged: MergedStaff[] = [];
  for (const e of entries) {
    if (e.enumName === 'STAFF_FIRST_STAFF') continue;
    merged.push({
      enumName: e.enumName,
      legacy: e.legacy,
      sources: { enum: { file: 'item-prop-enum.h', line: e.line } },
    });
  }
  return merged;
}

function emitStaves(entries: MergedStaff[], version: VersionInfo): string {
  const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit ${version.commit}
 * Extracted from: item-prop-enum.h (enum stave_type)
 * Re-run: \`pnpm --filter dcss-game-data extract\`
 */`;

  const interfaceDecl = `export interface ExtractedStaffEntry {
  /** DCSS enum name, e.g. 'STAFF_FIRE'. */
  enumName: string;
  /** True for TAG_MAJOR_VERSION == 34 entries. */
  legacy: boolean;
  sources: { enum: { file: string; line: number } };
}`;

  const literal = JSON.stringify(entries, null, 2);
  return `${banner}\n\n${interfaceDecl}\n\nexport const STAFF_ENTRIES: ExtractedStaffEntry[] = ${literal};\n\nexport const STAFF_BY_NAME: Map<string, ExtractedStaffEntry> = new Map(\n  STAFF_ENTRIES.map((e) => [e.enumName, e]),\n);\n`;
}

// ────────────────────────────────────────────────────────────────────────
// Unrand data (art-data.txt)
// ────────────────────────────────────────────────────────────────────────

interface MergedUnrand {
  /** Auto-generated UNRAND_* enum key, e.g. 'UNRAND_SINGING_SWORD'. */
  enumName: string;
  /** Display name as it appears in morgues, e.g. 'Singing Sword'. */
  name: string;
  /** OBJ_* class, e.g. 'OBJ_WEAPONS'. */
  objectClass: string;
  /** Sub-type, e.g. 'WPN_DOUBLE_SWORD', 'ARM_PLATE_ARMOUR'. */
  subType: string;
  /** Enchantment (+N) if specified. */
  plus?: number;
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}

/**
 * Parse art-data.txt. Each unrand is a block of `KEY: value` lines
 * separated by blank lines. Lines starting with `#` are comments.
 *
 * Auto-generated ENUMs follow the rule: if ENUM: is present, use that
 * (with UNRAND_ prefix); else derive from NAME by uppercasing and
 * replacing non-alphanumerics with underscores.
 */
function extractUnrands(sourceDir: string): MergedUnrand[] {
  const filePath = join(sourceDir, 'art-data.txt');
  const text = readFileSync(filePath, 'utf-8');
  const lines = text.split('\n');

  const blocks: { lines: { text: string; lineNo: number }[] }[] = [];
  let current: { text: string; lineNo: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() === '' || line.trim().startsWith('#')) {
      if (current.length > 0) {
        blocks.push({ lines: current });
        current = [];
      }
      continue;
    }
    current.push({ text: line, lineNo: i + 1 });
  }
  if (current.length > 0) blocks.push({ lines: current });

  const merged: MergedUnrand[] = [];
  for (const block of blocks) {
    const fields = new Map<string, string>();
    let firstLine = 0;
    for (const { text: line, lineNo } of block.lines) {
      if (firstLine === 0) firstLine = lineNo;
      const m = /^\s*([A-Z_]+):\s*(.*?)\s*$/.exec(line);
      if (!m) continue;
      const key = m[1]!;
      const value = m[2]!;
      // Only first occurrence wins (some fields have continuations).
      if (!fields.has(key)) fields.set(key, value);
    }

    const name = fields.get('NAME');
    const obj = fields.get('OBJ');
    if (!name || !obj) continue;

    // Skip the placeholder DUMMY entry.
    if (name.startsWith('DUMMY')) continue;

    const objMatch = /^(OBJ_[A-Z_]+)\/(\w+)/.exec(obj);
    if (!objMatch) continue;
    const objectClass = objMatch[1]!;
    const subType = objMatch[2]!;

    const explicitEnum = fields.get('ENUM');
    const enumBase = explicitEnum ?? name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const enumName = `UNRAND_${enumBase}`;

    let plus: number | undefined;
    const plusStr = fields.get('PLUS');
    if (plusStr) {
      const plusMatch = /^([+-]?\d+)/.exec(plusStr);
      if (plusMatch) plus = parseInt(plusMatch[1]!, 10);
    }

    merged.push({
      enumName,
      name,
      objectClass,
      subType,
      plus,
      legacy: false, // art-data.txt entries are all current; legacy unrands removed
      sources: { entry: { file: 'art-data.txt', line: firstLine } },
    });
  }

  return merged;
}

function emitUnrands(entries: MergedUnrand[], version: VersionInfo): string {
  const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit ${version.commit}
 * Extracted from: art-data.txt
 * Re-run: \`pnpm --filter dcss-game-data extract\`
 */`;

  const interfaceDecl = `export interface ExtractedUnrandEntry {
  /** Auto-generated UNRAND_* key, e.g. 'UNRAND_SINGING_SWORD'. */
  enumName: string;
  /** Display name as it appears in morgues, e.g. 'Singing Sword'. */
  name: string;
  /** OBJ_* class, e.g. 'OBJ_WEAPONS'. */
  objectClass: string;
  /** Sub-type, e.g. 'WPN_DOUBLE_SWORD'. */
  subType: string;
  /** Enchantment (+N) if specified in art-data.txt. */
  plus?: number;
  /** Always false here — art-data.txt strips removed unrands. */
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}`;

  const literal = JSON.stringify(entries, null, 2);
  return `${banner}\n\n${interfaceDecl}\n\nexport const UNRAND_ENTRIES: ExtractedUnrandEntry[] = ${literal};\n\nexport const UNRAND_BY_NAME: Map<string, ExtractedUnrandEntry> = new Map(\n  UNRAND_ENTRIES.map((e) => [e.name.toLowerCase(), e]),\n);\n\nexport const UNRAND_BY_ENUM: Map<string, ExtractedUnrandEntry> = new Map(\n  UNRAND_ENTRIES.map((e) => [e.enumName, e]),\n);\n`;
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

function main(): void {
  const version = loadVersion();
  const sourceDir = resolveDcssSource(version);

  console.log(`Extracting from DCSS commit ${version.commit}`);
  console.log(`Source dir: ${sourceDir}`);

  mkdirSync(GENERATED_DIR, { recursive: true });

  // ARTPs
  const artpEnum = parseArtpEnum(join(sourceDir, 'artefact-prop-type.h'));
  const artpData = parseArtpData(join(sourceDir, 'artefact.cc'));
  const artpDesc = parseArtpDescData(join(sourceDir, 'describe.cc'));
  const artpMerged = mergeArtp(artpEnum, artpData, artpDesc);
  const artpPath = join(GENERATED_DIR, 'artp.ts');
  writeFileSync(artpPath, emitArtp(artpMerged, version));
  console.log(
    `✓ ARTP: ${artpMerged.length} entries (${artpMerged.filter((e) => e.legacy).length} legacy) → ${artpPath}`,
  );

  // Brands
  const brands = extractBrands(sourceDir);
  const brandPath = join(GENERATED_DIR, 'brand.ts');
  writeFileSync(brandPath, emitBrands(brands, version));
  console.log(
    `✓ Brand: ${brands.length} entries (${brands.filter((e) => e.legacy).length} legacy, ${brands.filter((e) => e.realBrand).length} real) → ${brandPath}`,
  );

  // Egos
  const egos = extractEgos(sourceDir);
  const egoPath = join(GENERATED_DIR, 'sparm.ts');
  writeFileSync(egoPath, emitEgos(egos, version));
  console.log(
    `✓ Ego: ${egos.length} entries (${egos.filter((e) => e.legacy).length} legacy, ${egos.filter((e) => e.realEgo).length} real) → ${egoPath}`,
  );

  // Armors
  const armors = extractArmors(sourceDir);
  const armorPath = join(GENERATED_DIR, 'armor-type.ts');
  writeFileSync(armorPath, emitArmors(armors, version));
  console.log(
    `✓ Armor: ${armors.length} entries (${armors.filter((e) => e.legacy).length} legacy, ${armors.filter((e) => e.isShield).length} shields) → ${armorPath}`,
  );

  // Weapons
  const weapons = extractWeapons(sourceDir);
  const weaponPath = join(GENERATED_DIR, 'weapon-type.ts');
  writeFileSync(weaponPath, emitWeapons(weapons, version));
  console.log(
    `✓ Weapon: ${weapons.length} entries (${weapons.filter((e) => e.legacy).length} legacy) → ${weaponPath}`,
  );

  // Jewelry
  const jewelry = extractJewelry(sourceDir);
  const jewelryPath = join(GENERATED_DIR, 'jewellery-type.ts');
  writeFileSync(jewelryPath, emitJewelry(jewelry, version));
  console.log(
    `✓ Jewelry: ${jewelry.length} entries (${jewelry.filter((e) => e.legacy).length} legacy, ${jewelry.filter((e) => e.kind === 'ring').length} rings, ${jewelry.filter((e) => e.kind === 'amulet').length} amulets) → ${jewelryPath}`,
  );

  // Staves
  const staves = extractStaves(sourceDir);
  const stavesPath = join(GENERATED_DIR, 'stave-type.ts');
  writeFileSync(stavesPath, emitStaves(staves, version));
  console.log(
    `✓ Staff: ${staves.length} entries (${staves.filter((e) => e.legacy).length} legacy) → ${stavesPath}`,
  );

  // Unrands
  const unrands = extractUnrands(sourceDir);
  const unrandsPath = join(GENERATED_DIR, 'unrand-data.ts');
  writeFileSync(unrandsPath, emitUnrands(unrands, version));
  console.log(`✓ Unrand: ${unrands.length} entries → ${unrandsPath}`);
}

main();
