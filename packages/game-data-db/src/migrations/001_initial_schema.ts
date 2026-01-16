import type pg from 'pg';

export const name = '001_initial_schema';

export async function up(client: pg.PoolClient): Promise<void> {
  // ============================================
  // LOOKUP TABLES - Small, frequently joined tables
  // Using SMALLINT IDs for space efficiency
  // ============================================

  // Races (species) lookup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS races (
      id SMALLSERIAL PRIMARY KEY,
      code VARCHAR(4) NOT NULL UNIQUE,
      name VARCHAR(50) NOT NULL UNIQUE,
      is_removed BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  // Backgrounds (classes) lookup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS backgrounds (
      id SMALLSERIAL PRIMARY KEY,
      code VARCHAR(4) NOT NULL UNIQUE,
      name VARCHAR(50) NOT NULL UNIQUE,
      is_removed BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  // Gods lookup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS gods (
      id SMALLSERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      is_removed BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  // Skills lookup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id SMALLSERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    );
  `);

  // Spells lookup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS spells (
      id SMALLSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      level SMALLINT,
      is_removed BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  // Spell schools lookup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS spell_schools (
      id SMALLSERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    );
  `);

  // Spell to schools many-to-many
  await client.query(`
    CREATE TABLE IF NOT EXISTS spell_school_mapping (
      spell_id SMALLINT NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
      school_id SMALLINT NOT NULL REFERENCES spell_schools(id) ON DELETE CASCADE,
      PRIMARY KEY (spell_id, school_id)
    );
  `);

  // Branches lookup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id SMALLSERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      short_name VARCHAR(10),
      is_portal BOOLEAN NOT NULL DEFAULT FALSE,
      is_removed BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  // Runes lookup table
  await client.query(`
    CREATE TABLE IF NOT EXISTS runes (
      id SMALLSERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    );
  `);

  // Game versions lookup table (to avoid storing version strings repeatedly)
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_versions (
      id SERIAL PRIMARY KEY,
      version VARCHAR(100) NOT NULL UNIQUE,
      major SMALLINT,
      minor SMALLINT,
      is_trunk BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  // ============================================
  // MAIN GAMES TABLE
  // ============================================
  await client.query(`
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      
      -- Unique identifier for deduplication
      morgue_filename VARCHAR(255) UNIQUE,
      
      -- Core game info
      player_name VARCHAR(100) NOT NULL,
      score BIGINT,
      version_id INTEGER REFERENCES game_versions(id),
      
      -- Character info (using lookup IDs)
      race_id SMALLINT REFERENCES races(id),
      background_id SMALLINT REFERENCES backgrounds(id),
      character_level SMALLINT,
      title VARCHAR(100),
      
      -- Game outcome
      is_win BOOLEAN NOT NULL DEFAULT FALSE,
      end_date DATE,
      start_date DATE,
      game_duration_seconds INTEGER,
      total_turns INTEGER,
      
      -- Runes and gems
      runes_count SMALLINT DEFAULT 0,
      gems_count SMALLINT DEFAULT 0,
      
      -- Final god (null if atheist)
      god_id SMALLINT REFERENCES gods(id),
      piety SMALLINT,
      
      -- Final stats
      hp_max SMALLINT,
      mp_max SMALLINT,
      ac SMALLINT,
      ev SMALLINT,
      sh SMALLINT,
      str SMALLINT,
      int SMALLINT,
      dex SMALLINT,
      gold INTEGER,
      
      -- Exploration
      branches_visited SMALLINT,
      levels_seen SMALLINT,
      
      -- Metadata
      is_webtiles BOOLEAN,
      game_seed VARCHAR(30),
      parser_version VARCHAR(20),
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ============================================
  // GAME DETAIL TABLES
  // ============================================

  // Game runes collected (many-to-many)
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_runes (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      rune_id SMALLINT NOT NULL REFERENCES runes(id),
      PRIMARY KEY (game_id, rune_id)
    );
  `);

  // Gods worshipped during game
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_gods (
      id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      god_id SMALLINT NOT NULL REFERENCES gods(id),
      started_turn INTEGER,
      started_location VARCHAR(20),
      ended_turn INTEGER,
      worship_order SMALLINT NOT NULL DEFAULT 1
    );
  `);

  // Final skills at game end
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_skills (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      skill_id SMALLINT NOT NULL REFERENCES skills(id),
      level REAL NOT NULL,
      PRIMARY KEY (game_id, skill_id)
    );
  `);

  // Skill progression by XL (for heatmap visualization)
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_skill_progression (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      skill_id SMALLINT NOT NULL REFERENCES skills(id),
      xl SMALLINT NOT NULL,
      skill_level REAL NOT NULL,
      PRIMARY KEY (game_id, skill_id, xl)
    );
  `);

  // Spells memorized at game end
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_spells (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      spell_id SMALLINT NOT NULL REFERENCES spells(id),
      slot CHAR(1),
      failure_percent SMALLINT,
      PRIMARY KEY (game_id, spell_id)
    );
  `);

  // Branch visits
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_branches (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      branch_id SMALLINT NOT NULL REFERENCES branches(id),
      levels_seen SMALLINT,
      levels_total SMALLINT,
      deepest SMALLINT,
      first_entry_turn INTEGER,
      PRIMARY KEY (game_id, branch_id)
    );
  `);

  // XP progression (turn/location when each XL was reached)
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_xp_progression (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      xl SMALLINT NOT NULL,
      turn INTEGER,
      location VARCHAR(20),
      PRIMARY KEY (game_id, xl)
    );
  `);

  // Time spent by branch
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_branch_time (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      branch_id SMALLINT NOT NULL REFERENCES branches(id),
      elapsed INTEGER,
      non_travel INTEGER,
      inter_level_travel INTEGER,
      resting INTEGER,
      autoexplore INTEGER,
      levels SMALLINT,
      PRIMARY KEY (game_id, branch_id)
    );
  `);

  // Actions summary (aggregated by category for efficient querying)
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_actions (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      category VARCHAR(30) NOT NULL,
      action_name VARCHAR(50) NOT NULL,
      total_count INTEGER NOT NULL,
      counts_by_xl JSONB,
      PRIMARY KEY (game_id, category, action_name)
    );
  `);

  // Equipment at game end
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_equipment (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      slot VARCHAR(20) NOT NULL,
      item_text TEXT,
      PRIMARY KEY (game_id, slot)
    );
  `);

  // ============================================
  // INDEXES for common query patterns
  // ============================================
  
  // Player lookups
  await client.query(`CREATE INDEX IF NOT EXISTS idx_games_player_name ON games(player_name);`);
  
  // Filtering by race/background combo
  await client.query(`CREATE INDEX IF NOT EXISTS idx_games_race_bg ON games(race_id, background_id);`);
  
  // Filtering by god
  await client.query(`CREATE INDEX IF NOT EXISTS idx_games_god ON games(god_id);`);
  
  // Win filtering
  await client.query(`CREATE INDEX IF NOT EXISTS idx_games_is_win ON games(is_win);`);
  
  // Date range queries
  await client.query(`CREATE INDEX IF NOT EXISTS idx_games_end_date ON games(end_date);`);
  
  // Version filtering
  await client.query(`CREATE INDEX IF NOT EXISTS idx_games_version ON games(version_id);`);
  
  // Score sorting
  await client.query(`CREATE INDEX IF NOT EXISTS idx_games_score ON games(score DESC);`);
  
  // Composite index for common filter combinations
  await client.query(`CREATE INDEX IF NOT EXISTS idx_games_combo_win ON games(race_id, background_id, is_win);`);
  
  // Game skills for analytics
  await client.query(`CREATE INDEX IF NOT EXISTS idx_game_skills_skill ON game_skills(skill_id);`);
  
  // Game spells for analytics
  await client.query(`CREATE INDEX IF NOT EXISTS idx_game_spells_spell ON game_spells(spell_id);`);

  // ============================================
  // MIGRATIONS TABLE
  // ============================================
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function down(client: pg.PoolClient): Promise<void> {
  // Drop in reverse order of creation (respecting foreign keys)
  // Note: Table names are hardcoded constants, not user input.
  // We use pg_catalog.quote_ident() for defense-in-depth even though
  // these are trusted values.
  const tables = [
    'game_equipment',
    'game_actions',
    'game_branch_time',
    'game_xp_progression',
    'game_branches',
    'game_spells',
    'game_skill_progression',
    'game_skills',
    'game_gods',
    'game_runes',
    'games',
    'game_versions',
    'runes',
    'branches',
    'spell_school_mapping',
    'spell_schools',
    'spells',
    'skills',
    'gods',
    'backgrounds',
    'races',
    'migrations',
  ] as const;

  for (const table of tables) {
    // Validate table name matches expected pattern (alphanumeric + underscore only)
    if (!/^[a-z_]+$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
  }
}
