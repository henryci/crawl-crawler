/**
 * God and piety parsing: the header "God:" line (endingStats.god / piety)
 * and the worship history from notes (godsWorshipped). Excerpts are copied
 * from real morgues in scripts/streak-downloader/outputs.
 */
import { describe, it, expect } from 'vitest';
import { extractStats } from '../src/extractors/stats.js';
import { extractGods } from '../src/extractors/gods.js';

/** Build a minimal morgue from a "Began as" line, the stats block and notes. */
function morgue(beganAs: string, stats: string[], notes: string[] = []): string {
  return [
    ' Dungeon Crawl Stone Soup version 0.34 character file.',
    '',
    `             Began as ${beganAs} on Dec 10, 2025.`,
    '',
    ...stats,
    '',
    'Notes',
    'Turn   | Place    | Note',
    '-------+----------+-------------------------------------------',
    '     0 | D:1      | Someone began the quest for the Orb.',
    ...notes,
    '',
    '',
    '',
  ].join('\n');
}

/** Modern (0.23+) stats block with the given god-line value. */
function modernStats(godValue: string): string[] {
  return [
    'Health: 292/318    AC: 43    Str: 59    XL:     27',
    `Magic:  43/43      EV: 14    Int:  6    God:    ${godValue}`,
    'Gold:   7157       SH:  0    Dex: 11    Spells: 34/58 levels left',
  ];
}

/** Legacy (0.4-0.9) stats block with the given god-line value. */
function legacyStats(godValue: string): string[] {
  return [
    'HP 220/267       AC 56     Str 20      Exp: 27/2884465 (14728)',
    `MP  36/36        EV 21     Int 21      God: ${godValue}`,
    'Gold 20116       SH  0     Dex 14      Spells:  0 memorised, 28 levels left',
  ];
}

describe('endingStats god and piety', () => {
  it.each([
    // [god-line value, expected god, expected piety]
    ['the Shining One [******]', 'the Shining One', 6],
    ['the Shining One [****..]', 'the Shining One', 4],
    ['Sif Muna [***...]', 'Sif Muna', 3],
    ['Wu Jian [*****.]', 'Wu Jian', 5], // morgue-Aeongth-20250319-110055 (0.33)
    ['Ashenzari [*****.]', 'Ashenzari', 5], // morgue-Aiyanna-20260218-141311 (0.34)
    ['Lugonu [......]', 'Lugonu', 0], // morgue-Wizard1ke-20251210-134128 (0.34)
    ['Gozag', 'Gozag', null], // Gozag has no piety display
  ])('modern "God: %s"', (godValue, god, piety) => {
    const stats = extractStats(morgue('an Oni Monk', modernStats(godValue)));
    expect(stats?.god).toBe(god);
    expect(stats?.piety).toBe(piety);
  });

  it.each([
    ['No God', null, null], // morgue-78291-20080730-231917 (0.4)
    ['The Shining One ******', 'the Shining One', 6], // morgue-78291-20080803-043404 (0.4)
    ['The Shining One [******]', 'the Shining One', 6], // morgue-Alg-20110827-165522 (0.9)
    ['Okawaru *****', 'Okawaru', 5],
    ['Zin [*]', 'Zin', 1],
    ['Dithmengos [******]', 'Dithmenos', 6], // morgue-deopthoht-20140125-001737 (old spelling)
    ['Ieoh Jian [****..]', 'Wu Jian', 4], // morgue-nono-20170222-030540 (pre-release name)
    ['Ukayaw [......]', 'Uskayaw', 0], // morgue-hyperboh-20160528-055741
  ])('legacy "God: %s"', (godValue, god, piety) => {
    const stats = extractStats(morgue('a Human Healer', legacyStats(godValue)));
    expect(stats?.god).toBe(god);
    expect(stats?.piety).toBe(piety);
  });

  it('a blank god line means no god', () => {
    const stats = extractStats(morgue('an Oni Monk', modernStats('')));
    expect(stats?.god).toBeNull();
    expect(stats?.piety).toBeNull();
  });
});

