# Equipment Optimizer — Design

Cross-cutting design for an Equipment Optimizer feature that lets DCSS players
maximize a chosen objective (e.g. rFire, total resistances, EV with rF+ floor)
across all the items in their inventory. This doc anchors in
`packages/dcss-game-data` because that package owns the knowledge base every
other piece depends on, but the design spans the parser, a new optimizer
package, and update tooling.

Status: Design. Not yet implemented.

---

## 1. Goal

Given a parsed morgue file containing every item in the player's inventory,
produce a UI that lets the player pick an objective (e.g. "maximize rFire",
"maximize total elemental resistances", "maximize EV while keeping rF+") and
returns the best legal equipment loadout for that objective, respecting all
slot constraints (species-specific slot counts, two-hander vs shield,
multi-slot unrands, etc.).

The optimizer scores loadouts using the same property model DCSS uses
internally — resistances as pip-sums, stats as signed integers, abilities as
booleans — so that an optimizer score line-up matches what the player would
actually see in-game when they equip that loadout.

## 2. Scope

**In scope (v1):**

- All standard equipment slots and items
- Weapon brands, armor egos, magical staff types, jewelry types
- Artefact (randart and unrand) properties via tokenization of the `{...}`
  braces format
- Multi-slot unrands (Lear's Hauberk, etc.)
- Spell-school enhancers (Conj, Hex, Summ, Necro, Tloc, Fire, Ice, Air, Earth,
  Alch, plus Wiz/Archmagi) as optimizer objectives
- Species-specific slot capacities (Octopode rings, Naga barding, Felid
  no-armor, Coglin/Formicid dual wield, Draconian no-body-armor, etc.)

**Out of scope (v1):**

- Curses (defunct in modern DCSS)
- Mutations, god gifts, form transformations as input to scoring (added later)
- Spell selection or skill optimization
- Item identification status (assume all relevant items are identified)
- Item generation / loot prediction

**Deferred:**

- Mutation/god/form contributions to aggregated totals (Phase 5+, see §11)
- Comparison views across multiple objectives
- Auto-suggesting which items to drop from inventory

## 3. DCSS background

This section documents how DCSS itself models equipment so future readers
don't need to spelunk the C++ source. All file references are relative to
`source/crawl/crawl-ref/source/` in the pinned DCSS checkout (commit
`274e6c4f0775ad821a9e0f974ca21d09501f1955`, dated 2026-05-10).

### 3.1 Morgue equipment output

- `chardump.cc::dump_char()` orchestrates morgue generation (line 191).
- `chardump.cc::_sdump_inventory()` (line 935) writes the inventory section,
  organized by object class (Hand Weapons, Missiles, Armour, Magical Staves,
  Jewellery, Wands, Scrolls, Potions, Books, Miscellaneous).
- Each item line uses `item.name(DESC_INVENTORY_EQUIP)` for the header, then
  `chardump_desc(item)` appends artefact properties if
  `is_dumpable_artefact(item)` is true.
- The resistance/defense summary at the top of the morgue is built in
  `output.cc::_get_overview_resistances()` (line 2582), composed via
  `_resist_composer()`. Useful as an oracle for testing aggregation.

### 3.2 Slot model

Defined in `equipment-slot.h` (lines 3–60):

```
SLOT_WEAPON         one-handed or two-handed weapon
SLOT_OFFHAND        shield or off-hand weapon
SLOT_BODY_ARMOUR
SLOT_HELMET
SLOT_GLOVES
SLOT_BOOTS
SLOT_BARDING        species that can't wear boots (Naga, Palentonga)
SLOT_CLOAK
SLOT_RING           N slots, species-dependent
SLOT_AMULET
SLOT_GIZMO          Coglin only

SLOT_WEAPON_OR_OFFHAND   Coglin dual-wield
SLOT_HAUNTED_AUX         Poltergeist flex slot
SLOT_TWOHANDER_ONLY      Fortress Crab — two-hander, no shield
```

Species-specific slot counts come from
`player-equip.cc::get_player_equip_slot_count()` (lines 100–260):

| Species | Notable difference |
|---|---|
| Octopode | 8 rings; no body armor / gloves / boots / cloak |
| Naga / Palentonga | barding instead of boots |
| Felid | no armor, no weapons |
| Coglin | two weapon slots + gizmo |
| Formicid | dual wield + 4 rings |
| Draconian | no body armor |

Cross-slot constraint: a two-handed weapon blocks the offhand slot
(universal).

### 3.3 Three property systems

Items can have effects from three distinct sources, which combine
additively:

1. **Weapon brands** (`enum brand_type` in `item-prop-enum.h`, ~25 values):
   `SPWPN_FLAMING`, `SPWPN_PROTECTION`, `SPWPN_VAMPIRISM`, etc. One per
   weapon, mutually exclusive.

2. **Armor egos** (`enum special_armour_type` in `item-prop-enum.h`, 47
   values): `SPARM_FIRE_RESISTANCE`, `SPARM_RESISTANCE`,
   `SPARM_INTELLIGENCE`, `SPARM_SPIRIT_SHIELD`, etc. One per armor piece,
   mutually exclusive.

3. **Artefact properties** (`enum artefact_prop_type` in
   `artefact-prop-type.h`, 100+ values): `ARTP_FIRE`, `ARTP_STRENGTH`,
   `ARTP_SLAYING`, `ARTP_FRAGILE`, `ARTP_ENHANCE_FIRE`, etc. Multiple per
   randart/unrand, stackable across items.

These render in the morgue differently:

- **Brands** appear as the item name suffix: `+9 demon trident of flaming`.
- **Egos** also appear as the item name suffix:
  `+3 leather armour of fire resistance`.
- **Artefact properties** appear in braces with abbreviations and values:
  `the +5 quarterstaff of Hiorororua {rebuke, rC+ rCorr Str-2 Int+3}`.

For a non-artefact item, the morgue does not show its brand/ego effects in
braces — only the item name reveals them. So the optimizer cannot rely on
brace-tokenization alone; it needs a static brand/ego table.

The morgue's resistance summary block (lines like
`rFire   + + +  (20%)    a - cold staff "Elf's Curse" {rC+ rCorr SInv Conj Ice Earth}`)
does include condensed braces for non-artefacts (e.g.
`Y - +3 buckler {AC+3}`). Useful as a cross-check oracle but not a source of
truth.

