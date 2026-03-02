#!/usr/bin/env tsx
/**
 * Morgue CSV Generator Script
 *
 * Parses morgue files from a directory and generates CSV files for bulk loading
 * into PostgreSQL using the COPY command.
 *
 * Usage:
 *   pnpm generate:morgue-csv /path/to/morgue/directory /path/to/output/directory
 *
 * Then load with:
 *   psql -d crawl_crawler -c "\copy games FROM 'games.csv' WITH (FORMAT csv, HEADER true)"
 *   ... (repeat for each table)
 */

import { readFileSync, readdirSync, statSync, existsSync, createReadStream, createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { parseMorgue, type MorgueData } from 'dcss-morgue-parser';
import {
  getSpeciesCode,
  getBackgroundCode,
  normalizeSpeciesName,
  parseVersion as parseVersionUtil,
  PORTAL_BRANCHES,
} from 'dcss-game-data';

// ============================================
// URL Mapping
// ============================================

const URL_MAPPING_FILENAME = 'url_mapping.csv';

async function loadUrlMapping(directory: string): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();
  const csvPath = join(directory, URL_MAPPING_FILENAME);
  
  if (!existsSync(csvPath)) {
    console.log(`No URL mapping file found at ${csvPath}`);
    return mapping;
  }
  
  const fileStream = createReadStream(csvPath, 'utf-8');
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  
  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    
    const firstComma = line.indexOf(',');
    if (firstComma > 0) {
      const filename = line.substring(0, firstComma);
      const url = line.substring(firstComma + 1);
      mapping.set(filename, url);
    }
  }
  
  console.log(`Loaded ${mapping.size} URL mappings from ${csvPath}`);
  return mapping;
}

// ============================================
// Helper functions
// ============================================

const getRaceCode = getSpeciesCode;
const normalizeRace = normalizeSpeciesName;

function parseVersion(version: string): { major: number | null; minor: number | null; isTrunk: boolean } {
  const parsed = parseVersionUtil(version);
  return {
    major: parsed.major,
    minor: parsed.minor,
    isTrunk: parsed.isTrunk,
  };
}

function parseFailurePercent(failure: string): number | null {
  const match = /(\d+)%/.exec(failure);
  return match ? parseInt(match[1]!, 10) : null;
}

function getIsWin(data: MorgueData): boolean {
  if (data.isWin !== null) {
    return data.isWin;
  }
  return false;
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]!;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

// ============================================
// CSV escaping
// ============================================

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

function csvRow(...values: unknown[]): string {
  return values.map(escapeCsvValue).join(',') + '\n';
}

// ============================================
// Lookup table ID generators (local, no DB)
// ============================================

class IdGenerator {
  private nextId = 1;
  private map = new Map<string, number>();

  getOrCreate(key: string): number {
    const existing = this.map.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const id = this.nextId++;
    this.map.set(key, id);
    return id;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  entries(): IterableIterator<[string, number]> {
    return this.map.entries();
  }

  size(): number {
    return this.map.size;
  }
}

// ============================================
// CSV Writers
// ============================================

interface CsvWriters {
  // Lookup tables
  races: ReturnType<typeof createWriteStream>;
  backgrounds: ReturnType<typeof createWriteStream>;
  gods: ReturnType<typeof createWriteStream>;
  skills: ReturnType<typeof createWriteStream>;
  spells: ReturnType<typeof createWriteStream>;
  spellSchools: ReturnType<typeof createWriteStream>;
  spellSchoolMapping: ReturnType<typeof createWriteStream>;
  branches: ReturnType<typeof createWriteStream>;
  runes: ReturnType<typeof createWriteStream>;
  gameVersions: ReturnType<typeof createWriteStream>;
  
  // Main table
  games: ReturnType<typeof createWriteStream>;
  
