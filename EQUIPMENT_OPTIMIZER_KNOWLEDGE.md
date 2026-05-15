# Crawl Crawler — System Knowledge

This document captures the design, mechanics, and operational knowledge of
the equipment-optimizer end of Crawl Crawler. Drop it into context whenever
you (or an LLM) need to update the system for a new DCSS release, fix a
bug across packages, or extend the optimizer.

For the original feature spec, see
`packages/dcss-game-data/EQUIPMENT_OPTIMIZER_DESIGN.md`. This file is
operational knowledge: how it actually works today and what to touch when
things change.

---

## 1. What the system does

Crawl Crawler parses Dungeon Crawl Stone Soup (DCSS) morgue files and
character dumps and exposes:

- **Per-character viewer** — stats, skills, branches, spells, equipment.
- **Equipment Optimizer** — given the player's inventory, find the legal
  equipment loadout that best satisfies a chosen objective (max rF, max
  sum of resistances, max EV with rF+1 floor, etc.). Supports locked items
  (always keep) and banned items (never equip), live editing, and a
  non-equipment baseline derived from the player's defenses block so
  totals match what DCSS shows in-game.

The optimizer is the most DCSS-version-sensitive part of the system —
that's where this document focuses.

---

## 2. Repository layout

```
apps/web/                          Next.js app. /morgue page hosts everything.
  app/morgue/page.tsx              Tabs: Overview / Skills / Dungeon / Optimizer / Debug.
  components/optimizer-panel.tsx   The interactive optimizer UI (~1100 lines).

packages/
  dcss-game-data/                  Pinned DCSS knowledge base. ⭐ Most update churn.
    dcss-version.json              Pinned commit SHA + date.
    EQUIPMENT_OPTIMIZER_DESIGN.md  Original design spec.
    src/
      species.ts, backgrounds.ts,
      gods.ts, branches.ts,        Existing player-facing taxonomy (pre-optimizer).
      combos.ts, utils.ts, ...
      equipment/                   Optimizer knowledge base (added in this work).
        types.ts                   Property, Contribution, ParsedItem, etc.
        braces.ts                  Brace tokenizer (shared by parser & optimizer).
        properties.ts              Curated ARTP_* + non-ARTP extras (Chemistry, …).
        brands.ts                  Curated SPWPN_* weapon brands.
        egos.ts                    Curated SPARM_* armor egos (mostly auto-parsed).
        weapons.ts                 Weapon base-type registry (mostly extracted).
        armors.ts                  Armor + shield base-type registries.
        jewelry.ts                 Curated ring + amulet effects.
        staves.ts                  Curated staff effects.
        species-equip.ts           Slot capacities per species.
        multi-slot.ts              Multi-slot unrands (Lear's hauberk, …).
        index.ts                   Public re-exports.
        generated/                 ⚠ AUTO-EMITTED. Committed to repo.
          artp.ts, brand.ts, sparm.ts,
          armor-type.ts, weapon-type.ts,
          jewellery-type.ts, stave-type.ts,
          unrand-data.ts
    scripts/
      extract.ts                   Reads DCSS source → emits generated/*.
      verify.ts                    Checks curated covers extracted; ensures SHA matches.
    tests/equipment.test.ts        46 tests covering all curated registries.

  dcss-morgue-parser/              Morgue + character-dump parser.
    src/extractors/
      header.ts                    Version, score, race/bg, dates, runes, gems.
      stats.ts                     Final HP/MP/AC/EV/SH/Str/Int/Dex/God/piety.
      equipment.ts                 LEGACY: 9-slot string equipment view.
      inventory-items.ts           ⭐ Full structured inventory (0.33+ only).
      defenses-summary.ts          ⭐ Runtime totals from "rFire +++" block.
      skills.ts, spells.ts, gods.ts,
      branches.ts, notes.ts,
      actions.ts                   Existing pre-optimizer extractors.
    src/parser.ts                  Wires extractors into MorgueData.
    src/types.ts                   MorgueData shape, exports ParsedItem.
    src/utils.ts                   PATTERNS table + small helpers.
    tests/                         223 tests, including end-to-end on
                                   sample morgues + character dumps.

  dcss-loadout-optimizer/          ⭐ Pure optimizer logic, no I/O.
    src/types.ts                   Loadout, LoadoutScore, Objective, OptimizerInputs.
    src/aggregate.ts               sumContributions + applyCaps.
    src/capacity.ts                Slot usage tally + capacity checks.
    src/legality.ts                Cross-slot rules (2h blocks offhand).
    src/score.ts                   Objective evaluation w/ floors + fill scoring.
    src/search.ts                  Brute-force search w/ cartesian generator.
    src/baseline.ts                computeBaseline(runtimeTotals, equipped).
    src/optimize.ts                Public entry point. Two-phase algorithm.
    tests/                         47 tests across aggregate, capacity, legality,
                                   baseline, optimize.

  sample_morgues/                  Real morgue fixtures for tests.
    *.txt                          Death morgues (pre-0.33 and 0.33+).
    equipment_dumps/               Character dumps (in-game &dump output).
```

