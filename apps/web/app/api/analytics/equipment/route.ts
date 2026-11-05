import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { query } from '@crawl-crawler/game-data-db';
import {
  parseCommonFilters,
  buildCommonWhereClause,
  commonFiltersCacheKey,
  commonFiltersFromCacheKey,
  isCommonFiltersCacheable,
  type CommonFilters,
} from '@/lib/analytics-filters';
import {
  DB_CACHE_TAG,
  DB_CACHE_REVALIDATE_SECONDS,
  buildCacheDebugHeaders,
} from '@/lib/cache';

/**
 * End-of-game equipment for the filtered games: what was in each slot, what
 * the off-hand held, and the resistance totals the character finished with.
 */

export interface EquipmentItem {
  name: string;
  games: number;
  /** Share of all matching games (not just games with the slot filled). */
  pct: number;
}

export interface EquipmentSlot {
  slot: string;
  label: string;
  /** Games with anything in this slot. */
  filled: number;
  items: EquipmentItem[];
}

export interface OffhandSplit {
  shield: number;
  orb: number;
  none: number;
}

export interface ResistRow {
  prop: string;
  label: string;
  /** Games whose morgue reported this property. */
  games: number;
  /** Share of those games at or above each level. */
  atLeast: { 1: number; 2: number; 3: number };
}

export interface EquipmentResult {
  totalGames: number;
  offhand: OffhandSplit;
  slots: EquipmentSlot[];
  resists: { games: number; rows: ResistRow[] };
}

const SLOT_LABELS: Record<string, string> = {
  weapon: 'Weapon',
  shield: 'Off-hand',
  bodyArmour: 'Body armour',
  helmet: 'Helmet',
  cloak: 'Cloak',
  gloves: 'Gloves',
  boots: 'Boots',
  amulet: 'Amulet',
  ring: 'Rings',
};

const SLOT_ORDER = Object.keys(SLOT_LABELS);
const ITEMS_PER_SLOT = 8;

const RESIST_PROPS: { prop: string; label: string }[] = [
  { prop: 'rF', label: 'Fire resistance' },
  { prop: 'rC', label: 'Cold resistance' },
  { prop: 'rN', label: 'Negative energy' },
  { prop: 'rPois', label: 'Poison resistance' },
  { prop: 'rElec', label: 'Electric resistance' },
  { prop: 'rCorr', label: 'Corrosion resistance' },
  { prop: 'Will', label: 'Willpower' },
  { prop: 'SInv', label: 'See invisible' },
];

/** Joins the common filters expect (aliases r, b, god, v). */
const GAME_JOINS = `
  FROM games g
  LEFT JOIN races r ON g.race_id = r.id
  LEFT JOIN backgrounds b ON g.background_id = b.id
  LEFT JOIN gods god ON g.god_id = god.id
  LEFT JOIN game_versions v ON g.version_id = v.id
`;

/** Lowercased item text without curse status, enchantment or "pair of". */
const UNPREFIXED_NAME_SQL = `
  regexp_replace(
    regexp_replace(lower(e.item_text), '^(cursed )?([+-]?[0-9]+(,[+-]?[0-9]+)? )?(cursed |uncursed )?', ''),
    '^pair of ', '')`;

/**
 * Drop what follows the base type (ego, inscription, artefact name, shop
 * price) and unify the dragon armour names across versions.
 */
function baseTypeSql(nameSql: string): string {
  return `
    regexp_replace(
      regexp_replace(
        regexp_replace(${nameSql}, '( of .*| \\{.*| ".*| \\(.*)$', ''),
        '^golden dragon', 'gold dragon'),
      ' dragon armour$', ' dragon scales')`;
}

/**
 * Collapse an item description to its base type. Enchantments, brands,
 * egos and artefact names are stripped so "+9 vampiric broad axe of Foo"
 * and "+3 broad axe" count together. Jewellery and magical staves keep
 * their "of X" because that is the item type; artefact jewellery and
 * staves (a quoted or capitalised "of [the] Name") are bucketed as randart.
 */