  // Detail tables
  gameRunes: ReturnType<typeof createWriteStream>;
  gameGods: ReturnType<typeof createWriteStream>;
  gameSkills: ReturnType<typeof createWriteStream>;
  gameSkillProgression: ReturnType<typeof createWriteStream>;
  gameSpells: ReturnType<typeof createWriteStream>;
  gameBranches: ReturnType<typeof createWriteStream>;
  gameXpProgression: ReturnType<typeof createWriteStream>;
  gameActions: ReturnType<typeof createWriteStream>;
  gameEquipment: ReturnType<typeof createWriteStream>;
  parsedMorgueJson: ReturnType<typeof createWriteStream>;
}

function createWriters(outputDir: string): CsvWriters {
  return {
    races: createWriteStream(join(outputDir, 'races.csv')),
    backgrounds: createWriteStream(join(outputDir, 'backgrounds.csv')),
    gods: createWriteStream(join(outputDir, 'gods.csv')),
    skills: createWriteStream(join(outputDir, 'skills.csv')),
    spells: createWriteStream(join(outputDir, 'spells.csv')),
    spellSchools: createWriteStream(join(outputDir, 'spell_schools.csv')),
    spellSchoolMapping: createWriteStream(join(outputDir, 'spell_school_mapping.csv')),
    branches: createWriteStream(join(outputDir, 'branches.csv')),
    runes: createWriteStream(join(outputDir, 'runes.csv')),
    gameVersions: createWriteStream(join(outputDir, 'game_versions.csv')),
    games: createWriteStream(join(outputDir, 'games.csv')),
    gameRunes: createWriteStream(join(outputDir, 'game_runes.csv')),
    gameGods: createWriteStream(join(outputDir, 'game_gods.csv')),
    gameSkills: createWriteStream(join(outputDir, 'game_skills.csv')),
    gameSkillProgression: createWriteStream(join(outputDir, 'game_skill_progression.csv')),
    gameSpells: createWriteStream(join(outputDir, 'game_spells.csv')),
    gameBranches: createWriteStream(join(outputDir, 'game_branches.csv')),
    gameXpProgression: createWriteStream(join(outputDir, 'game_xp_progression.csv')),
    gameActions: createWriteStream(join(outputDir, 'game_actions.csv')),
    gameEquipment: createWriteStream(join(outputDir, 'game_equipment.csv')),
    parsedMorgueJson: createWriteStream(join(outputDir, 'parsed_morgue_json.csv')),
  };
}

function writeHeaders(writers: CsvWriters): void {
  // Lookup tables
  writers.races.write('id,code,name,is_removed\n');
  writers.backgrounds.write('id,code,name,is_removed\n');
  writers.gods.write('id,name,is_removed\n');
  writers.skills.write('id,name\n');
  writers.spells.write('id,name,level,is_removed\n');
  writers.spellSchools.write('id,name\n');
  writers.spellSchoolMapping.write('spell_id,school_id\n');
  writers.branches.write('id,name,is_portal\n');
  writers.runes.write('id,name\n');
  writers.gameVersions.write('id,version,major,minor,is_trunk\n');
  
  // Main table
  writers.games.write('id,morgue_filename,player_name,score,version_id,race_id,background_id,character_level,title,is_win,end_date,start_date,game_duration_seconds,total_turns,runes_count,gems_count,god_id,piety,hp_max,mp_max,ac,ev,sh,str,int,dex,gold,branches_visited,levels_seen,is_webtiles,game_seed,parser_version,morgue_hash,source_url,draconian_color\n');
  
  // Detail tables
  writers.gameRunes.write('game_id,rune_id\n');
  writers.gameGods.write('id,game_id,god_id,started_turn,started_location,ended_turn,worship_order\n');
  writers.gameSkills.write('game_id,skill_id,level\n');
  writers.gameSkillProgression.write('game_id,skill_id,xl,skill_level\n');
  writers.gameSpells.write('game_id,spell_id,slot,failure_percent\n');
  writers.gameBranches.write('game_id,branch_id,levels_seen,levels_total,first_entry_turn\n');
  writers.gameXpProgression.write('game_id,xl,turn,location\n');
  writers.gameActions.write('game_id,category,action_name,total_count,counts_by_xl\n');
  writers.gameEquipment.write('game_id,slot,item_text\n');
  writers.parsedMorgueJson.write('morgue_hash,parsed_json\n');
}

function closeWriters(writers: CsvWriters): Promise<void[]> {
  return Promise.all(Object.values(writers).map(w => new Promise<void>((resolve, reject) => {
    w.end((err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  })));
}

// ============================================
// Main generator
// ============================================

// Error types for tracking parsing/data issues
interface DataError {
  filename: string;
  field: string;
  value: string;
  reason: string;
}

interface GeneratorState {
  // ID generators for lookup tables
  raceIds: IdGenerator;
  backgroundIds: IdGenerator;
  godIds: IdGenerator;
  skillIds: IdGenerator;
  spellIds: IdGenerator;
  schoolIds: IdGenerator;
  branchIds: IdGenerator;
  runeIds: IdGenerator;
  versionIds: IdGenerator;
  
  // Track codes we've used (to avoid duplicate code constraint violations)
  usedRaceCodes: Set<string>;
  usedBackgroundCodes: Set<string>;
  
  // Track spell-school mappings we've written (to avoid duplicates)
  spellSchoolMappings: Set<string>;
  
  // Track morgue hashes we've seen (for deduplication)
  seenHashes: Set<string>;
  seenFilenames: Set<string>;
  
  // Auto-incrementing IDs
  nextGameId: number;
  nextGameGodId: number;
  
  // Writers
  writers: CsvWriters;
  
  // Error tracking
  dataErrors: DataError[];
  currentFilename: string;
}

function createState(writers: CsvWriters): GeneratorState {
  return {
    raceIds: new IdGenerator(),
    backgroundIds: new IdGenerator(),
    godIds: new IdGenerator(),
    skillIds: new IdGenerator(),
    spellIds: new IdGenerator(),
    schoolIds: new IdGenerator(),
    branchIds: new IdGenerator(),
    runeIds: new IdGenerator(),
    versionIds: new IdGenerator(),
    usedRaceCodes: new Set(),
    usedBackgroundCodes: new Set(),
    spellSchoolMappings: new Set(),
    seenHashes: new Set(),
    seenFilenames: new Set(),
    nextGameId: 1,
    nextGameGodId: 1,
    writers,
    dataErrors: [],
    currentFilename: '',
  };
}

function recordError(state: GeneratorState, field: string, value: string, reason: string): void {
  state.dataErrors.push({
    filename: state.currentFilename,
    field,
    value: value.length > 200 ? value.substring(0, 200) + '...' : value,
    reason,
  });
}

function getOrCreateRace(state: GeneratorState, name: string): number {
  const normalizedName = normalizeRace(name);
  
  if (!state.raceIds.has(normalizedName)) {
    const id = state.raceIds.getOrCreate(normalizedName);
    let code = getRaceCode(name);
    
    // Ensure unique code - append number if already used
    let attempt = 0;
    const baseCode = code;
    while (state.usedRaceCodes.has(code)) {
      attempt++;
      code = baseCode + attempt;
    }
    state.usedRaceCodes.add(code);
    
    state.writers.races.write(csvRow(id, code, normalizedName, false));
  }
  
  return state.raceIds.getOrCreate(normalizedName);
}

function getOrCreateBackground(state: GeneratorState, name: string): number {
  if (!state.backgroundIds.has(name)) {
    const id = state.backgroundIds.getOrCreate(name);
    let code = getBackgroundCode(name);
    
    // Ensure unique code - append number if already used
    let attempt = 0;
    const baseCode = code;
    while (state.usedBackgroundCodes.has(code)) {
      attempt++;
      code = baseCode + attempt;
    }
    state.usedBackgroundCodes.add(code);
    
    state.writers.backgrounds.write(csvRow(id, code, name, false));
  }
  
  return state.backgroundIds.getOrCreate(name);
}

function getOrCreateGod(state: GeneratorState, name: string): number {
  if (!state.godIds.has(name)) {
    const id = state.godIds.getOrCreate(name);
    state.writers.gods.write(csvRow(id, name, false));
  }
  
  return state.godIds.getOrCreate(name);
}

function getOrCreateSkill(state: GeneratorState, name: string): number {
  if (!state.skillIds.has(name)) {
    const id = state.skillIds.getOrCreate(name);
    state.writers.skills.write(csvRow(id, name));
  }
  
  return state.skillIds.getOrCreate(name);
}

function getOrCreateSpell(state: GeneratorState, name: string, level: number | null): number {
  if (!state.spellIds.has(name)) {
    const id = state.spellIds.getOrCreate(name);
    state.writers.spells.write(csvRow(id, name, level, false));
  }
  
  return state.spellIds.getOrCreate(name);
}

function getOrCreateSchool(state: GeneratorState, name: string): number {
  if (!state.schoolIds.has(name)) {
    const id = state.schoolIds.getOrCreate(name);
    state.writers.spellSchools.write(csvRow(id, name));
  }
  
  return state.schoolIds.getOrCreate(name);
}

function getOrCreateBranch(state: GeneratorState, name: string): number {
  if (!state.branchIds.has(name)) {
    const id = state.branchIds.getOrCreate(name);
    const isPortal = PORTAL_BRANCHES.includes(name);
    state.writers.branches.write(csvRow(id, name, isPortal));
  }
  
  return state.branchIds.getOrCreate(name);
}

function getOrCreateRune(state: GeneratorState, name: string): number | null {
  // Validate rune name - should be short (max ~30 chars for names like "slimy" or "serpentine")
  // Skip obviously corrupted data
  if (!name) {
    recordError(state, 'rune', '', 'Empty rune name');
    return null;
  }
  if (name.length > 50) {
    recordError(state, 'rune', name, 'Rune name too long (>50 chars)');
    return null;
  }
  if (name.includes('Level') || name.includes(':')) {
    recordError(state, 'rune', name, 'Rune name contains invalid characters (likely corrupted data)');
    return null;
  }
  
  if (!state.runeIds.has(name)) {
    const id = state.runeIds.getOrCreate(name);
    state.writers.runes.write(csvRow(id, name));
  }
  
  return state.runeIds.getOrCreate(name);
}

function getOrCreateVersion(state: GeneratorState, version: string): number {
  if (!state.versionIds.has(version)) {
    const id = state.versionIds.getOrCreate(version);
    const { major, minor, isTrunk } = parseVersion(version);
    state.writers.gameVersions.write(csvRow(id, version, major, minor, isTrunk));
  }
  
  return state.versionIds.getOrCreate(version);
}

function processMorgue(state: GeneratorState, data: MorgueData, filename: string): boolean {
  // Set current filename for error tracking
  state.currentFilename = filename;
  
  // Check for duplicates
  if (state.seenFilenames.has(filename)) {
    return false;
  }
  
  if (data.morgueHash && state.seenHashes.has(data.morgueHash)) {
    return false;
  }
  
  // Mark as seen
  state.seenFilenames.add(filename);
  if (data.morgueHash) {
    state.seenHashes.add(data.morgueHash);
  }
  
  const gameId = state.nextGameId++;
  
  // Get lookup IDs
  const raceId = data.race ? getOrCreateRace(state, data.race) : null;
  const backgroundId = data.background ? getOrCreateBackground(state, data.background) : null;
  const godId = data.endingStats?.god ? getOrCreateGod(state, data.endingStats.god) : null;
  const versionId = data.version ? getOrCreateVersion(state, data.version) : null;
  
  const draconianColor = (data.speciesData?.color as string | undefined) ?? null;

  // Write main game record
  state.writers.games.write(csvRow(
    gameId,
    filename,
    data.playerName,
    data.score,
    versionId,
    raceId,
    backgroundId,
    data.characterLevel,
    data.title,
    getIsWin(data),
    parseDate(data.endDate),
    parseDate(data.startDate),
    data.gameDurationSeconds,
    data.totalTurns,
    data.runesList?.length ?? 0,
    data.gemsList?.length ?? 0,
    godId,
    data.endingStats?.piety,
    data.endingStats?.hpMax,
    data.endingStats?.mpMax,
    data.endingStats?.ac,
    data.endingStats?.ev,
    data.endingStats?.sh,
    data.endingStats?.str,
    data.endingStats?.int,
    data.endingStats?.dex,
    data.endingStats?.gold,
    data.branchesVisitedCount,
    data.levelsSeenCount,
    data.isWebtiles,
    data.gameSeed,
    data.parserVersion,
    data.morgueHash,
    data.sourceUrl,
    draconianColor,
  ));
  
  // Write runes
  if (data.runesList) {
    for (const runeName of data.runesList) {
      const runeId = getOrCreateRune(state, runeName);
      if (runeId !== null) {
        state.writers.gameRunes.write(csvRow(gameId, runeId));
      }
    }
  }
  
  // Write gods worshipped
  if (data.godsWorshipped) {
    for (let i = 0; i < data.godsWorshipped.length; i++) {
      const godRecord = data.godsWorshipped[i]!;
      const worshippedGodId = getOrCreateGod(state, godRecord.god);
      const gameGodId = state.nextGameGodId++;
      state.writers.gameGods.write(csvRow(
        gameGodId,
        gameId,
        worshippedGodId,
        godRecord.startedTurn,
        godRecord.startedLocation,
        godRecord.endedTurn,
        i + 1
      ));
    }
  }
  
  // Write final skills
  if (data.endingSkills) {
    for (const [skillName, level] of Object.entries(data.endingSkills)) {
      const skillId = getOrCreateSkill(state, skillName);
      state.writers.gameSkills.write(csvRow(gameId, skillId, level));
    }
  }
  
  // Write skill progression
  if (data.skillsByXl) {
    for (const [skillName, progression] of Object.entries(data.skillsByXl)) {
      const skillId = getOrCreateSkill(state, skillName);
      for (const [xlStr, level] of Object.entries(progression)) {
        const xl = parseInt(xlStr, 10);
        if (!isNaN(xl)) {
          state.writers.gameSkillProgression.write(csvRow(gameId, skillId, xl, level));
        }
      }
    }
  }
  
  // Write spells (deduplicate by spell name within this game)
  if (data.endingSpells) {
    const seenSpellIds = new Set<number>();
    for (const spell of data.endingSpells) {
      const spellId = getOrCreateSpell(state, spell.name, spell.level);
      
      // Write spell-school mappings (only once per spell-school pair)
      for (const school of spell.schools) {
        const schoolId = getOrCreateSchool(state, school);
        const mappingKey = `${spellId}-${schoolId}`;
        if (!state.spellSchoolMappings.has(mappingKey)) {
          state.spellSchoolMappings.add(mappingKey);
          state.writers.spellSchoolMapping.write(csvRow(spellId, schoolId));
        }
      }
      
      // Skip duplicate spells within the same game
      if (seenSpellIds.has(spellId)) {
        recordError(state, 'spell', spell.name, 'Duplicate spell in game');
        continue;
      }
      seenSpellIds.add(spellId);
      
      state.writers.gameSpells.write(csvRow(
        gameId,
        spellId,
        spell.slot,
        parseFailurePercent(spell.failure)
      ));
    }
  }
  
  // Write branches
  if (data.branches) {
    for (const [branchName, info] of Object.entries(data.branches)) {
      const branchId = getOrCreateBranch(state, branchName);
      state.writers.gameBranches.write(csvRow(
        gameId,
        branchId,
        info.levelsSeen,
        info.levelsTotal,
        info.firstEntryTurn
      ));
    }
  }
  
  // Write XP progression
  if (data.xpProgression) {
    for (const [xlStr, info] of Object.entries(data.xpProgression)) {
      const xl = parseInt(xlStr, 10);
      if (!isNaN(xl)) {
        state.writers.gameXpProgression.write(csvRow(gameId, xl, info.turn, info.location));
      }
    }
  }
  
  // Write actions
  if (data.actions) {
    for (const [category, actions] of Object.entries(data.actions)) {
      for (const [actionName, counts] of Object.entries(actions)) {
        const total = counts.total ?? 0;
        const countsByXl = { ...counts };
        delete (countsByXl as Record<string, unknown>).total;
        
        state.writers.gameActions.write(csvRow(
          gameId,
          category,
          actionName,
          total,
          JSON.stringify(countsByXl)
        ));
      }
    }
  }
  
  // Write equipment
  if (data.equipment) {
    const scalarSlots = ['weapon', 'bodyArmour', 'shield', 'helmet', 'cloak', 'gloves', 'boots', 'amulet'] as const;
    for (const slot of scalarSlots) {
      const item = data.equipment[slot];
      if (item) {
        state.writers.gameEquipment.write(csvRow(gameId, slot, item));
      }
    }
    for (let i = 0; i < data.equipment.rings.length; i++) {
      state.writers.gameEquipment.write(csvRow(gameId, `ring_${i}`, data.equipment.rings[i]));
    }
  }
  
  // Write parsed JSON
  if (data.morgueHash) {
    state.writers.parsedMorgueJson.write(csvRow(data.morgueHash, JSON.stringify(data)));
  }
  
  return true;
}

// ============================================
// CLI
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: pnpm generate:morgue-csv <morgue-directory> <output-directory>');
    console.error('Example: pnpm generate:morgue-csv scripts/streak-downloader/outputs ./csv-output');
    process.exit(1);
  }

  const inputDir = args[0]!;
  const outputDir = args[1]!;
  
  if (!existsSync(inputDir)) {
    console.error(`Directory not found: ${inputDir}`);
    process.exit(1);
  }

  const stat = statSync(inputDir);
  if (!stat.isDirectory()) {
    console.error(`Not a directory: ${inputDir}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Find all .txt files (excluding the URL mapping CSV)
  const files = readdirSync(inputDir).filter(f => f.endsWith('.txt') && f !== URL_MAPPING_FILENAME);
  console.log(`Found ${files.length} morgue files to process`);

  // Load URL mapping
  const urlMapping = await loadUrlMapping(inputDir);

  // Create writers and state
  const writers = createWriters(outputDir);
  writeHeaders(writers);
  const state = createState(writers);
  
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const filePath = join(inputDir, file);
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const sourceUrl = urlMapping.get(file);
      const result = await parseMorgue(content, { sourceUrl });
      
      if (!result.data.playerName) {
        skipped++;
        continue;
      }

      const success = processMorgue(state, result.data, file);
      
      if (success) {
        processed++;
        if ((processed % 1000) === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = processed / elapsed;
          console.log(`  Processed ${processed}/${files.length} (${rate.toFixed(0)}/sec)`);
        }
      } else {
        skipped++;
      }
    } catch (error) {
      failed++;
      if (failed <= 10) {
        console.error(`  Failed to parse ${file}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  // Close all writers
  await closeWriters(writers);

  const elapsed = (Date.now() - startTime) / 1000;
  
  console.log(`\nComplete in ${elapsed.toFixed(1)}s!`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped (duplicates or invalid): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Data errors: ${state.dataErrors.length}`);
  console.log(`\nLookup table sizes:`);
  console.log(`  Races: ${state.raceIds.size()}`);
  console.log(`  Backgrounds: ${state.backgroundIds.size()}`);
  console.log(`  Gods: ${state.godIds.size()}`);
  console.log(`  Skills: ${state.skillIds.size()}`);
  console.log(`  Spells: ${state.spellIds.size()}`);
  console.log(`  Spell Schools: ${state.schoolIds.size()}`);
  console.log(`  Branches: ${state.branchIds.size()}`);
  console.log(`  Runes: ${state.runeIds.size()}`);
  console.log(`  Versions: ${state.versionIds.size()}`);
  
  // Write errors file if there are any data errors
  if (state.dataErrors.length > 0) {
    const errorsPath = join(outputDir, 'errors.json');
    const fs = await import('node:fs/promises');
    await fs.writeFile(errorsPath, JSON.stringify(state.dataErrors, null, 2));
    console.log(`\nData errors written to: ${errorsPath}`);
    
    // Also write a summary grouped by error type
    const errorsByField = new Map<string, DataError[]>();
    for (const error of state.dataErrors) {
      const key = `${error.field}: ${error.reason}`;
      if (!errorsByField.has(key)) {
        errorsByField.set(key, []);
      }
      errorsByField.get(key)!.push(error);
    }
    
    console.log(`\nError summary:`);
    for (const [key, errors] of errorsByField) {
      console.log(`  ${key}: ${errors.length} occurrences`);
      // Show first 3 example files
      const examples = errors.slice(0, 3).map(e => e.filename);
      console.log(`    Examples: ${examples.join(', ')}`);
    }
  }
  
  console.log(`\nCSV files written to: ${outputDir}`);
  console.log(`\nTo load into PostgreSQL, run:`);
  console.log(`  psql -d crawl_crawler -f ${outputDir}/load.sql`);
  
  // Generate the load script
  const loadScript = generateLoadScript(outputDir);
  const loadScriptPath = join(outputDir, 'load.sql');
  const fs = await import('node:fs/promises');
  await fs.writeFile(loadScriptPath, loadScript);
  console.log(`\nGenerated load script: ${loadScriptPath}`);
}

function generateLoadScript(outputDir: string): string {
  // Use absolute path for the CSV files
  const absPath = join(process.cwd(), outputDir);
  
  return `-- Auto-generated script to load CSV files into PostgreSQL
-- Run with: psql -d crawl_crawler -f load.sql

-- Stop on first error
\\set ON_ERROR_STOP on

-- Clear existing data (comment out this section if you want to append)
TRUNCATE 
  game_equipment, game_actions, game_xp_progression,
  game_branches, game_spells, game_skill_progression, game_skills,
  game_gods, game_runes, games, parsed_morgue_json,
  spell_school_mapping, game_versions, runes, branches, spell_schools,
  spells, skills, gods, backgrounds, races
CASCADE;

-- Load lookup tables first
\\copy races(id, code, name, is_removed) FROM '${absPath}/races.csv' WITH (FORMAT csv, HEADER true);
\\copy backgrounds(id, code, name, is_removed) FROM '${absPath}/backgrounds.csv' WITH (FORMAT csv, HEADER true);
\\copy gods(id, name, is_removed) FROM '${absPath}/gods.csv' WITH (FORMAT csv, HEADER true);
\\copy skills(id, name) FROM '${absPath}/skills.csv' WITH (FORMAT csv, HEADER true);
\\copy spells(id, name, level, is_removed) FROM '${absPath}/spells.csv' WITH (FORMAT csv, HEADER true);
\\copy spell_schools(id, name) FROM '${absPath}/spell_schools.csv' WITH (FORMAT csv, HEADER true);
\\copy spell_school_mapping(spell_id, school_id) FROM '${absPath}/spell_school_mapping.csv' WITH (FORMAT csv, HEADER true);
\\copy branches(id, name, is_portal) FROM '${absPath}/branches.csv' WITH (FORMAT csv, HEADER true);
\\copy runes(id, name) FROM '${absPath}/runes.csv' WITH (FORMAT csv, HEADER true);
\\copy game_versions(id, version, major, minor, is_trunk) FROM '${absPath}/game_versions.csv' WITH (FORMAT csv, HEADER true);

-- Load main games table
\\copy games(id, morgue_filename, player_name, score, version_id, race_id, background_id, character_level, title, is_win, end_date, start_date, game_duration_seconds, total_turns, runes_count, gems_count, god_id, piety, hp_max, mp_max, ac, ev, sh, str, int, dex, gold, branches_visited, levels_seen, is_webtiles, game_seed, parser_version, morgue_hash, source_url, draconian_color) FROM '${absPath}/games.csv' WITH (FORMAT csv, HEADER true);

-- Load detail tables
\\copy game_runes(game_id, rune_id) FROM '${absPath}/game_runes.csv' WITH (FORMAT csv, HEADER true);
\\copy game_gods(id, game_id, god_id, started_turn, started_location, ended_turn, worship_order) FROM '${absPath}/game_gods.csv' WITH (FORMAT csv, HEADER true);
\\copy game_skills(game_id, skill_id, level) FROM '${absPath}/game_skills.csv' WITH (FORMAT csv, HEADER true);
\\copy game_skill_progression(game_id, skill_id, xl, skill_level) FROM '${absPath}/game_skill_progression.csv' WITH (FORMAT csv, HEADER true);
\\copy game_spells(game_id, spell_id, slot, failure_percent) FROM '${absPath}/game_spells.csv' WITH (FORMAT csv, HEADER true);
\\copy game_branches(game_id, branch_id, levels_seen, levels_total, first_entry_turn) FROM '${absPath}/game_branches.csv' WITH (FORMAT csv, HEADER true);
\\copy game_xp_progression(game_id, xl, turn, location) FROM '${absPath}/game_xp_progression.csv' WITH (FORMAT csv, HEADER true);
\\copy game_actions(game_id, category, action_name, total_count, counts_by_xl) FROM '${absPath}/game_actions.csv' WITH (FORMAT csv, HEADER true);
\\copy game_equipment(game_id, slot, item_text) FROM '${absPath}/game_equipment.csv' WITH (FORMAT csv, HEADER true);
\\copy parsed_morgue_json(morgue_hash, parsed_json) FROM '${absPath}/parsed_morgue_json.csv' WITH (FORMAT csv, HEADER true);

-- Update sequences to continue from max ID
SELECT setval('races_id_seq', COALESCE((SELECT MAX(id) FROM races), 1));
SELECT setval('backgrounds_id_seq', COALESCE((SELECT MAX(id) FROM backgrounds), 1));
SELECT setval('gods_id_seq', COALESCE((SELECT MAX(id) FROM gods), 1));
SELECT setval('skills_id_seq', COALESCE((SELECT MAX(id) FROM skills), 1));
SELECT setval('spells_id_seq', COALESCE((SELECT MAX(id) FROM spells), 1));
SELECT setval('spell_schools_id_seq', COALESCE((SELECT MAX(id) FROM spell_schools), 1));
SELECT setval('branches_id_seq', COALESCE((SELECT MAX(id) FROM branches), 1));
SELECT setval('runes_id_seq', COALESCE((SELECT MAX(id) FROM runes), 1));
SELECT setval('game_versions_id_seq', COALESCE((SELECT MAX(id) FROM game_versions), 1));
SELECT setval('games_id_seq', COALESCE((SELECT MAX(id) FROM games), 1));
SELECT setval('game_gods_id_seq', COALESCE((SELECT MAX(id) FROM game_gods), 1));

-- Analyze tables for query optimization
ANALYZE;

SELECT 'Loaded ' || COUNT(*) || ' games' FROM games;
`;
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
