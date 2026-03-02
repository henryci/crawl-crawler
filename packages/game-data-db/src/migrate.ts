import { getClient, closePool } from './connection.js';
import * as migration001 from './migrations/001_initial_schema.js';
import * as migration002 from './migrations/002_add_morgue_hash_and_url.js';
import * as migration003 from './migrations/003_add_parsed_morgue_json.js';
import * as migration004 from './migrations/004_add_service_metadata.js';
import * as migration005 from './migrations/005_fix_branch_time_levels_type.js';
import * as migration006 from './migrations/006_remove_time_tables_and_deepest_add_draconian_color.js';

const migrations = [migration001, migration002, migration003, migration004, migration005, migration006];

async function ensureMigrationsTable(client: import('pg').PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client: import('pg').PoolClient): Promise<Set<string>> {
  const result = await client.query<{ name: string }>('SELECT name FROM migrations');
  return new Set(result.rows.map((r) => r.name));
}

async function runMigrations(): Promise<void> {
  const client = await getClient();
  
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    for (const migration of migrations) {
      if (!applied.has(migration.name)) {
        console.log(`Applying migration: ${migration.name}`);
        await client.query('BEGIN');
        try {
          await migration.up(client);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migration.name]
          );
          await client.query('COMMIT');
          console.log(`  ✓ Applied ${migration.name}`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        console.log(`  - Skipping ${migration.name} (already applied)`);
      }
    }

    console.log('\nAll migrations complete!');
  } finally {
    client.release();
    await closePool();
  }
}

async function rollbackMigrations(): Promise<void> {
  const client = await getClient();
  
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    // Rollback in reverse order
    for (const migration of [...migrations].reverse()) {
      if (applied.has(migration.name)) {
        console.log(`Rolling back migration: ${migration.name}`);
        await client.query('BEGIN');
        try {
          await migration.down(client);
          await client.query(
            'DELETE FROM migrations WHERE name = $1',
            [migration.name]
          );
          await client.query('COMMIT');
          console.log(`  ✓ Rolled back ${migration.name}`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
    }

    console.log('\nRollback complete!');
  } finally {
    client.release();
    await closePool();
  }
}

async function resetDatabase(): Promise<void> {
  const client = await getClient();
  
  try {
    console.log('Resetting database...\n');

    // Drop all known tables directly (CASCADE handles foreign keys).
    // This is more robust than running down migrations, which can fail
    // on data constraints (e.g., SMALLINT overflow during column type revert).
    const tables = [
      'game_equipment', 'game_actions', 'game_branch_time', 'game_xp_progression',
      'game_branches', 'game_spells', 'game_skill_progression', 'game_skills',
      'game_gods', 'game_runes', 'games', 'parsed_morgue_json', 'service_metadata',
      'game_versions', 'runes', 'branches', 'spell_school_mapping', 'spell_schools',
      'spells', 'skills', 'gods', 'backgrounds', 'races', 'migrations',
    ];
    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    console.log('Dropped all tables.\n');

    console.log('--- Applying fresh migrations ---\n');

    // Now apply all migrations fresh
    await ensureMigrationsTable(client);

    for (const migration of migrations) {
      console.log(`Applying: ${migration.name}`);
      await client.query('BEGIN');
      try {
        await migration.up(client);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        await client.query('COMMIT');
        console.log(`  ✓ Applied ${migration.name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('\n✓ Database reset complete! All tables are empty with latest schema.');
  } finally {
    client.release();
    await closePool();
  }
}

// Main entry point
const command = process.argv[2];

if (command === 'down') {
  rollbackMigrations().catch((error) => {
    console.error('Rollback failed:', error);
    process.exit(1);
  });
} else if (command === 'reset') {
  resetDatabase().catch((error) => {
    console.error('Reset failed:', error);
    process.exit(1);
  });
} else {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
