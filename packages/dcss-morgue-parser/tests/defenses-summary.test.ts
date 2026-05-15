import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractDefensesSummary } from '../src/extractors/defenses-summary.js';
import { parseMorgueData } from '../src/parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_DIR = resolve(__dirname, '..', '..', 'sample_morgues');

describe('extractDefensesSummary', () => {
  it('returns null when the block is missing', () => {
    expect(extractDefensesSummary('')).toBeNull();
    expect(extractDefensesSummary('Just some text\nNo defenses here')).toBeNull();
  });

  it('parses a synthetic block', () => {
    const block = `Some header\n\nrFire   + + +  (20%)\nrCold   + + .  (20%)\nrNeg    . . .  (0%)\nrPois   +      (33%)\nrElec   .      (0%)\nrCorr   .      (0%)\nSInv    +\nWill    +++..\nStlth   +++++\nHPRegen 0.52/turn\nMPRegen 0.70/turn\n\n%: other`;
    const totals = extractDefensesSummary(block);
    expect(totals).toEqual({
      rF: 3,
      rC: 2,
      rN: 0,
      rPois: 1,
      rElec: 0,
      rCorr: 0,
      SInv: 1,
      Will: 3,
      Stlth: 5,
      Regen: 0.52,
      RegenMP: 0.7,
    });
  });

  it('handles tight pip formatting (no spaces between +s)', () => {
    const block = `rFire   +++   (20%)\nWill    +++.`;
    const totals = extractDefensesSummary(block);
    expect(totals).toEqual({ rF: 3, Will: 3 });
  });
});

describe('runtimeTotals on real morgues', () => {
  it('0.33 morgue: extracts the runtime defenses block', async () => {
    const path = resolve(SAMPLE_DIR, 'morgue-zkxksk0-20241105-160150.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));
    expect(data.runtimeTotals).not.toBeNull();
    // From the morgue: rFire + . . (1 pip), rCold + . . (1), Stlth ++++++ (6)
    expect(data.runtimeTotals!.rF).toBe(1);
    expect(data.runtimeTotals!.rC).toBe(1);
    expect(data.runtimeTotals!.Stlth).toBe(6);
    expect(data.runtimeTotals!.SInv).toBe(1);
  });

  it('0.34 morgue: extracts the runtime defenses block', async () => {
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));
    expect(data.runtimeTotals).not.toBeNull();
    // From the morgue: rFire +++, rCold +++, rNeg ++., Will +++..
    expect(data.runtimeTotals!.rF).toBe(3);
    expect(data.runtimeTotals!.rC).toBe(3);
    expect(data.runtimeTotals!.rN).toBe(2);
    expect(data.runtimeTotals!.Will).toBe(3);
    expect(data.runtimeTotals!.Stlth).toBe(5);
    // Regen values are floats: 0.52/turn and 0.70/turn
    expect(data.runtimeTotals!.Regen).toBeCloseTo(0.52, 2);
    expect(data.runtimeTotals!.RegenMP).toBeCloseTo(0.7, 2);
  });

  it('isEquipped flag is set for items marked (worn) etc.', async () => {
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));
    const equipped = data.inventoryItems!.filter((i) => i.isEquipped);
    // Player has weapon (staff a), shield Y, armor i, helmet l, cloak u,
    // gloves d, boots R, amulet D, ring h, ring n = 10 items.
    expect(equipped.length).toBeGreaterThanOrEqual(9);

    // Spot-check a few specific items.
    const staff = data.inventoryItems!.find((i) => i.id === 'a');
    expect(staff?.isEquipped).toBe(true);
    const amulet = data.inventoryItems!.find((i) => i.id === 'D');
    expect(amulet?.isEquipped).toBe(true);
    const unwornCloak = data.inventoryItems!.find((i) => i.id === 'g'); // +2 cloak of air
    expect(unwornCloak?.isEquipped).toBe(false);
  });

  it('equipment contributions sum to runtime totals (sanity check)', async () => {
    const path = resolve(SAMPLE_DIR, 'equipment_dumps', 'morgue-henryci-equipment-0.34.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));
    const equipped = data.inventoryItems!.filter((i) => i.isEquipped);

    // Sum rF from all equipped items.
    let rfFromEquipment = 0;
    for (const item of equipped) {
      rfFromEquipment += item.contributions.rF ?? 0;
    }
    // Runtime total for rF is 3; equipment contributions should explain
    // most or all of it (player has Deep Elf with no innate rF and
    // worships Vehumet which doesn't grant rF).
    expect(rfFromEquipment).toBeGreaterThanOrEqual(2);
    expect(data.runtimeTotals!.rF).toBe(3);
  });
});