const ITEM_NAME_SQL = `
  CASE
    WHEN e.slot = 'amulet' OR e.slot LIKE 'ring_%' THEN
      CASE
        WHEN e.item_text ~ '"' OR e.item_text ~ '(ring|amulet) of (the )?[A-Z]' THEN
          CASE WHEN e.slot = 'amulet' THEN 'artefact amulet' ELSE 'artefact ring' END
        ELSE regexp_replace(
          regexp_replace(lower(e.item_text), '^(cursed )?([+-]?[0-9]+(,[+-]?[0-9]+)? )?(cursed )?', ''),
          ' \\{.*$', '')
      END
    WHEN e.slot = 'weapon' THEN
      CASE
        WHEN ${UNPREFIXED_NAME_SQL} ~ '^staff of ' THEN
          CASE
            WHEN e.item_text ~ '"' OR e.item_text ~ '[Ss]taff of (the )?[A-Z]' THEN 'artefact staff'
            ELSE regexp_replace(${UNPREFIXED_NAME_SQL}, '( \\{.*| ".*| \\(.*)$', '')
          END
        -- Only weapons take a brand prefix; on armour the same words can
        -- begin the base type itself ("acid dragon scales").
        ELSE ${baseTypeSql(`regexp_replace(${UNPREFIXED_NAME_SQL}, '^(vampiric|flaming|freezing|electric|venom|antimagic|anti-magic|heavy|holy|speed|draining|distortion|chaos|protection|spectral|penetration|acid) ', '')`)}
      END
    ELSE ${baseTypeSql(UNPREFIXED_NAME_SQL)}
  END
`;