DCSS source lives **outside the repo** at `../source/crawl/crawl-ref/source/`
(relative to the repo root), pinned via `dcss-version.json`.

---

## 3. DCSS source pinning

The knowledge base is pinned to a specific DCSS git commit. The currently
pinned commit is in `packages/dcss-game-data/dcss-version.json`:

```json
{
  "commit": "274e6c4f0775ad821a9e0f974ca21d09501f1955",
  "date": "2026-05-10",
  "sourcePath": "../../../source/crawl"
}
```

`verify.ts` runs `git rev-parse HEAD` in `sourcePath` and fails if the
local source HEAD doesn't match — so you can't accidentally regenerate
data from a different DCSS version than what's recorded.

---

## 4. Two-layer data model: generated vs curated

The DCSS knowledge base is split into:

- **Generated** (`src/equipment/generated/*.ts`) — auto-emitted from DCSS
  C++ source by `scripts/extract.ts`. **Committed to the repo** so
  consumers don't need a DCSS source checkout.
- **Curated** (`src/equipment/{properties,brands,egos,jewelry,staves,...}.ts`) —
  hand-written semantic data: "what does this brand actually do," "what's
  the slot cap for Octopode rings," etc.

### What's mechanically extractable

| Data                               | Source location                                | Extractable? |
|------------------------------------|------------------------------------------------|--------------|
| `ARTP_*` enum values               | `artefact-prop-type.h`                         | Yes          |
| `ARTP_*` abbreviations + value type| `artefact.cc::artp_data[]`                     | Yes          |
| `ARTP_*` descriptions + display    | `describe.cc::_get_all_artp_desc_data()`       | Yes          |
| `SPWPN_*` enum + name tables       | `item-prop-enum.h` + `item-name.cc`            | Yes          |
| `SPARM_*` enum + name switches     | `item-prop-enum.h` + `item-name.cc`            | Yes          |
| Weapon `Weapon_prop[]` table       | `item-prop.cc`                                 | Yes          |
| Armor `Armour_prop[]` table        | `item-prop.cc`                                 | Yes          |
| `enum jewellery_type`              | `item-prop-enum.h`                             | Yes          |
| `enum stave_type`                  | `item-prop-enum.h`                             | Yes          |
| Unrand data                        | `art-data.txt` (already a flat data file)      | Yes          |
| Brand semantic effects             | scattered (`item-use.cc`, `attack.cc`, etc.)   | **No** — curate |
| Ego semantic effects               | scattered                                      | **No** — curate |
| Jewelry effects                    | scattered                                      | **No** — curate |
| Staff effects                      | scattered                                      | **No** — curate |
| Species slot rules                 | `player-equip.cc::get_player_equip_slot_count` | Partial — curate |
| Multi-slot unrand flags            | `player-equip.cc::_use_slots()` calls          | Partial — curate |

The extract script (`packages/dcss-game-data/scripts/extract.ts`)
implements the "Yes" rows. Anything else lives in the curated files.

### Verify script (`scripts/verify.ts`)

Currently runs 14 checks:

1. **SHA match** — `dcss-version.json` commit equals `git rev-parse HEAD`
   of the DCSS source.
2. **ARTP coverage** — every non-legacy ARTP has a curated entry in
   `properties.ts::CURATED_ARTP_META`.
