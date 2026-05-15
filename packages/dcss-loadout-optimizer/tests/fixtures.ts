/**
 * Test fixture builders for ParsedItem.
 *
 * Real ParsedItem objects come from the morgue parser. For unit tests
 * we construct minimal ones — only the fields the optimizer reads need
 * to be set, and other fields are stubbed.
 */

import type {
  ContributionMap,
  ItemCategory,
  ItemSlot,
  ParsedItem,
  WeaponBaseType,
} from 'dcss-game-data';

let nextId = 'a'.charCodeAt(0);
function freshId(): string {
  const code = nextId++;
  return String.fromCharCode(code);
}

export function makeItem(opts: {
  category: ItemCategory;
  slots: ItemSlot[];
  contributions: ContributionMap;
  enchant?: number;
  hands?: 1 | 2;
  displayName?: string;
}): ParsedItem {
  const id = freshId();
  const displayName = opts.displayName ?? `test-${opts.category}-${id}`;
  const baseType =
    opts.category === 'weapon'
      ? makeWeaponBase(displayName, opts.hands ?? 1)
      : makeNonWeaponBase(displayName, opts.slots);

  return {
    id,
    rawText: displayName,
    category: opts.category,
    baseType,
    slots: opts.slots,
    enchant: opts.enchant ?? 0,
    isEquipped: false,
    contributions: opts.contributions,
  };
}

function makeWeaponBase(displayName: string, hands: 1 | 2): WeaponBaseType {
  return {
    key: displayName.replace(/\s+/g, '_'),
    displayName,
    hands,
    skill: 'long_blades',
  };
}

function makeNonWeaponBase(displayName: string, slots: ItemSlot[]): ParsedItem['baseType'] {
  if (slots.length === 1 && slots[0] === 'offhand') {
    return {
      key: displayName.replace(/\s+/g, '_'),
      displayName,
      slots: ['offhand'],
      baseSH: 0,
    };
  }
  if (slots.length === 1 && slots[0] === 'ring') {
    return {
      key: displayName.replace(/\s+/g, '_'),
      displayName,
      slots: ['ring'],
      innateContributions: [],
    };
  }
  if (slots.length === 1 && slots[0] === 'amulet') {
    return {
      key: displayName.replace(/\s+/g, '_'),
      displayName,
      slots: ['amulet'],
      innateContributions: [],
    };
  }
  if (slots.length === 1 && slots[0] === 'weapon') {
    // Magical staff (treated as weapon-slot but in 'staff' category).
    return {
      key: displayName.replace(/\s+/g, '_'),
      displayName,
      slots: ['weapon'],
      hands: 1,
      innateContributions: [],
    };
  }
  // ArmorBaseType (covers body_armour, helmet, gloves, boots, cloak, barding, and multi-slot)
  return {
    key: displayName.replace(/\s+/g, '_'),
    displayName,
    slots,
    baseAC: 0,
  };
}

/**
 * Reset the auto-id counter so tests get stable ids when run in order.
 * Call in `beforeEach` if needed.
 */
export function resetFixtureIds(): void {
  nextId = 'a'.charCodeAt(0);
}
