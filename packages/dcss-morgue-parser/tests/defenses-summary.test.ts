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
    // HPRegen / MPRegen are absolute regen rates, not the pip-based
    // Regen / RegenMP item properties, so they are intentionally omitted.
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
    });
  });

  it('does not parse the regen-rate lines into Regen / RegenMP', () => {
    // Regression: a character wearing nothing that grants RegenMP must
    // not get a phantom non-equipment RegenMP baseline from the always-
    // present `MPRegen X.XX/turn` rate line.
    const block = `rFire   .      (0%)\nHPRegen 1.41/turn\nMPRegen 0.34/turn`;
    const totals = extractDefensesSummary(block);
    expect(totals).not.toBeNull();
    expect(totals!.Regen).toBeUndefined();
    expect(totals!.RegenMP).toBeUndefined();
  });

  it('handles tight pip formatting (no spaces between +s)', () => {
    const block = `rFire   +++   (20%)\nWill    +++.`;
    const totals = extractDefensesSummary(block);
    expect(totals).toEqual({ rF: 3, Will: 3 });
  });
  it('counts only the first column in pre-0.31 two-column blocks', () => {
    // Regression: the pip count used to run on into the second column,
    // so `rFire + + +  SeeInvis +` parsed as rF 4 with SInv missing.
    const block = [
      'rFire    + + +     SeeInvis +   a - +7 Spriggan\'s Knife {MR+ EV+4}',
      'rCold    + + .     Gourm    .   D - +4 shield "Qivaunk" {rPois rF+ rN+}',
      'rPois    +         Spirit   +   b - +2 hat {SInv}',
      'rElec    .         Reflect  +   J - scarf {rC+ rF+}',
      'MR       +++..                  (boots unavailable)',
      'Stlth    ++........             K - amulet of regeneration',
    ].join('\n');
    expect(extractDefensesSummary(block)).toEqual({
      rF: 3,
      SInv: 1,
      rC: 2,
      rPois: 1,
      rElec: 0,
      Will: 3,
      Stlth: 2,
    });
  });

  it('reads the old SeeInvis column as 0 when absent', () => {
    const block = 'rFire  + + +     SeeInvis .     a - +9 broad axe (holy)';
    expect(extractDefensesSummary(block)).toEqual({ rF: 3, SInv: 0 });
  });

  it('treats ∞ as immunity (the property cap)', () => {
    const block = 'rPois    ∞         Spirit   .   h - +2 helmet\nrNeg   ∞';
    expect(extractDefensesSummary(block)).toEqual({ rPois: 1, rN: 3 });
  });

  it('counts x pips as vulnerability', () => {
    const block = 'rFire   x . .  (100%)\nrCold   + + .  (20%)\nWill    x....';
    expect(extractDefensesSummary(block)).toEqual({ rF: -1, rC: 2, Will: -1 });
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
    // The HPRegen / MPRegen rate lines are not pip properties and must
    // not leak into runtimeTotals (they would create phantom non-
    // equipment Regen / RegenMP baselines in the optimizer).
    expect(data.runtimeTotals!.Regen).toBeUndefined();
    expect(data.runtimeTotals!.RegenMP).toBeUndefined();
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

  it('pre-0.31 two-column morgue (0.22): reads MR, Stlth and SeeInvis', async () => {
    const path = resolve(SAMPLE_DIR, 'morgue-0xDEADFACE-20180605-051901.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));
    // From the morgue: rFire + + . / SeeInvis +, MR +++.., Stlth ++........
    expect(data.runtimeTotals).toMatchObject({
      rF: 2,
      rC: 2,
      rN: 1,
      rPois: 1,
      rElec: 1,
      rCorr: 0,
      SInv: 1,
      Will: 3,
      Stlth: 2,
    });
  });

  it('poison-immune character: rPois ∞ reads as 1', async () => {
    const path = resolve(SAMPLE_DIR, 'morgue-Bowmetheus-20230628-120831.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));
    expect(data.runtimeTotals).toMatchObject({ rF: 1, rN: 3, rPois: 1, SInv: 1, Will: 4 });
  });
});
