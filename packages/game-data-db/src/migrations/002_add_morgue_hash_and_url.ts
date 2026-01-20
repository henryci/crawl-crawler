import type pg from 'pg';

export const name = '002_add_morgue_hash_and_url';

export async function up(client: pg.PoolClient): Promise<void> {
  // Add morgue_hash column for deduplication
  // SHA-256 hash is 64 hex characters
  await client.query(`
    ALTER TABLE games
    ADD COLUMN IF NOT EXISTS morgue_hash VARCHAR(64);
  `);

  // Add source_url column for linking back to original morgue file
  await client.query(`
    ALTER TABLE games
    ADD COLUMN IF NOT EXISTS source_url TEXT;
  `);

  // Create unique index on morgue_hash for efficient deduplication lookups
  // This allows us to detect duplicate morgues even if they have different filenames
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_games_morgue_hash 
    ON games(morgue_hash) 
    WHERE morgue_hash IS NOT NULL;
  `);
}

export async function down(client: pg.PoolClient): Promise<void> {
  await client.query(`DROP INDEX IF EXISTS idx_games_morgue_hash;`);
  await client.query(`ALTER TABLE games DROP COLUMN IF EXISTS source_url;`);
  await client.query(`ALTER TABLE games DROP COLUMN IF EXISTS morgue_hash;`);
}
