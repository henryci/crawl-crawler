#!/usr/bin/env tsx
/**
 * Morgue Loader Script
 *
 * Parses morgue files from a directory and loads them into the PostgreSQL database.
 *
 * Usage:
 *   PGDATABASE=crawl_crawler pnpm load:morgues /path/to/morgue/directory
 */

import { readFileSync, readdirSync, statSync, existsSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { parseMorgue, type MorgueData } from 'dcss-morgue-parser';
import { getPool, closePool, recordStreakDownloadDate } from '@crawl-crawler/game-data-db';
import type { Pool } from 'pg';

// ============================================
// URL Mapping
// ============================================

const URL_MAPPING_FILENAME = 'url_mapping.csv';

/**
 * Load the URL mapping from the CSV file created by the download script.
 * Returns a Map of filename -> URL.
 */
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
    
    // Simple CSV parsing (handles basic cases)
    // Format: filename,url
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
// Lookup table caches (populated on first use)
// ============================================
const raceCache = new Map<string, number>();
const backgroundCache = new Map<string, number>();
const godCache = new Map<string, number>();
const skillCache = new Map<string, number>();
const spellCache = new Map<string, number>();
const schoolCache = new Map<string, number>();
const branchCache = new Map<string, number>();
const runeCache = new Map<string, number>();
const versionCache = new Map<string, number>();

// ============================================
// Race/Background code mappings (from centralized package)
// ============================================
import {
  getSpeciesCode,
  getBackgroundCode,
  normalizeSpeciesName,
  parseVersion as parseVersionUtil,
  PORTAL_BRANCHES,
} from 'dcss-game-data';

// ============================================
// Helper functions
// ============================================

// Use the centralized functions with local aliases for backwards compatibility
const getRaceCode = getSpeciesCode;

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
  // Use the parser's isWin field which is determined from the header text
  // (e.g., "Escaped with the Orb" indicates a win)
  if (data.isWin !== null) {
    return data.isWin;
  }
  // Fallback for very old morgues where isWin might not be detected
  return false;
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  // Try to parse various date formats
  // "Apr 26, 2025" or "2025-04-26"
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

// Use the centralized function with a local alias for backwards compatibility
const normalizeRace = normalizeSpeciesName;

// ============================================
// Lookup table getters/inserters
// ============================================

async function getOrCreateRace(pool: Pool, name: string): Promise<number> {
  const normalizedName = normalizeRace(name);
  
  if (raceCache.has(normalizedName)) {
    return raceCache.get(normalizedName)!;
  }

  const code = getRaceCode(name);
  
  // Try to find existing
  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM races WHERE name = $1',
    [normalizedName]
  );
  
  if (existing.rows[0]) {
    raceCache.set(normalizedName, existing.rows[0].id);
    return existing.rows[0].id;
  }

  // Insert new - use a unique code by appending a number if needed
  let uniqueCode = code;
  let attempt = 0;
  while (attempt < 10) {
    try {
      const result = await pool.query<{ id: number }>(
        'INSERT INTO races (code, name) VALUES ($1, $2) RETURNING id',
        [uniqueCode, normalizedName]
      );
      const id = result.rows[0]!.id;
      raceCache.set(normalizedName, id);
      return id;
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code === '23505') { // unique violation
        // Check if it's the name or code that's duplicate
        const checkName = await pool.query<{ id: number }>(
          'SELECT id FROM races WHERE name = $1',
          [normalizedName]
        );
        if (checkName.rows[0]) {
          raceCache.set(normalizedName, checkName.rows[0].id);
          return checkName.rows[0].id;
        }
        // Code is duplicate, try a different one
        attempt++;
        uniqueCode = code + attempt;
      } else {
        throw e;
      }
    }
  }
  throw new Error(`Failed to create race: ${normalizedName}`);
}

async function getOrCreateBackground(pool: Pool, name: string): Promise<number> {
  if (backgroundCache.has(name)) {
    return backgroundCache.get(name)!;
  }

  const code = getBackgroundCode(name);
  
  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM backgrounds WHERE name = $1',
    [name]
  );
  
  if (existing.rows[0]) {
    backgroundCache.set(name, existing.rows[0].id);
    return existing.rows[0].id;
  }

  // Insert new - handle code conflicts
  let uniqueCode = code;
  let attempt = 0;
  while (attempt < 10) {
    try {
      const result = await pool.query<{ id: number }>(
        'INSERT INTO backgrounds (code, name) VALUES ($1, $2) RETURNING id',
        [uniqueCode, name]
      );
      const id = result.rows[0]!.id;
      backgroundCache.set(name, id);
      return id;
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code === '23505') {
        const checkName = await pool.query<{ id: number }>(
          'SELECT id FROM backgrounds WHERE name = $1',
          [name]
        );
        if (checkName.rows[0]) {
          backgroundCache.set(name, checkName.rows[0].id);
          return checkName.rows[0].id;
        }
        attempt++;
        uniqueCode = code + attempt;
      } else {
        throw e;
      }
    }
  }
  throw new Error(`Failed to create background: ${name}`);
}

