/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit 274e6c4f0775ad821a9e0f974ca21d09501f1955
 * Extracted from: item-prop.cc (Armour_prop[])
 * Re-run: `pnpm --filter dcss-game-data extract`
 */

export interface ExtractedArmorEntry {
  /** DCSS enum name, e.g. 'ARM_PLATE_ARMOUR'. */
  enumName: string;
  /** Item display name as it appears in inventory. */
  displayName: string;
  /** Base AC contribution before enchantment / skill. */
  baseAC: number;
  /** EV penalty (negative numbers mean penalty; 0 means none). */
  evPenalty: number;
  /** DCSS equipment slot enum, e.g. 'SLOT_BODY_ARMOUR'. */
  slot: string;
  /** True for shields (ARM_BUCKLER, ARM_KITE_SHIELD, ARM_TOWER_SHIELD, ARM_ORB). */
  isShield: boolean;
  /** True for TAG_MAJOR_VERSION == 34 entries. */
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}

export const ARMOR_ENTRIES: ExtractedArmorEntry[] = [
  {
    "enumName": "ARM_ANIMAL_SKIN",
    "displayName": "animal skin",
    "baseAC": 2,
    "evPenalty": 0,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 118
      }
    }
  },
  {
    "enumName": "ARM_ROBE",
    "displayName": "robe",
    "baseAC": 2,
    "evPenalty": 0,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 120
      }
    }
  },
  {
    "enumName": "ARM_LEATHER_ARMOUR",
    "displayName": "leather armour",
    "baseAC": 3,
    "evPenalty": -40,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 129
      }
    }
  },
  {
    "enumName": "ARM_RING_MAIL",
    "displayName": "ring mail",
    "baseAC": 5,
    "evPenalty": -70,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 131
      }
    }
  },
  {
    "enumName": "ARM_SCALE_MAIL",
    "displayName": "scale mail",
    "baseAC": 6,
    "evPenalty": -100,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 133
      }
    }
  },
  {
    "enumName": "ARM_CHAIN_MAIL",
    "displayName": "chain mail",
    "baseAC": 8,
    "evPenalty": -140,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 145
      }
    }
  },
  {
    "enumName": "ARM_PLATE_ARMOUR",
    "displayName": "plate armour",
    "baseAC": 10,
    "evPenalty": -180,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 147
      }
    }
  },
  {
    "enumName": "ARM_CRYSTAL_PLATE_ARMOUR",
    "displayName": "crystal plate armour",
    "baseAC": 14,
    "evPenalty": -230,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 149
      }
    }
  },
  {
    "enumName": "ARM_TROLL_HIDE",
    "displayName": "removed troll hide",
    "baseAC": 0,
    "evPenalty": 0,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 153
      }
    }
  },
  {
    "enumName": "ARM_TROLL_LEATHER_ARMOUR",
    "displayName": "troll leather armour",
    "baseAC": 3,
    "evPenalty": -40,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 157
      }
    }
  },
  {
    "enumName": "ARM_CLOAK",
    "displayName": "cloak",
    "baseAC": 1,
    "evPenalty": 0,
    "slot": "SLOT_CLOAK",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 161
      }
    }
  },
  {
    "enumName": "ARM_SCARF",
    "displayName": "scarf",
    "baseAC": 0,
    "evPenalty": 0,
    "slot": "SLOT_CLOAK",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 169
      }
    }
  },
  {
    "enumName": "ARM_GLOVES",
    "displayName": "gloves",
    "baseAC": 1,
    "evPenalty": 0,
    "slot": "SLOT_GLOVES",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 178
      }
    }
  },
  {
    "enumName": "ARM_HELMET",
    "displayName": "helmet",
    "baseAC": 1,
    "evPenalty": 0,
    "slot": "SLOT_HELMET",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 189
      }
    }
  },
  {
    "enumName": "ARM_CAP",
    "displayName": "cap",
    "baseAC": 0,
    "evPenalty": 0,
    "slot": "SLOT_HELMET",
    "isShield": false,
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 198
      }
    }
  },
  {
    "enumName": "ARM_HAT",
    "displayName": "hat",
    "baseAC": 0,
    "evPenalty": 0,
    "slot": "SLOT_HELMET",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 202
      }
    }
  },
  {
    "enumName": "ARM_BOOTS",
    "displayName": "boots",
    "baseAC": 1,
    "evPenalty": 0,
    "slot": "SLOT_BOOTS",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 215
      }
    }
  },
  {
    "enumName": "ARM_CENTAUR_BARDING",
    "displayName": "centaur barding",
    "baseAC": 4,
    "evPenalty": -60,
    "slot": "SLOT_BARDING",
    "isShield": false,
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 225
      }
    }
  },
  {
    "enumName": "ARM_BARDING",
    "displayName": "barding",
    "baseAC": 4,
    "evPenalty": -60,
    "slot": "SLOT_BARDING",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 228
      }
    }
  },
  {
    "enumName": "ARM_ORB",
    "displayName": "orb",
    "baseAC": 0,
    "evPenalty": 0,
    "slot": "SLOT_OFFHAND",
    "isShield": true,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 239
      }
    }
  },
  {
    "enumName": "ARM_BUCKLER",
    "displayName": "buckler",
    "baseAC": 3,
    "evPenalty": -50,
    "slot": "SLOT_OFFHAND",
    "isShield": true,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 250
      }
    }
  },
  {
    "enumName": "ARM_KITE_SHIELD",
    "displayName": "kite shield",
    "baseAC": 8,
    "evPenalty": -100,
    "slot": "SLOT_OFFHAND",
    "isShield": true,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 261
      }
    }
  },
  {
    "enumName": "ARM_TOWER_SHIELD",
    "displayName": "tower shield",
    "baseAC": 13,
    "evPenalty": -150,
    "slot": "SLOT_OFFHAND",
    "isShield": true,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 272
      }
    }
  },
  {
    "enumName": "ARM_STEAM_DRAGON_ARMOUR",
    "displayName": "steam dragon scales",
    "baseAC": 5,
    "evPenalty": 0,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 285
      }
    }
  },
  {
    "enumName": "ARM_ACID_DRAGON_ARMOUR",
    "displayName": "acid dragon scales",
    "baseAC": 6,
    "evPenalty": -50,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 287
      }
    }
  },
  {
    "enumName": "ARM_QUICKSILVER_DRAGON_ARMOUR",
    "displayName": "quicksilver dragon scales",
    "baseAC": 9,
    "evPenalty": -70,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 289
      }
    }
  },
  {
    "enumName": "ARM_SWAMP_DRAGON_ARMOUR",
    "displayName": "swamp dragon scales",
    "baseAC": 7,
    "evPenalty": -70,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 291
      }
    }
  },
  {
    "enumName": "ARM_FIRE_DRAGON_ARMOUR",
    "displayName": "fire dragon scales",
    "baseAC": 8,
    "evPenalty": -90,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 293
      }
    }
  },
  {
    "enumName": "ARM_ICE_DRAGON_ARMOUR",
    "displayName": "ice dragon scales",
    "baseAC": 9,
    "evPenalty": -110,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 295
      }
    }
  },
  {
    "enumName": "ARM_PEARL_DRAGON_ARMOUR",
    "displayName": "pearl dragon scales",
    "baseAC": 10,
    "evPenalty": -110,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 297
      }
    }
  },
  {
    "enumName": "ARM_STORM_DRAGON_ARMOUR",
    "displayName": "storm dragon scales",
    "baseAC": 10,
    "evPenalty": -150,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 299
      }
    }
  },
  {
    "enumName": "ARM_SHADOW_DRAGON_ARMOUR",
    "displayName": "shadow dragon scales",
    "baseAC": 11,
    "evPenalty": -150,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 301
      }
    }
  },
  {
    "enumName": "ARM_GOLDEN_DRAGON_ARMOUR",
    "displayName": "golden dragon scales",
    "baseAC": 12,
    "evPenalty": -230,
    "slot": "SLOT_BODY_ARMOUR",
    "isShield": false,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 303
      }
    }
  }
];

export const ARMOR_BY_NAME: Map<string, ExtractedArmorEntry> = new Map(
  ARMOR_ENTRIES.map((e) => [e.enumName, e]),
);
