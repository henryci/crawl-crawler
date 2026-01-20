/**
 * Comprehensive tests for the DCSS morgue parser.
 *
 * Tests cover:
 * - Parsing of modern morgue files (0.24+)
 * - Parsing of older morgue files (0.6)
 * - Edge cases and malformed input
 * - Parity with Python implementation output
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMorgue, parseMorgueData } from '../src/parser.js';
import type { MorgueData } from '../src/types.js';
import {
  durationToSeconds,
  cleanItemName,
  expandSchoolAbbreviation,
  cleanGodName,
  getCanonicalBranchName,
} from '../src/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to sample morgue files
const SAMPLE_DIR = join(__dirname, '../../sample_morgues');

/**
 * Load a sample morgue file.
 */
function loadMorgue(filename: string): string {
  return readFileSync(join(SAMPLE_DIR, filename), 'utf-8');
}

describe('parseMorgue', () => {
  describe('modern morgue file (0.24 - Bowmetheus)', () => {
    let data: MorgueData;

    beforeAll(async () => {
      const content = loadMorgue('morgue-Bowmetheus-20230628-120831.txt');
      const result = await parseMorgue(content);
      data = result.data;
    });

    it('extracts version information', () => {
      expect(data.version).toBe('0.24.1-14-gf8d2b50');
      expect(data.isWebtiles).toBe(true);
    });

    it('extracts game seed', () => {
      expect(data.gameSeed).toBe('989551417225520350');
    });

    it('extracts player information', () => {
      expect(data.playerName).toBe('Bowmetheus');
      expect(data.title).toBe('Sniper');
      expect(data.race).toBe('Gargoyle');
      expect(data.background).toBe('Berserker');
      expect(data.characterLevel).toBe(27);
    });

    it('extracts score', () => {
      expect(data.score).toBe(12993590);
    });

    it('extracts dates', () => {
      expect(data.startDate).toBe('June 22, 2023');
      expect(data.endDate).toBe('June 28, 2023');
    });

    it('extracts game duration', () => {
      expect(data.gameDurationSeconds).toBe(39876);
      expect(data.totalTurns).toBe(124363);
    });

    it('extracts runes', () => {
      expect(data.runesPossible).toBe(15);
      expect(data.runesList).toHaveLength(15);
      expect(data.runesList).toContain('serpentine');
      expect(data.runesList).toContain('barnacled');
      expect(data.runesList).toContain('dark');
    });

    it('extracts branch summary', () => {
      expect(data.branchesVisitedCount).toBe(18);
      expect(data.levelsSeenCount).toBe(89);
    });

    it('extracts character stats', () => {
      expect(data.endingStats).not.toBeNull();
      expect(data.endingStats?.hpCurrent).toBe(222);
      expect(data.endingStats?.hpMax).toBe(222);
      expect(data.endingStats?.mpCurrent).toBe(44);
      expect(data.endingStats?.mpMax).toBe(44);
      expect(data.endingStats?.ac).toBe(69);
      expect(data.endingStats?.ev).toBe(20);
      expect(data.endingStats?.sh).toBe(0);
      expect(data.endingStats?.str).toBe(39);
      expect(data.endingStats?.int).toBe(14);
      expect(data.endingStats?.dex).toBe(13);
      expect(data.endingStats?.gold).toBe(9566);
      expect(data.endingStats?.god).toBe('the Shining One');
      expect(data.endingStats?.piety).toBe(6);
    });

    it('extracts equipment', () => {
      expect(data.equipment).not.toBeNull();
      expect(data.equipment?.weapon).toContain('heavy crossbow');
      expect(data.equipment?.weapon).toContain('Sniper');
      expect(data.equipment?.bodyArmour).toContain('gold dragon scales');
      expect(data.equipment?.helmet).toContain('helmet');
      expect(data.equipment?.cloak).toContain('cloak');
      expect(data.equipment?.gloves).toContain('gloves');
      expect(data.equipment?.boots).toContain('boots');
      expect(data.equipment?.amulet).toContain('amulet');
      expect(data.equipment?.ringLeft).toContain('ring');
      expect(data.equipment?.ringRight).toContain('ring');
    });

    it('extracts skills', () => {
      expect(data.endingSkills).not.toBeNull();
      expect(data.endingSkills?.['Fighting']).toBe(26.8);
      expect(data.endingSkills?.['Axes']).toBe(26.8);
      expect(data.endingSkills?.['Crossbows']).toBe(26.9);
      expect(data.endingSkills?.['Armour']).toBe(26.8);
      expect(data.endingSkills?.['Invocations']).toBe(26.9);
    });

    it('extracts skill progression by XL', () => {
      expect(data.skillsByXl).not.toBeNull();
      expect(data.skillsByXl?.['Axes']).toBeDefined();
      // Axes should have progression data
      const axesProgression = data.skillsByXl?.['Axes'];
      expect(axesProgression).toBeDefined();
    });

    it('extracts spells', () => {
      expect(data.endingSpells).not.toBeNull();
      expect(data.endingSpells?.length).toBeGreaterThan(0);

      const apportation = data.endingSpells?.find((s) => s.name === 'Apportation');
      expect(apportation).toBeDefined();
      expect(apportation?.slot).toBe('a');
      expect(apportation?.level).toBe(1);
      expect(apportation?.schools).toContain('Translocations');
    });

    it('extracts god worship history', () => {
      expect(data.godsWorshipped).not.toBeNull();
      expect(data.godsWorshipped?.length).toBeGreaterThanOrEqual(2);

      // Should have Trog first, then The Shining One
      const trog = data.godsWorshipped?.find((g) => g.god === 'Trog');
      expect(trog).toBeDefined();
      expect(trog?.endedTurn).not.toBeNull(); // Should have ended

      const tso = data.godsWorshipped?.find((g) => g.god === 'the Shining One');
      expect(tso).toBeDefined();
      expect(tso?.endedTurn).toBeNull(); // Still worshipping at game end
    });

    it('extracts branch information', () => {
      expect(data.branches).not.toBeNull();
      expect(data.branches?.['Dungeon']).toBeDefined();
      expect(data.branches?.['Dungeon']?.levelsSeen).toBe(15);
      expect(data.branches?.['Dungeon']?.levelsTotal).toBe(15);

      expect(data.branches?.['Zot']).toBeDefined();
      expect(data.branches?.['Zot']?.levelsSeen).toBe(5);
    });

    it('extracts XP progression', () => {
      expect(data.xpProgression).not.toBeNull();
      expect(data.xpProgression?.['1']).toBeDefined();
      expect(data.xpProgression?.['1']?.turn).toBe(0);
      expect(data.xpProgression?.['1']?.location).toBe('D:1');

      expect(data.xpProgression?.['27']).toBeDefined();
    });

    it('extracts actions', () => {
      expect(data.actions).not.toBeNull();
      expect(data.actions?.['Melee']).toBeDefined();
      expect(data.actions?.['Fire']).toBeDefined();
      expect(data.actions?.['Cast']).toBeDefined();
    });

    it('has no parse errors', () => {
      expect(data.parseErrors).toHaveLength(0);
    });
  });

  describe('morgue hash', () => {
    it('generates a morgue hash', async () => {
      const content = loadMorgue('morgue-henryci-20110411-013936.txt');
      const result = await parseMorgue(content);
      expect(result.data.morgueHash).toBeDefined();
      expect(result.data.morgueHash).toHaveLength(64); // SHA-256 produces 64 hex chars
      expect(result.data.morgueHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('hash consistency', () => {
    it('generates the same hash for the same content', async () => {
      const content = loadMorgue('morgue-henryci-20110411-013936.txt');
      const result1 = await parseMorgue(content);
      const result2 = await parseMorgue(content);
      expect(result1.data.morgueHash).toBe(result2.data.morgueHash);
    });

    it('generates different hashes for different content', async () => {
      const content1 = loadMorgue('morgue-henryci-20110411-013936.txt');
      const content2 = loadMorgue('morgue-henryci-20151114-075948.txt');
      const result1 = await parseMorgue(content1);
      const result2 = await parseMorgue(content2);
      expect(result1.data.morgueHash).not.toBe(result2.data.morgueHash);
    });
  });

  describe('older morgue file (0.6 - hyperbolic)', () => {
    let data: MorgueData;

    beforeAll(async () => {
      const content = loadMorgue('morgue-hyperbolic-20100426-054248.txt');
      const result = await parseMorgue(content);
      data = result.data;
    });

    it('extracts version information', () => {
      expect(data.version).toBe('0.6.0-2-gded071c');
      expect(data.isWebtiles).toBe(false);
    });

    it('extracts player information', () => {
      expect(data.playerName).toBe('hyperbolic');
      expect(data.title).toBe('Annihilator');
      expect(data.race).toBe('Deep');
      expect(data.background).toContain('Elf');
      expect(data.characterLevel).toBe(27);
    });

    it('extracts score', () => {
      expect(data.score).toBe(13771379);
    });

    it('extracts runes', () => {
      expect(data.runesList).toHaveLength(15);
    });

    it('extracts character stats (older format)', () => {
      expect(data.endingStats).not.toBeNull();
      expect(data.endingStats?.hpCurrent).toBe(132);
      expect(data.endingStats?.hpMax).toBe(132);
      expect(data.endingStats?.mpCurrent).toBe(35);
      expect(data.endingStats?.mpMax).toBe(50);
      expect(data.endingStats?.ac).toBe(20);
      expect(data.endingStats?.ev).toBe(29);
      expect(data.endingStats?.sh).toBe(26);
      expect(data.endingStats?.god).toBe('Vehumet');
      expect(data.endingStats?.piety).toBe(6);
    });

    it('extracts skills (simple list format)', () => {
      expect(data.endingSkills).not.toBeNull();
      expect(data.endingSkills?.['Fighting']).toBe(7);
      expect(data.endingSkills?.['Spellcasting']).toBe(27);
      expect(data.endingSkills?.['Conjurations']).toBe(27);
      expect(data.endingSkills?.['Fire Magic']).toBe(22);
    });

    it('extracts spells', () => {
      expect(data.endingSpells).not.toBeNull();
      expect(data.endingSpells?.length).toBeGreaterThan(0);

      const fireStorm = data.endingSpells?.find((s) => s.name === 'Fire Storm');
      expect(fireStorm).toBeDefined();
      expect(fireStorm?.level).toBe(9);
    });

    it('extracts god worship history', () => {
      expect(data.godsWorshipped).not.toBeNull();
      const vehumet = data.godsWorshipped?.find((g) => g.god === 'Vehumet');
      expect(vehumet).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles empty input gracefully', async () => {
      const result = await parseMorgue('');
      expect(result.success).toBe(true); // No errors, just null values
      expect(result.data.playerName).toBeNull();
    });

    it('handles malformed input gracefully', async () => {
      const result = await parseMorgue('This is not a morgue file.\nJust random text.');
      expect(result.data.playerName).toBeNull();
      expect(result.data.parseErrors).toHaveLength(0); // Should not throw
    });

    it('handles partial morgue file', async () => {
      const partialContent = `
 Dungeon Crawl Stone Soup version 0.30.0 (webtiles) character file.

12345 TestPlayer the Warrior (level 10, 50/50 HPs)
             Began as a Minotaur Fighter on Jan 1, 2025.
`;
      const result = await parseMorgue(partialContent);
      expect(result.data.playerName).toBe('TestPlayer');
      expect(result.data.title).toBe('Warrior');
      expect(result.data.characterLevel).toBe(10);
      expect(result.data.race).toBe('Minotaur');
      expect(result.data.background).toBe('Fighter');
    });
  });

  describe('parseMorgueData convenience function', () => {
    it('returns data directly without result wrapper', async () => {
      const content = loadMorgue('morgue-henryci-20110411-013936.txt');
      const data = await parseMorgueData(content);
      expect(data.playerName).toBe('henryci');
      expect(data.parserVersion).toBeDefined();
      expect(data.morgueHash).toBeDefined();
    });
  });

  describe('sourceUrl option', () => {
    it('includes sourceUrl when provided', async () => {
      const content = loadMorgue('morgue-henryci-20110411-013936.txt');
      const url = 'http://crawl.example.org/rawdata/henryci/morgue.txt';
      const result = await parseMorgue(content, { sourceUrl: url });
      expect(result.data.sourceUrl).toBe(url);
    });

    it('sets sourceUrl to null when not provided', async () => {
      const content = loadMorgue('morgue-henryci-20110411-013936.txt');
      const result = await parseMorgue(content);
      expect(result.data.sourceUrl).toBeNull();
    });

    it('works with parseMorgueData convenience function', async () => {
      const content = loadMorgue('morgue-henryci-20110411-013936.txt');
      const url = 'http://crawl.example.org/rawdata/henryci/morgue.txt';
      const data = await parseMorgueData(content, { sourceUrl: url });
      expect(data.sourceUrl).toBe(url);
    });
  });

  describe('older morgue file (0.7 - henryci) with runes from inventory', () => {
    let data: MorgueData;

    beforeAll(async () => {
      const content = loadMorgue('morgue-henryci-20110411-013936.txt');
      const result = await parseMorgue(content);
      data = result.data;
    });

    it('extracts version information', () => {
      expect(data.version).toBe('0.7.2-1-gedacb19');
      expect(data.isWebtiles).toBe(false);
    });

    it('extracts player information', () => {
      expect(data.playerName).toBe('henryci');
      expect(data.title).toBe('Thanatomancer');
      expect(data.race).toBe('Kenku');
      expect(data.background).toBe('Necromancer');
      expect(data.characterLevel).toBe(27);
    });

    it('extracts runes without duplicates from message history', () => {
      // This morgue has runes mentioned in both Inventory and Message History
      // The parser should only extract from Inventory to avoid duplicates
      expect(data.runesPossible).toBe(15);
      expect(data.runesList).toHaveLength(15);
      // Verify no duplicates
      const uniqueRunes = [...new Set(data.runesList)];
      expect(uniqueRunes).toHaveLength(15);
      // Verify specific runes are present
      expect(data.runesList).toContain('barnacled');
      expect(data.runesList).toContain('serpentine');
      expect(data.runesList).toContain('obsidian');
      expect(data.runesList).toContain('silver');
      expect(data.runesList).toContain('slimy');
      expect(data.runesList).toContain('abyssal');
    });
  });

  describe('older morgue file (0.17 - henryci) with skillsByXl from notes', () => {
    let data: MorgueData;

    beforeAll(async () => {
      const content = loadMorgue('morgue-henryci-20151114-075948.txt');
      const result = await parseMorgue(content);
      data = result.data;
    });

    it('extracts version information', () => {
      expect(data.version).toBe('0.17.0-23-g0de4337');
      expect(data.isWebtiles).toBe(false);
    });

    it('extracts player information', () => {
      expect(data.playerName).toBe('henryci');
      expect(data.title).toBe('Conqueror');
      expect(data.race).toBe('Minotaur');
      expect(data.background).toBe('Fighter');
      expect(data.characterLevel).toBe(27);
    });

    it('extracts ending skills', () => {
      expect(data.endingSkills).not.toBeNull();
      expect(data.endingSkills?.['Fighting']).toBe(27);
      expect(data.endingSkills?.['Axes']).toBe(27);
      expect(data.endingSkills?.['Armour']).toBe(27);
      expect(data.endingSkills?.['Dodging']).toBe(27);
      expect(data.endingSkills?.['Shields']).toBe(27);
      expect(data.endingSkills?.['Invocations']).toBe(27);
    });

    it('builds skillsByXl from notes section', () => {
      expect(data.skillsByXl).not.toBeNull();
      // Should have skills with XL progression
      expect(Object.keys(data.skillsByXl || {})).toContain('Fighting');
      expect(Object.keys(data.skillsByXl || {})).toContain('Armour');
      expect(Object.keys(data.skillsByXl || {})).toContain('Shields');
      expect(Object.keys(data.skillsByXl || {})).toContain('Axes');
    });

    it('marks skillsByXlSource as notes for older morgues', () => {
      // This morgue (0.17) doesn't have the skill table, so it's derived from notes
      expect(data.skillsByXlSource).toBe('notes');
    });

    it('correctly maps skill levels to XL based on turn', () => {
      // From the notes:
      // Turn 438: Reached skill level 4 in Armour (before XL 3 at turn 584)
      // So Armour 4 should be at XL 2
      expect(data.skillsByXl?.['Armour']?.['2']).toBe(4);

      // Turn 2448: skill level 5 in Fighting, same turn as XL 6
      // XL 6 is reached at turn 2448, so Fighting 5 should be at XL 6
      expect(data.skillsByXl?.['Fighting']?.['6']).toBe(5);

      // Turn 8114: skill level 10 in Armour (XL 10 was reached at turn 7649)
      expect(data.skillsByXl?.['Armour']?.['10']).toBe(10);
    });

    it('handles skills with only one milestone', () => {
      // Evocations was trained later - should have progression entries
      expect(data.skillsByXl?.['Evocations']).toBeDefined();
    });

    it('keeps highest skill level when multiple events at same XL', () => {
      // At turn 2448, multiple skill level 5 events happen at XL 6
      // Fighting, Armour, Shields all reach level 5
      expect(data.skillsByXl?.['Fighting']?.['6']).toBe(5);
      expect(data.skillsByXl?.['Armour']?.['6']).toBe(5);
      expect(data.skillsByXl?.['Shields']?.['6']).toBe(5);
    });

    it('extracts xpProgression', () => {
      expect(data.xpProgression).not.toBeNull();
      expect(data.xpProgression?.['1']).toBeDefined();
      expect(data.xpProgression?.['27']).toBeDefined();
      expect(data.xpProgression?.['1']?.turn).toBe(0);
      expect(data.xpProgression?.['1']?.location).toBe('D:1');
    });
  });
});

describe('utility functions', () => {
  describe('durationToSeconds', () => {
    it('parses HH:MM:SS format', () => {
      expect(durationToSeconds('10:20:02')).toBe(37202);
      expect(durationToSeconds('01:00:00')).toBe(3600);
      expect(durationToSeconds('00:00:01')).toBe(1);
    });

    it('parses MM:SS format', () => {
      expect(durationToSeconds('5:30')).toBe(330);
      expect(durationToSeconds('0:01')).toBe(1);
    });

    it('returns null for invalid input', () => {
      expect(durationToSeconds('')).toBeNull();
      expect(durationToSeconds('invalid')).toBeNull();
    });
  });

  describe('cleanItemName', () => {
    it('removes worn marker', () => {
      expect(cleanItemName('a +2 robe (worn)')).toBe('+2 robe');
    });

    it('removes weapon marker', () => {
      expect(cleanItemName('a +5 broad sword (weapon)')).toBe('+5 broad sword');
    });

    it('removes inventory letter', () => {
      expect(cleanItemName('a - the +3 Elemental Staff')).toBe('+3 Elemental Staff');
    });

    it('removes "the" prefix', () => {
      expect(cleanItemName('the +3 Elemental Staff')).toBe('+3 Elemental Staff');
    });

    it('handles complex item names', () => {
      const result = cleanItemName('a - the +9 heavy crossbow "Sniper" (weapon) {velocity, Acc+∞ SInv}');
      expect(result).toContain('heavy crossbow');
      expect(result).toContain('Sniper');
      expect(result).not.toContain('(weapon)');
    });
  });

  describe('expandSchoolAbbreviation', () => {
    it('expands known abbreviations', () => {
      expect(expandSchoolAbbreviation('Conj')).toBe('Conjurations');
      expect(expandSchoolAbbreviation('Erth')).toBe('Earth');
      expect(expandSchoolAbbreviation('Tloc')).toBe('Translocations');
      expect(expandSchoolAbbreviation('Necr')).toBe('Necromancy');
    });

    it('returns unknown abbreviations unchanged', () => {
      expect(expandSchoolAbbreviation('Unknown')).toBe('Unknown');
    });
  });

  describe('cleanGodName', () => {
    it('removes epithets after god name', () => {
      expect(cleanGodName('Makhleb the Destroyer')).toBe('Makhleb');
      expect(cleanGodName('Trog the Wrathful')).toBe('Trog');
      expect(cleanGodName('Lugonu the Unformed')).toBe('Lugonu');
    });

    it('removes title prefixes before god name', () => {
      expect(cleanGodName('Warmaster Okawaru')).toBe('Okawaru');
      expect(cleanGodName('The Warmaster Okawaru')).toBe('Okawaru');
      expect(cleanGodName('Stormbringer Qazlal')).toBe('Qazlal');
      expect(cleanGodName('The Healer Elyvilon')).toBe('Elyvilon');
      expect(cleanGodName('Madash Fedhas')).toBe('Fedhas');
      expect(cleanGodName('Ym Sagoz Gozag')).toBe('Gozag');
    });

    it('handles multi-word god names', () => {
      expect(cleanGodName('The Shining One')).toBe('the Shining One');
      expect(cleanGodName('the Shining One')).toBe('the Shining One');
      expect(cleanGodName('Sif Muna')).toBe('Sif Muna');
      expect(cleanGodName('Nemelex Xobeh')).toBe('Nemelex Xobeh');
      expect(cleanGodName('The Wu Jian Council')).toBe('Wu Jian');
      expect(cleanGodName('Wu Jian Council')).toBe('Wu Jian');
    });

    it('handles plain god names without titles', () => {
      expect(cleanGodName('Okawaru')).toBe('Okawaru');
      expect(cleanGodName('Vehumet')).toBe('Vehumet');
      expect(cleanGodName('Xom')).toBe('Xom');
      expect(cleanGodName('Kikubaaqudgha')).toBe('Kikubaaqudgha');
    });
  });

  describe('getCanonicalBranchName', () => {
    it('expands branch abbreviations', () => {
      expect(getCanonicalBranchName('D')).toBe('Dungeon');
      expect(getCanonicalBranchName('Orc')).toBe('Orcish Mines');
      expect(getCanonicalBranchName('Elf')).toBe('Elven Halls');
      expect(getCanonicalBranchName('Snake')).toBe('Snake Pit');
    });

    it('returns unknown names unchanged', () => {
      expect(getCanonicalBranchName('Unknown')).toBe('Unknown');
    });
  });
});

