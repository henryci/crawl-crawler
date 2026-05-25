import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { extractInventoryItems, MIN_INVENTORY_PARSE_VERSION } from '../src/extractors/inventory-items.js';
import { parseMorgueData } from '../src/parser.js';
import {
  parseArtefactBraces,
  parseTerseToken,
  parseTerseToContributions,
} from 'dcss-game-data';

const SAMPLE_DIR = resolve(__dirname, '..', '..', 'sample_morgues');

describe('brace tokenizer (re-exported from dcss-game-data)', () => {
  it('parses simple property tokens', () => {
    expect(parseTerseToken('rF+')).toEqual({ prop: 'rF', value: 1 });
    expect(parseTerseToken('rC++')).toEqual({ prop: 'rC', value: 2 });
    expect(parseTerseToken('rF-')).toEqual({ prop: 'rF', value: -1 });
    expect(parseTerseToken('Str+3')).toEqual({ prop: 'Str', value: 3 });
    expect(parseTerseToken('Slay-2')).toEqual({ prop: 'Slay', value: -2 });
    expect(parseTerseToken('SInv')).toEqual({ prop: 'SInv', value: 1 });
    expect(parseTerseToken('+Blink')).toEqual({ prop: '+Blink', value: 1 });
    expect(parseTerseToken('^Fragile')).toEqual({ prop: '^Fragile', value: 1 });
  });

  it('returns null for unknown tokens', () => {
    expect(parseTerseToken('Bogus')).toBeNull();
    expect(parseTerseToken('Self')).toBeNull(); // Ashenzari curse label
  });

  it('decodes multi-token strings', () => {
    expect(parseTerseToContributions('rC+ rF+')).toEqual([
      { prop: 'rC', value: 1 },
      { prop: 'rF', value: 1 },
    ]);
  });
});

describe('parseArtefactBraces', () => {
  it('peels off leading brand token for weapons', () => {
    const result = parseArtefactBraces('rebuke, rC+ rCorr Str-2 Int+3', true);
    expect(result.brand).toBe('rebuke');
    expect(result.properties).toEqual({
      rC: 1,
      rCorr: 1,
      Str: -2,
      Int: 3,
    });
    expect(result.unknownTokens).toEqual([]);
  });

  it('does not peel brand when expectBrand is false', () => {
    const result = parseArtefactBraces('rPois rF+ rCorr', false);
    expect(result.brand).toBeUndefined();
    expect(result.properties).toEqual({ rPois: 1, rF: 1, rCorr: 1 });
  });

  it('handles Ashenzari multi-comma format', () => {
    // {venom, Int+4 SInv, Dev, Melee}
    const result = parseArtefactBraces('venom, Int+4 SInv, Dev, Melee', true);
    expect(result.brand).toBe('venom');
    expect(result.properties).toEqual({ Int: 4, SInv: 1 });
    expect(result.unknownTokens).toEqual(['Dev', 'Melee']);
  });

  it('does not interpret a non-brand leading token as a brand', () => {
    // {rPois rF+ rCorr} — no leading brand
    const result = parseArtefactBraces('rPois rF+ rCorr', true);
    expect(result.brand).toBeUndefined();
    expect(result.properties).toEqual({ rPois: 1, rF: 1, rCorr: 1 });
  });

  it('returns empty result for empty braces', () => {
    const result = parseArtefactBraces('', true);
    expect(result.properties).toEqual({});
    expect(result.unknownTokens).toEqual([]);
  });
});

describe('version gate', () => {
  it('returns null for null version', () => {
    expect(extractInventoryItems('whatever', null)).toBeNull();
  });

  it('returns null for pre-0.33 versions', () => {
    expect(extractInventoryItems('Inventory:\n', '0.32')).toBeNull();
    expect(extractInventoryItems('Inventory:\n', '0.30-b1-2-g02819fbbbe')).toBeNull();
    expect(extractInventoryItems('Inventory:\n', '0.21.1-1-g345015f')).toBeNull();
  });

  it('accepts 0.33 and newer', () => {
    expect(MIN_INVENTORY_PARSE_VERSION).toBe('0.33');
    // Empty inventory still returns an array, not null.
    expect(extractInventoryItems('Inventory:\n', '0.33')).toEqual([]);
    expect(extractInventoryItems('Inventory:\n', '0.34.0')).toEqual([]);
    expect(extractInventoryItems('Inventory:\n', '0.33-a0-298-g559140af29')).toEqual([]);
  });

  it('returns null when inventory section is missing', () => {
    expect(extractInventoryItems('no inventory here', '0.33')).toBeNull();
  });
});

