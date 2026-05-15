/**
 * Armor and shield base-type registries, derived from Armour_prop[] in
 * item-prop.cc. Shields (buckler, kite shield, tower shield, orb) get
 * routed to ShieldBaseType; everything else to ArmorBaseType.
 *
 * Tower shields impose a spell-success penalty in DCSS that scales with
 * encumbrance, strength, and Shields skill — too dynamic to model as a
 * fixed Contribution, so for v1 we leave shield `innateContributions`
 * empty and capture the penalty as a UI note. The optimizer can later
 * apply a dynamic penalty calculator if needed.
 */

import type { ArmorBaseType, ItemSlot, ShieldBaseType } from './types.js';
import { ARMOR_ENTRIES, type ExtractedArmorEntry } from './generated/armor-type.js';

/** Map DCSS SLOT_* enum to our ItemSlot type. */
const SLOT_MAP: Record<string, ItemSlot> = {
  SLOT_WEAPON: 'weapon',
  SLOT_OFFHAND: 'offhand',
  SLOT_BODY_ARMOUR: 'body_armour',
  SLOT_HELMET: 'helmet',
  SLOT_GLOVES: 'gloves',
  SLOT_BOOTS: 'boots',
  SLOT_BARDING: 'barding',
  SLOT_CLOAK: 'cloak',
  SLOT_RING: 'ring',
  SLOT_AMULET: 'amulet',
  SLOT_GIZMO: 'gizmo',
};

function mapSlot(dcssSlot: string): ItemSlot | null {
  return SLOT_MAP[dcssSlot] ?? null;
}

function enumNameToKey(enumName: string): string {
  return enumName.replace(/^ARM_/, '').toLowerCase();
}

function buildArmor(extracted: ExtractedArmorEntry): ArmorBaseType | null {
  const slot = mapSlot(extracted.slot);
  if (!slot) return null;
  return {
    key: enumNameToKey(extracted.enumName),
    displayName: extracted.displayName,
    slots: [slot],
    baseAC: extracted.baseAC,
  };
}

function buildShield(extracted: ExtractedArmorEntry): ShieldBaseType {
  return {
    key: enumNameToKey(extracted.enumName),
    displayName: extracted.displayName,
    slots: ['offhand'],
    baseSH: extracted.baseAC, // shields store SH bonus in the AC field
  };
}

/**
 * Armor base types (excludes shields) keyed by lowercase identifier
 * (e.g. 'plate_armour', 'cloak', 'hat'). Non-legacy only.
 */
export const ARMOR_BASE_TYPES: Record<string, ArmorBaseType> = (() => {
  const out: Record<string, ArmorBaseType> = {};
  for (const extracted of ARMOR_ENTRIES) {
    if (extracted.legacy || extracted.isShield) continue;
    const armor = buildArmor(extracted);
    if (!armor) continue;
    if (out[armor.key]) {
      throw new Error(`Duplicate armor key '${armor.key}' from ${extracted.enumName}`);
    }
    out[armor.key] = armor;
  }
  return out;
})();

/** Shield base types keyed by lowercase identifier. Non-legacy only. */
export const SHIELD_BASE_TYPES: Record<string, ShieldBaseType> = (() => {
  const out: Record<string, ShieldBaseType> = {};
  for (const extracted of ARMOR_ENTRIES) {
    if (extracted.legacy || !extracted.isShield) continue;
    const shield = buildShield(extracted);
    if (out[shield.key]) {
      throw new Error(`Duplicate shield key '${shield.key}' from ${extracted.enumName}`);
    }
    out[shield.key] = shield;
  }
  return out;
})();

export const ARMORS_BY_ARM: Map<string, ArmorBaseType | ShieldBaseType> = new Map(
  ARMOR_ENTRIES
    .filter((e) => !e.legacy)
    .map((e) => {
      const built = e.isShield ? buildShield(e) : buildArmor(e);
      return built ? [e.enumName, built] as const : null;
    })
    .filter((p): p is readonly [string, ArmorBaseType | ShieldBaseType] => p !== null),
);

export const ARMORS_BY_DISPLAY_NAME: Map<string, ArmorBaseType | ShieldBaseType> = new Map(
  ARMOR_ENTRIES
    .filter((e) => !e.legacy)
    .map((e) => {
      const built = e.isShield ? buildShield(e) : buildArmor(e);
      return built ? [e.displayName.toLowerCase(), built] as const : null;
    })
    .filter((p): p is readonly [string, ArmorBaseType | ShieldBaseType] => p !== null),
);