Artefact abbreviations come from `describe.cc::_randart_prop_abbrev()` (line
491); descriptions from `_randart_propnames()` (line 581).

### 3.4 Aggregation

Resistances/defenses shown in the morgue are computed at runtime by:
`player_res_fire(false)`, `player_res_cold(false)`, `player_prot_life(false)`,
`player_res_poison(false)`, `player_res_electricity(false)`,
`player_res_corrosion(false)`, `you.can_see_invisible()`,
`player_willpower() / WL_PIP`, `player_regen()`, `player_mp_regen()`.

Each function sums contributions from: species base, god bonuses, form,
mutations, and equipped items. For v1 the optimizer only computes equipment
contributions; the player can add their non-equipment base mentally. Phase 5+
adds the rest.

## 4. Architecture

```
                   ┌─────────────────────────┐
                   │   dcss-game-data        │ ← Knowledge base
                   │   (properties, brands,  │
                   │    egos, base types,    │
                   │    species rules,       │
                   │    unrands)             │
                   └────────────┬────────────┘
                                │
              ┌─────────────────┼───────────────────┐
              │                 │                   │
   ┌──────────▼──────────┐  ┌───▼──────────┐  ┌────▼─────────────┐
   │ dcss-morgue-parser  │  │ NEW:         │  │ extract scripts  │
   │ (extended to parse  │  │ dcss-loadout │  │ (read DCSS source│
   │  full inventory +   │  │ -optimizer   │  │  → generated/*)  │
   │  produce ParsedItem)│  │              │  │                  │
   └──────────┬──────────┘  └───┬──────────┘  └──────────────────┘
              │                 │
              │                 │
              └────────┬────────┘
                       │
              ┌────────▼──────────┐
              │   apps/web        │
              │   /optimizer page │
              └───────────────────┘
```

**Package responsibilities:**

- `dcss-game-data` — static registries of properties, brands, egos, base item
  types, species slot rules, unrand list, multi-slot mapping. Also hosts the
  extract/verify scripts.