describe('end-to-end parsing on real morgues', () => {
  it('0.33 morgue: extracts inventoryItems', async () => {
    const path = resolve(SAMPLE_DIR, 'morgue-zkxksk0-20241105-160150.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    expect(data.version).toMatch(/^0\.33/);
    expect(data.inventoryItems).not.toBeNull();
    expect(data.inventoryItems!.length).toBeGreaterThan(5);

    // Find the falchion (item 's') — its braces are {venom, Int+4 SInv, Dev, Melee}
    const falchion = data.inventoryItems!.find((i) => i.id === 's');
    expect(falchion).toBeDefined();
    expect(falchion!.category).toBe('weapon');
    expect(falchion!.enchant).toBe(9);
    expect(falchion!.brand).toBe('venom');
    expect(falchion!.contributions).toMatchObject({ Int: 4, SInv: 1 });
  });

  it('0.34 morgue: extracts ~35 items with correct contributions', async () => {
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    expect(data.version).toMatch(/^0\.34/);
    expect(data.inventoryItems).not.toBeNull();
    expect(data.inventoryItems!.length).toBeGreaterThan(20);

    // Quarterstaff of Hiorororua: +5 quarterstaff {rebuke, rC+ rCorr Str-2 Int+3}
    const staff = data.inventoryItems!.find((i) => i.id === 'b');
    expect(staff).toBeDefined();
    expect(staff!.category).toBe('weapon');
    expect(staff!.enchant).toBe(5);
    expect(staff!.brand).toBe('rebuke');
    expect(staff!.contributions).toMatchObject({
      rC: 1,
      rCorr: 1,
      Str: -2,
      Int: 3,
    });
  });

  it('pre-0.33 morgue: inventoryItems is null but equipment still populated', async () => {
    const path = resolve(SAMPLE_DIR, 'morgue-zkyp-20230510-154758.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    expect(data.version).toMatch(/^0\.30/);
    expect(data.inventoryItems).toBeNull();
    // Old extractor still works
    expect(data.equipment).not.toBeNull();
  });
});

describe('enchantment contributions', () => {
  it('armor +N contributes AC+N', async () => {
    // The 0.34 reference morgue has "+3 leather armour of fire resistance"
    // → AC+3 from enchant, plus rF+ from the ego.
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    const armor = data.inventoryItems!.find((i) => i.id === 'i');
    expect(armor).toBeDefined();
    expect(armor!.category).toBe('armor');
    expect(armor!.enchant).toBe(3);
    expect(armor!.contributions.AC).toBe(3);
    expect(armor!.contributions.rF).toBe(1);
  });

  it('shield +N contributes SH+N', async () => {
    // "+3 buckler of protection" → SH+3 from enchant, AC+3 from "protection" ego.
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    const shield = data.inventoryItems!.find((i) => i.id === 'Y');
    expect(shield).toBeDefined();
    expect(shield!.category).toBe('shield');
    expect(shield!.enchant).toBe(3);
    expect(shield!.contributions.SH).toBe(3);
  });

  it('weapon +N contributes Slay+N', async () => {
    // The 0.34 morgue has the quarterstaff of Hiorororua at +5
    // → Slay+5 from enchant, plus the brace contributions.
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    const weapon = data.inventoryItems!.find((i) => i.id === 'b');
    expect(weapon).toBeDefined();
    expect(weapon!.category).toBe('weapon');
    expect(weapon!.enchant).toBe(5);
    expect(weapon!.contributions.Slay).toBe(5);
  });
});

describe('item identification edge cases', () => {
  it('handles cursed Ashenzari items (strips "cursed " keyword)', async () => {
    const path = resolve(SAMPLE_DIR, 'morgue-zkxksk0-20241105-160150.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    // "the cursed +9 falchion 'Cryptic Augurer' (weapon)"
    const falchion = data.inventoryItems!.find((i) => i.id === 's');
    expect(falchion!.baseType.displayName).toContain('falchion');
    expect(falchion!.enchant).toBe(9);
  });

  it('handles quoted artefact names', async () => {
    const path = resolve(SAMPLE_DIR, 'morgue-zkxksk0-20241105-160150.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    // "the cursed +5 kite shield 'Enigmatic Negligence' (worn)"
    const shield = data.inventoryItems!.find((i) => i.id === 'x');
    expect(shield).toBeDefined();
    expect(shield!.category).toBe('shield');
    expect(shield!.baseType.displayName).toContain('kite shield');
  });

  it('handles "of NAME" artefact names like "of Ignis\'s Reproof"', async () => {
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    // "the +1 cloak of Ignis's Reproof {Regen+}"
    const cloak = data.inventoryItems!.find((i) => i.id === 'o');
    expect(cloak).toBeDefined();
    expect(cloak!.category).toBe('armor');
    expect(cloak!.baseType.displayName).toBe('cloak');
  });

  it('randart jewelry: brace lists totals, not extras on top of innate', async () => {
    // DCSS prints randart jewelry properties as the *total* effect of
    // the item, including the base ring's innate contribution. Parser
    // must not double-count by adding base innate on top of the brace.
    //
    // Sample: "c - the ring of Optimism {rPois rF+ rCorr}" with base
    // "[ring of poison resistance]" (innate rPois+). The brace already
    // shows the total rPois (1 pip), so rPois must be 1 — not 2.
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    const ring = data.inventoryItems!.find((i) => i.id === 'c');
    expect(ring).toBeDefined();
    expect(ring!.category).toBe('jewelry');
    expect(ring!.baseType.displayName).toBe('ring of poison resistance');
    expect(ring!.contributions.rPois).toBe(1);
    expect(ring!.contributions.rF).toBe(1);
    expect(ring!.contributions.rCorr).toBe(1);
  });

  it('identifies a magical staff via [staff of X] marker', async () => {
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const content = readFileSync(path, 'utf-8');
    const data = await parseMorgueData(content);

    // "the cold staff 'Elf's Curse' (weapon) {rC+ rCorr SInv Conj Ice Earth}"
    // Magical Staves section, has [staff of cold] description marker.
    const staff = data.inventoryItems!.find((i) => i.id === 'a' && i.category === 'staff');
    expect(staff).toBeDefined();
    expect(staff!.baseType.displayName).toBe('staff of cold');
    // Contributions include the staff's innate Ice + rC PLUS artefact extras
    expect(staff!.contributions.Ice).toBeGreaterThanOrEqual(1);
    expect(staff!.contributions.rC).toBeGreaterThanOrEqual(1);
    expect(staff!.contributions.SInv).toBe(1);
  });
});
