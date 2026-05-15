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
 * For each line: the property name maps to a PropertyKey, and the value
 * is either pip count (# of '+' characters) or a decimal (for regen).
 * Unrecognized lines are skipped. Returns the totals as a sparse
 * ContributionMap matching the property registry's keys.
 *
 * The totals reflect the SUM of every contribution the player has from
 * all sources (species, god, mutations, currently-equipped items). The
 * optimizer uses this to derive a non-equipment baseline by subtracting
 * the current equipment's contributions.
 */

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
  HPRegen: 'Regen',
  MPRegen: 'RegenMP',
};

const KNOWN_LINE_PREFIX = new RegExp(
  '^(?:' + Object.keys(DISPLAY_NAME_TO_KEY).join('|') + ')\\b',
);

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

    const parsed = parseLine(line);
    if (parsed) totals[parsed.key] = parsed.value;
  }

  return Object.keys(totals).length > 0 ? totals : null;
}

interface ParsedLine {
  key: PropertyKey;
  value: number;
}

function parseLine(line: string): ParsedLine | null {
  const m = /^(\w+)\s+(.+?)$/.exec(line);
  if (!m) return null;
  const displayName = m[1]!;
  const rest = m[2]!;

  const key = DISPLAY_NAME_TO_KEY[displayName];
  if (!key) return null;

  // HPRegen / MPRegen: decimal value followed by /turn
  const regenMatch = /^([\d.]+)\/turn/.exec(rest);
  if (regenMatch) {
    return { key, value: parseFloat(regenMatch[1]!) };
  }

  // Pip format: count '+' characters up to the (N%) percentage or the
  // attribution column (item-letter dash).
  let pipPart = rest;
  const cutoff = /\(\d+%\)|\s{2,}[a-zA-Z]\s*-\s/.exec(pipPart);
  if (cutoff) pipPart = pipPart.slice(0, cutoff.index);
  const pipCount = (pipPart.match(/\+/g) ?? []).length;
  return { key, value: pipCount };
}