- `dcss-morgue-parser` — extended to parse the full inventory section (not
  just equipped), and to produce `ParsedItem` objects with pre-computed
  contribution maps.
- `dcss-loadout-optimizer` (new package) — pure functions: capacity check,
  legality, aggregation, search. No UI.
- `apps/web` — `/optimizer` page that ingests a morgue, lets the player
  choose an objective, calls the optimizer, renders results.

## 5. Data model

All shapes are TypeScript. Names are illustrative; final names get nailed
down at implementation.

### 5.1 Properties

```typescript
type PropertyKey = string;  // 'rF', 'Str', 'SInv', 'Conj', etc.

type PropertyCategory =
  | 'resistance'    // rF, rC, rN, rPois, rElec, rCorr, rMut
  | 'stat'          // Str, Int, Dex
  | 'defense'       // AC, EV, SH
  | 'offense'       // Slay, BaseAcc, BaseDam
  | 'pool'          // HP, MP
  | 'regen'         // HPRegen, MPRegen
  | 'utility'       // Stlth, Will, SInv, Fly, +Blink, Spirit,
                    // Reflect, Harm, Acrobat, Rampage
  | 'spell_school'  // Conj, Hex, Summ, Necro, Tloc, Fire, Ice, Air, Earth, Alch
  | 'wizardry'      // Wiz, Archmagi
  | 'downside';     // Drain, Slow, Angry, Fragile, Contam, NoPotionHeal,
                    // Ponderous, Noise, NoSpell, NoTele

type Property = {
  key: PropertyKey;
  displayName: string;        // 'Fire Resistance'
  category: PropertyCategory;

  // Values are signed integers in storage; rendering controls display.
  //   'pip'  → '+' = 1, '++' = 2, '-' = -1 (rF, Will, Stlth)
  //   'int'  → explicit number (Str+3, Dex-2, Slay+4)
  //   'bool' → presence = 1 (SInv, Fly, Reflect)
  rendering: 'pip' | 'int' | 'bool';
  bipolar: boolean;           // can be negative? (rF: yes; Slay: yes; SInv: no)

  // Aggregation cap, mirrors DCSS runtime caps:
  cap?: { min?: number; max?: number };

  // Cross-references to DCSS source (verified by extract script):
  artpEnum?: string;          // e.g. 'ARTP_FIRE'
  source?: { file: string; line: number };
};

export const PROPERTIES: Record<PropertyKey, Property>;
```

**Why integers everywhere:** DCSS stores `ARTP_FIRE` as -2..+2 internally;
pip-rendering is purely display. Treating all property values as signed
integers means aggregation is a single sum-then-cap function regardless of
property type.

### 5.2 Brands and egos

```typescript
type Contribution =
  | { prop: PropertyKey; value: number }            // fixed: rF+1
  | { prop: PropertyKey; fromEnchant: 'plus' };     // scales with item's
                                                    // enchantment (ring of evasion)

type WeaponBrand = {
  key: string;                  // 'flaming'
  spwpnEnum: string;            // 'SPWPN_FLAMING'
  displayName: string;          // 'flaming'
  contributions: Contribution[]; // most brands have none for the optimizer's
                                 // purposes (on-hit effects don't aggregate)
  notes?: string;                // human-readable, e.g. '+d3 fire damage on hit'
};

type ArmorEgo = {
  key: string;
  sparmEnum: string;            // 'SPARM_FIRE_RESISTANCE'
  displayName: string;
  validSlots: ItemSlot[];       // some egos restrict to specific slots
  contributions: Contribution[];
};

export const WEAPON_BRANDS: Record<string, WeaponBrand>;
export const ARMOR_EGOS: Record<string, ArmorEgo>;
```

### 5.3 Base item types

