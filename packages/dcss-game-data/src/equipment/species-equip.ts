/**
 * Per-species equipment slot capacities, hand-curated from
 * `player-equip.cc::get_player_equip_slot_count()` and species mutations.
 *
 * The reference is DCSS's runtime logic: this file is the snapshot of
 * those rules for the pinned source. When DCSS adds a new species or
 * changes slot rules, update this file (no extract script to re-run).
 *
 * Default rule: a species with no entry here is assumed to follow the
 * human-like default (DEFAULT_CAPACITY). Use `getSpeciesEquipmentRules`
 * to read with fallback.
 */

import type { ItemSlot, SlotCapacity, SpeciesEquipmentRules } from './types.js';

/** Capacity for a default Human-like species. */
export const DEFAULT_CAPACITY: SlotCapacity = {
  weapon: 1,
  offhand: 1,
  body_armour: 1,
  helmet: 1,
  gloves: 1,
  boots: 1,
  barding: 0,
  cloak: 1,
  ring: 2,
  amulet: 1,
  gizmo: 0,
};

/**
 * Per-species rules keyed by the two-letter species code. Only species
 * with non-default capacities are listed; others fall back to
 * DEFAULT_CAPACITY via getSpeciesEquipmentRules().
 */
export const SPECIES_EQUIPMENT_RULES: Record<string, SpeciesEquipmentRules> = {
  Op: {
    speciesCode: 'Op',
    capacity: {
      weapon: 1,
      offhand: 1,
      body_armour: 0,
      helmet: 1,
      gloves: 0,
      boots: 0,
      barding: 0, // sphinx form can wear barding, but default Octopode can't
      cloak: 0,
      ring: 8,
      amulet: 1,
      gizmo: 0,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Octopode: 8 ring slots, no body armor/gloves/boots/cloak.',
  },
  Fe: {
    speciesCode: 'Fe',
    capacity: {
      weapon: 0,
      offhand: 0,
      body_armour: 0,
      helmet: 0,
      gloves: 0,
      boots: 0,
      barding: 0,
      cloak: 0,
      ring: 2,
      amulet: 1,
      gizmo: 0,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Felid: no weapons, no armor. Only rings + amulet (via paws/neck).',
  },
  Na: {
    speciesCode: 'Na',
    capacity: {
      ...DEFAULT_CAPACITY,
      boots: 0,
      barding: 1,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Naga: barding instead of boots.',
  },
  Pa: {
    speciesCode: 'Pa',
    capacity: {
      ...DEFAULT_CAPACITY,
      boots: 0,
      barding: 1,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Palentonga: barding instead of boots. (Removed in 0.31.)',
  },
  Cg: {
    speciesCode: 'Cg',
    capacity: {
      weapon: 1,
      // Coglin offhand slot is 0; second weapon goes in WEAPON_OR_OFFHAND
      // which we model by allowing 2 weapons via two-handed-check logic.
      // For the optimizer's slot count, treat as weapon: 2.
      offhand: 0,
      body_armour: 1,
      helmet: 1,
      gloves: 1,
      boots: 1,
      barding: 0,
      cloak: 1,
      ring: 2,
      amulet: 1,
      gizmo: 1,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Coglin: dual-wield via WEAPON_OR_OFFHAND, plus gizmo exoframe slot. ' +
      'Model dual-wield as weapon: 2 in optimizer logic.',
  },
  Fo: {
    speciesCode: 'Fo',
    capacity: {
      // Formicids can wield two-handed weapons one-handed and have extra arms.
      ...DEFAULT_CAPACITY,
      ring: 4,
    },
    twoHanderBlocksOffhand: false, // Formicid 2h weapons don't block offhand
    notes: 'Formicid: 4 ring slots; can wield 2h weapons one-handed (offhand stays free).',
  },
  Dr: {
    speciesCode: 'Dr',
    capacity: {
      ...DEFAULT_CAPACITY,
      body_armour: 0,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Draconian: wings prevent body armor. Cloaks work (but are scarves only iirc).',
  },
  // Small-sized species: no gloves/boots
  Sp: {
    speciesCode: 'Sp',
    capacity: {
      ...DEFAULT_CAPACITY,
      gloves: 0,
      boots: 0,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Spriggan: too small for gloves and boots.',
  },
  // Large-sized species: no gloves/boots/most armor
  Tr: {
    speciesCode: 'Tr',
    capacity: {
      ...DEFAULT_CAPACITY,
      gloves: 0,
      boots: 0,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Troll: too large for gloves and boots.',
  },
  Og: {
    speciesCode: 'Og',
    capacity: {
      ...DEFAULT_CAPACITY,
      gloves: 0,
      boots: 0,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Ogre: too large for gloves and boots. (Removed in 0.26.)',
  },
  // Tiny-sized species: no gloves/boots (also no hat? need to verify)
  Ko: {
    speciesCode: 'Ko',
    capacity: {
      ...DEFAULT_CAPACITY,
      gloves: 0,
      boots: 0,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Kobold: small size — no gloves/boots.',
  },
  Po: {
    speciesCode: 'Po',
    capacity: {
      weapon: 1,
      offhand: 0,
      body_armour: 0,
      helmet: 0,
      gloves: 0,
      boots: 0,
      barding: 0,
      cloak: 0,
      ring: 2,
      amulet: 1,
      gizmo: 0,
    },
    twoHanderBlocksOffhand: true,
    notes: 'Poltergeist: formless — no armor at all. Has special HAUNTED_AUX slots.',
  },
};

/**
 * Get equipment rules for a species code, falling back to DEFAULT_CAPACITY
 * for unlisted species.
 */
export function getSpeciesEquipmentRules(speciesCode: string): SpeciesEquipmentRules {
  const explicit = SPECIES_EQUIPMENT_RULES[speciesCode];
  if (explicit) return explicit;
  return {
    speciesCode,
    capacity: { ...DEFAULT_CAPACITY },
    twoHanderBlocksOffhand: true,
    notes: 'Default human-like capacity (no special species rules).',
  };
}

/**
 * Get the slot capacity for a (species, slot) pair, with default fallback.
 */
export function getSlotCapacity(speciesCode: string, slot: ItemSlot): number {
  const rules = getSpeciesEquipmentRules(speciesCode);
  return rules.capacity[slot] ?? 0;
}
