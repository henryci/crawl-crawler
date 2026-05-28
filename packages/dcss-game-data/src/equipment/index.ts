/**
 * Equipment data exports — properties, brands, egos, base types, species
 * slot rules, and unrand registries used by the equipment optimizer.
 *
 * See EQUIPMENT_OPTIMIZER_DESIGN.md for the conceptual model.
 */

export type {
  PropertyKey,
  PropertyCategory,
  PropertyRendering,
  PropertyValueType,
  Property,
  Contribution,
  WeaponBrand,
  ArmorEgo,
  ItemSlot,
  WeaponBaseType,
  ArmorBaseType,
  ShieldBaseType,
  JewelryBaseType,
  StaffBaseType,
  SlotCapacity,
  SpeciesEquipmentRules,
  MultiSlotUnrand,
  ItemCategory,
  ContributionMap,
  ParsedItem,
  ParsedItemArtefact,
  TalismanBaseType,
} from './types.js';

export {
  parseTerseToken,
  parseTerseToContributions,
  parseArtefactBraces,
  type ArtefactBraceParse,
} from './braces.js';

// Generated (extracted from DCSS source — do not edit by hand)
export { ARTP_ENTRIES, ARTP_BY_NAME } from './generated/artp.js';
export type { ExtractedArtpEntry } from './generated/artp.js';

export { BRAND_ENTRIES, BRAND_BY_NAME } from './generated/brand.js';
export type { ExtractedBrandEntry } from './generated/brand.js';

export { EGO_ENTRIES, EGO_BY_NAME } from './generated/sparm.js';
export type { ExtractedEgoEntry } from './generated/sparm.js';

export { ARMOR_ENTRIES, ARMOR_BY_NAME } from './generated/armor-type.js';
export type { ExtractedArmorEntry } from './generated/armor-type.js';

export { WEAPON_ENTRIES, WEAPON_BY_NAME } from './generated/weapon-type.js';
export type { ExtractedWeaponEntry } from './generated/weapon-type.js';

export { JEWELRY_ENTRIES, JEWELRY_BY_NAME } from './generated/jewellery-type.js';
export type { ExtractedJewelryEntry } from './generated/jewellery-type.js';

export { STAFF_ENTRIES, STAFF_BY_NAME } from './generated/stave-type.js';
export type { ExtractedStaffEntry } from './generated/stave-type.js';

export { UNRAND_ENTRIES, UNRAND_BY_NAME, UNRAND_BY_ENUM } from './generated/unrand-data.js';
export type { ExtractedUnrandEntry } from './generated/unrand-data.js';

// Curated (semantic layer)
export { PROPERTIES, PROPERTIES_BY_ARTP, CURATED_ARTP_KEYS } from './properties.js';
export { WEAPON_BRANDS, BRANDS_BY_SPWPN, CURATED_BRAND_KEYS } from './brands.js';
export {
  ARMOR_EGOS,
  EGOS_BY_SPARM,
  CURATED_EGO_KEYS,
  getUncoveredEgos,
  getCuratedEgoPropertyRefs,
} from './egos.js';
export {
  WEAPON_BASE_TYPES,
  WEAPONS_BY_WPN,
  WEAPONS_BY_DISPLAY_NAME,
  getWeaponHands,
} from './weapons.js';
export {
  ARMOR_BASE_TYPES,
  SHIELD_BASE_TYPES,
  ARMORS_BY_ARM,
  ARMORS_BY_DISPLAY_NAME,
} from './armors.js';
export {
  JEWELRY_BASE_TYPES,
  JEWELRY_BY_ENUM,
  JEWELRY_BY_DISPLAY_NAME,
  CURATED_JEWELRY_KEYS,
  getCuratedJewelryPropertyRefs,
} from './jewelry.js';
export {
  STAFF_BASE_TYPES,
  STAVES_BY_ENUM,
  STAVES_BY_DISPLAY_NAME,
  CURATED_STAFF_KEYS,
  getCuratedStaffPropertyRefs,
} from './staves.js';
export {
  TALISMAN_BASE_TYPES,
  TALISMANS_BY_DISPLAY_NAME,
  TALISMAN_GENERIC,
} from './talismans.js';
export {
  SPECIES_EQUIPMENT_RULES,
  DEFAULT_CAPACITY,
  getSpeciesEquipmentRules,
  getSlotCapacity,
} from './species-equip.js';
export {
  MULTI_SLOT_UNRANDS,
  MULTI_SLOT_BY_DISPLAY_NAME,
  getMultiSlotOccupation,
  getGrantedSlots,
  effectiveCapacity,
} from './multi-slot.js';