async function getEquipmentData(filters: CommonFilters): Promise<EquipmentResult> {
  const { where, params } = buildCommonWhereClause(filters);
  const matching = `SELECT g.id ${GAME_JOINS} ${where}`;

  const [totalResult, offhandResult, slotResult, itemResult, resistResult] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) AS count FROM (${matching}) m`, params),
    query<{ kind: string; count: string }>(
      `
      SELECT
        CASE
          WHEN e.item_text ~* 'shield|buckler|kite|tower|mirror' THEN 'shield'
          WHEN e.item_text ~* '\\morb\\M' THEN 'orb'
          ELSE 'none'
        END AS kind,
        COUNT(*) AS count
      FROM (${matching}) m
      LEFT JOIN game_equipment e ON e.game_id = m.id AND e.slot = 'shield'
      GROUP BY 1
      `,
      params,
    ),
    query<{ slot: string; filled: string }>(
      `
      SELECT CASE WHEN e.slot LIKE 'ring_%' THEN 'ring' ELSE e.slot END AS slot,
             COUNT(DISTINCT e.game_id) AS filled
      FROM (${matching}) m
      JOIN game_equipment e ON e.game_id = m.id
      GROUP BY 1
      `,
      params,
    ),
    query<{ slot: string; name: string; games: string }>(
      `
      SELECT slot, name, games FROM (
        SELECT slot, name, games, ROW_NUMBER() OVER (PARTITION BY slot ORDER BY games DESC, name) AS rk
        FROM (
          SELECT CASE WHEN e.slot LIKE 'ring_%' THEN 'ring' ELSE e.slot END AS slot,
                 ${ITEM_NAME_SQL} AS name,
                 COUNT(DISTINCT e.game_id) AS games
          FROM (${matching}) m
          JOIN game_equipment e ON e.game_id = m.id
          WHERE e.item_text IS NOT NULL AND e.item_text !~ '^[0-9 ]+[A-Za-z]+:'
          GROUP BY 1, 2
        ) counted
      ) ranked
      WHERE rk <= ${ITEMS_PER_SLOT}
      ORDER BY slot, rk
      `,
      params,
    ),
    query<{ prop: string; games: string; ge1: string; ge2: string; ge3: string }>(
      `
      SELECT kv.key AS prop,
             COUNT(*) AS games,
             COUNT(*) FILTER (WHERE kv.value::numeric >= 1) AS ge1,
             COUNT(*) FILTER (WHERE kv.value::numeric >= 2) AS ge2,
             COUNT(*) FILTER (WHERE kv.value::numeric >= 3) AS ge3
      FROM (SELECT g.id, g.morgue_hash ${GAME_JOINS} ${where}) m
      JOIN parsed_morgue_json p ON p.morgue_hash = m.morgue_hash
      CROSS JOIN LATERAL jsonb_each_text(p.parsed_json -> 'runtimeTotals') kv
      WHERE jsonb_typeof(p.parsed_json -> 'runtimeTotals') = 'object'
        AND kv.key IN (${RESIST_PROPS.map((r) => `'${r.prop}'`).join(', ')})
        AND kv.value ~ '^-?[0-9]+(\\.[0-9]+)?$'
      GROUP BY 1
      `,
      params,
    ),
  ]);

  const totalGames = parseInt(totalResult.rows[0]?.count ?? '0', 10);
  const pctOf = (n: number, of: number): number => (of > 0 ? Math.round((n / of) * 100) : 0);

  const offhand: OffhandSplit = { shield: 0, orb: 0, none: 0 };
  for (const row of offhandResult.rows) {
    if (row.kind === 'shield' || row.kind === 'orb' || row.kind === 'none') {
      offhand[row.kind] = parseInt(row.count, 10);
    }
  }

  const filledBySlot = new Map(slotResult.rows.map((r) => [r.slot, parseInt(r.filled, 10)]));
  const itemsBySlot = new Map<string, EquipmentItem[]>();
  for (const row of itemResult.rows) {
    const list = itemsBySlot.get(row.slot) ?? [];
    const games = parseInt(row.games, 10);
    list.push({ name: row.name, games, pct: pctOf(games, totalGames) });
    itemsBySlot.set(row.slot, list);
  }
  const slots: EquipmentSlot[] = SLOT_ORDER.map((slot) => ({
    slot,
    label: SLOT_LABELS[slot]!,
    filled: filledBySlot.get(slot) ?? 0,
    items: itemsBySlot.get(slot) ?? [],
  }));

  const resistByProp = new Map(resistResult.rows.map((r) => [r.prop, r]));
  const rows: ResistRow[] = RESIST_PROPS.flatMap(({ prop, label }) => {
    const r = resistByProp.get(prop);
    if (!r) return [];
    const games = parseInt(r.games, 10);
    return [{
      prop,
      label,
      games,
      atLeast: {
        1: pctOf(parseInt(r.ge1, 10), games),
        2: pctOf(parseInt(r.ge2, 10), games),
        3: pctOf(parseInt(r.ge3, 10), games),
      },
    }];
  });
  const resistGames = rows.reduce((max, r) => Math.max(max, r.games), 0);

  return { totalGames, offhand, slots, resists: { games: resistGames, rows } };
}

const fetchEquipmentData = unstable_cache(
  async (cacheKey: string) => {
    const filters = commonFiltersFromCacheKey(cacheKey);
    return {
      data: await getEquipmentData(filters),
      cachedAtUnixMs: Date.now(),
    };
  },
  ['analytics-equipment'],
  { tags: [DB_CACHE_TAG], revalidate: DB_CACHE_REVALIDATE_SECONDS }
);

export async function GET(request: NextRequest) {
  try {
    const filters = parseCommonFilters(new URL(request.url).searchParams);
    if (isCommonFiltersCacheable(filters)) {
      const cached = await fetchEquipmentData(commonFiltersCacheKey(filters));
      return NextResponse.json(cached.data, {
        headers: buildCacheDebugHeaders({
          route: '/api/analytics/equipment',
          cacheable: true,
          cachedAtUnixMs: cached.cachedAtUnixMs,
        }),
      });
    }
    const data = await getEquipmentData(filters);
    return NextResponse.json(data, {
      headers: buildCacheDebugHeaders({ route: '/api/analytics/equipment', cacheable: false }),
    });
  } catch (error) {
    console.error('Equipment API error:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment data' }, { status: 500 });
  }
}