```typescript
type ItemSlot =
  | 'weapon' | 'offhand' | 'body_armour' | 'helmet' | 'gloves'
  | 'boots' | 'barding' | 'cloak' | 'ring' | 'amulet' | 'gizmo';

type WeaponBaseType = {
  key: string;             // 'long_sword'
  displayName: string;
  hands: 1 | 2;
  skill: string;           // future-use; ignore for v1 optimizer
};

type ArmorBaseType = {
  key: string;             // 'plate_armour'
  displayName: string;
  slots: ItemSlot[];       // usually length 1; multi-slot unrands
                           // override this (see §8)
  baseAC: number;
};

type ShieldBaseType = {
  key: string;             // 'buckler' | 'kite_shield' | 'tower_shield'
  slots: ['offhand'];
  baseSH: number;
  // Tower-shield spell-success penalty and similar effects go here as
  // negative-valued Contributions on a curated property (e.g. a
  // `SpellSuccess` utility property). Same shape as every other
  // contribution; the optimizer aggregates without special-casing shields.
  innateContributions?: Contribution[];
};

type JewelryBaseType = {
  key: string;                          // 'ring_of_fire'
  slots: ['ring'] | ['amulet'];
  displayName: string;
  innateContributions: Contribution[];  // ring of fire:
                                        //   [{rF:1}, {Fire:1}, {rC:-1}]
};

type StaffBaseType = {
  key: string;                          // 'staff_of_fire'
  slots: ['weapon'];
  hands: 1;
  innateContributions: Contribution[];  // staff of fire: [{Fire:1}]
};
```

Staves and jewelry carry their effects in `innateContributions` — randart
versions (e.g. `staff of fire of Makhleb's Outrage`) keep the base type's
innate effects and add the artefact's brace properties on top.

### 5.4 Parsed item — the parser's output

This is what the optimizer consumes. All variation between artefact and
non-artefact, brand vs ego vs property, collapses into one
`contributions` map.

```typescript
type ParsedItem = {
  id: string;                       // inventory letter (a, b, c, ...)
  rawText: string;                  // original morgue line, for debugging
  category: 'weapon' | 'armor' | 'shield' | 'jewelry' | 'staff';
  
  baseType: WeaponBaseType | ArmorBaseType | ShieldBaseType
          | JewelryBaseType | StaffBaseType;
  slots: ItemSlot[];                // copy of baseType.slots; overridden
                                    // for multi-slot unrands
  enchant: number;                  // 0 for unenchantable categories
  
  brand?: string;                   // weapon brand key (mutually exclusive)
  ego?: string;                     // armor ego key (mutually exclusive)
  
  artefact?: {
    name?: string;                  // 'Hiorororua', or undefined for unrands
                                    // identified by descriptor
    properties: Partial<Record<PropertyKey, number>>;  // tokenized braces
    isUnrand: boolean;
    unrandKey?: string;             // when isUnrand, looks up unrands.ts entry
  };
  
  // PRE-COMPUTED at parse time. Sum of:
  //   baseType.innateContributions
  //   + (brand or ego).contributions, with fromEnchant scaling applied
  //   + artefact.properties
  contributions: Partial<Record<PropertyKey, number>>;
};
```

The pre-computed `contributions` map is the punchline of the design: the
optimizer treats every item identically after parsing.

### 5.5 Species rules

```typescript
type SlotCapacity = Partial<Record<ItemSlot, number>>;

type SpeciesEquipmentRules = {
  species: string;                  // 'octopode' (normalized key)
  capacity: SlotCapacity;           // { ring: 8, amulet: 1,
                                    //   body_armour: 0, ... }
  twoHanderBlocksOffhand: boolean;  // true universally
  notes?: string;                   // free-form, e.g. 'Coglin gizmo logic'
};

export const SPECIES_RULES: Record<string, SpeciesEquipmentRules>;
```

### 5.6 Loadout and scoring (lives in `dcss-loadout-optimizer`)

```typescript
type Loadout = {
  items: ParsedItem[];              // flat list; capacity computed by walking it
};

type LoadoutScore = {
  totals: Partial<Record<PropertyKey, number>>;       // capped per Property.cap
  uncappedTotals: Partial<Record<PropertyKey, number>>; // for tiebreaking
  violations: string[];                               // empty if legal
};

function isLegal(loadout: Loadout, rules: SpeciesEquipmentRules): boolean;
function score(loadout: Loadout, rules: SpeciesEquipmentRules): LoadoutScore;

type Objective =
  | { kind: 'maximize'; prop: PropertyKey }
  | { kind: 'maximize_sum'; props: PropertyKey[] }
  | { kind: 'maximize_with_floor'; prop: PropertyKey;
      floors: Partial<Record<PropertyKey, number>> };

function optimize(
  items: ParsedItem[],
  rules: SpeciesEquipmentRules,
  objective: Objective,
): { best: Loadout; score: LoadoutScore };
```