async function getOrCreateGod(pool: Pool, name: string): Promise<number> {
  if (godCache.has(name)) {
    return godCache.get(name)!;
  }

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM gods WHERE name = $1',
    [name]
  );
  
  if (existing.rows[0]) {
    godCache.set(name, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const result = await pool.query<{ id: number }>(
    'INSERT INTO gods (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [name]
  );
  
  const id = result.rows[0]!.id;
  godCache.set(name, id);
  return id;
}

async function getOrCreateSkill(pool: Pool, name: string): Promise<number> {
  if (skillCache.has(name)) {
    return skillCache.get(name)!;
  }

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM skills WHERE name = $1',
    [name]
  );
  
  if (existing.rows[0]) {
    skillCache.set(name, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const result = await pool.query<{ id: number }>(
    'INSERT INTO skills (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [name]
  );
  
  const id = result.rows[0]!.id;
  skillCache.set(name, id);
  return id;
}

async function getOrCreateSpell(pool: Pool, name: string, level: number | null): Promise<number> {
  if (spellCache.has(name)) {
    return spellCache.get(name)!;
  }

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM spells WHERE name = $1',
    [name]
  );
  
  if (existing.rows[0]) {
    spellCache.set(name, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const result = await pool.query<{ id: number }>(
    'INSERT INTO spells (name, level) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [name, level]
  );
  
  const id = result.rows[0]!.id;
  spellCache.set(name, id);
  return id;
}

async function getOrCreateSchool(pool: Pool, name: string): Promise<number> {
  if (schoolCache.has(name)) {
    return schoolCache.get(name)!;
  }

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM spell_schools WHERE name = $1',
    [name]
  );
  
  if (existing.rows[0]) {
    schoolCache.set(name, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const result = await pool.query<{ id: number }>(
    'INSERT INTO spell_schools (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [name]
  );
  
  const id = result.rows[0]!.id;
  schoolCache.set(name, id);
  return id;
}

async function getOrCreateBranch(pool: Pool, name: string): Promise<number> {
  if (branchCache.has(name)) {
    return branchCache.get(name)!;
  }

  // Determine if it's a portal (using centralized data)
  const isPortal = PORTAL_BRANCHES.includes(name);

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM branches WHERE name = $1',
    [name]
  );
  
  if (existing.rows[0]) {
    branchCache.set(name, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const result = await pool.query<{ id: number }>(
    'INSERT INTO branches (name, is_portal) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [name, isPortal]
  );
  
  const id = result.rows[0]!.id;
  branchCache.set(name, id);
  return id;
}

async function getOrCreateRune(pool: Pool, name: string): Promise<number> {
  if (runeCache.has(name)) {
    return runeCache.get(name)!;
  }

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM runes WHERE name = $1',
    [name]
  );
  
  if (existing.rows[0]) {
    runeCache.set(name, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const result = await pool.query<{ id: number }>(
    'INSERT INTO runes (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [name]
  );
  
  const id = result.rows[0]!.id;
  runeCache.set(name, id);
  return id;
}

async function getOrCreateVersion(pool: Pool, version: string): Promise<number> {
  if (versionCache.has(version)) {
    return versionCache.get(version)!;
  }

  const { major, minor, isTrunk } = parseVersion(version);

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM game_versions WHERE version = $1',
    [version]
  );
  
  if (existing.rows[0]) {
    versionCache.set(version, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const result = await pool.query<{ id: number }>(
    'INSERT INTO game_versions (version, major, minor, is_trunk) VALUES ($1, $2, $3, $4) ON CONFLICT (version) DO UPDATE SET version = EXCLUDED.version RETURNING id',
    [version, major, minor, isTrunk]
  );
  
  const id = result.rows[0]!.id;
  versionCache.set(version, id);
  return id;
}

// ============================================
// Main loader function
// ============================================

/**
 * Store the parsed morgue JSON in the lookup table.
 * This allows retrieving the full parsed data without re-parsing.
 */
async function storeParsedMorgueJson(pool: Pool, data: MorgueData): Promise<void> {
  if (!data.morgueHash) return;
  
  await pool.query(`
    INSERT INTO parsed_morgue_json (morgue_hash, parsed_json)
    VALUES ($1, $2)
    ON CONFLICT (morgue_hash) DO NOTHING
  `, [data.morgueHash, JSON.stringify(data)]);
}

async function loadMorgue(pool: Pool, data: MorgueData, filename: string): Promise<number | null> {
  // Check if already loaded by filename
  const existingByFilename = await pool.query<{ id: number }>(
    'SELECT id FROM games WHERE morgue_filename = $1',
    [filename]
  );
  
  if (existingByFilename.rows[0]) {
    return null; // Already loaded
  }

  // Check if already loaded by hash (handles duplicate morgues with different filenames)
  if (data.morgueHash) {
    const existingByHash = await pool.query<{ id: number }>(
      'SELECT id FROM games WHERE morgue_hash = $1',
      [data.morgueHash]
    );
    
    if (existingByHash.rows[0]) {
      return null; // Already loaded (duplicate content)
    }
  }

  // Get lookup IDs (these are done outside transaction to avoid conflicts)
  const raceId = data.race ? await getOrCreateRace(pool, data.race) : null;
  const backgroundId = data.background ? await getOrCreateBackground(pool, data.background) : null;
  const godId = data.endingStats?.god ? await getOrCreateGod(pool, data.endingStats.god) : null;
  const versionId = data.version ? await getOrCreateVersion(pool, data.version) : null;

  // Get a client for the transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert main game record
    // ON CONFLICT DO NOTHING handles race conditions and ensures idempotency
    const gameResult = await client.query<{ id: number }>(`
      INSERT INTO games (
        morgue_filename, player_name, score, version_id,
        race_id, background_id, character_level, title,
        is_win, end_date, start_date, game_duration_seconds, total_turns,
        runes_count, gems_count, god_id, piety,
        hp_max, mp_max, ac, ev, sh, str, int, dex, gold,
        branches_visited, levels_seen, is_webtiles, game_seed, parser_version,
        morgue_hash, source_url
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31,
        $32, $33
      )
      ON CONFLICT (morgue_filename) DO NOTHING
      RETURNING id
    `, [
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
    ]);

    // If ON CONFLICT triggered, no row is returned - this is a duplicate
    if (gameResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const gameId = gameResult.rows[0]!.id;

    // Insert runes
    if (data.runesList) {
      for (const runeName of data.runesList) {
        const runeId = await getOrCreateRune(pool, runeName);
        await client.query(
          'INSERT INTO game_runes (game_id, rune_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [gameId, runeId]
        );
      }
    }

    // Insert gods worshipped
    if (data.godsWorshipped) {
      for (let i = 0; i < data.godsWorshipped.length; i++) {
        const godRecord = data.godsWorshipped[i]!;
        const worshippedGodId = await getOrCreateGod(pool, godRecord.god);
        await client.query(`
          INSERT INTO game_gods (game_id, god_id, started_turn, started_location, ended_turn, worship_order)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [gameId, worshippedGodId, godRecord.startedTurn, godRecord.startedLocation, godRecord.endedTurn, i + 1]);
      }
    }

    // Insert final skills
    if (data.endingSkills) {
      for (const [skillName, level] of Object.entries(data.endingSkills)) {
        const skillId = await getOrCreateSkill(pool, skillName);
        await client.query(
          'INSERT INTO game_skills (game_id, skill_id, level) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [gameId, skillId, level]
        );
      }
    }

    // Insert skill progression
    if (data.skillsByXl) {
      for (const [skillName, progression] of Object.entries(data.skillsByXl)) {
        const skillId = await getOrCreateSkill(pool, skillName);
        for (const [xlStr, level] of Object.entries(progression)) {
          const xl = parseInt(xlStr, 10);
          if (!isNaN(xl)) {
            await client.query(
              'INSERT INTO game_skill_progression (game_id, skill_id, xl, skill_level) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
              [gameId, skillId, xl, level]
            );
          }
        }
      }
    }

    // Insert spells
    if (data.endingSpells) {
      for (const spell of data.endingSpells) {
        const spellId = await getOrCreateSpell(pool, spell.name, spell.level);
        
        // Insert spell-school mappings (outside transaction to avoid conflicts)
        for (const school of spell.schools) {
          const schoolId = await getOrCreateSchool(pool, school);
          await pool.query(
            'INSERT INTO spell_school_mapping (spell_id, school_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [spellId, schoolId]
          );
        }

        await client.query(
          'INSERT INTO game_spells (game_id, spell_id, slot, failure_percent) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [gameId, spellId, spell.slot, parseFailurePercent(spell.failure)]
        );
      }
    }

    // Insert branches
    if (data.branches) {
      for (const [branchName, info] of Object.entries(data.branches)) {
        const branchId = await getOrCreateBranch(pool, branchName);
        await client.query(`
          INSERT INTO game_branches (game_id, branch_id, levels_seen, levels_total, deepest, first_entry_turn)
          VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING
        `, [gameId, branchId, info.levelsSeen, info.levelsTotal, info.deepest, info.firstEntryTurn]);
      }
    }

    // Insert XP progression
    if (data.xpProgression) {
      for (const [xlStr, info] of Object.entries(data.xpProgression)) {
        const xl = parseInt(xlStr, 10);
        if (!isNaN(xl)) {
          await client.query(
            'INSERT INTO game_xp_progression (game_id, xl, turn, location) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [gameId, xl, info.turn, info.location]
          );
        }
      }
    }

    // Insert branch time
    if (data.timeByBranch) {
      for (const [branchName, stats] of Object.entries(data.timeByBranch)) {
        if (branchName === 'Total') continue; // Skip total row
        const branchId = await getOrCreateBranch(pool, branchName);
        await client.query(`
          INSERT INTO game_branch_time (game_id, branch_id, elapsed, non_travel, inter_level_travel, resting, autoexplore, levels)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING
        `, [gameId, branchId, stats.elapsed, stats.nonTravel, stats.interLevelTravel, stats.resting, stats.autoexplore, stats.levels]);
      }
    }

    // Insert actions
    if (data.actions) {
      for (const [category, actions] of Object.entries(data.actions)) {
        for (const [actionName, counts] of Object.entries(actions)) {
          const total = counts.total ?? 0;
          // Remove 'total' from counts for the JSON
          const countsByXl = { ...counts };
          delete (countsByXl as Record<string, unknown>).total;
          
          await client.query(`
            INSERT INTO game_actions (game_id, category, action_name, total_count, counts_by_xl)
            VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
          `, [gameId, category, actionName, total, JSON.stringify(countsByXl)]);
        }
      }
    }

    // Insert equipment
    if (data.equipment) {
      const slots = ['weapon', 'bodyArmour', 'shield', 'helmet', 'cloak', 'gloves', 'boots', 'amulet', 'ringLeft', 'ringRight'];
      for (const slot of slots) {
        const item = data.equipment[slot as keyof typeof data.equipment];
        if (item) {
          await client.query(
            'INSERT INTO game_equipment (game_id, slot, item_text) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [gameId, slot, item]
          );
        }
      }
    }

    await client.query('COMMIT');
    
    // Store the parsed JSON for later retrieval (outside transaction)
    await storeParsedMorgueJson(pool, data);
    
    return gameId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// CLI
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: pnpm load:morgues <directory>');
    console.error('Example: PGDATABASE=crawl_crawler pnpm load:morgues scripts/streak-downloader/outputs');
    process.exit(1);
  }

  const inputDir = args[0]!;
  
  if (!existsSync(inputDir)) {
    console.error(`Directory not found: ${inputDir}`);
    process.exit(1);
  }

  const stat = statSync(inputDir);
  if (!stat.isDirectory()) {
    console.error(`Not a directory: ${inputDir}`);
    process.exit(1);
  }

  // Find all .txt files (excluding the URL mapping CSV)
  const files = readdirSync(inputDir).filter(f => f.endsWith('.txt') && f !== URL_MAPPING_FILENAME);
  console.log(`Found ${files.length} morgue files to process`);

  // Load URL mapping
  const urlMapping = await loadUrlMapping(inputDir);

  const pool = getPool();
  
  let loaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const filePath = join(inputDir, file);
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Get the source URL from the mapping (if available)
      const sourceUrl = urlMapping.get(file);
      
      const result = await parseMorgue(content, { sourceUrl });
      
      if (!result.data.playerName) {
        console.log(`  [${i + 1}/${files.length}] Skipping ${file} (no player name)`);
        skipped++;
        continue;
      }

      const gameId = await loadMorgue(pool, result.data, file);

      if (gameId) {
        loaded++;
        if ((loaded % 50) === 0 || loaded === 1) {
          console.log(`  [${i + 1}/${files.length}] Loaded ${file} -> game #${gameId}`);
        }
      } else {
        skipped++;
      }
    } catch (error) {
      failed++;
      console.error(`  [${i + 1}/${files.length}] Failed to load ${file}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\nComplete!`);
  console.log(`  Loaded: ${loaded}`);
  console.log(`  Skipped (already loaded or invalid): ${skipped}`);
  console.log(`  Failed: ${failed}`);

  // Record the streak download date
  if (loaded > 0) {
    console.log(`\nRecording streak download date...`);
    await recordStreakDownloadDate();
    console.log(`  ✓ Streak download date recorded`);
  }

  await closePool();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
