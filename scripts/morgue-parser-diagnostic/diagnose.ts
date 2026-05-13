#!/usr/bin/env tsx
/**
 * Morgue Parser Diagnostic Tool
 *
 * Parses all morgue files in a directory and reports:
 * - Version range (lowest and highest game versions)
 * - Missing required fields (score, playerName, title, race, etc.)
 * - Missing critical sections (runes, equipment, gods, skills, branches)
 * - Parsing errors
 * - Total parsing time
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMorgue, type MorgueData, type ParseResult } from "dcss-morgue-parser";
import {
  KNOWN_SPECIES_NAMES,
  KNOWN_BACKGROUND_NAMES,
  KNOWN_GOD_NAMES,
} from "../../packages/dcss-game-data/src/index.ts";

// Configuration
const DEFAULT_MORGUE_DIR = "../streak-downloader/outputs";
const CRITICAL_SECTIONS = ["equipment", "godsWorshipped", "endingSkills", "branches"] as const;
const HIGH_XL_SKILLS_LEVEL = 26;
const LOW_SKILL_COUNT_THRESHOLD = 2;
const LOW_SKILL_SUM_THRESHOLD = 25;
const MAX_RUNE_NAME_LENGTH = 50;
const DB_TEXT_LIMITS = {
  player_name: 100,
  title: 100,
  race_name: 50,
  background_name: 50,
  god_name: 50,
  skill_name: 50,
  spell_name: 100,
  spell_school_name: 50,
  branch_name: 50,
  xp_location: 20,
  action_category: 30,
  action_name: 50,
} as const;
const SUSPICIOUS_SKILL_HASHES = new Set([
  "aad81280fb33ca71f3c5ba814ed616ad95d6f531de95a06e969aa1e1130075b1",
  "74e3d56921998ed9f52a0c8e02b332c1e832b8c4372ee31c2fc306d9baaaefe5",
  "8ab9edea5535627d0ab3d96f4dbb4ec76a3693f630abdb9bfd040506c4bef17b",
  "5daf9b84dd08925c8fbfba921dd78401184684ac719478a070baf5e0e1b6a397",
  "3db0a81b22ebace6eb86bc579295622c888ad1761d5ee6a95d63cf75aee2eb9e",
  "b8f0cc4f8e244458e8a7e533c2be53fa02597134cd67814c06189dd75c571439",
  "78a29a92d20d8f4b84f515b684400c9eff1ec30410de267205797f0c39689fec",
  "e6b268e1a6879417009c9514b08aabf066a4146e7bdb554a8a54a7884ba15509",
]);

/** All nullable fields on MorgueData that should have at least one non-null value across a corpus. */
const ALL_NULLABLE_FIELDS: (keyof MorgueData)[] = [
  "version", "isWebtiles", "gameSeed", "score", "playerName", "title",
  "race", "background", "speciesData", "characterLevel", "startDate", "endDate",
  "gameDurationSeconds", "totalTurns", "runesList",
  "gemsList", "branchesVisitedCount", "levelsSeenCount", "isWin",
  "endingStats", "equipment", "endingSkills", "skillsByXl", "skillsByXlSource",
  "endingSpells", "godsWorshipped", "branches", "xpProgression", "actions",
];
const REQUIRED_FIELDS = [
  "score",
  "playerName",
  "title",
  "race",
  "background",
  "characterLevel",
  "startDate",
  "endDate",
  "gameDurationSeconds",
  "totalTurns",
  "levelsSeenCount",
  "isWin",
] as const;

type CriticalSection = (typeof CRITICAL_SECTIONS)[number];
type RequiredField = (typeof REQUIRED_FIELDS)[number];

interface MissingFieldInfo {
  file: string;
  version: string | null;
}

interface MissingSectionInfo {
  file: string;
  version: string | null;
  race: string | null;
  characterLevel: number | null;
  missingSections: CriticalSection[];
}

interface ParseErrorInfo {
  file: string;
  version: string | null;
  errors: string[];
}

const SEMANTIC_ISSUE_TYPES = [
  "background_starts_with_species",
  "unknown_race",
  "unknown_background",
  "duplicate_spell_in_game",
  "rune_name_too_long",
  "god_name_too_long",
  "unknown_god",
  "db_text_field_too_long",
  "win_with_too_few_runes",
  "high_xl_missing_skills",
  "high_xl_zero_total_skills",
  "high_xl_low_skills_warning",
] as const;

type SemanticIssueType = (typeof SEMANTIC_ISSUE_TYPES)[number];
const DETAIL_LEVELS = ["summary", "standard", "full"] as const;
const OUTPUT_FORMATS = ["text", "json"] as const;
const REPORT_SECTIONS = [
  "versions",
  "always-null",
  "missing-fields",
  "missing-sections",
  "runes",
  "parse-errors",
  "semantic",
  "watchlist",
  "tips",
] as const;

type DetailLevel = (typeof DETAIL_LEVELS)[number];
type OutputFormat = (typeof OUTPUT_FORMATS)[number];
type ReportSection = (typeof REPORT_SECTIONS)[number];

interface SemanticIssueInfo {
  file: string;
  version: string | null;
  playerName: string | null;
  morgueHash: string | null;
  race: string | null;
  background: string | null;
  characterLevel: number | null;
  skillCount: number;
  totalSkillLevels: number;
  maxSkill: number;
  runesCount: number;
  severity: "error" | "warn";
  detail: string;
  skillsExcerpt: string | null;
}

interface DiagnosticResult {
  totalFiles: number;
  totalFilesDiscovered: number;
  skippedBeforeMinVersion: number;
  parsedSuccessfully: number;
  parsedWithErrors: number;
  versionLowest: string | null;
  versionHighest: string | null;
  versionsFound: Map<string, number>;
  missingSections: Map<CriticalSection, MissingSectionInfo[]>;
  missingFields: Map<RequiredField, MissingFieldInfo[]>;
  parseErrors: ParseErrorInfo[];
  noRunesFiles: { file: string; version: string | null; characterLevel: number | null }[];
  winsWithoutRunes: { file: string; version: string | null; characterLevel: number | null }[];
  semanticIssues: Map<SemanticIssueType, SemanticIssueInfo[]>;
  watchedSkillHashesSeen: Set<string>;
  /** Fields that had at least one non-null value across all parsed files. */
  fieldsEverNonNull: Set<keyof MorgueData>;
  parsingTimeMs: number;
}

