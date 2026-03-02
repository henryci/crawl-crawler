import type pg from 'pg';

export const name = '006_remove_time_tables_and_deepest_add_draconian_color';

export async function up(client: pg.PoolClient): Promise<void> {
  // game_branch_time was populated from timeByBranch which is no longer parsed
  await client.query(`DROP TABLE IF EXISTS game_branch_time;`);

  // deepest always equaled levels_seen; the parser no longer produces it
  await client.query(`ALTER TABLE game_branches DROP COLUMN IF EXISTS deepest;`);

  // Draconian color extracted from speciesData.color (e.g., "Grey", "Red")
  await client.query(`ALTER TABLE games ADD COLUMN draconian_color VARCHAR(10);`);
}

export async function down(client: pg.PoolClient): Promise<void> {
  await client.query(`ALTER TABLE games DROP COLUMN IF EXISTS draconian_color;`);

  await client.query(`ALTER TABLE game_branches ADD COLUMN deepest SMALLINT;`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS game_branch_time (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      branch_id SMALLINT NOT NULL REFERENCES branches(id),
      elapsed INTEGER,
      non_travel INTEGER,
      inter_level_travel INTEGER,
      resting INTEGER,
      autoexplore INTEGER,
      levels INTEGER,
      PRIMARY KEY (game_id, branch_id)
    );
  `);
}
