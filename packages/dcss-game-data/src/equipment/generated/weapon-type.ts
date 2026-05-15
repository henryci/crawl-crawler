/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit 274e6c4f0775ad821a9e0f974ca21d09501f1955
 * Extracted from: item-prop.cc (Weapon_prop[])
 * Re-run: `pnpm --filter dcss-game-data extract`
 */

export interface ExtractedWeaponEntry {
  /** DCSS enum name, e.g. 'WPN_LONG_SWORD'. */
  enumName: string;
  /** Item display name as it appears in inventory. */
  displayName: string;
  /** Base damage before enchantment / skill. */
  baseDamage: number;
  /** Weapon skill enum, e.g. 'SK_LONG_BLADES'. */
  skill: string;
  /**
   * Smallest size that can wield this weapon at all (needs both hands).
   * Larger sizes may be able to wield one-handed (see min1hSize).
   */
  min2hSize: string;
  /**
   * Smallest size that can wield one-handed. 'NUM_SIZE_LEVELS' means the
   * weapon is always two-handed for everyone.
   */
  min1hSize: string;
  /** True for TAG_MAJOR_VERSION == 34 entries. */
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}

export const WEAPON_ENTRIES: ExtractedWeaponEntry[] = [
  {
    "enumName": "WPN_CLUB",
    "displayName": "club",
    "baseDamage": 5,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 503
      }
    }
  },
  {
    "enumName": "WPN_SPIKED_FLAIL",
    "displayName": "old spiked flail",
    "baseDamage": 5,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 507
      }
    }
  },
  {
    "enumName": "WPN_WHIP",
    "displayName": "whip",
    "baseDamage": 6,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 511
      }
    }
  },
  {
    "enumName": "WPN_HAMMER",
    "displayName": "old hammer",
    "baseDamage": 7,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 527
      }
    }
  },
  {
    "enumName": "WPN_MACE",
    "displayName": "mace",
    "baseDamage": 8,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 531
      }
    }
  },
  {
    "enumName": "WPN_FLAIL",
    "displayName": "flail",
    "baseDamage": 10,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 534
      }
    }
  },
  {
    "enumName": "WPN_MORNINGSTAR",
    "displayName": "morningstar",
    "baseDamage": 13,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 537
      }
    }
  },
  {
    "enumName": "WPN_DEMON_WHIP",
    "displayName": "demon whip",
    "baseDamage": 11,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 554
      }
    }
  },
  {
    "enumName": "WPN_SACRED_SCOURGE",
    "displayName": "sacred scourge",
    "baseDamage": 12,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 557
      }
    }
  },
  {
    "enumName": "WPN_DIRE_FLAIL",
    "displayName": "dire flail",
    "baseDamage": 13,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 560
      }
    }
  },
  {
    "enumName": "WPN_EVENINGSTAR",
    "displayName": "eveningstar",
    "baseDamage": 15,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 563
      }
    }
  },
  {
    "enumName": "WPN_GREAT_MACE",
    "displayName": "great mace",
    "baseDamage": 17,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 580
      }
    }
  },
  {
    "enumName": "WPN_GIANT_CLUB",
    "displayName": "giant club",
    "baseDamage": 20,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LARGE",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 583
      }
    }
  },
  {
    "enumName": "WPN_GIANT_SPIKED_CLUB",
    "displayName": "giant spiked club",
    "baseDamage": 22,
    "skill": "SK_MACES_FLAILS",
    "min2hSize": "SIZE_LARGE",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 586
      }
    }
  },
  {
    "enumName": "WPN_DAGGER",
    "displayName": "dagger",
    "baseDamage": 4,
    "skill": "SK_SHORT_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 591
      }
    }
  },
  {
    "enumName": "WPN_QUICK_BLADE",
    "displayName": "quick blade",
    "baseDamage": 4,
    "skill": "SK_SHORT_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 609
      }
    }
  },
  {
    "enumName": "WPN_SHORT_SWORD",
    "displayName": "short sword",
    "baseDamage": 5,
    "skill": "SK_SHORT_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 625
      }
    }
  },
  {
    "enumName": "WPN_RAPIER",
    "displayName": "rapier",
    "baseDamage": 7,
    "skill": "SK_SHORT_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 628
      }
    }
  },
  {
    "enumName": "WPN_ATHAME",
    "displayName": "athame",
    "baseDamage": 6,
    "skill": "SK_SHORT_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 631
      }
    }
  },
  {
    "enumName": "WPN_CUTLASS",
    "displayName": "old cutlass",
    "baseDamage": 8,
    "skill": "SK_SHORT_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 649
      }
    }
  },
  {
    "enumName": "WPN_FALCHION",
    "displayName": "falchion",
    "baseDamage": 8,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 655
      }
    }
  },
  {
    "enumName": "WPN_LONG_SWORD",
    "displayName": "long sword",
    "baseDamage": 10,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 658
      }
    }
  },
  {
    "enumName": "WPN_SCIMITAR",
    "displayName": "scimitar",
    "baseDamage": 12,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 661
      }
    }
  },
  {
    "enumName": "WPN_DEMON_BLADE",
    "displayName": "demon blade",
    "baseDamage": 13,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 664
      }
    }
  },
  {
    "enumName": "WPN_EUDEMON_BLADE",
    "displayName": "eudemon blade",
    "baseDamage": 14,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 667
      }
    }
  },
  {
    "enumName": "WPN_DOUBLE_SWORD",
    "displayName": "double sword",
    "baseDamage": 15,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_MEDIUM",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 670
      }
    }
  },
  {
    "enumName": "WPN_GREAT_SWORD",
    "displayName": "great sword",
    "baseDamage": 17,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 673
      }
    }
  },
  {
    "enumName": "WPN_TRIPLE_SWORD",
    "displayName": "triple sword",
    "baseDamage": 19,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 676
      }
    }
  },
  {
    "enumName": "WPN_BLESSED_FALCHION",
    "displayName": "old falchion",
    "baseDamage": 8,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 680
      }
    }
  },
  {
    "enumName": "WPN_BLESSED_LONG_SWORD",
    "displayName": "old long sword",
    "baseDamage": 10,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 683
      }
    }
  },
  {
    "enumName": "WPN_BLESSED_SCIMITAR",
    "displayName": "old scimitar",
    "baseDamage": 12,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 686
      }
    }
  },
  {
    "enumName": "WPN_BLESSED_DOUBLE_SWORD",
    "displayName": "old double sword",
    "baseDamage": 15,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_MEDIUM",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 689
      }
    }
  },
  {
    "enumName": "WPN_BLESSED_GREAT_SWORD",
    "displayName": "old great sword",
    "baseDamage": 17,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 692
      }
    }
  },
  {
    "enumName": "WPN_BLESSED_TRIPLE_SWORD",
    "displayName": "old triple sword",
    "baseDamage": 19,
    "skill": "SK_LONG_BLADES",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 695
      }
    }
  },
  {
    "enumName": "WPN_HAND_AXE",
    "displayName": "hand axe",
    "baseDamage": 7,
    "skill": "SK_AXES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 701
      }
    }
  },
  {
    "enumName": "WPN_WAR_AXE",
    "displayName": "war axe",
    "baseDamage": 11,
    "skill": "SK_AXES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 704
      }
    }
  },
  {
    "enumName": "WPN_BROAD_AXE",
    "displayName": "broad axe",
    "baseDamage": 13,
    "skill": "SK_AXES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_MEDIUM",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 707
      }
    }
  },
  {
    "enumName": "WPN_BATTLEAXE",
    "displayName": "battleaxe",
    "baseDamage": 15,
    "skill": "SK_AXES",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 710
      }
    }
  },
  {
    "enumName": "WPN_EXECUTIONERS_AXE",
    "displayName": "executioner's axe",
    "baseDamage": 18,
    "skill": "SK_AXES",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 713
      }
    }
  },
  {
    "enumName": "WPN_SPEAR",
    "displayName": "spear",
    "baseDamage": 6,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 718
      }
    }
  },
  {
    "enumName": "WPN_TRIDENT",
    "displayName": "trident",
    "baseDamage": 9,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_MEDIUM",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 732
      }
    }
  },
  {
    "enumName": "WPN_HALBERD",
    "displayName": "halberd",
    "baseDamage": 13,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 735
      }
    }
  },
  {
    "enumName": "WPN_SCYTHE",
    "displayName": "old scythe",
    "baseDamage": 14,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 739
      }
    }
  },
  {
    "enumName": "WPN_PARTISAN",
    "displayName": "partisan",
    "baseDamage": 14,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_MEDIUM",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 743
      }
    }
  },
  {
    "enumName": "WPN_DEMON_TRIDENT",
    "displayName": "demon trident",
    "baseDamage": 12,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_MEDIUM",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 746
      }
    }
  },
  {
    "enumName": "WPN_TRISHULA",
    "displayName": "trishula",
    "baseDamage": 13,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_MEDIUM",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 749
      }
    }
  },
  {
    "enumName": "WPN_GLAIVE",
    "displayName": "glaive",
    "baseDamage": 15,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 752
      }
    }
  },
  {
    "enumName": "WPN_BARDICHE",
    "displayName": "bardiche",
    "baseDamage": 18,
    "skill": "SK_POLEARMS",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 755
      }
    }
  },
  {
    "enumName": "WPN_STAFF",
    "displayName": "staff",
    "baseDamage": 5,
    "skill": "SK_STAVES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 761
      }
    }
  },
  {
    "enumName": "WPN_QUARTERSTAFF",
    "displayName": "quarterstaff",
    "baseDamage": 10,
    "skill": "SK_STAVES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 764
      }
    }
  },
  {
    "enumName": "WPN_LAJATANG",
    "displayName": "lajatang",
    "baseDamage": 16,
    "skill": "SK_STAVES",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 778
      }
    }
  },
  {
    "enumName": "WPN_BLOWGUN",
    "displayName": "old blowgun",
    "baseDamage": 0,
    "skill": "SK_THROWING",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 795
      }
    }
  },
  {
    "enumName": "WPN_SLING",
    "displayName": "sling",
    "baseDamage": 7,
    "skill": "SK_RANGED_WEAPONS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 800
      }
    }
  },
  {
    "enumName": "WPN_HAND_CANNON",
    "displayName": "hand cannon",
    "baseDamage": 16,
    "skill": "SK_RANGED_WEAPONS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_LITTLE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 803
      }
    }
  },
  {
    "enumName": "WPN_FUSTIBALUS",
    "displayName": "old fustibalus",
    "baseDamage": 10,
    "skill": "SK_RANGED_WEAPONS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "SIZE_SMALL",
    "legacy": true,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 817
      }
    }
  },
  {
    "enumName": "WPN_SHORTBOW",
    "displayName": "shortbow",
    "baseDamage": 8,
    "skill": "SK_RANGED_WEAPONS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 822
      }
    }
  },
  {
    "enumName": "WPN_ORCBOW",
    "displayName": "orcbow",
    "baseDamage": 11,
    "skill": "SK_RANGED_WEAPONS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 825
      }
    }
  },
  {
    "enumName": "WPN_ARBALEST",
    "displayName": "arbalest",
    "baseDamage": 16,
    "skill": "SK_RANGED_WEAPONS",
    "min2hSize": "SIZE_LITTLE",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 828
      }
    }
  },
  {
    "enumName": "WPN_LONGBOW",
    "displayName": "longbow",
    "baseDamage": 14,
    "skill": "SK_RANGED_WEAPONS",
    "min2hSize": "SIZE_MEDIUM",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 831
      }
    }
  },
  {
    "enumName": "WPN_TRIPLE_CROSSBOW",
    "displayName": "triple crossbow",
    "baseDamage": 23,
    "skill": "SK_RANGED_WEAPONS",
    "min2hSize": "SIZE_SMALL",
    "min1hSize": "NUM_SIZE_LEVELS",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "item-prop.cc",
        "line": 834
      }
    }
  }
];

export const WEAPON_BY_NAME: Map<string, ExtractedWeaponEntry> = new Map(
  WEAPON_ENTRIES.map((e) => [e.enumName, e]),
);
