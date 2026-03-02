/**
 * Equipment extractor for DCSS morgue files.
 *
 * Extracts equipment information from the Inventory section.
 * Equipment currently worn has markers like "(worn)", "(weapon)",
 * "(left hand)", "(right hand)".
 *
 * Equipment slots:
 * - weapon: Item with "(weapon)" marker
 * - bodyArmour: Robes, scales, mail, leather armour, etc.
 * - shield: Buckler, shield, orb, warlock's mirror
 * - helmet: Helmet, hat, cap
 * - cloak: Cloak, scarf
 * - gloves: Gloves, gauntlets
 * - boots: Boots, barding
 * - amulet: Amulet (worn)
 * - rings: All worn rings (variable count)
 */

import type { Equipment } from '../types.js';
import { cleanItemName } from '../utils.js';

/**
 * Extract equipped items from the morgue file.
 *
 * Scans the Inventory section for items marked as worn or wielded.
 *
 * @param content - Full morgue file content as a string
 * @returns Object with equipment slots, or null if inventory not found.
 *         Each slot contains the cleaned item name or null if empty.
 */
export function extractEquipment(content: string): Equipment | null {
  const result: Equipment = {
    weapon: null,
    bodyArmour: null,
    shield: null,
    helmet: null,
    cloak: null,
    gloves: null,
    boots: null,
    amulet: null,
    rings: [],
  };

  // Find the inventory section
  const inventorySection = findInventorySection(content);
  if (!inventorySection) {
    return null;
  }

  // Parse each line looking for worn/wielded items
  const lines = inventorySection.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }

    // Check for item markers
    if (trimmedLine.includes('(weapon)')) {
      result.weapon = cleanItemName(trimmedLine);
    } else if (trimmedLine.includes('(left hand)') || trimmedLine.includes('(right hand)')) {
      result.rings.push(cleanItemName(trimmedLine));
    } else if (trimmedLine.includes('(worn)')) {
      assignWornItem(trimmedLine, result);
    } else if (trimmedLine.includes('(around neck)')) {
      result.amulet = cleanItemName(trimmedLine);
    }
  }

  return result;
}

/**
 * Find the Inventory section in the morgue file.
 *
 * The inventory section starts with "Inventory:" and ends at the next
 * major section (Skills, Spells, Dungeon Overview, etc.)
 */
function findInventorySection(content: string): string | null {
  // Look for Inventory header
  const invMatch = /^Inventory:/m.exec(content);
  if (!invMatch) {
    return null;
  }

  const start = invMatch.index;

  // Find the end - look for next major section
  const endMarkers = [
    '\nSkills:',
    '\n   Skills:',
    '\nYou had ',
    '\nYou knew ',
    '\nDungeon Overview',
    '\nMessage History',
    '\nNotes',
    '\nVanquished Creatures',
  ];

  let end = content.length;
  for (const marker of endMarkers) {
    const idx = content.indexOf(marker, start);
    if (idx !== -1 && idx < end) {
      end = idx;
    }
  }

  return content.slice(start, end);
}

/**
 * Body armour type keywords for identification.
 */
const BODY_ARMOUR_TYPES = [
  'robe',
  'leather armour',
  'ring mail',
  'scale mail',
  'chain mail',
  'plate armour',
  'crystal plate',
  'dragon scales',
  'dragon armour',
  'fire dragon',
  'ice dragon',
  'storm dragon',
  'gold dragon',
  'swamp dragon',
  'shadow dragon',
  'quicksilver dragon',
  'pearl dragon',
  'steam dragon',
  'acid dragon',
  'troll leather',
  'animal skin',
];

/**
 * Shield type keywords for identification.
 */
const SHIELD_TYPES = ['buckler', 'kite shield', 'tower shield', 'orb', "warlock's mirror", 'shield'];

/**
 * Strip the affix description (e.g., `{rF+ Will+ Ring++}`) from an item line.
 * Affix descriptions can contain keywords like "Ring" that would confuse slot detection.
 */
function stripAffixDescription(line: string): string {
  return line.replace(/\{[^}]*\}/g, '');
}

/**
 * Assign a worn item to the appropriate equipment slot.
 *
 * Determines the slot based on item type keywords in the base item name,
 * ignoring the affix description in curly braces.
 */
function assignWornItem(line: string, result: Equipment): void {
  const baseLower = stripAffixDescription(line).toLowerCase();
  const cleaned = cleanItemName(line);

  if (BODY_ARMOUR_TYPES.some((t) => baseLower.includes(t))) {
    result.bodyArmour = cleaned;
  } else if (SHIELD_TYPES.some((t) => baseLower.includes(t))) {
    result.shield = cleaned;
  } else if (
    baseLower.includes('helmet') ||
    baseLower.includes('hat') ||
    baseLower.includes('cap') ||
    baseLower.includes('crown') ||
    baseLower.includes('horn') ||
    baseLower.includes('mask')
  ) {
    result.helmet = cleaned;
  } else if (baseLower.includes('cloak') || baseLower.includes('scarf')) {
    result.cloak = cleaned;
  } else if (baseLower.includes('gloves') || baseLower.includes('gauntlets')) {
    result.gloves = cleaned;
  } else if (baseLower.includes('boots') || baseLower.includes('barding')) {
    result.boots = cleaned;
  } else if (baseLower.includes('amulet')) {
    result.amulet = cleaned;
  } else if (baseLower.includes('ring')) {
    result.rings.push(cleaned);
  }
}

