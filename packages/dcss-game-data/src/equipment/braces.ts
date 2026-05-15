/**
 * Brace tokenization for DCSS item descriptions.
 *
 * DCSS shows artefact properties in `{...}` blocks following an item
 * name. The format has two layers:
 *
 *   1. A weapon-brand-only leading token (lowercase, comma-separated)
 *      that appears only on weapon artefacts, e.g.
 *      `{rebuke, rC+ rCorr Str-2 Int+3}`. The brand here is the leading
 *      "rebuke" (= SPWPN_REBUKE) and everything after the comma is
 *      space-separated property tokens.
 *
 *   2. Space-separated property tokens encoding contributions. Each
 *      token follows one of:
 *        - Bool: exact match against a PropertyKey, e.g. 'SInv', '+Blink'
 *        - Pip:  prefix + '+'/'-' repeats, e.g. 'rF+', 'rC++', 'Will-'
 *        - Int:  prefix + signed integer, e.g. 'Str+3', 'AC-2'
 *
 * The same property keys also appear without braces (in armor ego terse
 * names — see egos.ts), so the property-token parser is shared.
 */

import type { Contribution, PropertyKey } from './types.js';
import { PROPERTIES } from './properties.js';
import { WEAPON_BRANDS } from './brands.js';

/**
 * Result of parsing an artefact's `{...}` block.
 */
export interface ArtefactBraceParse {
  /** Recognized weapon brand key, if a leading brand token was present. */
  brand?: string;
  /**
   * Property contributions decoded from the space-separated tokens.
   * Aggregated into a sparse map (last wins on duplicate keys, which is
   * rare/never in practice).
   */
  properties: Partial<Record<PropertyKey, number>>;
  /**
   * Tokens that didn't decode to a known property or brand. Helpful for
   * surfacing data drift when DCSS adds something the registry doesn't
   * cover yet.
   */
  unknownTokens: string[];
}

/**
 * Parse a single brace token into a property contribution.
 *
 * Returns null if the token doesn't decode against PROPERTIES — caller
 * decides whether that's an error or a soft skip.
 */
export function parseTerseToken(token: string): Contribution | null {
  // 1. Exact bool match (handles 'SInv', 'Fly', '+Blink', '^Fragile', '*Rage').
  const exact = PROPERTIES[token];
  if (exact && exact.rendering === 'bool') {
    return { prop: exact.key, value: 1 };
  }

  // 2. Pip pattern: <key><+|->+
  const pipMatch = /^(.+?)([+-]+)$/.exec(token);
  if (pipMatch) {
    const key = pipMatch[1]!;
    const symbol = pipMatch[2]!;
    const prop = PROPERTIES[key];
    if (prop && prop.rendering === 'pip') {
      const sign = symbol[0] === '+' ? 1 : -1;
      return { prop: prop.key, value: sign * symbol.length };
    }
  }

  // 3. Int pattern: <key>[+-]<N>
  const intMatch = /^(.+?)([+-])(\d+)$/.exec(token);
  if (intMatch) {
    const key = intMatch[1]!;
    const sign = intMatch[2] === '+' ? 1 : -1;
    const num = parseInt(intMatch[3]!, 10);
    const prop = PROPERTIES[key];
    if (prop && prop.rendering === 'int') {
      return { prop: prop.key, value: sign * num };
    }
  }

  return null;
}

/**
 * Parse a space-separated sequence of brace tokens (no leading brand).
 *
 * Returns null if any token can't be decoded. Use this for armor-ego
 * terse names where the whole string is properties.
 */
export function parseTerseToContributions(terse: string): Contribution[] | null {
  if (terse.trim() === '') return null;
  const tokens = terse.trim().split(/\s+/);
  const contributions: Contribution[] = [];
  for (const token of tokens) {
    const parsed = parseTerseToken(token);
    if (!parsed) return null;
    contributions.push(parsed);
  }
  return contributions;
}

/**
 * Parse the contents of an artefact's `{...}` block.
 *
 * `expectBrand` should be true when the item is a weapon — DCSS emits
 * the brand as the leading comma-separated token only for weapons. For
 * non-weapon artefacts the whole block is space-separated properties.
 *
 * Tokens that don't decode are collected into `unknownTokens` so the
 * caller can surface a warning without aborting the parse.
 *
 * Note: the brace string passed in should NOT include the surrounding
 * `{` and `}`.
 */
export function parseArtefactBraces(
  braceContents: string,
  expectBrand: boolean,
): ArtefactBraceParse {
  const result: ArtefactBraceParse = {
    properties: {},
    unknownTokens: [],
  };

  const trimmed = braceContents.trim();
  if (trimmed === '') return result;

  let rest = trimmed;

  // Peel off a leading "brand," prefix for weapons.
  if (expectBrand) {
    const commaIdx = rest.indexOf(',');
    if (commaIdx !== -1) {
      const candidate = rest.slice(0, commaIdx).trim();
      const brand = lookupBrandByTerse(candidate);
      if (brand) {
        result.brand = brand;
        rest = rest.slice(commaIdx + 1).trim();
      }
    }
  }

  // Remaining tokens are separated by whitespace or commas. Ashenzari
  // cursed items embed commas between curse-skill labels
  // (e.g. `{Int+3, Melee, Self}`), and the post-brand portion of weapon
  // braces can also include commas. Treat both as token separators.
  const tokens = rest.split(/[\s,]+/).filter((t) => t.length > 0);
  for (const token of tokens) {
    const parsed = parseTerseToken(token);
    if (parsed && 'value' in parsed) {
      result.properties[parsed.prop] = (result.properties[parsed.prop] ?? 0) + parsed.value;
    } else {
      result.unknownTokens.push(token);
    }
  }

  return result;
}

/**
 * Resolve a leading brace token (e.g. `'flame'`, `'drain'`) against the
 * weapon brand registry. Returns the brand key on match or null.
 */
function lookupBrandByTerse(terse: string): string | null {
  // WEAPON_BRANDS is keyed by terse name, so direct lookup works.
  const direct = WEAPON_BRANDS[terse];
  if (direct) return direct.key;
  return null;
}