describe('godsWorshipped', () => {
  it('piety notes logged before "Became a worshipper" do not create a turn-0 record', () => {
    // morgue-Wizard1ke-20251210-134128: Oni Monk (no starting god).
    const content = morgue('an Oni Monk', modernStats('Lugonu [......]'), [
      '  2673 | Temple   | Reached * piety under the Shining One',
      '  2673 | Temple   | Reached ** piety under the Shining One',
      '  2673 | Temple   | Became a worshipper of the Shining One',
      ' 10773 | D:10     | Reached *** piety under the Shining One',
      '106371 | Depths:1 | Fell from the grace of the Shining One',
      '106371 | Depths:1 | Became a worshipper of Lugonu the Unformed',
    ]);
    expect(extractGods(content)).toEqual([
      { god: 'the Shining One', startedTurn: 2673, startedLocation: 'Temple', endedTurn: 106371 },
      { god: 'Lugonu', startedTurn: 106371, startedLocation: 'Depths:1', endedTurn: null },
    ]);
  });

  it('keeps multi-word names from piety notes when no worship note exists', () => {
    const content = morgue('a Troll Fighter', modernStats('Wu Jian [*****.]'), [
      '  6948 | D:9      | Reached * piety under Wu Jian',
    ]);
    expect(extractGods(content)).toEqual([
      { god: 'Wu Jian', startedTurn: 0, startedLocation: 'D:1', endedTurn: null },
    ]);
  });

  it('canonicalizes epithets and "Council" forms', () => {
    // morgue-Aeongth-20250319-110055
    const content = morgue('a Troll Fighter', modernStats('Wu Jian [*****.]'), [
      '  5027 | D:8      | Became a worshipper of Elyvilon the Healer',
      '  6123 | Temple   | Fell from the grace of Elyvilon',
      '  6123 | Temple   | Became a worshipper of the Wu Jian Council',
      '  6948 | D:9      | Reached * piety under Wu Jian',
    ]);
    expect(extractGods(content)?.map((g) => g.god)).toEqual(['Elyvilon', 'Wu Jian']);
  });

  it('uses canonical casing for The Shining One', () => {
    // morgue-Alg-20110827-165522 (0.9)
    const content = morgue('a Merfolk Ice Elementalist', legacyStats('The Shining One [******]'), [
      '  7321 | Temple   | Became a worshipper of Warmaster Okawaru',
      '119686 | Temple   | Fell from the grace of Okawaru',
      '119686 | Temple   | Became a worshipper of The Shining One',
    ]);
    expect(extractGods(content)?.map((g) => g.god)).toEqual(['Okawaru', 'the Shining One']);
  });

  it('Paladin starts with the Shining One (canonical casing)', () => {
    const content = morgue('a Human Paladin', legacyStats('The Shining One ******'));
    expect(extractGods(content)).toEqual([
      { god: 'the Shining One', startedTurn: 0, startedLocation: 'D:1', endedTurn: null },
    ]);
  });

  it('Champion notes keep the full god name', () => {
    const content = morgue('a Human Fighter', legacyStats('The Shining One ******'), [
      '  9000 | D:5      | Became the Champion of The Shining One',
    ]);
    expect(extractGods(content)?.[0]?.god).toBe('the Shining One');
  });

  it('ignores right-hand column spill on an empty Worship line', () => {
    // morgue-jarmok-20070201-0936
    const content = morgue('a Human Fighter', [
      'Worship    :                    Life Prot.: . . .   Conserve   : .',
    ]);
    expect(extractGods(content)).toEqual([]);
  });

  it('No God gives an empty history', () => {
    // morgue-78291-20080730-231917 (0.4)
    expect(extractGods(morgue('a Demigod Warper', legacyStats('No God')))).toEqual([]);
  });
});
