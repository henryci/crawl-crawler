import { getClient, closePool } from './connection.js';
import * as migration001 from './migrations/001_initial_schema.js';

const migrations = [migration001];

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

// Main entry point
const command = process.argv[2];

if (command === 'down') {
  rollbackMigrations().catch((error) => {
    console.error('Rollback failed:', error);
    process.exit(1);
  });
} else {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
