import type pg from 'pg';

export const name = '004_add_service_metadata';

export async function up(client: pg.PoolClient): Promise<void> {
  // Service metadata table for storing various timestamps and metadata
  // Uses a key-value design for flexibility
  await client.query(`
    CREATE TABLE IF NOT EXISTS service_metadata (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Add some helpful comments
  await client.query(`
    COMMENT ON TABLE service_metadata IS 'Key-value store for service-level metadata like download timestamps';
    COMMENT ON COLUMN service_metadata.key IS 'Metadata key (e.g., streak_download_date, combo_records_download_date)';
    COMMENT ON COLUMN service_metadata.value IS 'Metadata value (stored as text, parse as needed)';
    COMMENT ON COLUMN service_metadata.updated_at IS 'When this metadata was last updated';
  `);
}

export async function down(client: pg.PoolClient): Promise<void> {
  await client.query('DROP TABLE IF EXISTS service_metadata CASCADE;');
}
