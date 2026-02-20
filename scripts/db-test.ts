import { query, closePool } from '../packages/game-data-db/src/connection.js';

async function testConnection() {
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const database = process.env.PGDATABASE || 'crawl_crawler';
  const user = process.env.PGUSER || process.env.USER;
  const hasPassword = !!process.env.PGPASSWORD;

  console.log('--- Database Connection Test ---');
  console.log(`  Host:     ${host}`);
  console.log(`  Port:     ${port}`);
  console.log(`  Database: ${database}`);
  console.log(`  User:     ${user}`);
  console.log(`  Password: ${hasPassword ? '(set)' : '(NOT SET)'}`);
  console.log(`  SSL:      ${host !== 'localhost' ? 'enabled' : 'disabled'}`);
  console.log('');

  try {
    console.log('Connecting...');
    const start = Date.now();
    const result = await query<{ now: Date }>('SELECT NOW() as now');
    const elapsed = Date.now() - start;
    console.log(`Connected in ${elapsed}ms`);
    console.log(`  Server time: ${result.rows[0].now}`);
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    console.error('CONNECTION FAILED');
    console.error(`  Error: ${error.message}`);
    if (error.code) console.error(`  Code:  ${error.code}`);
    await closePool();
    process.exit(1);
  }

  try {
    const tables = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log(`\nPublic tables (${tables.rows.length}):`);
    for (const row of tables.rows) {
      const count = await query<{ count: string }>(
        `SELECT count(*) FROM "${row.table_name}"`
      );
      console.log(`  ${row.table_name}: ${count.rows[0].count} rows`);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`\nFailed to list tables: ${error.message}`);
  }

  await closePool();
  console.log('\nDone.');
}

testConnection();
