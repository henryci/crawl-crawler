import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseMorgueData } from '../src/parser.js';
import { PATTERNS } from '../src/utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(__dirname, '..', '..', 'sample_morgues', 'equipment_dumps');

describe('character dump player-line pattern', () => {
  it('matches a typical character dump line', () => {
    const line =
      'henryci the Intangible (DsEE)                     Turns: 188192, Time: 11:04:59';
    const m = PATTERNS.characterDumpPlayer.exec(line);
    expect(m).not.toBeNull();
    expect(m![1]).toBe('henryci');
    expect(m![2]).toBe('Intangible');
    expect(m![3]).toBe('Ds');
    expect(m![4]).toBe('EE');
    expect(m![5]).toBe('188192');
  });

  it('rejects death-summary lines (they have a score prefix)', () => {
    const line =
      '12163156 Charly the Archmage (level 27, 258/258 HPs)';
    expect(PATTERNS.characterDumpPlayer.exec(line)).toBeNull();
  });

  it('handles species codes with lowercase second letter (Op, Mi, Co)', () => {
    const variants = [
      'someone the Wanderer (CoBe)         Turns: 123, Time: 00:01:00',
      'foo the Aggressor (MiBe)            Turns: 99, Time: 00:00:30',
      'bar the Crusher (OpFi)              Turns: 1, Time: 00:00:01',
      'baz the Curl (BaWn)                 Turns: 5, Time: 00:00:10',
    ];
    for (const line of variants) {
      const m = PATTERNS.characterDumpPlayer.exec(line);
      expect(m, `failed to match: ${line}`).not.toBeNull();
    }
  });

  it('handles species codes with uppercase second letter (DE, DD, VS)', () => {
    const variants = [
      'someone the Archmage (DEWz)         Turns: 1, Time: 00:00:01',
      'someone the Slayer (VSAM)            Turns: 1, Time: 00:00:01',
    ];
    for (const line of variants) {
      const m = PATTERNS.characterDumpPlayer.exec(line);
      expect(m, `failed to match: ${line}`).not.toBeNull();
    }
  });

  it('matches the full-name variant (race + background expanded)', () => {
    const line =
      'henryci the Spry (Demonspawn Earth Elementalist)   Turns: 96892, Time: 04:30:49';
    // Full-name variant deliberately does not match the code-based pattern.
    expect(PATTERNS.characterDumpPlayer.exec(line)).toBeNull();
    const m = PATTERNS.characterDumpPlayerFullName.exec(line);
    expect(m).not.toBeNull();
    expect(m![1]).toBe('henryci');
    expect(m![2]).toBe('Spry');
    expect(m![3]).toBe('Demonspawn Earth Elementalist');
    expect(m![4]).toBe('96892');
  });
});

describe('character dump end-to-end parse', () => {
  it('parses race, background, and key fields from henryci.txt', async () => {
    const path = resolve(FIXTURE_DIR, 'henryci-cdump-0.34.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));

    expect(data.race).toBe('Demonspawn');
    expect(data.background).toBe('Earth Elementalist');
    expect(data.playerName).toBe('henryci');
    expect(data.title).toBe('Intangible');
    expect(data.characterLevel).toBe(27);
    expect(data.totalTurns).toBe(188192);
    // No score — character dump, not a death morgue.
    expect(data.score).toBeNull();
  });

  it('parses race and background from a full-name character dump (ongoing game, no "Began as" line)', async () => {
    const path = resolve(FIXTURE_DIR, 'henryci-cdump-ongoing-0.34.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));

    expect(data.race).toBe('Demonspawn');
    expect(data.background).toBe('Earth Elementalist');
    expect(data.playerName).toBe('henryci');
    expect(data.title).toBe('Spry');
    expect(data.characterLevel).toBe(24);
    expect(data.totalTurns).toBe(96892);
    expect(data.score).toBeNull();
  });

  it('still extracts inventory, runtime totals, and stats from a character dump', async () => {
    const path = resolve(FIXTURE_DIR, 'henryci-cdump-0.34.txt');
    const data = await parseMorgueData(readFileSync(path, 'utf-8'));

    expect(data.inventoryItems).not.toBeNull();
    expect(data.inventoryItems!.length).toBeGreaterThan(20);

    const equipped = data.inventoryItems!.filter((i) => i.isEquipped);
    // Player has weapon, body, helmet, cloak, gloves, boots, amulet, 2 rings ≥ 8 equipped slots.
    expect(equipped.length).toBeGreaterThanOrEqual(7);

    expect(data.runtimeTotals).not.toBeNull();
    expect(data.runtimeTotals!.rN).toBe(3);
    expect(data.runtimeTotals!.Will).toBe(5);

    expect(data.endingStats).not.toBeNull();
    expect(data.endingStats!.ac).toBe(14);
    expect(data.endingStats!.ev).toBe(33);
  });
});