3. **ARTP dead references** — no curated entry references a removed ARTP.
4-5. Same coverage/dead-ref for `SPWPN_*` brands.
6-8. Same for `SPARM_*` egos plus a "property refs valid" check (no
   curated ego references a PropertyKey that doesn't exist).
9-11. Same for jewelry.
12-14. Same for staves.

Verify is the safety net for DCSS updates. Run it after every extract.

---

## 5. Updating to a new DCSS version — the playbook

When DCSS 0.35 (or whatever) drops:

```bash
# 1. Pull the new DCSS source.
cd ../source/crawl     # adjust path if your layout differs
git fetch origin
git checkout <new-sha>

# 2. Regenerate all extracted data.
cd -                   # back to repo root
pnpm --filter dcss-game-data extract

# 3. Run verify. It will print which curated entries are missing.
pnpm --filter dcss-game-data verify
# → Example output:
#   ✗ ARTP coverage
#     1 non-legacy ARTP_* entries lack curated metadata.
#     Add entries to CURATED_ARTP_META in src/equipment/properties.ts for:
#       - ARTP_NEW_THING

# 4. Add curated entries for whatever verify flagged.

# 5. Re-run verify until it passes all checks.

# 6. Run all tests.
pnpm --filter dcss-game-data test
pnpm --filter dcss-morgue-parser test
pnpm --filter dcss-loadout-optimizer test

# 7. Smoke test on real morgues / dumps.
#    - At least one sample_morgues/ file
#    - At least one equipment_dumps/ file
#    Verify the Optimizer tab still renders and produces sensible output.

# 8. Update dcss-version.json with the new SHA + date.
echo '{"commit":"<new-sha>","date":"YYYY-MM-DD","sourcePath":"../../../source/crawl"}' \
  > packages/dcss-game-data/dcss-version.json

# 9. Commit.
git add packages/dcss-game-data packages/sample_morgues
git commit -m "Update DCSS data to <short-sha>"
```

See `packages/dcss-game-data/README.md` for the same procedure with more
prose.

---

## 6. The data model

### 6.1 Properties (`equipment/properties.ts`)

A `Property` is one effect an item can contribute. Properties live in a
sparse `Record<string, number>` map keyed by their **morgue brace
abbreviation** (`'rF'`, `'Str'`, `'^Fragile'`, `'+Blink'`).

```typescript
interface Property {
  key: PropertyKey;             // morgue abbreviation
  displayName: string;
  category: 'resistance' | 'stat' | 'defense' | 'offense' | 'pool' |
            'regen' | 'utility' | 'spell_school' | 'wizardry' | 'downside';
  rendering: 'pip' | 'int' | 'bool';
  bipolar: boolean;             // can value be negative?
  cap?: { min?: number; max?: number };
  artpEnum?: string;            // 'ARTP_FIRE' if applicable
  source?: { file: string; line: number };
  legacy?: boolean;             // TAG_MAJOR_VERSION == 34 stuff
  description?: string;
}
```

The registry has two sources:

- **67 ARTP-derived entries** (from `generated/artp.ts`): every
  `ARTP_*` from DCSS source, including 9 legacy ones.
- **24 non-ARTP entries** (`CURATED_EXTRA_PROPERTIES` in
  `properties.ts`): effects that appear on items but don't have an ARTP
  enum. These cover ego-only flags:
  - **Utility flags**: `Reflect`, `Spirit`, `Chemistry`, `Dissipation`,
    `Hurl`, `Repulsion`, `Shadows`, `Infuse`, `Mayhem`, `Guile`,
    `Energy`, `Snipe`, `Archery`, `Command`, `Death`, `Resonance`,
    `Parrying`, `Pyromania`, `Stardust`, `Mesmerism`, `Attunement`
  - **Downside flags**: `Ponderous`, `Light`, `Glass`

These exist because the user wants the parser to tokenize morgue braces
like `{Chemistry rPois Int+3}` without warnings AND wants the optimizer
to be able to score "items with Reflect" or similar.

**Rendering modes:**
- `pip`: `rF+`, `rC++` — display as `+` chars; value = pip count signed.
- `int`: `Str+3`, `Slay-2` — display as signed number.
- `bool`: `SInv`, `+Blink`, `^Fragile` — value of 1 means "present".

**Caps:** mirror DCSS's equipment-only caps. rF/rC/rN cap at +3; Will
caps at +5; binary resistances (rPois, rElec, rCorr, rMut) cap at +1.
Stats, defenses, etc. are uncapped.

### 6.2 Weapon brands (`equipment/brands.ts`)

23 real brands (excluding sentinels, debug, and species-specific brands
like `SPWPN_ACID` from acid bite). For now, **all brand contributions
are empty `[]`** — DCSS weapon brands are on-hit effects (extra fire
damage, vampirism heal, etc.), not passive stat bonuses, so they don't
aggregate cleanly into the property model. The optimizer treats them
as flavor text. If DCSS ever adds a brand with a passive contribution,
add it to that brand's `contributions` in `brands.ts`.

`SPWPN_PROTECTION` is the closest exception — it grants a temporary
AC+7 buff on attack — but it's still triggered, not passive, so we
leave its contributions empty.

### 6.3 Armor egos (`equipment/egos.ts`)

45 real egos. **Most auto-parse** from their DCSS terse name string:
- `SPARM_FIRE_RESISTANCE` → terse name `"rF+"` → `[{prop:'rF', value:1}]`
- `SPARM_STRENGTH` → `"Str+3"` → `[{prop:'Str', value:3}]`
- `SPARM_RESISTANCE` → `"rC+ rF+"` → two contributions

The auto-parser is in `equipment/braces.ts::parseTerseToContributions`.
It's shared with the morgue parser's artefact brace tokenizer.

Egos whose terse names don't decode (`Mayhem`, `Snipe`, `Glass`, …)
auto-parse against the **non-ARTP extra properties** we curated for
exactly this purpose (see §6.1).

The few egos that map to something more complex (`SPARM_REFLECTION`
gives `Reflect+1` AND `SH+5`) have explicit `contributions` overrides
in `CURATED_EGO_META`.

### 6.4 Weapons & armors (`weapons.ts`, `armors.ts`)

Thin wrappers over `generated/weapon-type.ts` and `generated/armor-type.ts`.
The extract script parses `Weapon_prop[]` and `Armour_prop[]` C++ arrays
to capture: enum name, display name, base damage/AC, skill (weapons),
slot (armors), 1h vs 2h size thresholds.

`weapons.ts::getWeaponHands(weapon, playerSize)` computes 1h vs 2h for a
given player size. Default assumes `SIZE_MEDIUM`.

`armors.ts` exports both `ARMOR_BASE_TYPES` (single-slot armors) and
`SHIELD_BASE_TYPES` (offhand items: buckler, kite shield, tower shield,
orb). Shields use `baseSH` as the same field where armors store `baseAC`.

### 6.5 Jewelry (`equipment/jewelry.ts`)

Fully hand-curated. Each ring/amulet has innate `contributions`:

- **Enchantment-scaled**: ring of protection → `[{prop:'AC', fromEnchant:'plus'}]`
- **Fixed**: ring of fire resistance → `[{prop:'rF', value:1}]`
- **Empty**: amulet of guardian spirit → `[]` + uses non-ARTP `Spirit` flag

If DCSS adds a new ring/amulet, `verify.ts` flags it; add an entry to
`CURATED_JEWELRY` in `jewelry.ts`.

### 6.6 Staves (`equipment/staves.ts`)

7 modern staves, hand-curated. Each gives a spell-school enhancer
(`Fire`, `Ice`, `Alch`, `Necro`, `Conj`, `Air`, `Earth`) plus a
resistance for the elemental ones. Modeled as 1h weapons (`slot:
'weapon'`, `hands: 1`) so they go in the weapon slot like other
melee weapons.

### 6.7 Species equipment rules (`equipment/species-equip.ts`)

`SpeciesEquipmentRules` per species:
- `capacity: SlotCapacity` — per-slot counts (`ring: 8` for Octopode,
  etc.)
- `twoHanderBlocksOffhand: boolean` — universal `true` except Formicid

The map covers species with non-default rules. Unknown/unlisted species
fall back to `DEFAULT_CAPACITY` (human-like) via `getSpeciesEquipmentRules`.

Currently curated:
- **Octopode (Op)**: 8 rings, no body/gloves/boots/cloak
- **Felid (Fe)**: no weapons or armor — rings + amulet only
- **Naga (Na) / Palentonga (Pa)**: barding instead of boots
- **Coglin (Cg)**: dual wield + gizmo slot
- **Formicid (Fo)**: 4 rings, `twoHanderBlocksOffhand: false`
- **Draconian (Dr)**: no body armor (wings)
- **Spriggan (Sp) / Troll (Tr) / Ogre (Og) / Kobold (Ko)**: size-based
  gloves/boots restrictions
- **Poltergeist (Po)**: weapon + ring + amulet only

When DCSS adds a new species, add its capacity overrides here.

### 6.8 Multi-slot unrands (`equipment/multi-slot.ts`)

Two distinct mechanics:

1. **OCCUPIES multiple slots** — Lear's Hauberk fills body+helmet+gloves+boots.
   Modeled with `occupiedSlots: ItemSlot[]`. The parser sets these on the
   `ParsedItem.slots` when it sees this unrand.
2. **GRANTS extra slots** — Skull of Zonguldrok adds a helmet slot,
   Finger Amulet adds a ring slot, etc. Recorded in `grantsExtraSlots`
   but **not yet consumed by the optimizer** (deferred work).

If DCSS adds either kind, append an entry here.

### 6.9 Unrand data (`generated/unrand-data.ts`)

Auto-extracted from `art-data.txt`. Each entry has the unrand's display
name, the auto-generated `UNRAND_FOO` key, and the object class +
subtype (`OBJ_WEAPONS / WPN_DOUBLE_SWORD`). The parser uses this to
match unrand items by name (`UNRAND_BY_NAME`).

If DCSS removes an unrand, `verify.ts` will flag stale references in
`multi-slot.ts`. Update accordingly.

---

## 7. Parser (`dcss-morgue-parser`)

### 7.1 Header

`extractors/header.ts` handles two distinct file formats:

- **Death morgue** — `<score> <name> the <title> (level <N>, <hp>/<hp> HPs)`
  via `PATTERNS.scoreLine`.
- **Character dump** (in-game `&dump` output) — `<name> the <title>
  (<RaceCode><BgCode>) Turns: <N>, Time: ...` via
  `PATTERNS.characterDumpPlayer`. Race/background codes resolved via
  `getSpeciesName` / `getBackgroundName` from `dcss-game-data`. Score
  stays null; XL extracted from the stats block.

If DCSS changes either header format, this is where to patch it.

### 7.2 Inventory items (`extractors/inventory-items.ts`)

**Version gate: 0.33+**. For older versions, returns `null` and the
existing legacy `extractors/equipment.ts` (9-slot string view) still
runs.

Walks the `Inventory:` section by category header (`Hand Weapons`,
`Armour`, `Magical Staves`, `Jewellery`), then per-item:

1. Strip leading article (`the `/`a `/`an `) and `cursed ` keyword.
2. Detect `(worn)` / `(weapon)` / `(left hand)` / `(right hand)` /
   `(around neck)` / `(on left finger)` / etc. → `isEquipped: true`.
3. Strip enchantment prefix (`+5 ` / `-2 `).
4. Extract quoted artefact name (`"Cryptic Augurer"`).
5. Tokenize `{...}` braces via shared `parseArtefactBraces`.
6. Lookup against `UNRAND_BY_NAME`, base-type registries, or fall back
   to substring scan.
7. For magical staves, read `[staff of cold]` continuation marker for
   randart base type identification.
8. For randart jewelry, read `[ring of fire]` continuation marker.
9. Compute `contributions` map: base innate + brand/ego + artefact
   props. This is the canonical "what does this item give me" that the
   optimizer consumes.

**Important quirks:**

- Ashenzari cursed items use a multi-comma brace format
  (`{venom, Int+4 SInv, Dev, Melee}`). The brace tokenizer splits on
  whitespace AND commas after peeling off the leading brand token.
- Weapon artefact braces have the **brand as the first comma-separated
  token** (e.g. `{rebuke, rC+ rCorr ...}`). Non-weapon brace blocks are
  pure space-separated property tokens.
- Brand names can collide with property abbreviations
  (`drain` brand vs `Drain` property). Disambiguation: position (first
  comma-token) and casing (brands lowercase, properties capitalized).

### 7.3 Defenses summary (`extractors/defenses-summary.ts`)

Parses the resistance/defense block in the morgue header (the
`rFire +++`, `Will +++..`, `HPRegen 0.52/turn` block).

Display-name mapping:
- `rFire` → `rF`
- `rCold` → `rC`
- `rNeg` → `rN`
- `rPois`/`rElec`/`rCorr`/`rMut` → same key
- `SInv`, `Will`, `Stlth` → same key
- `HPRegen` → `Regen` (decimal value)
- `MPRegen` → `RegenMP` (decimal value)

Pip values are counted from `+` characters before the percentage column
or attribution column. Output is `ContributionMap` stored on
`MorgueData.runtimeTotals`.

The optimizer's baseline (`computeBaseline`) subtracts equipped-item
contributions from `runtimeTotals` to derive what species/god/mutations/
form contribute.

---

## 8. Optimizer (`dcss-loadout-optimizer`)

### 8.1 Two-phase algorithm

`optimize(inputs)`:

**Phase 1 — primary optimization (combinatorial, fast)**

1. Identify "relevant" properties for the objective:
   - `maximize: { prop }` → `{prop}`
   - `maximize_sum: { props[] }` → all of them
   - any objective with `floors` → also include all floor props
2. Filter items to those contributing to at least one relevant property
   (plus multi-slot items and 2h weapons, which interact with legality).
3. Search exhaustively over slot combinations (`search.ts::searchLoadouts`)
   using a generator-based cartesian product. Each candidate is scored
   via `scoreLoadout` + `evaluateObjective` with `fillProps=[]`.

**Phase 2 — greedy fill (slot-by-slot)**

For each slot with remaining capacity:
1. Find single-slot candidates not yet equipped, contributing to any
   fill prop.
2. Of those, pick the one that maximizes the fill score
   (sum of `fillProps' totals`) without reducing the primary objective
   score or breaking legality.
3. Add it; repeat until slot full or no candidates.

This is **suboptimal globally** (greedy phase 2 misses interactions) but
massively faster than searching over the wider fill set. Without it,
"Maximize EV" with one EV item would leave 8 other slots empty.

**Fill props** (`DEFAULT_FILL_PROPS`): all resistances, AC/EV/SH, Will,
Stlth, Slay, stats, HP/MP, regen, useful utility flags (SInv, Fly,
+Blink, Reflect, Spirit). Pass `fillProps: []` in `OptimizerInputs` to
disable filling entirely.

### 8.2 Scoring (`score.ts::evaluateObjective`)

Three-tier layered score:

```
score = primary + uncapped * 1e-3 + fill * 1e-6
```

Each tier dominates the next so it never disturbs the level above.
This gives:
- Primary: the objective's actual value (capped)
- Uncapped tiebreaker: `+4 rF` beats `+3 rF` when both cap at 3
- Fill: empty slots with helpful items break further ties

Floor violations return `-Infinity` (illegal). Slot capacity violations
also return `-Infinity` via `scoreLoadout.violations`.

### 8.3 Locked items (`OptimizerInputs.lockedItems`)

Items the user wants pinned regardless of optimization. Implementation:

1. Reduce species capacity by locked items' slot occupation
2. Exclude locked items from the candidate pool
3. Prepend locked items to every scored loadout (so legality with the
   rest still applies — a locked 2h weapon prevents picking offhand)

The UI exposes this via the lock icon in each `WORN EQUIPMENT` slot row
and tracks `lockedIds: Set<string>` keyed by `ParsedItem.id`.

### 8.4 Banned items (UI only — not in optimizer types)

UI tracks `bannedIds: Set<string>`. Before calling `optimize()`, the UI
filters `inventoryItems` to exclude banned items. The optimizer itself
is unaware. Banning an equipped item auto-unequips it (and drops any
lock on it).

### 8.5 Baseline (`baseline.ts::computeBaseline`)

```typescript
baseline[prop] = max(0, runtimeTotals[prop] - sum(equippedItems[*].contributions[prop]))
```

What the player gets from species/god/mutations/form. Passed to
`optimize()` as `baseline`, then added to every loadout score so totals
match in-game numbers.

Clamps at 0 — DCSS capping the runtime total below our equipment sum
shouldn't produce a negative baseline.

### 8.6 Constraints (UI: "Require at least")

UI manages `floors: { id, prop, value }[]`. Built into the
`Objective.floors` map and passed to the optimizer. The strictest
floor wins if the user adds two for the same prop.

### 8.7 Where complexity lives

`optimize()` is ~60 lines. `searchLoadouts()` is the brute-force
machinery. `greedyFillEmptySlots()` is phase 2. Pruning
(`relevantProperties` + `itemIsRelevant`) is what keeps phase 1 tractable.

If the optimizer feels slow on Octopode (8-ring slot), look at
`relevantProperties` — narrowing it cuts search size dramatically.

---

## 9. UI (`apps/web`)

### 9.1 `/morgue` page

Single big component (`apps/web/app/morgue/page.tsx`, ~2600 lines)
with five tabs:

- **Overview** — character info, stats, runes, gems, summary equipment
- **Skills** — skill table + progression
- **Dungeon** — branch visit summary
- **Optimizer** — embeds `<OptimizerPanel />` from
  `components/optimizer-panel.tsx`
- **Debug** — raw parsed-data tree

Top of page: URL input that fetches a morgue (or character dump) URL,
parses it via `parseMorgue` from `dcss-morgue-parser`, and renders the
tabs.

The Optimizer tab is gated on `data.inventoryItems` being non-null
(0.33+ requirement). For pre-0.33 morgues it shows a friendly
"requires 0.33+" message.

### 9.2 Optimizer panel (`components/optimizer-panel.tsx`)

Three-column layout:

```
INVENTORY            │ WORN EQUIPMENT        │ MAXIMIZE
(every item, click   │ (slot rows, click to  │ ┌──────────┐
 to equip; ban icon  │  unequip; lock icon   │ │ dropdown │
 excludes from       │  pins through         │ └──────────┘
 optimize)           │  optimize)            │ REQUIRE AT LEAST
                     │                       │ [rN  ≥ 3 ×]
                     │                       │ [Will ≥ 3 ×]
                     │                       │ [+ Add constraint]
                     │                       │
                     │                       │ LIVE TOTALS
                     │                       │ ┌──────────┐
                     │                       │ │ AC EV SH │
                     │                       │ │ rF ■■■   │
                     │                       │ │ rC ■■■   │
                     │                       │ │ ...      │
                     │                       │ │ OTHER    │
                     │                       │ │ Reflect  │
                     │                       │ │ Chemistry│
                     │                       │ └──────────┘
```

State held in the panel:
- `loadout: ParsedItem[]` — what's currently "worn"
- `lockedIds: Set<string>` — pinned items
- `bannedIds: Set<string>` — excluded items
- `selectedPresetId: string` — Maximize dropdown
- `floors: Floor[]` — constraint list
- `pending: boolean` (via `useTransition`) — optimize in flight

Initial `loadout` = currently-equipped items from the morgue. So the
tab opens showing the player's current setup, totals matching in-game.

**Color palette**: each property gets a Tailwind color (rF red, rC
cyan, rN purple, rPois green, rElec yellow, rCorr amber, Will blue,
Stlth slate, AC/EV/SH amber, Slay red, stats purple, etc.). Bool flags
render as chips with property-specific borders/backgrounds.

**Pip rendering**: pip-rendered properties show as colored boxes (one
per cap level). Negative values render as red boxes from the right.

---

## 10. Common update scenarios

### "DCSS added a new ARTP"

1. Run `extract` — new entry appears in `generated/artp.ts`.
2. `verify` fails: "ARTP_NEWPROP needs curated metadata".
3. Add an entry to `CURATED_ARTP_META` in `properties.ts` with category,
   displayName, cap (if any).
4. If the property is a downside flag or has unusual rendering, also
   check `chipStyle(prop)` in `apps/web/components/optimizer-panel.tsx`
   — the default for unknown properties is `NEUTRAL_CHIP`. Add a custom
   color there if needed.
5. Consider whether to add it to `DEFAULT_FILL_PROPS` (in `optimize.ts`)
   so the optimizer fills slots with items contributing to it.
6. Consider whether to add it to `FLOOR_OPTIONS` (in
   `optimizer-panel.tsx`) so users can set constraints on it.

### "DCSS added a new species"

1. The species enum is auto-extracted but the slot rules aren't.
2. Add an entry to `SPECIES_EQUIPMENT_RULES` in `species-equip.ts` with
   the species code, capacity overrides, and notes.
3. If `getSpeciesCode(name)` resolves the new species name, the UI will
   pick up the rules automatically.

### "DCSS changed an existing armor ego's effect"

1. The ego's terse name comes from `generated/sparm.ts`; if the terse
   name changed, the auto-parse may produce different contributions.
2. If the effect changed semantically (different stats, different
   slot), update the override in `CURATED_EGO_META` in `egos.ts`.

### "DCSS added a new weapon brand"

1. `extract` picks up the enum value and terse/verbose names.
2. `verify` flags it: "SPWPN_NEWBRAND needs curated metadata".
3. Add an entry to `CURATED_BRAND_META` in `brands.ts` with notes.
   Contributions stay `[]` unless the brand grants a true passive bonus.

### "DCSS added a new unrand"

1. `extract` reads `art-data.txt` and adds to `generated/unrand-data.ts`.
2. The parser will recognize it via `UNRAND_BY_NAME` automatically.
3. If it's a **multi-slot** unrand (occupies multiple slots) or **grants
   extra slots**, add an entry to `MULTI_SLOT_UNRANDS` in `multi-slot.ts`.

### "DCSS changed the morgue header format"

1. Update `PATTERNS` in `dcss-morgue-parser/src/utils.ts`.
2. Update `extractors/header.ts` to call the new pattern.
3. Add a fixture morgue under `packages/sample_morgues/` and a test
   asserting key fields parse.

### "DCSS changed the inventory section format"

1. Most parsing lives in `extractors/inventory-items.ts`.
2. Key extension points:
   - `preparseItem()` — strips article, enchantment, cursed marker,
     braces, slot markers; detects artefact-ness
   - `parseArtefactBraces()` (in `dcss-game-data/equipment/braces.ts`)
     — tokenizes brace content
   - Per-category parsers (`parseWeaponItem`, etc.) — base-type lookup
3. Be prepared to update the `MIN_INVENTORY_PARSE_VERSION` constant if
   the new format isn't backward-compatible with 0.33.

### "DCSS changed the defenses summary format"

1. Update `extractors/defenses-summary.ts`.
2. The function expects a known prefix list (`rFire`, `rCold`, etc.)
   to anchor the block; widen it if DCSS adds new defense lines.

---

## 11. Testing strategy

- **`dcss-game-data` tests** (46): primarily check that curated registries
  cover everything extracted, that property categories make sense, and
  that the ego auto-parser produces expected `Contribution[]` for known
  inputs.
- **`dcss-morgue-parser` tests** (229): cross-version compatibility
  (parses many sample morgues without errors), specific field
  assertions on real fixtures, character-dump format coverage,
  defenses-summary regression tests, brace-tokenizer unit tests.
- **`dcss-loadout-optimizer` tests** (47): aggregate/cap math, slot
  capacity/legality, score evaluation across objective kinds, end-to-end
  optimization on synthetic loadouts AND a real 0.34 morgue fixture.

After any DCSS update, all three test suites should pass. Failures here
are usually informative — they tell you which assumption broke.

---

## 12. Gotchas and non-obvious decisions

### Versioning
- **0.33+ is the cutoff** for structured inventory parsing. Older
  morgues fall back to the legacy 9-slot string equipment view.
- Character dumps **don't have a score** but DO have the resistance
  block and inventory section — the optimizer works on them.

### Property model
- All property values are stored as **signed integers**. Pip rendering
  (`+`, `-`) and bool rendering ("presence") are display concerns
  handled by `Property.rendering`.
- **Negative pips for downsides** (`*Slow`, `^Drain`) — these are
  bool-rendered properties that just happen to have a downside
  category. They're not displayed as negative; their presence is the
  downside.
- The **non-ARTP extra properties** (Chemistry, Reflect, etc.) are not
  in the DCSS `ARTP_*` enum. They exist solely so the parser can
  tokenize ego-only flags and the UI can render them.

### Brace parsing
- Brand vs property collision: `drain` is a brand, `Drain` is a
  property (ARTP_DRAIN abbreviation `^Drain`). Disambiguated by
  position (first comma-token) and casing.
- Multi-comma Ashenzari format: `{venom, Int+4 SInv, Dev, Melee}`. The
  brand is the first comma-token; the rest is comma-OR-whitespace
  separated tokens.
- Unknown tokens collected in `unknownTokens` but don't fail parsing.

### Optimizer
- **Greedy fill is suboptimal** in pathological cases (interactions
  across slots) but >1000× faster than including fill props in the
  combinatorial phase. The trade-off is intentional.
- **Banned items** are filtered at the UI layer, not in the optimizer.
  This keeps the optimizer API simpler.
- **Locked items** ARE in the optimizer API (`OptimizerInputs.lockedItems`)
  because they affect slot capacity and legality checks during the
  combinatorial search.
- Phase 2 fill **respects floors**: if no loadout can satisfy the
  primary objective (e.g., rF+2 floor with no rF items available),
  the optimizer returns the empty loadout rather than polluting with
  items that won't reach the floor.

### Species / race lookup
- Death morgues have a `Began as a Demigod Earth Elementalist on
  <date>` line that the parser handles via `parseRaceBackground`.
- Character dumps have `<name> the <title> (<RaceCode><BgCode>)` (e.g.
  `(DsEE)`). Race code maps to species name via `getSpeciesName('Ds')`
  → `"Demonspawn"`.
- **Draconian** is normalized: morgues say "Red Draconian", "Black
  Draconian", etc. The parser captures the color in
  `MorgueData.speciesData.color` and sets `race = 'Draconian'`.

### Coding conventions
- All packages use **strict TS** with `noUncheckedIndexedAccess`.
  Watch for `T | undefined` from array/object indexing — explicit
  guards needed.
- Workspace structure is `pnpm` workspaces. Use
  `pnpm --filter <package> <command>`.
- The web app's `next.config.mjs` has `typescript.ignoreBuildErrors:
  true`. Don't rely on this — always check `tsc --noEmit` manually.

### Things not yet handled
- **Multi-slot "grants extra slots"** unrands (Skull of Zonguldrok,
  Finger Amulet, etc.) are recorded in `MULTI_SLOT_UNRANDS` with a
  `grantsExtraSlots` field but **the optimizer doesn't yet apply
  that bonus to species capacity**. Future work.
- **Mutations / god gifts / form contributions** are derived from the
  baseline subtraction; they're not separately modeled. The total
  matches in-game but the UI can't break down "from species" vs "from
  Vehumet" vs "from a mutation".
- **Tower shield spell-success penalty** is mentioned in
  `ShieldBaseType.innateContributions` comments but not actually
  populated. It's dynamic (depends on Shields skill + Str) so a static
  contribution would be misleading.

---

## 13. Quick reference

| Want to...                              | Look at                                       |
|-----------------------------------------|-----------------------------------------------|
| Add a new ARTP                          | `properties.ts::CURATED_ARTP_META`            |
| Add a new species                       | `species-equip.ts::SPECIES_EQUIPMENT_RULES`   |
| Add a new ego                           | `egos.ts::CURATED_EGO_META`                   |
| Add a new brand                         | `brands.ts::CURATED_BRAND_META`               |
| Add a new ring/amulet effect            | `jewelry.ts::CURATED_JEWELRY`                 |
| Add a new staff effect                  | `staves.ts::CURATED_STAVES`                   |
| Add a multi-slot unrand                 | `multi-slot.ts::MULTI_SLOT_UNRANDS`           |
| Add a non-ARTP property (Chemistry-like)| `properties.ts::CURATED_EXTRA_PROPERTIES`     |
| Add a new objective preset              | `optimizer-panel.tsx::OBJECTIVE_PRESETS`      |
| Add a new floor-able property           | `optimizer-panel.tsx::FLOOR_OPTIONS`          |
| Add property color                      | `optimizer-panel.tsx::PROP_STYLE`             |
| Change pin DCSS version                 | `dcss-version.json`                           |
| Run extraction                          | `pnpm --filter dcss-game-data extract`        |
| Run verification                        | `pnpm --filter dcss-game-data verify`         |
| Run all tests                           | `pnpm --filter "*" test`                      |
