import type pg from 'pg';

export const name = '003_add_parsed_morgue_json';

export async function up(client: pg.PoolClient): Promise<void> {
  // Create table to store parsed morgue JSON by hash
  // This allows us to retrieve the full parsed data without re-parsing
  await client.query(`
    CREATE TABLE IF NOT EXISTS parsed_morgue_json (
      morgue_hash VARCHAR(64) PRIMARY KEY,
      parsed_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Add comment explaining the table's purpose
  await client.query(`
    COMMENT ON TABLE parsed_morgue_json IS 
    'Stores parsed morgue JSON data keyed by morgue hash for efficient retrieval without re-parsing';
  `);
}

export async function down(client: pg.PoolClient): Promise<void> {
  await client.query(`DROP TABLE IF EXISTS parsed_morgue_json;`);
}
