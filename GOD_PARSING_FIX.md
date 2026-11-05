# Fix: truncated god names and missing piety

Brief for an agent. Read `CLAUDE.md` first. Nothing here has been changed yet.

## The problem

The morgue parser stores the wrong god for about 1,400 games and drops piety
for about 16,800 games (roughly 45% of games that have a god). The database
holds the wrong values, so every analytics view grouped by god shows bogus
rows such as `Wu`, `Sif`, `the`, `The` and `No`.

### Root cause 1: the ending god regex in the stats extractor

`packages/dcss-morgue-parser/src/extractors/stats.ts`, around line 184:

```ts
const godWithPietyMatch = /God:\s+([A-Za-z][A-Za-z ]+?)\s+\[([*]+)\]/.exec(section);
...
const godMatch = /God:\s+([A-Za-z][A-Za-z ]*?)(?:\s|$)/.exec(section);
```

- The first regex only matches a piety display made entirely of stars
  (`[******]`). Modern morgues show unfilled piety as dots (`[****..]`,
  `[......]`), so the first regex fails for any god below max piety.
- The fallback regex stops at the first whitespace, so a multi-word god is
  cut to its first word, and piety is never set.
- `No God` comes out as the god `No` instead of no god.
- Old morgues print `The Shining One` (capital T), and some print bare
  piety stars with no brackets (`God: The Shining One ******`).

Reproduction of the current behaviour:

```
"God:    the Shining One [******]"   god=the Shining One   piety=6
"God:    the Shining One [****..]"   god=the               piety=null
"God:    Sif Muna [***...]"          god=Sif               piety=null
"God:    Wu Jian [**....]"           god=Wu                piety=null
"God: No God"                        god=No                piety=null
"God:    Ashenzari [*****.]"         god=Ashenzari         piety=null
"God:    Lugonu [......]"            god=Lugonu            piety=null
```

Expected: the full canonical name, piety equal to the number of `*`
characters (0 to 6, and `[......]` is 0, not null), and `No God` gives
`god: null`.

The gods extractor (`src/extractors/gods.ts`) already has a more robust path
for the same line: `detectCurrentGod` plus `sanitizeGodLineValue` plus
`cleanGodName` from `dcss-game-data`, which maps any string to the canonical
god name. Reuse that instead of keeping a second, weaker parser. Note that
`sanitizeGodLineValue` also only strips all-star brackets (`\[[*]+\]`), so
widen it to accept dots too.

### Root cause 2: the god history extractor (smaller, needs investigation)

`game_gods` (filled from `godsWorshipped`) has 77 rows with truncated names
(`the` 43, `Wu` 28, `Sif` 6) plus 41 rows stored as `The Shining One` with a
capital T. Almost all truncated rows have `worship_order = 1` and
`started_turn = 0`, which looks like a bogus starting-god record.

Example: `morgue-Wizard1ke-20251210-134128.txt` is an Oni Monk (no starting
god) whose notes say `2673 | Temple | Became a worshipper of the Shining One`
and who ended with Lugonu. The DB has a first worship row of `the` at turn 0.
Find where that row comes from and fix it.

`BACKGROUND_STARTING_GODS` in `gods.ts` uses `'The Shining One'` for Paladin;
the canonical name elsewhere is `the Shining One`. Run every god name through
`cleanGodName` before it leaves the parser so casing is consistent.

## Example morgues

All are on disk under `scripts/streak-downloader/outputs/`. Copy short
excerpts of the relevant lines into tests rather than whole files.

| File | God line in the morgue | Currently stored |
|---|---|---|
| `morgue-Aeongth-20250319-110055.txt` (0.33) | `God:    Wu Jian [*****.]` | `Wu`, piety null |
| `morgue-Aiyanna-20260218-141311.txt` (0.34) | `God:    Ashenzari [*****.]` | `Ashenzari`, piety null |
| `morgue-Wizard1ke-20251210-134128.txt` (0.34) | `God:    Lugonu [......]` | ending god ok, piety null, bogus `the` in history |
| `morgue-78291-20080730-231917.txt` (0.4) | `God: No God` | `No` |
| `morgue-78291-20080803-043404.txt` (0.4) | `God: The Shining One ******` | `The` |
| `morgue-Alg-20110827-165522.txt` (0.9) | `God: The Shining One [******]` | `The Shining One` (wrong case) |

Source URLs if the files are missing locally:

- https://archive.nemelex.cards/morgue/Aeongth/morgue-Aeongth-20250319-110055.txt
- https://crawl.dcss.io/crawl/morgue/Aiyanna/morgue-Aiyanna-20260218-141311.txt
- https://crawl.project357.org/morgue/Wizard1ke/morgue-Wizard1ke-20251210-134128.txt
- https://crawl.akrasiac.org/rawdata/78291/morgue-78291-20080730-231917.txt
- https://crawl.akrasiac.org/rawdata/78291/morgue-78291-20080803-043404.txt
- http://crawl.develz.org/morgues/0.9/Alg/morgue-Alg-20110827-165522.txt

## What to do

1. Write failing vitest cases first in `packages/dcss-morgue-parser/tests/`,
   covering every row of the table above plus `Sif Muna [***...]` and
   `the Shining One [****..]`. Assert both `endingStats.god`,
   `endingStats.piety` and `godsWorshipped`.
2. Fix the stats extractor so it reuses the gods extractor's line handling
   and `cleanGodName`. Keep the fix in the extractors; no parser-wide hacks.
3. Fix the god history bug and the capital-T Shining One.
4. Bump the parser version in `packages/dcss-morgue-parser/package.json`.
5. Run `pnpm test:parser` and `pnpm lint`.
6. Do not touch the database. Reloading is a separate step the owner runs
   (see below).

## Reloading the data (owner runs this)

The direct loader skips games that are already loaded, so it will not fix
existing rows. Use the bulk path, which truncates and reloads:

```bash
cd scripts/morgue-loader
pnpm generate-csv ../streak-downloader/outputs ./csv-output
psql -f ./csv-output/load.sql
pnpm mark:streaks-updated
```

After the reload, the junk rows in the `gods` table (`Wu`, `Sif`, `the`,
`The`, `No`, `The Shining One`) should no longer be referenced and can be
deleted.

## How to verify after the reload

```sql
-- Should return no rows.
SELECT god.name, count(*) FROM games g JOIN gods god ON g.god_id = god.id
WHERE god.name IN ('Wu', 'Sif', 'the', 'The', 'No', 'The Shining One')
GROUP BY 1;

SELECT god.name, count(*) FROM game_gods gg JOIN gods god ON gg.god_id = god.id
WHERE god.name IN ('Wu', 'Sif', 'the', 'The', 'No', 'The Shining One')
GROUP BY 1;

-- Piety should be null only for games with no god.
SELECT count(*) FROM games WHERE god_id IS NOT NULL AND piety IS NULL;
```

Current values before the fix: 1,397 games with a truncated or junk god,
16,812 games with a god but no piety, out of 40,604 games.

The analytics view for gods of 15-rune wins since 0.30 is a good visual
check: it should show a single Wu Jian row and no `Wu` or `the` rows.
