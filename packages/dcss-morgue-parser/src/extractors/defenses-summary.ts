/**
 * Defenses-summary extractor: parses the resistance/utility block in
 * the morgue header into a ContributionMap of runtime totals.
 *
 * The block looks like:
 *
 *   rFire   + + +  (20%)    a - cold staff "Elf's Curse" {rC+ rCorr ...}
 *   rCold   + + +  (20%)    Y - +3 buckler {AC+3}
 *   rNeg    + + .  (20%)    i - +3 leather armour {rF+}
 *   rPois   +      (33%)    l - +1 helmet "Fojo" {Snipe, rN+ Str+3}
 *   rElec   +      (33%)    u - scarf {rC+ rF+}
 *   rCorr   +      (50%)    d - +2 pair of gloves of the Tardigrade {...}
 *   SInv    +               R - +2 pair of boots {Fly}
 *   Will    +++..           D - amulet "Weiruam" {Reflect rPois rF+ ...}
 *   Stlth   +++++           h - ring "Umiol" {rN+ Wiz Str-3 Int+5}
 *   HPRegen 0.52/turn       n - ring of Suspicion {Fly Will+ Dex+5}
 *   MPRegen 0.70/turn
 *
 * Pre-0.31 morgues print a second property column to the right of the
 * first (`rFire  + + +     SeeInvis +   a - ...`) and call Willpower `MR`:
 *
 *   rFire    + + .     SeeInvis +   a - +7 Spriggan's Knife {...}
 *   rPois    ∞         Spirit   .   h - +2 helmet of Tender Moments
 *   MR       +++..                  (boots unavailable)
 *
 * For each pip line: the property name maps to a PropertyKey and the
 * value is the pip count: '+' counts 1, 'x' (vulnerability) counts -1,
 * '.' counts 0, and '∞' (immunity) counts as the property's cap. Only the
 * pip run right after the name is counted, so the second column and the
 * item attribution column never leak into it. A recognized second-column
 * property (SeeInvis) is parsed the same way. The HPRegen / MPRegen rate
 * lines are intentionally skipped (see DISPLAY_NAME_TO_KEY below).
 * Unrecognized lines are skipped. Returns the totals as a sparse
 * ContributionMap matching the property registry's keys.
 *
 * The totals reflect the SUM of every contribution the player has from
 * all sources (species, god, mutations, currently-equipped items). The
 * optimizer uses this to derive a non-equipment baseline by subtracting
 * the current equipment's contributions.
 */

import { PROPERTIES } from 'dcss-game-data';
import type { ContributionMap, PropertyKey } from 'dcss-game-data';

/**
 * Map of display names in the morgue's defenses block to canonical
 * PropertyKey values used elsewhere.
 */
const DISPLAY_NAME_TO_KEY: Record<string, PropertyKey> = {
  rFire: 'rF',
  rCold: 'rC',
  rNeg: 'rN',
  rPois: 'rPois',
  rElec: 'rElec',
  rCorr: 'rCorr',
  rMut: 'rMut',
  SInv: 'SInv',
  Will: 'Will',
  Stlth: 'Stlth',
  // Pre-0.31 names.
  MR: 'Will',
  SeeInvis: 'SInv',
};

// The defenses block also prints `HPRegen X.XX/turn` and `MPRegen X.XX/turn`,
// but those are absolute regeneration *rates* (present for every character,
// scaling with pool size / XL / god), not the discrete pip-based `Regen` /
// `RegenMP` item properties. They are deliberately NOT mapped here: feeding a
// rate into the pip-based runtimeTotals would let computeBaseline() invent a
// non-equipment `RegenMP` baseline (e.g. 0.34) for players wearing nothing
// that grants it. The optimizer treats Regen/RegenMP as equipment-derived
// pip properties only.

const KNOWN_LINE_PREFIX = new RegExp(
  '^(?:' + Object.keys(DISPLAY_NAME_TO_KEY).join('|') + ')\\b',
);

/**
 * A pip run: pips separated by at most one space ("+ + .", "+++..", "∞"),
 * ending at whitespace or end of line. Columns are separated by two or
 * more spaces, so the run never reaches into the next column.
 */
const PIP_RUN = /^[+.x∞](?: ?[+.x∞])*(?=\s|$)/;

/** A second-column property: `   SeeInvis +`. */
const SECOND_COLUMN = /^\s{2,}(\w+)\s+([+.x∞](?: ?[+.x∞])*)(?=\s|$)/;

/**
 * Extract the runtime defenses totals from the morgue header. Returns
 * null if the block can't be located (older morgues, non-standard
 * formats). For 0.33+ death morgues and character dumps the block is
 * reliably present.
 */
export function extractDefensesSummary(content: string): ContributionMap | null {
  // Locate the block by scanning for the first known prefix line.
  // It always sits early in the morgue (after the stats block).
  const lines = content.split('\n');
  let startIdx = -1;
  for (let i = 0; i < Math.min(80, lines.length); i++) {
    const line = lines[i] ?? '';
    if (KNOWN_LINE_PREFIX.test(line)) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return null;

  const totals: ContributionMap = {};

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() === '') break;
    if (!KNOWN_LINE_PREFIX.test(line)) break;

    for (const parsed of parseLine(line)) totals[parsed.key] = parsed.value;
  }

  return Object.keys(totals).length > 0 ? totals : null;
}

interface ParsedLine {
  key: PropertyKey;
  value: number;
}

function parseLine(line: string): ParsedLine[] {
  const m = /^(\w+)\s+(.*)$/.exec(line);
  if (!m) return [];
  const key = DISPLAY_NAME_TO_KEY[m[1]!];
  if (!key) return [];

  const rest = m[2]!;
  const pips = PIP_RUN.exec(rest);
  if (!pips) return [];

  const results: ParsedLine[] = [{ key, value: pipValue(key, pips[0]) }];

  const second = SECOND_COLUMN.exec(rest.slice(pips[0].length));
  const secondKey = second ? DISPLAY_NAME_TO_KEY[second[1]!] : undefined;
  if (second && secondKey) {
    results.push({ key: secondKey, value: pipValue(secondKey, second[2]!) });
  }
  return results;
}

function pipValue(key: PropertyKey, pips: string): number {
  // Immunity: report the property's maximum so "immune" reads as
  // "fully resistant" (rPois ∞ -> 1, rN ∞ -> 3).
  if (pips.includes('∞')) return PROPERTIES[key]?.cap?.max ?? 1;
  let value = 0;
  for (const ch of pips) {
    if (ch === '+') value++;
    else if (ch === 'x') value--;
  }
  return value;
}