interface ReportOptions {
  detail: DetailLevel;
  maxExamples: number;
  includeSkillsExcerpts: boolean;
  showVersionHistogram: boolean;
  onlySections: Set<ReportSection> | null;
  format: OutputFormat;
  outPath: string | null;
  minVersion: string | null;
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
 * Races that cannot worship gods.
 */
const GODLESS_RACES = ["Demigod"];
const GODLESS_RACES_SET = new Set(GODLESS_RACES.map((race) => race.toLowerCase()));
const KNOWN_SPECIES_SORTED = [...KNOWN_SPECIES_NAMES].sort((a, b) => b.length - a.length);
const KNOWN_SPECIES_SET = new Set(KNOWN_SPECIES_NAMES.map((s) => s.toLowerCase()));
const KNOWN_BACKGROUND_SET = new Set(KNOWN_BACKGROUND_NAMES.map((b) => b.toLowerCase()));
const KNOWN_GOD_SET = new Set(KNOWN_GOD_NAMES.map((g) => g.toLowerCase()));

function startsWithKnownSpecies(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  for (const species of KNOWN_SPECIES_SORTED) {
    const speciesLower = species.toLowerCase();
    if (lower.startsWith(`${speciesLower} `)) {
      return species;
    }
  }
  return null;
}

function isKnownSpecies(value: string | null): boolean {
  if (!value) return false;
  return KNOWN_SPECIES_SET.has(value.trim().toLowerCase());
}

function isKnownBackground(value: string | null): boolean {
  if (!value) return false;
  return KNOWN_BACKGROUND_SET.has(value.trim().toLowerCase());
}

function isKnownGod(value: string | null): boolean {
  if (!value) return false;
  return KNOWN_GOD_SET.has(value.trim().toLowerCase());
}

function hasNonEmptyText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isGodlessRace(value: string | null): boolean {
  if (!value) return false;
  return GODLESS_RACES_SET.has(value.trim().toLowerCase());
}

function getSkillsSectionExcerpt(content: string): string | null {
  const lines = content.split("\n");
  const skillsIndex = lines.findIndex((line) => (
    /^\s*Skills:?\s*$/i.test(line) ||
    /^\s*Skill\s+XL:\s*\|/i.test(line) ||
    /^\s*Skill\s+\|\s*Level/i.test(line)
  ));
  if (skillsIndex === -1) {
    return null;
  }

  const start = Math.max(0, skillsIndex - 3);
  const end = Math.min(lines.length, skillsIndex + 12);
  const excerpt = lines.slice(start, end).join("\n").trimEnd();
  return excerpt || null;
}

function prioritizeWatchlistIssues(issues: SemanticIssueInfo[]): SemanticIssueInfo[] {
  return [...issues].sort((a, b) => {
    const aWatch = a.morgueHash ? SUSPICIOUS_SKILL_HASHES.has(a.morgueHash) : false;
    const bWatch = b.morgueHash ? SUSPICIOUS_SKILL_HASHES.has(b.morgueHash) : false;
    if (aWatch !== bWatch) return aWatch ? -1 : 1;
    const aXl = a.characterLevel ?? -1;
    const bXl = b.characterLevel ?? -1;
    return bXl - aXl;
  });
}

function shouldShowSection(options: ReportOptions, section: ReportSection): boolean {
  return options.onlySections === null || options.onlySections.has(section);
}

function getIssueFileKey(issue: SemanticIssueInfo): string {
  return issue.morgueHash || issue.file;
}

function countBackgroundSpeciesCluster(result: DiagnosticResult): number {
  const prefixed = new Set(
    (result.semanticIssues.get("background_starts_with_species") || []).map(getIssueFileKey)
  );
  const unknownRace = new Set((result.semanticIssues.get("unknown_race") || []).map(getIssueFileKey));
  const unknownBackground = new Set(
    (result.semanticIssues.get("unknown_background") || []).map(getIssueFileKey)
  );
  let overlapCount = 0;
  for (const key of prefixed) {
    if (unknownRace.has(key) || unknownBackground.has(key)) {
      overlapCount++;
    }
  }
  return overlapCount;
}

function mapByVersion<T extends { version: string | null }>(items: T[]): Map<string, T[]> {
  const byVersion = new Map<string, T[]>();
  for (const item of items) {
    const v = item.version?.match(/^(\d+\.\d+)/)?.[1] || "unknown";
    if (!byVersion.has(v)) byVersion.set(v, []);
    byVersion.get(v)!.push(item);
  }
  return byVersion;
}

function parseListArg(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function getArgValue(args: string[], names: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (names.includes(args[i])) {
      return args[i + 1];
    }
  }
  return undefined;
}

function toJsonReport(result: DiagnosticResult): Record<string, unknown> {
  return {
    totalFiles: result.totalFiles,
    parsedSuccessfully: result.parsedSuccessfully,
    parsedWithErrors: result.parsedWithErrors,
    versionLowest: result.versionLowest,
    versionHighest: result.versionHighest,
    versionsFound: Object.fromEntries(result.versionsFound),
    missingSections: Object.fromEntries(
      CRITICAL_SECTIONS.map((section) => [section, result.missingSections.get(section) || []])
    ),
    missingFields: Object.fromEntries(
      REQUIRED_FIELDS.map((field) => [field, result.missingFields.get(field) || []])
    ),
    parseErrors: result.parseErrors,
    noRunesFiles: result.noRunesFiles,
    winsWithoutRunes: result.winsWithoutRunes,
    semanticIssues: Object.fromEntries(
      SEMANTIC_ISSUE_TYPES.map((type) => [type, result.semanticIssues.get(type) || []])
    ),
    watchedSkillHashesSeen: [...result.watchedSkillHashesSeen],
    watchlistConfigured: [...SUSPICIOUS_SKILL_HASHES],
    fieldsEverNonNull: [...result.fieldsEverNonNull],
    parsingTimeMs: result.parsingTimeMs,
  };
}

async function inspectHash(morgueDir: string, targetHash: string): Promise<void> {
  const morgueFiles = getMorgueFiles(morgueDir);
  for (const filePath of morgueFiles) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const parseResult = await parseMorgue(content);
    const data = parseResult.data;
    if (data.morgueHash !== targetHash) {
      continue;
    }

    const skillEntries = Object.entries(data.endingSkills ?? {});
    const skillCount = skillEntries.length;
    const totalSkillLevels = skillEntries.reduce((sum, [, level]) => sum + level, 0);
    const maxSkill = skillEntries.reduce((max, [, level]) => Math.max(max, level), 0);
    const runesCount = data.runesList?.length ?? 0;
    const shouldRunHighXlSkillChecks = (
      (data.characterLevel ?? 0) >= HIGH_XL_SKILLS_LEVEL
      || SUSPICIOUS_SKILL_HASHES.has(targetHash)
    );

    const classifications: string[] = [];
    if (shouldRunHighXlSkillChecks) {
      if (!data.endingSkills || skillCount === 0) {
        classifications.push("high_xl_missing_skills");
      } else {
        if (totalSkillLevels === 0) {
          classifications.push("high_xl_zero_total_skills");
        }
        if (skillCount <= LOW_SKILL_COUNT_THRESHOLD || totalSkillLevels < LOW_SKILL_SUM_THRESHOLD) {
          classifications.push("high_xl_low_skills_warning");
        }
      }
    }

    const summary = {
      found: true,
      file: fileName,
      version: data.version,
      playerName: data.playerName,
      morgueHash: data.morgueHash,
      characterLevel: data.characterLevel,
      endingSkillsIsNull: data.endingSkills === null,
      skillCount,
      totalSkillLevels,
      maxSkill,
      runesCount,
      shouldRunHighXlSkillChecks,
      classifications,
      skillsExcerpt: getSkillsSectionExcerpt(content),
    };

    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(JSON.stringify({ found: false, morgueHash: targetHash }, null, 2));
}

/**
 * Check which critical sections are missing from a parsed morgue.
 * Takes race into account - Demigods can't worship gods so missing godsWorshipped is expected.
 */
function getMissingSections(data: MorgueData): CriticalSection[] {
  const missing: CriticalSection[] = [];

  for (const section of CRITICAL_SECTIONS) {
    const value = data[section];
    
    // Skip godsWorshipped check for races that can't worship gods
    if (section === "godsWorshipped" && isGodlessRace(data.race)) {
      continue;
    }
    
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
async function runDiagnostics(
  morgueDir: string,
  verbose: boolean,
  quiet: boolean,
  minVersion: string | null
): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    totalFiles: 0,
    totalFilesDiscovered: 0,
    skippedBeforeMinVersion: 0,
    parsedSuccessfully: 0,
    parsedWithErrors: 0,
    versionLowest: null,
    versionHighest: null,
    versionsFound: new Map(),
    missingSections: new Map(),
    missingFields: new Map(),
    parseErrors: [],
    noRunesFiles: [],
    winsWithoutRunes: [],
    semanticIssues: new Map(),
    watchedSkillHashesSeen: new Set(),
    fieldsEverNonNull: new Set(),
    parsingTimeMs: 0,
  };

  for (const section of CRITICAL_SECTIONS) {
    result.missingSections.set(section, []);
  }
  for (const field of REQUIRED_FIELDS) {
    result.missingFields.set(field, []);
  }
  for (const issueType of SEMANTIC_ISSUE_TYPES) {
    result.semanticIssues.set(issueType, []);
  }

  const morgueFiles = getMorgueFiles(morgueDir);
  result.totalFilesDiscovered = morgueFiles.length;

  if (result.totalFilesDiscovered === 0) {
    if (!quiet) {
      console.log(`No morgue files found in ${morgueDir}`);
    }
    return result;
  }

  if (!quiet) {
    console.log(`Found ${result.totalFilesDiscovered} morgue files\n`);
  }

  const startTime = performance.now();

  for (const filePath of morgueFiles) {
    const fileName = path.basename(filePath);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parseResult: ParseResult = await parseMorgue(content);
      const data = parseResult.data;
      if (minVersion && data.version && compareVersions(data.version, minVersion) < 0) {
        result.skippedBeforeMinVersion++;
        if (verbose && !quiet) {
          console.log(`⏭️  ${fileName} (v${data.version}) skipped (< min version ${minVersion})`);
        }
        continue;
      }
      result.totalFiles++;
      if (data.morgueHash && SUSPICIOUS_SKILL_HASHES.has(data.morgueHash)) {
        result.watchedSkillHashesSeen.add(data.morgueHash);
      }

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
        if (verbose && !quiet) {
          console.log(`⚠️  ${fileName} (v${data.version || "unknown"}): ${data.parseErrors.length} parse error(s)`);
        }
      } else {
        result.parsedSuccessfully++;
        if (verbose && !quiet) {
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
            race: data.race,
            characterLevel: data.characterLevel,
            missingSections: missing,
          });
        }
      }

      // Check for missing required fields
      for (const field of REQUIRED_FIELDS) {
        if (data[field] === null || data[field] === undefined) {
          result.missingFields.get(field)!.push({
            file: fileName,
            version: data.version,
          });
        }
      }

      // Track which fields have been seen with non-null values
      for (const field of ALL_NULLABLE_FIELDS) {
        if (!result.fieldsEverNonNull.has(field) && data[field] !== null && data[field] !== undefined) {
          result.fieldsEverNonNull.add(field);
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

      // Wins without runes is always a bug — you need at least 3 runes to win
      if (data.isWin && (!data.runesList || data.runesList.length === 0)) {
        result.winsWithoutRunes.push({
          file: fileName,
          version: data.version,
          characterLevel: data.characterLevel,
        });
      }

      // Semantic sanity checks for parser drift and malformed values.
      const runesCount = data.runesList?.length ?? 0;
      const skillEntries = Object.entries(data.endingSkills ?? {});
      const skillCount = skillEntries.length;
      const totalSkillLevels = skillEntries.reduce((sum, [, level]) => sum + level, 0);
      const maxSkill = skillEntries.reduce((max, [, level]) => Math.max(max, level), 0);
      const skillsExcerpt = getSkillsSectionExcerpt(content);
      const shouldRunHighXlSkillChecks = (
        (data.characterLevel ?? 0) >= HIGH_XL_SKILLS_LEVEL
        || (data.morgueHash ? SUSPICIOUS_SKILL_HASHES.has(data.morgueHash) : false)
      );

      const prefixedBySpecies = startsWithKnownSpecies(data.background);
      if (prefixedBySpecies) {
        result.semanticIssues.get("background_starts_with_species")!.push({
          file: fileName,
          version: data.version,
          playerName: data.playerName,
          morgueHash: data.morgueHash,
          race: data.race,
          background: data.background,
          characterLevel: data.characterLevel,
          skillCount,
          totalSkillLevels,
          maxSkill,
          runesCount,
          severity: "error",
          detail: `Background "${data.background}" starts with species "${prefixedBySpecies}"`,
          skillsExcerpt,
        });
      }

      if (hasNonEmptyText(data.race) && !isKnownSpecies(data.race)) {
        result.semanticIssues.get("unknown_race")!.push({
          file: fileName,
          version: data.version,
          playerName: data.playerName,
          morgueHash: data.morgueHash,
          race: data.race,
          background: data.background,
          characterLevel: data.characterLevel,
          skillCount,
          totalSkillLevels,
          maxSkill,
          runesCount,
          severity: "warn",
          detail: `Unknown race "${data.race}"`,
          skillsExcerpt,
        });
      }

      if (hasNonEmptyText(data.background) && !isKnownBackground(data.background)) {
        result.semanticIssues.get("unknown_background")!.push({
          file: fileName,
          version: data.version,
          playerName: data.playerName,
          morgueHash: data.morgueHash,
          race: data.race,
          background: data.background,
          characterLevel: data.characterLevel,
          skillCount,
          totalSkillLevels,
          maxSkill,
          runesCount,
          severity: "warn",
          detail: `Unknown background "${data.background}"`,
          skillsExcerpt,
        });
      }

      if (data.endingSpells && data.endingSpells.length > 0) {
        const seenSpellNames = new Set<string>();
        for (const spell of data.endingSpells) {
          const spellNameKey = spell.name.trim().toLowerCase();
          if (!spellNameKey) {
            continue;
          }
          if (seenSpellNames.has(spellNameKey)) {
            result.semanticIssues.get("duplicate_spell_in_game")!.push({
              file: fileName,
              version: data.version,
              playerName: data.playerName,
              morgueHash: data.morgueHash,
              race: data.race,
              background: data.background,
              characterLevel: data.characterLevel,
              skillCount,
              totalSkillLevels,
              maxSkill,
              runesCount,
              severity: "warn",
              detail: `Duplicate spell in game: "${spell.name}"`,
              skillsExcerpt,
            });
            continue;
          }
          seenSpellNames.add(spellNameKey);
        }
      }

      if (data.runesList && data.runesList.length > 0) {
        for (const runeName of data.runesList) {
          if (runeName.length > MAX_RUNE_NAME_LENGTH) {
            result.semanticIssues.get("rune_name_too_long")!.push({
              file: fileName,
              version: data.version,
              playerName: data.playerName,
              morgueHash: data.morgueHash,
              race: data.race,
              background: data.background,
              characterLevel: data.characterLevel,
              skillCount,
              totalSkillLevels,
              maxSkill,
              runesCount,
              severity: "warn",
              detail: `Rune name too long (> ${MAX_RUNE_NAME_LENGTH}): "${runeName}"`,
              skillsExcerpt,
            });
          }
        }
      }

      const godNames = [
        data.endingStats?.god,
        ...(data.godsWorshipped?.map((record) => record.god) ?? []),
      ].filter(hasNonEmptyText);

      for (const godName of godNames) {
        if (godName.length > DB_TEXT_LIMITS.god_name) {
          result.semanticIssues.get("god_name_too_long")!.push({
            file: fileName,
            version: data.version,
            playerName: data.playerName,
            morgueHash: data.morgueHash,
            race: data.race,
            background: data.background,
            characterLevel: data.characterLevel,
            skillCount,
            totalSkillLevels,
            maxSkill,
            runesCount,
            severity: "error",
            detail: `God name too long (> ${DB_TEXT_LIMITS.god_name}): "${godName}"`,
            skillsExcerpt,
          });
        }
        if (!isKnownGod(godName) && !/^no god$/i.test(godName)) {
          result.semanticIssues.get("unknown_god")!.push({
            file: fileName,
            version: data.version,
            playerName: data.playerName,
            morgueHash: data.morgueHash,
            race: data.race,
            background: data.background,
            characterLevel: data.characterLevel,
            skillCount,
            totalSkillLevels,
            maxSkill,
            runesCount,
            severity: "warn",
            detail: `Unknown god "${godName}"`,
            skillsExcerpt,
          });
        }
      }

      const dbTextViolations: string[] = [];
      if ((data.playerName?.length ?? 0) > DB_TEXT_LIMITS.player_name) {
        dbTextViolations.push(`player_name (${data.playerName!.length} > ${DB_TEXT_LIMITS.player_name})`);
      }
      if ((data.title?.length ?? 0) > DB_TEXT_LIMITS.title) {
        dbTextViolations.push(`title (${data.title!.length} > ${DB_TEXT_LIMITS.title})`);
      }
      if ((data.race?.length ?? 0) > DB_TEXT_LIMITS.race_name) {
        dbTextViolations.push(`race_name (${data.race!.length} > ${DB_TEXT_LIMITS.race_name})`);
      }
      if ((data.background?.length ?? 0) > DB_TEXT_LIMITS.background_name) {
        dbTextViolations.push(
          `background_name (${data.background!.length} > ${DB_TEXT_LIMITS.background_name})`
        );
      }
      if (data.endingSkills) {
        for (const skillName of Object.keys(data.endingSkills)) {
          if (skillName.length > DB_TEXT_LIMITS.skill_name) {
            dbTextViolations.push(`skill_name "${skillName}" (${skillName.length} > ${DB_TEXT_LIMITS.skill_name})`);
          }
        }
      }
      if (data.endingSpells) {
        for (const spell of data.endingSpells) {
          if (spell.name.length > DB_TEXT_LIMITS.spell_name) {
            dbTextViolations.push(
              `spell_name "${spell.name}" (${spell.name.length} > ${DB_TEXT_LIMITS.spell_name})`
            );
          }
          for (const school of spell.schools) {
            if (school.length > DB_TEXT_LIMITS.spell_school_name) {
              dbTextViolations.push(
                `spell_school_name "${school}" (${school.length} > ${DB_TEXT_LIMITS.spell_school_name})`
              );
            }
          }
        }
      }
      if (data.branches) {
        for (const branchName of Object.keys(data.branches)) {
          if (branchName.length > DB_TEXT_LIMITS.branch_name) {
            dbTextViolations.push(
              `branch_name "${branchName}" (${branchName.length} > ${DB_TEXT_LIMITS.branch_name})`
            );
          }
        }
      }
      if (data.xpProgression) {
        for (const xp of Object.values(data.xpProgression)) {
          if ((xp.location?.length ?? 0) > DB_TEXT_LIMITS.xp_location) {
            dbTextViolations.push(
              `xp_location "${xp.location}" (${xp.location.length} > ${DB_TEXT_LIMITS.xp_location})`
            );
          }
        }
      }
      if (data.actions) {
        for (const [category, actionGroup] of Object.entries(data.actions)) {
          if (category.length > DB_TEXT_LIMITS.action_category) {
            dbTextViolations.push(
              `action_category "${category}" (${category.length} > ${DB_TEXT_LIMITS.action_category})`
            );
          }
          for (const actionName of Object.keys(actionGroup)) {
            if (actionName.length > DB_TEXT_LIMITS.action_name) {
              dbTextViolations.push(
                `action_name "${actionName}" (${actionName.length} > ${DB_TEXT_LIMITS.action_name})`
              );
            }
          }
        }
      }

      if (dbTextViolations.length > 0) {
        result.semanticIssues.get("db_text_field_too_long")!.push({
          file: fileName,
          version: data.version,
          playerName: data.playerName,
          morgueHash: data.morgueHash,
          race: data.race,
          background: data.background,
          characterLevel: data.characterLevel,
          skillCount,
          totalSkillLevels,
          maxSkill,
          runesCount,
          severity: "error",
          detail: `DB text limit violation(s): ${dbTextViolations.slice(0, 3).join("; ")}${
            dbTextViolations.length > 3 ? ` (+${dbTextViolations.length - 3} more)` : ""
          }`,
          skillsExcerpt,
        });
      }

      if (data.isWin && runesCount > 0 && runesCount < 3) {
        result.semanticIssues.get("win_with_too_few_runes")!.push({
          file: fileName,
          version: data.version,
          playerName: data.playerName,
          morgueHash: data.morgueHash,
          race: data.race,
          background: data.background,
          characterLevel: data.characterLevel,
          skillCount,
          totalSkillLevels,
          maxSkill,
          runesCount,
          severity: "error",
          detail: `Winning game has only ${runesCount} rune(s)`,
          skillsExcerpt,
        });
      }

      if (shouldRunHighXlSkillChecks) {
        if (!data.endingSkills || skillCount === 0) {
          result.semanticIssues.get("high_xl_missing_skills")!.push({
            file: fileName,
            version: data.version,
            playerName: data.playerName,
            morgueHash: data.morgueHash,
            race: data.race,
            background: data.background,
            characterLevel: data.characterLevel,
            skillCount,
            totalSkillLevels,
            maxSkill,
            runesCount,
            severity: "error",
            detail: `XL ${data.characterLevel ?? "unknown"} game has null/empty endingSkills`,
            skillsExcerpt,
          });
        } else {
          if (totalSkillLevels === 0) {
            result.semanticIssues.get("high_xl_zero_total_skills")!.push({
              file: fileName,
              version: data.version,
              playerName: data.playerName,
              morgueHash: data.morgueHash,
              race: data.race,
              background: data.background,
              characterLevel: data.characterLevel,
              skillCount,
              totalSkillLevels,
              maxSkill,
              runesCount,
              severity: "error",
              detail: `XL ${data.characterLevel ?? "unknown"} game has zero total parsed skill levels`,
              skillsExcerpt,
            });
          }

          if (skillCount <= LOW_SKILL_COUNT_THRESHOLD || totalSkillLevels < LOW_SKILL_SUM_THRESHOLD) {
            result.semanticIssues.get("high_xl_low_skills_warning")!.push({
              file: fileName,
              version: data.version,
              playerName: data.playerName,
              morgueHash: data.morgueHash,
              race: data.race,
              background: data.background,
              characterLevel: data.characterLevel,
              skillCount,
              totalSkillLevels,
              maxSkill,
              runesCount,
              severity: "warn",
              detail: `XL ${data.characterLevel ?? "unknown"} game has unusually low parsed skills (count=${skillCount}, total=${totalSkillLevels}, max=${maxSkill})`,
              skillsExcerpt,
            });
          }
        }
      }
    } catch (e) {
      result.totalFiles++;
      result.parsedWithErrors++;
      const errorMessage = e instanceof Error ? e.message : String(e);
      result.parseErrors.push({
        file: fileName,
        version: null,
        errors: [`Fatal error: ${errorMessage}`],
      });
      if (verbose && !quiet) {
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
function printResults(result: DiagnosticResult, options: ReportOptions): void {
  const hasFiles = result.totalFiles > 0;
  const successPct = hasFiles
    ? `${((result.parsedSuccessfully / result.totalFiles) * 100).toFixed(1)}%`
    : "N/A";
  const errorPct = hasFiles
    ? `${((result.parsedWithErrors / result.totalFiles) * 100).toFixed(1)}%`
    : "N/A";
  const avgMsPerFile = hasFiles
    ? `${(result.parsingTimeMs / result.totalFiles).toFixed(2)}ms/file`
    : "N/A";

  const semanticIssueLabels: Record<SemanticIssueType, string> = {
    background_starts_with_species: "Background starts with species",
    unknown_race: "Unknown race",
    unknown_background: "Unknown background",
    duplicate_spell_in_game: "Duplicate spell in game",
    rune_name_too_long: `Rune name too long (> ${MAX_RUNE_NAME_LENGTH})`,
    god_name_too_long: `God name too long (> ${DB_TEXT_LIMITS.god_name})`,
    unknown_god: "Unknown god",
    db_text_field_too_long: "DB text field too long",
    win_with_too_few_runes: "Win with < 3 runes",
    high_xl_missing_skills: `XL ${HIGH_XL_SKILLS_LEVEL}+ missing endingSkills`,
    high_xl_zero_total_skills: `XL ${HIGH_XL_SKILLS_LEVEL}+ zero total skill levels`,
    high_xl_low_skills_warning: `XL ${HIGH_XL_SKILLS_LEVEL}+ unusually low skills`,
  };

  console.log("\n" + "=".repeat(80));
  console.log("MORGUE PARSER DIAGNOSTIC REPORT");
  console.log("=".repeat(80));
  console.log(`Detail level: ${options.detail}`);

  // Summary
  console.log("\n📊 SUMMARY");
  console.log("-".repeat(40));
  console.log(`Files discovered:    ${result.totalFilesDiscovered}`);
  console.log(`Files analyzed:      ${result.totalFiles}`);
  if (options.minVersion) {
    console.log(`Min version filter:  ${options.minVersion}`);
    console.log(`Skipped by version:  ${result.skippedBeforeMinVersion}`);
  }
  console.log(`Parsed successfully: ${result.parsedSuccessfully} (${successPct})`);
  console.log(`Parsed with errors:  ${result.parsedWithErrors} (${errorPct})`);
  console.log(`Parsing time:        ${result.parsingTimeMs.toFixed(2)}ms (${avgMsPerFile})`);

  if (shouldShowSection(options, "versions")) {
    console.log("\n📦 VERSION RANGE");
    console.log("-".repeat(40));
    console.log(`Lowest version:  ${result.versionLowest || "N/A"}`);
    console.log(`Highest version: ${result.versionHighest || "N/A"}`);
    console.log(`Distinct major/minor versions: ${result.versionsFound.size}`);

    if (options.showVersionHistogram || options.detail === "full") {
      console.log("\nVersions found:");
      const sortedVersions = [...result.versionsFound.entries()].sort((a, b) => compareVersions(a[0], b[0]));
      for (const [version, count] of sortedVersions) {
        console.log(`  ${version.padEnd(8)} : ${count} file(s)`);
      }
    }
  }

  if (shouldShowSection(options, "always-null")) {
    const alwaysNullFields = ALL_NULLABLE_FIELDS.filter((f) => !result.fieldsEverNonNull.has(f));
    if (alwaysNullFields.length > 0) {
      console.log("\n🚨 ALWAYS-NULL FIELDS (potential broken extractors)");
      console.log("-".repeat(40));
      console.log(`The following fields were null in ALL ${result.totalFiles} files:`);
      for (const field of alwaysNullFields) {
        console.log(`  ❌ ${field}`);
      }
    } else {
      console.log("\n✅ No always-null fields detected — all extractors produced output.");
    }
  }

  if (shouldShowSection(options, "missing-fields")) {
    console.log("\n📋 MISSING REQUIRED FIELDS");
    console.log("-".repeat(40));
    const fieldCounts = REQUIRED_FIELDS.map((field) => ({
      field,
      files: result.missingFields.get(field) || [],
    }));
    const fieldsWithIssues = fieldCounts.filter((entry) => entry.files.length > 0);

    if (options.detail === "summary") {
      if (fieldsWithIssues.length === 0) {
        console.log("  ✅ No missing required fields.");
      } else {
        for (const { field, files } of fieldsWithIssues.sort((a, b) => b.files.length - a.files.length)) {
          console.log(`  ❌ ${field}: ${files.length} file(s) missing`);
        }
      }
    } else {
      for (const { field, files } of fieldCounts) {
        const status = files.length === 0 ? "✅" : "❌";
        console.log(`  ${status} ${field}: ${files.length} file(s) missing`);
      }

      if (fieldsWithIssues.length > 0) {
        console.log("\nDetails for fields with missing values:");
        for (const { field, files } of fieldsWithIssues) {
          console.log(`\n  ${field} (${files.length} file(s)):`);
          const byVersion = mapByVersion(files);
          const sortedVersionRows = [...byVersion.entries()].sort((a, b) => compareVersions(a[0], b[0]));
          const versionsToShow = options.detail === "full"
            ? sortedVersionRows
            : sortedVersionRows.slice(0, options.maxExamples);
          for (const [version, fileList] of versionsToShow) {
            console.log(`    ${version}: ${fileList.length} file(s)`);
            for (const info of fileList.slice(0, options.maxExamples)) {
              console.log(`      - ${info.file}`);
            }
            if (fileList.length > options.maxExamples) {
              console.log(`      ... and ${fileList.length - options.maxExamples} more`);
            }
          }
          if (sortedVersionRows.length > versionsToShow.length) {
            console.log(`    ... and ${sortedVersionRows.length - versionsToShow.length} more version bucket(s)`);
          }
        }
      }
    }
  }

  if (shouldShowSection(options, "missing-sections")) {
    console.log("\n🔍 MISSING CRITICAL SECTIONS");
    console.log("-".repeat(40));
    const sectionCounts = CRITICAL_SECTIONS.map((section) => ({
      section,
      files: result.missingSections.get(section) || [],
    }));
    const sectionsWithIssues = sectionCounts.filter((entry) => entry.files.length > 0);

    if (options.detail === "summary") {
      if (sectionsWithIssues.length === 0) {
        console.log("  ✅ No missing critical sections.");
      } else {
        for (const { section, files } of sectionsWithIssues.sort((a, b) => b.files.length - a.files.length)) {
          console.log(`  ❌ ${section}: ${files.length} file(s) missing`);
        }
      }
    } else {
      for (const { section, files } of sectionCounts) {
        console.log(`\n${section}: ${files.length} file(s) missing`);
        if (files.length === 0) {
          continue;
        }
        const byVersion = mapByVersion(files);
        const sortedVersionRows = [...byVersion.entries()].sort((a, b) => compareVersions(a[0], b[0]));
        const versionsToShow = options.detail === "full"
          ? sortedVersionRows
          : sortedVersionRows.slice(0, options.maxExamples);
        console.log("  By version:");
        for (const [version, fileList] of versionsToShow) {
          console.log(`    ${version}: ${fileList.length} file(s)`);
          for (const info of fileList.slice(0, options.maxExamples)) {
            const levelStr = info.characterLevel !== null ? `, XL ${info.characterLevel}` : "";
            console.log(`      - ${info.file}${levelStr}`);
          }
          if (fileList.length > options.maxExamples) {
            console.log(`      ... and ${fileList.length - options.maxExamples} more`);
          }
        }
        if (sortedVersionRows.length > versionsToShow.length) {
          console.log(`    ... and ${sortedVersionRows.length - versionsToShow.length} more version bucket(s)`);
        }
      }
    }
  }

  if (shouldShowSection(options, "runes")) {
    if (result.winsWithoutRunes.length > 0) {
      console.log("\n🚨 WINS WITHOUT RUNES (parsing error — need at least 3 runes to win)");
      console.log("-".repeat(40));
      console.log(`Total: ${result.winsWithoutRunes.length} file(s)`);
      for (const f of result.winsWithoutRunes.slice(0, options.maxExamples)) {
        const levelStr = f.characterLevel !== null ? `, XL ${f.characterLevel}` : "";
        console.log(`  ❌ ${f.file} (v${f.version || "unknown"}${levelStr})`);
      }
      if (result.winsWithoutRunes.length > options.maxExamples) {
        console.log(`  ... and ${result.winsWithoutRunes.length - options.maxExamples} more`);
      }
    } else {
      console.log("\n✅ No wins without runes — all winning games have rune data.");
    }

    console.log("\n🔮 GAMES WITH NO RUNES");
    console.log("-".repeat(40));
    console.log(`Total: ${result.noRunesFiles.length} file(s)`);
    if (result.noRunesFiles.length > 0) {
      const lowLevel = result.noRunesFiles.filter((f) => f.characterLevel !== null && f.characterLevel < 14);
      const highLevel = result.noRunesFiles.filter((f) => f.characterLevel !== null && f.characterLevel >= 14);
      const unknownLevel = result.noRunesFiles.filter((f) => f.characterLevel === null);

      console.log(`  XL 1-13 (likely legitimate): ${lowLevel.length}`);
      console.log(`  XL 14+ (watch list):         ${highLevel.length}`);
      if (unknownLevel.length > 0) {
        console.log(`  Unknown XL:                  ${unknownLevel.length}`);
      }

      if (options.detail !== "summary" && highLevel.length > 0) {
        console.log(`\nHigh level (XL 14+) deaths without runes:`);
        for (const f of highLevel.slice(0, options.maxExamples)) {
          console.log(`  - ${f.file} (v${f.version || "unknown"}, XL ${f.characterLevel})`);
        }
        if (highLevel.length > options.maxExamples) {
          console.log(`  ... and ${highLevel.length - options.maxExamples} more`);
        }
      }
    }
  }

  if (shouldShowSection(options, "parse-errors")) {
    console.log("\n❌ PARSE ERRORS");
    console.log("-".repeat(40));
    console.log(`Total files with errors: ${result.parseErrors.length}`);

    if (result.parseErrors.length > 0) {
      const errorTypes = new Map<string, { count: number; files: { file: string; version: string | null }[] }>();
      for (const info of result.parseErrors) {
        for (const error of info.errors) {
          const errorType = error.split(":")[0] || "unknown";
          if (!errorTypes.has(errorType)) {
            errorTypes.set(errorType, { count: 0, files: [] });
          }
          const entry = errorTypes.get(errorType)!;
          entry.count++;
          if (entry.files.length < options.maxExamples) {
            entry.files.push({ file: info.file, version: info.version });
          }
        }
      }

      console.log("\nErrors by type:");
      for (const [errorType, data] of [...errorTypes.entries()].sort((a, b) => b[1].count - a[1].count)) {
        console.log(`  ${errorType}: ${data.count} occurrence(s)`);
      }

      if (options.detail !== "summary") {
        console.log("\nDetailed error examples:");
        for (const info of result.parseErrors.slice(0, options.maxExamples)) {
          console.log(`\n  📄 ${info.file} (v${info.version || "unknown"}):`);
          for (const error of info.errors.slice(0, options.maxExamples)) {
            console.log(`     • ${error}`);
          }
          if (info.errors.length > options.maxExamples) {
            console.log(`     ... and ${info.errors.length - options.maxExamples} more`);
          }
        }
      }
    }
  }

  if (shouldShowSection(options, "semantic")) {
    console.log("\n🧪 SEMANTIC VALIDATION");
    console.log("-".repeat(40));
    const semanticCounts = SEMANTIC_ISSUE_TYPES.map((issueType) => ({
      issueType,
      issues: result.semanticIssues.get(issueType) || [],
    }));

    for (const { issueType, issues } of semanticCounts) {
      if (options.detail === "summary" && issues.length === 0) {
        continue;
      }
      const status = issues.length === 0 ? "✅" : "❌";
      console.log(`  ${status} ${semanticIssueLabels[issueType]}: ${issues.length} file(s)`);
    }

    if (options.detail === "summary") {
      const overlapCount = countBackgroundSpeciesCluster(result);
      if (overlapCount > 0) {
        console.log(`  ℹ️  Co-occurring species-prefix/unknown taxonomy cluster: ${overlapCount} file(s)`);
      }
    } else {
      for (const { issues } of semanticCounts) {
        if (issues.length === 0) {
          continue;
        }
        const prioritized = prioritizeWatchlistIssues(issues);
        for (const issue of prioritized.slice(0, options.maxExamples)) {
          const version = issue.version || "unknown";
          const severityIcon = issue.severity === "error" ? "❌" : "⚠️";
          const hashPart = issue.morgueHash ? `, hash=${issue.morgueHash}` : "";
          const playerPart = issue.playerName ? `, player=${issue.playerName}` : "";
          console.log(`    ${severityIcon} ${issue.file} (v${version}${playerPart}${hashPart}) — ${issue.detail}`);
          if (options.includeSkillsExcerpts) {
            if (issue.skillsExcerpt) {
              const preview = issue.skillsExcerpt
                .split("\n")
                .map((line) => `      ${line}`)
                .join("\n");
              console.log("      Skills excerpt:");
              console.log(preview);
            } else {
              console.log("      Skills excerpt: <not found>");
            }
          }
        }
        if (issues.length > options.maxExamples) {
          console.log(`    ... and ${issues.length - options.maxExamples} more`);
        }
      }
    }
  }

  if (shouldShowSection(options, "watchlist")) {
    console.log("\n🎯 WATCHLIST SKILL HASHES");
    console.log("-".repeat(40));
    console.log(`Configured: ${SUSPICIOUS_SKILL_HASHES.size}`);
    console.log(`Seen in corpus: ${result.watchedSkillHashesSeen.size}`);
    const missingWatchlist = [...SUSPICIOUS_SKILL_HASHES].filter(
      (hash) => !result.watchedSkillHashesSeen.has(hash)
    );
    if (missingWatchlist.length === 0) {
      console.log("✅ All watchlist hashes were observed in this run.");
    } else {
      console.log(`⚠️ Missing watchlist hashes: ${missingWatchlist.length}`);
      for (const hash of missingWatchlist.slice(0, options.maxExamples)) {
        console.log(`  - ${hash}`);
      }
      if (missingWatchlist.length > options.maxExamples) {
        console.log(`  ... and ${missingWatchlist.length - options.maxExamples} more`);
      }
    }
  }

  if (shouldShowSection(options, "tips")) {
    console.log("\n" + "=".repeat(80));
    console.log("💡 INVESTIGATION TIPS");
    console.log("=".repeat(80));
    console.log("Use targeted follow-ups for deeper investigation:");
    console.log("  pnpm diagnose:morgue --detail standard --only semantic --max-examples 10");
    console.log("  pnpm diagnose:morgue --detail full --show-version-histogram --include-skills-excerpts");
    console.log("  pnpm diagnose:morgue --format json --out diagnose.json");
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose") || args.includes("-v");
  const helpRequested = args.includes("--help") || args.includes("-h");
  const includeSkillsExcerpts = args.includes("--include-skills-excerpts");
  const showVersionHistogram = args.includes("--show-version-histogram");
  const minVersionRaw = getArgValue(args, ["--min-version"]);
  const hashIndex = args.findIndex((a) => a === "--hash");
  const hashToInspect = hashIndex >= 0 ? args[hashIndex + 1] : undefined;
  const detailRaw = getArgValue(args, ["--detail"]);
  const maxExamplesRaw = getArgValue(args, ["--max-examples"]);
  const onlyRaw = getArgValue(args, ["--only"]);
  const formatRaw = getArgValue(args, ["--format"]);
  const outRaw = getArgValue(args, ["--out"]);

  // Get custom directory if provided
  const dirIndex = args.findIndex((a) => a === "--dir" || a === "-d");
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const morgueDir = dirIndex >= 0 && args[dirIndex + 1]
    ? path.resolve(args[dirIndex + 1])
    : path.resolve(scriptDir, DEFAULT_MORGUE_DIR);

  if (helpRequested) {
    console.log(`
Morgue Parser Diagnostic Tool

Usage: pnpm diagnose [options]

Options:
  -v, --verbose    Show per-file parsing results
  -d, --dir <path> Path to morgue files directory (default: ../streak-downloader/outputs)
  --detail <level> Output detail level: summary|standard|full (default: summary)
  --max-examples <n> Max examples per section (default: 3)
  --only <list>    Comma-separated sections: versions,always-null,missing-fields,
                   missing-sections,runes,parse-errors,semantic,watchlist,tips
  --format <fmt>   Output format: text|json (default: text)
  --out <path>     Write JSON report to file
  --min-version <v> Skip morgues with parsed version lower than v (e.g. 0.20)
  --show-version-histogram  Print full per-version histogram
  --include-skills-excerpts Include skills excerpts in semantic issue details
  --hash <hash>    Inspect one morgue hash classification and exit
  -h, --help       Show this help message

Examples:
  pnpm diagnose
  pnpm diagnose --detail standard --only semantic --max-examples 10
  pnpm diagnose --min-version 0.20
  pnpm diagnose --detail full --show-version-histogram --include-skills-excerpts
  pnpm diagnose --format json --out diagnose.json
`);
    return;
  }

  if (!fs.existsSync(morgueDir)) {
    console.error(`Error: Directory does not exist: ${morgueDir}`);
    process.exit(1);
  }

  const detail: DetailLevel = detailRaw
    ? (detailRaw as DetailLevel)
    : "summary";
  if (!DETAIL_LEVELS.includes(detail)) {
    console.error(`Error: Invalid --detail value "${detailRaw}". Expected one of: ${DETAIL_LEVELS.join(", ")}`);
    process.exit(1);
  }

  const format: OutputFormat = formatRaw
    ? (formatRaw as OutputFormat)
    : "text";
  if (!OUTPUT_FORMATS.includes(format)) {
    console.error(`Error: Invalid --format value "${formatRaw}". Expected one of: ${OUTPUT_FORMATS.join(", ")}`);
    process.exit(1);
  }

  let maxExamples = 3;
  if (maxExamplesRaw !== undefined) {
    const parsed = Number.parseInt(maxExamplesRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      console.error(`Error: Invalid --max-examples value "${maxExamplesRaw}". Expected integer >= 1.`);
      process.exit(1);
    }
    maxExamples = parsed;
  }

  const minVersion = minVersionRaw?.trim() || null;
  if (minVersion !== null && !/^\d+\.\d+([-.].*)?$/.test(minVersion)) {
    console.error(`Error: Invalid --min-version value "${minVersionRaw}".`);
    console.error("Expected format like 0.20 or 0.35-a0.");
    process.exit(1);
  }

  let onlySections: Set<ReportSection> | null = null;
  if (onlyRaw) {
    const parsedSections = parseListArg(onlyRaw);
    const invalidSections = parsedSections.filter((s) => !REPORT_SECTIONS.includes(s as ReportSection));
    if (invalidSections.length > 0) {
      console.error(`Error: Invalid --only section(s): ${invalidSections.join(", ")}`);
      console.error(`Valid sections: ${REPORT_SECTIONS.join(", ")}`);
      process.exit(1);
    }
    onlySections = new Set(parsedSections as ReportSection[]);
  }

  if (hashIndex >= 0 && (!hashToInspect || hashToInspect.startsWith("-"))) {
    console.error("Error: --hash requires a hash value");
    console.error("Usage: pnpm diagnose --hash <hash> [--dir <path>]");
    process.exit(1);
  }

  if (hashToInspect) {
    await inspectHash(morgueDir, hashToInspect);
    return;
  }

  const options: ReportOptions = {
    detail,
    maxExamples,
    includeSkillsExcerpts,
    showVersionHistogram,
    onlySections,
    format,
    outPath: outRaw ? path.resolve(outRaw) : null,
    minVersion,
  };

  const quiet = format === "json";
  if (!quiet) {
    console.log(`Parsing morgue files from: ${morgueDir}\n`);
  }

  const result = await runDiagnostics(morgueDir, verbose, quiet, minVersion);

  const jsonReport = JSON.stringify(toJsonReport(result), null, 2);
  if (options.outPath) {
    fs.writeFileSync(options.outPath, jsonReport + "\n", "utf-8");
    if (format === "text") {
      console.log(`\nSaved JSON report to: ${options.outPath}`);
    }
  }

  if (format === "json") {
    if (!options.outPath) {
      console.log(jsonReport);
    }
    return;
  }

  printResults(result, options);
}

main().catch((e) => {
  console.error("Fatal error:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
