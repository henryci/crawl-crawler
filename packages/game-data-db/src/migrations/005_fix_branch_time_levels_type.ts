import type pg from 'pg';

export const name = '005_fix_branch_time_levels_type';

export async function up(client: pg.PoolClient): Promise<void> {
  // Change levels column from SMALLINT to INTEGER
  // SMALLINT max is 32,767 but some games have more levels visited
  await client.query(`
    ALTER TABLE game_branch_time
    ALTER COLUMN levels TYPE INTEGER;
  `);
}

export async function down(client: pg.PoolClient): Promise<void> {
  // Note: This may fail if there are values > 32767
  await client.query(`
    ALTER TABLE game_branch_time
    ALTER COLUMN levels TYPE SMALLINT;
  `);
}