Loadout flips from a slot-keyed object to a flat list because multi-slot
items (Lear's Hauberk occupies four slots) don't fit cleanly into a
slot-keyed map. Capacity check walks the items list and sums per-slot
usage.

## 6. Item taxonomy — two parsing paths

Every item in the morgue's inventory section falls into one of:

### 6.1 Standard item (no braces)

```
i - a +3 leather armour of fire resistance (worn)
j - a +2 cloak of poison resistance
Y - a +3 buckler of protection (worn)
g - a +2 cloak of air
O - a +0 pair of gloves of fire
```

Parse path: extract `baseType` from item name (`leather armour`,
`buckler`, `cloak`, etc.), `enchant` from the `+N` prefix, `ego` or `brand`
from the `of X` suffix. Look up ego/brand in the static registry to get
contributions. Plain items (`a +2 dagger`, with no `of X`) have no ego/brand
contributions, just the enchantment.

### 6.2 Artefact item (braces)

```
b - the +5 quarterstaff of Hiorororua {rebuke, rC+ rCorr Str-2 Int+3}
   rC+:       It protects you from cold.
   rCorr:     It protects you from acid and corrosion.
   Str-2:     It affects your strength (-2).
   Int+3:     It affects your intelligence (+3).
```

Parse path: detect artefact-ness from the `{...}` block. Tokenize each
property:

- `rC+` → `{ prop: 'rC', value: 1 }`
- `rC++` → `{ prop: 'rC', value: 2 }`
- `Str-2` → `{ prop: 'Str', value: -2 }`
- `SInv` → `{ prop: 'SInv', value: 1 }`
- `+Blink` → `{ prop: 'Blink', value: 1 }`
- `^Fragile` → `{ prop: 'Fragile', value: 1 }`

Tokenization rules are defined by the property's `rendering` field. Unknown
tokens are logged as warnings (catch new DCSS properties we haven't curated
yet) but don't fail parsing.

The first token in the braces is often a brand or short descriptor (e.g.
`{flame, rF+, ...}` or `{rebuke, rC+, ...}`). It needs to be matched
against the brand registry to determine whether it's a weapon brand or a
property. Magical staves include a `[staff of X]` marker on a separate
indented line — that gives us the base type for artefact staves.

### 6.3 Multi-slot unrand

Detected by checking the parsed item's `unrandKey` against the multi-slot
registry. See §8.

## 7. Aggregation rules

```typescript
function aggregate(items: ParsedItem[]): Partial<Record<PropertyKey, number>> {
  const totals: Partial<Record<PropertyKey, number>> = {};
  for (const item of items) {
    for (const [prop, value] of Object.entries(item.contributions)) {
      totals[prop] = (totals[prop] ?? 0) + value;
    }
  }
  return totals;
}

function applyCaps(
  totals: Partial<Record<PropertyKey, number>>,
): Partial<Record<PropertyKey, number>> {
  const capped: Partial<Record<PropertyKey, number>> = {};
  for (const [prop, value] of Object.entries(totals)) {
    const cap = PROPERTIES[prop].cap;
    capped[prop] = clamp(value, cap?.min ?? -Infinity, cap?.max ?? Infinity);
  }
  return capped;
}
```

Validation: against the morgue's own resistance summary block. For each
parsed game, compute totals from equipped items and assert they match the
summary (within the limits of v1's "equipment only" scope — species/god/form
contributions need to be subtracted first, which is hand-tractable from the
character header).

## 8. Multi-slot items

Small set of unrands (~5-10) that occupy more than one equipment slot. Modeled
as base type overrides in a dedicated registry:

```typescript
type MultiSlotUnrand = {
  unrandKey: string;        // 'lears_hauberk'
  displayName: string;
  occupiedSlots: ItemSlot[]; // ['body_armour', 'helmet', 'gloves', 'boots']
  innateContributions: Contribution[];
};

export const MULTI_SLOT_UNRANDS: Record<string, MultiSlotUnrand>;
```

When the parser identifies an unrand, it checks `MULTI_SLOT_UNRANDS` and
overrides the parsed item's `slots`. The optimizer's capacity check naturally
handles this: placing the item decrements each slot in `item.slots`.

Source: `art-data.txt` flags multi-slot items, plus references in
`art-func.h` for special-case behaviors.

## 9. Source-update workflow

The DCSS source is pinned to a specific git commit in
`packages/dcss-game-data/dcss-version.json`. When DCSS releases a new
version with new properties / brands / egos / items, we need a reliable
update process.

### 9.1 Directory layout

```
packages/dcss-game-data/
  src/
    properties.ts            # curated: semantic metadata
    brands.ts                # curated: contributions per brand
    egos.ts                  # curated: contributions per ego
    weapons.ts               # mostly extracted (base table)
    armors.ts                # mostly extracted (base table)
    jewelry.ts               # curated: innate contributions
    staves.ts                # curated: innate contributions
    species.ts               # curated: slot capacities
    unrands.ts               # extracted from art-data.txt
    multi-slot.ts            # curated: small set of multi-slot unrands
    generated/               # auto-emitted, committed to repo
      artp.ts                # enum mirror of ARTP_*
      brand.ts               # enum mirror of SPWPN_*
      sparm.ts               # enum mirror of SPARM_*
      weapon-type.ts         # enum mirror of WPN_*
      armour-type.ts
      jewellery-type.ts
      stave-type.ts
      unrand-data.ts         # parsed art-data.txt
  scripts/
    extract.ts               # reads DCSS source → emits generated/
    verify.ts                # ensures every extracted enum has curated entry
    diff-version.ts          # shows what changed between two DCSS SHAs
  dcss-version.json          # { commit: "<SHA>", date: "..." }
  README.md
```

### 9.2 What's mechanically extractable

| Data | Source location | Extractable? |
|---|---|---|
| `ARTP_*` enum values | `artefact-prop-type.h` | Yes |
| `ARTP_*` abbreviations | `describe.cc::_randart_prop_abbrev` | Yes (regular switch) |
| `SPWPN_*` enum values | `item-prop-enum.h` | Yes |
| `SPARM_*` enum values | `item-prop-enum.h` | Yes |
| Weapon base table | `item-prop.cc::Weapon_prop[]` | Yes (C++ array) |
| Armor base table | `item-prop.cc::Armour_prop[]` | Yes |
| Staff types | `enum stave_type` | Yes (names) |
| Jewelry types | `enum jewellery_type` | Yes (names) |
| Unrand data | `art-data.txt` | Yes (flat file) |
| Species slot rules | `player-equip.cc::get_player_equip_slot_count` | Partial — switch on species, effects imperative |
| Brand effects | scattered (item-use, attack, etc.) | No — curate |
| Ego effects | scattered | No — curate |
| Staff innate effects | scattered (item-use, spl-cast) | No — curate |
| Jewelry innate effects | scattered (item-use) | No — curate |

### 9.3 Update procedure

```bash
# 1. Update local DCSS source to target commit
cd ../source/crawl
git fetch origin
git checkout <target-sha>

# 2. Extract enums and tables
cd -
pnpm --filter dcss-game-data extract

# 3. Check for unmapped new entries
pnpm --filter dcss-game-data verify
# → prints per-file errors like:
#   src/brands.ts missing curated entry for SPWPN_NEWBRAND
#   src/properties.ts missing curated entry for ARTP_NEWPROP

# 4. For each error, add a curated entry. The verify script tells you
#    exactly which file and which enum value, with file:line back to DCSS
#    source for context.

# 5. Run tests
pnpm --filter dcss-game-data test
pnpm --filter dcss-morgue-parser test
pnpm --filter dcss-loadout-optimizer test

# 6. Bump the pinned SHA
echo '{"commit":"<target-sha>","date":"YYYY-MM-DD"}' > packages/dcss-game-data/dcss-version.json

# 7. Commit
git add packages/dcss-game-data
git commit -m "Update DCSS data to <short-sha>"
```

### 9.4 Verification contract

The `verify` script must fail CI if:

1. Any extracted enum value lacks a curated entry where one is required.
2. Any curated entry references an enum value that no longer exists.
3. The pinned `dcss-version.json` SHA doesn't match the local source.
4. Sample morgues fail to parse (regression check).

(3) catches the common mistake of "I updated the source but forgot to bump
the version", which would silently produce wrong data.

### 9.5 What happens when unknown tokens appear

A morgue parsed against an outdated game-data version might encounter
unknown brace tokens (player using a newer DCSS than we've pinned). The
parser logs a warning, stores the token verbatim in `rawText`, and skips
the contribution. The optimizer scores the loadout but flags it as
"unknown-token underestimate." UI surfaces this so the user knows the
score may be low.

## 10. Open questions

(none currently — see §10.2 for resolved questions)

## 10.1 Implementation notes (not design questions)

- **Brand token in artefact braces is first and comma-separated.** Weapon
  artefacts emit their brand as the leading comma-separated token, then
  space-separated property tokens:

  ```
  {rebuke, rC+ rCorr Str-2 Int+3}
  {drain, ^Fragile rElec rPois SInv}
  {flame, rF+ Slay+2}
  ```

  Tokenizer must split on `, ` to peel off the brand, then space-split the
  rest. Important because brand names can collide with property
  abbreviations: `drain` is the brand `SPWPN_DRAINING`, while `Drain` is
  the property `ARTP_DRAIN`. Disambiguation: position (first comma-token)
  and casing (brands are lowercase in braces; properties are capitalized).

- **Spell-school enhancers stored as integers.** Consistent with every
  other property; rendering (e.g. "+1 enhancer = 30% more spellpower") is
  a frontend concern.

- **God-given artefacts need no special parsing.** They appear in
  inventory with the same brace inscriptions as any other artefact.

## 10.2 Decided (recorded for traceability)

- Spell-school enhancers: integer storage, frontend translates.
- Tower-shield spell penalty: modeled as a `Contribution` on the shield
  base type's `innateContributions` — no special-case code path.
- God-given artefacts: no special handling; parsed identically to other
  artefacts.
- Search algorithm: start with brute force. Search space is not as large
  as naive ~30×11 implies because each item is bound to a single slot
  type (a leather armour can only go in the body_armour slot), so the
  space factors per slot. Benchmark before optimizing.

## 11. Phased rollout

**Phase 1 — Knowledge base foundation (this design):**
- Scaffold `dcss-game-data` extensions: directory structure, extract/verify
  scripts, generated/ enums committed.
- Populate curated registries: properties, brands, egos, jewelry, staves,
  species rules, multi-slot list.
- Tests: extract script produces stable output; verify script catches
  missing entries; small fixture covering ~20 items round-trips correctly.

**Phase 2 — Parser extensions:**
- Extend `dcss-morgue-parser` to parse the full inventory section
  (categories, multi-line item descriptions).
- Tokenize brace properties against the property registry.
- Produce `ParsedItem` with pre-computed `contributions`.
- Validation: sample morgues' resistance-summary blocks match aggregation
  of their equipped items (modulo non-equipment contributions).

**Phase 3 — Optimizer core:**
- New `dcss-loadout-optimizer` package: capacity check, legality,
  aggregation, search.
- Start with brute-force search (items are bound to a single slot type, so
  the search space factors per slot; should be tractable). Benchmark on
  realistic inventories before introducing pruning.
- Pure functions, no I/O. Tested against hand-built fixture loadouts.

**Phase 4 — UI:**
- Optimizer is embedded in the existing `/morgue` page in `apps/web` (not
  a standalone `/optimizer` route): objective picker, results display
  showing best loadout + score breakdown, inline with the morgue view.

**Phase 5 (deferred) — non-equipment contributions:**
- Parse character species/god/mutations/form from morgue header.
- Add their base contributions to aggregation so totals match in-game
  numbers exactly.
- Lets the player optimize "given I'm a rF++ Naga, give me the loadout
  that maxes total resistances" with correct accounting.

**Phase 6+ (later):**
- Multi-objective optimization (e.g. Pareto frontier across rF / EV).
- Save/compare loadouts across morgues.
- Equipment recommendations: "you're missing rPois; consider these items."
