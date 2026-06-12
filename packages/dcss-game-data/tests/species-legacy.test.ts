import { describe, it, expect } from 'vitest';

import {
  LEGACY_SPECIES_NAMES,
  CURRENT_SPECIES_NAMES,
  REMOVED_SPECIES_CODES,
} from '../src/species.js';
import { isSpeciesRemoved } from '../src/utils.js';
import { isCurrentlyRemoved } from '../src/types.js';

describe('re-added species classification', () => {
  it('treats Mountain Dwarf as currently playable (removed in 0.10, re-added in 0.32)', () => {
    expect(CURRENT_SPECIES_NAMES).toContain('Mountain Dwarf');
    expect(LEGACY_SPECIES_NAMES).not.toContain('Mountain Dwarf');
    expect(REMOVED_SPECIES_CODES).not.toContain('MD');
  });

  it('still classifies genuinely removed species as legacy', () => {
    // Deep Dwarf was removed in 0.27 and never re-added.
    expect(LEGACY_SPECIES_NAMES).toContain('Deep Dwarf');
    expect(REMOVED_SPECIES_CODES).toContain('DD');
    expect(CURRENT_SPECIES_NAMES).not.toContain('Deep Dwarf');
  });

  it('isCurrentlyRemoved: re-added entry is not removed, gap-only removal is', () => {
    expect(isCurrentlyRemoved({ removedInVersion: '0.10', readdedInVersion: '0.32' })).toBe(false);
    expect(isCurrentlyRemoved({ removedInVersion: '0.27' })).toBe(true);
    expect(isCurrentlyRemoved({})).toBe(false);
  });

  it('isSpeciesRemoved is version-aware for re-added species', () => {
    // Modern Mountain Dwarf games are not removed...
    expect(isSpeciesRemoved('MD', '0.32')).toBe(false);
    expect(isSpeciesRemoved('MD', '0.33')).toBe(false);
    // ...but games from the removed era (0.10 <= v < 0.32) are.
    expect(isSpeciesRemoved('MD', '0.20')).toBe(true);
    expect(isSpeciesRemoved('MD', '0.10')).toBe(true);
    // Without a version, report current status (re-added => not removed).
    expect(isSpeciesRemoved('MD')).toBe(false);
  });
});
