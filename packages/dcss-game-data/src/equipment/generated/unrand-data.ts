/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit 274e6c4f0775ad821a9e0f974ca21d09501f1955
 * Extracted from: art-data.txt
 * Re-run: `pnpm --filter dcss-game-data extract`
 */

export interface ExtractedUnrandEntry {
  /** Auto-generated UNRAND_* key, e.g. 'UNRAND_SINGING_SWORD'. */
  enumName: string;
  /** Display name as it appears in morgues, e.g. 'Singing Sword'. */
  name: string;
  /** OBJ_* class, e.g. 'OBJ_WEAPONS'. */
  objectClass: string;
  /** Sub-type, e.g. 'WPN_DOUBLE_SWORD'. */
  subType: string;
  /** Enchantment (+N) if specified in art-data.txt. */
  plus?: number;
  /** Always false here — art-data.txt strips removed unrands. */
  legacy: boolean;
  sources: { entry: { file: string; line: number } };
}

export const UNRAND_ENTRIES: ExtractedUnrandEntry[] = [
  {
    "enumName": "UNRAND_SINGING_SWORD",
    "name": "Singing Sword",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DOUBLE_SWORD",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 194
      }
    }
  },
  {
    "enumName": "UNRAND_WRATH_OF_TROG",
    "name": "Wrath of Trog",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_BATTLEAXE",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 206
      }
    }
  },
  {
    "enumName": "UNRAND_MACE_OF_VARIABILITY",
    "name": "mace of Variability",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GREAT_MACE",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 220
      }
    }
  },
  {
    "enumName": "UNRAND_PARTISAN_OF_PRUNE",
    "name": "partisan of Prune",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_PARTISAN",
    "plus": 12,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 233
      }
    }
  },
  {
    "enumName": "UNRAND_SWORD_OF_POWER",
    "name": "sword of Power",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GREAT_SWORD",
    "plus": 9,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 247
      }
    }
  },
  {
    "enumName": "UNRAND_STAFF_OF_OLGREB",
    "name": "staff of Olgreb",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_STAFF",
    "plus": 9,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 258
      }
    }
  },
  {
    "enumName": "UNRAND_CRYSTAL_BALL_OF_WUCAD_MU",
    "name": "crystal ball of Wucad Mu",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ORB",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 273
      }
    }
  },
  {
    "enumName": "UNRAND_VAMPIRE_S_TOOTH",
    "name": "Vampire's Tooth",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_QUICK_BLADE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 285
      }
    }
  },
  {
    "enumName": "UNRAND_SCYTHE_OF_CURSES",
    "name": "scythe of Curses",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_HALBERD",
    "plus": 13,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 300
      }
    }
  },
  {
    "enumName": "UNRAND_SCEPTRE_OF_TORMENT",
    "name": "sceptre of Torment",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_EVENINGSTAR",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 317
      }
    }
  },
  {
    "enumName": "UNRAND_SWORD_OF_ZONGULDROK",
    "name": "sword of Zonguldrok",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DOUBLE_SWORD",
    "plus": 9,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 330
      }
    }
  },
  {
    "enumName": "UNRAND_SWORD_OF_CEREBOV",
    "name": "sword of Cerebov",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GREAT_SWORD",
    "plus": 6,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 342
      }
    }
  },
  {
    "enumName": "UNRAND_ORB_OF_DISPATER",
    "name": "orb of Dispater",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ORB",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 358
      }
    }
  },
  {
    "enumName": "UNRAND_SCEPTRE_OF_ASMODEUS",
    "name": "sceptre of Asmodeus",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_EVENINGSTAR",
    "plus": 13,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 369
      }
    }
  },
  {
    "enumName": "UNRAND_FAERIE",
    "name": "faerie dragon scales",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ACID_DRAGON_ARMOUR",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 382
      }
    }
  },
  {
    "enumName": "UNRAND_DEMON_BLADE_BLOODBANE",
    "name": "demon blade \"Bloodbane\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DEMON_BLADE",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 392
      }
    }
  },
  {
    "enumName": "UNRAND_SCIMITAR_OF_FLAMING_DEATH",
    "name": "scimitar of Flaming Death",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_SCIMITAR",
    "plus": 6,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 405
      }
    }
  },
  {
    "enumName": "UNRAND_EVENINGSTAR_BRILLIANCE",
    "name": "eveningstar \"Brilliance\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_EVENINGSTAR",
    "plus": 1,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 419
      }
    }
  },
  {
    "enumName": "UNRAND_DEMON_BLADE_LEECH",
    "name": "demon blade \"Leech\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DEMON_BLADE",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 431
      }
    }
  },
  {
    "enumName": "UNRAND_DAGGER_OF_CHILLY_DEATH",
    "name": "dagger of Chilly Death",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DAGGER",
    "plus": 9,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 445
      }
    }
  },
  {
    "enumName": "UNRAND_DAGGER_MORG",
    "name": "dagger \"Morg\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DAGGER",
    "plus": 4,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 460
      }
    }
  },
  {
    "enumName": "UNRAND_SCYTHE_FINISHER",
    "name": "scythe \"Finisher\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_HALBERD",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 472
      }
    }
  },
  {
    "enumName": "UNRAND_GREATSLING_PUNK",
    "name": "greatsling \"Punk\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_SLING",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 487
      }
    }
  },
  {
    "enumName": "UNRAND_LONGBOW_ZEPHYR",
    "name": "longbow \"Zephyr\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_LONGBOW",
    "plus": 12,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 500
      }
    }
  },
  {
    "enumName": "UNRAND_GIANT_CLUB_SKULLCRUSHER",
    "name": "giant club \"Skullcrusher\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GIANT_CLUB",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 513
      }
    }
  },
  {
    "enumName": "UNRAND_GLAIVE_OF_THE_GUARD",
    "name": "glaive of the Guard",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GLAIVE",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 522
      }
    }
  },
  {
    "enumName": "UNRAND_ZEALOT_SWORD",
    "name": "zealot's sword",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_EUDEMON_BLADE",
    "plus": 10,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 534
      }
    }
  },
  {
    "enumName": "UNRAND_ARBALEST_DAMNATION",
    "name": "arbalest \"Damnation\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_ARBALEST",
    "plus": 6,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 551
      }
    }
  },
  {
    "enumName": "UNRAND_SWORD_OF_THE_DREAD_KNIGHT",
    "name": "sword of the Dread Knight",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GREAT_SWORD",
    "plus": 13,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 564
      }
    }
  },
  {
    "enumName": "UNRAND_MORNINGSTAR_EOS",
    "name": "morningstar \"Eos\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_MORNINGSTAR",
    "plus": 10,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 577
      }
    }
  },
  {
    "enumName": "UNRAND_SPEAR_OF_THE_BOTONO",
    "name": "spear of the Botono",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_SPEAR",
    "plus": 6,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 594
      }
    }
  },
  {
    "enumName": "UNRAND_TRIDENT_OF_THE_OCTOPUS_KING",
    "name": "trident of the Octopus King",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_TRIDENT",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 608
      }
    }
  },
  {
    "enumName": "UNRAND_MITHRIL_AXE_ARGA",
    "name": "mithril axe \"Arga\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_BROAD_AXE",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 618
      }
    }
  },
  {
    "enumName": "UNRAND_ELEMENTAL_STAFF",
    "name": "Elemental Staff",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_STAFF",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 627
      }
    }
  },
  {
    "enumName": "UNRAND_HEAVY_CROSSBOW_SNIPER",
    "name": "heavy crossbow \"Sniper\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_TRIPLE_CROSSBOW",
    "plus": 27,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 644
      }
    }
  },
  {
    "enumName": "UNRAND_LONGBOW_PIERCER",
    "name": "longbow \"Piercer\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_LONGBOW",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 659
      }
    }
  },
  {
    "enumName": "UNRAND_BLOWGUN_ASSASSIN",
    "name": "blowgun of the Assassin",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_BLOWGUN",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 671
      }
    }
  },
  {
    "enumName": "UNRAND_LANCE_WYRMBANE",
    "name": "lance \"Wyrmbane\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_SPEAR",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 685
      }
    }
  },
  {
    "enumName": "UNRAND_SPRIGGAN_S_KNIFE",
    "name": "Spriggan's Knife",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DAGGER",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 702
      }
    }
  },
  {
    "enumName": "UNRAND_PLUTONIUM_SWORD",
    "name": "plutonium sword",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_TRIPLE_SWORD",
    "plus": 11,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 715
      }
    }
  },
  {
    "enumName": "UNRAND_GREAT_MACE_UNDEADHUNTER",
    "name": "great mace \"Undeadhunter\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GREAT_MACE",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 730
      }
    }
  },
  {
    "enumName": "UNRAND_WHIP_SNAKEBITE",
    "name": "whip \"Snakebite\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_WHIP",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 741
      }
    }
  },
  {
    "enumName": "UNRAND_KNIFE_OF_ACCURACY",
    "name": "knife of Accuracy",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DAGGER",
    "plus": 27,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 755
      }
    }
  },
  {
    "enumName": "UNRAND_CRYSTAL_SPEAR",
    "name": "Lehudib's crystal spear",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_SPEAR",
    "plus": 6,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 767
      }
    }
  },
  {
    "enumName": "UNRAND_CAPTAIN",
    "name": "captain's cutlass",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_RAPIER",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 778
      }
    }
  },
  {
    "enumName": "UNRAND_STORM_BOW",
    "name": "storm bow",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_LONGBOW",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 791
      }
    }
  },
  {
    "enumName": "UNRAND_TOWER_SHIELD_OF_IGNORANCE",
    "name": "tower shield of Ignorance",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_TOWER_SHIELD",
    "plus": 10,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 804
      }
    }
  },
  {
    "enumName": "UNRAND_ROBE_OF_AUGMENTATION",
    "name": "robe of Augmentation",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ROBE",
    "plus": 4,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 813
      }
    }
  },
  {
    "enumName": "UNRAND_CLOAK_OF_THE_THIEF",
    "name": "cloak of the Thief",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_CLOAK",
    "plus": 0,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 824
      }
    }
  },
  {
    "enumName": "UNRAND_TOWER_SHIELD_BULLSEYE",
    "name": "tower shield \"Bullseye\"",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_TOWER_SHIELD",
    "plus": 15,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 836
      }
    }
  },
  {
    "enumName": "UNRAND_CROWN_OF_DYROVEPREVA",
    "name": "crown of Dyrovepreva",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 846
      }
    }
  },
  {
    "enumName": "UNRAND_HAT_OF_THE_BEAR_SPIRIT",
    "name": "hat of the Bear Spirit",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": 2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 856
      }
    }
  },
  {
    "enumName": "UNRAND_ROBE_OF_MISFORTUNE",
    "name": "robe of Misfortune",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ROBE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 869
      }
    }
  },
  {
    "enumName": "UNRAND_CLOAK_OF_FLASH",
    "name": "cloak of Flash",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_CLOAK",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 882
      }
    }
  },
  {
    "enumName": "UNRAND_HOOD_ASSASSIN",
    "name": "hood of the Assassin",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": 2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 892
      }
    }
  },
  {
    "enumName": "UNRAND_LEAR",
    "name": "Lear's hauberk",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_CHAIN_MAIL",
    "plus": 18,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 907
      }
    }
  },
  {
    "enumName": "UNRAND_SKIN_OF_ZHOR",
    "name": "skin of Zhor",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ANIMAL_SKIN",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 918
      }
    }
  },
  {
    "enumName": "UNRAND_SALAMANDER",
    "name": "salamander hide armour",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_LEATHER_ARMOUR",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 933
      }
    }
  },
  {
    "enumName": "UNRAND_GAUNTLETS_OF_WAR",
    "name": "gauntlets of War",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_GLOVES",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 948
      }
    }
  },
  {
    "enumName": "UNRAND_SHIELD_OF_RESISTANCE",
    "name": "shield of Resistance",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_KITE_SHIELD",
    "plus": 2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 956
      }
    }
  },
  {
    "enumName": "UNRAND_ROBE_OF_FOLLY",
    "name": "robe of Folly",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ROBE",
    "plus": 4,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 966
      }
    }
  },
  {
    "enumName": "UNRAND_MAXWELL",
    "name": "Maxwell's patent armour",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_PLATE_ARMOUR",
    "plus": 15,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 978
      }
    }
  },
  {
    "enumName": "UNRAND_DRAGONMASK",
    "name": "mask of the Dragon",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": 2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 988
      }
    }
  },
  {
    "enumName": "UNRAND_ROBE_OF_NIGHT",
    "name": "robe of Night",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ROBE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1001
      }
    }
  },
  {
    "enumName": "UNRAND_SCALES_OF_THE_DRAGON_KING",
    "name": "scales of the Dragon King",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_GOLDEN_DRAGON_ARMOUR",
    "plus": 9,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1015
      }
    }
  },
  {
    "enumName": "UNRAND_HAT_OF_THE_ALCHEMIST",
    "name": "hat of the Alchemist",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": -2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1023
      }
    }
  },
  {
    "enumName": "UNRAND_FENCERS",
    "name": "fencer's gloves",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_GLOVES",
    "plus": 0,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1035
      }
    }
  },
  {
    "enumName": "UNRAND_CLOAK_OF_STARLIGHT",
    "name": "cloak of Starlight",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_CLOAK",
    "plus": 1,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1048
      }
    }
  },
  {
    "enumName": "UNRAND_RATSKIN_CLOAK",
    "name": "ratskin cloak",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_CLOAK",
    "plus": 2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1060
      }
    }
  },
  {
    "enumName": "UNRAND_SHIELD_OF_THE_GONG",
    "name": "shield of the Gong",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_KITE_SHIELD",
    "plus": 18,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1076
      }
    }
  },
  {
    "enumName": "UNRAND_AMULET_OF_THE_AIR",
    "name": "amulet of the Air",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_NOTHING",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1090
      }
    }
  },
  {
    "enumName": "UNRAND_RING_OF_SHADOWS",
    "name": "ring of Shadows",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "RING_STEALTH",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1098
      }
    }
  },
  {
    "enumName": "UNRAND_AMULET_OF_CEKUGOB",
    "name": "amulet of Cekugob",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_ACROBAT",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1109
      }
    }
  },
  {
    "enumName": "UNRAND_AMULET_OF_TRANQUILITY",
    "name": "amulet of Tranquility",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_NOTHING",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1119
      }
    }
  },
  {
    "enumName": "UNRAND_NECKLACE_OF_BLOODLUST",
    "name": "necklace of Bloodlust",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_NOTHING",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1127
      }
    }
  },
  {
    "enumName": "UNRAND_RING_OF_THE_HARE",
    "name": "ring of the Hare",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "RING_EVASION",
    "plus": 10,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1138
      }
    }
  },
  {
    "enumName": "UNRAND_RING_OF_THE_TORTOISE",
    "name": "ring of the Tortoise",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "RING_PROTECTION",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1144
      }
    }
  },
  {
    "enumName": "UNRAND_RING_OF_THE_MAGE",
    "name": "ring of the Mage",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "RING_WIZARDRY",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1150
      }
    }
  },
  {
    "enumName": "UNRAND_BROOCH_OF_SHIELDING",
    "name": "brooch of Shielding",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_GUARDIAN_SPIRIT",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1156
      }
    }
  },
  {
    "enumName": "UNRAND_RCLOUDS",
    "name": "robe of Clouds",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ROBE",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1162
      }
    }
  },
  {
    "enumName": "UNRAND_HAT_OF_PONDERING",
    "name": "hat of Pondering",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1174
      }
    }
  },
  {
    "enumName": "UNRAND_DEMON_AXE",
    "name": "obsidian axe",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_BROAD_AXE",
    "plus": 16,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1185
      }
    }
  },
  {
    "enumName": "UNRAND_LIGHTNING_SCALES",
    "name": "lightning scales",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_BARDING",
    "plus": 6,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1201
      }
    }
  },
  {
    "enumName": "UNRAND_BLACK_KNIGHT_HORSE",
    "name": "Black Knight's barding",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_BARDING",
    "plus": 10,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1211
      }
    }
  },
  {
    "enumName": "UNRAND_AMULET_OF_VITALITY",
    "name": "amulet of Vitality",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_NOTHING",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1222
      }
    }
  },
  {
    "enumName": "UNRAND_AUTUMN_KATANA",
    "name": "autumn katana",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_LONG_SWORD",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1231
      }
    }
  },
  {
    "enumName": "UNRAND_SHILLELAGH_DEVASTATOR",
    "name": "shillelagh \"Devastator\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_CLUB",
    "plus": 6,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1246
      }
    }
  },
  {
    "enumName": "UNRAND_DRAGONSKIN",
    "name": "dragonskin cloak",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_CLOAK",
    "plus": 4,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1265
      }
    }
  },
  {
    "enumName": "UNRAND_OCTOPUS_KING_RING",
    "name": "ring of the Octopus King",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "RING_FIRST_RING",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1279
      }
    }
  },
  {
    "enumName": "UNRAND_WOE",
    "name": "Axe of Woe",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_EXECUTIONERS_AXE",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1293
      }
    }
  },
  {
    "enumName": "UNRAND_MOON_TROLL_LEATHER_ARMOUR",
    "name": "moon troll leather armour",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_TROLL_LEATHER_ARMOUR",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1301
      }
    }
  },
  {
    "enumName": "UNRAND_FINGER_AMULET",
    "name": "macabre finger necklace",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_NOTHING",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1311
      }
    }
  },
  {
    "enumName": "UNRAND_SPIDER",
    "name": "boots of the spider",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_BOOTS",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1324
      }
    }
  },
  {
    "enumName": "UNRAND_DARK_MAUL",
    "name": "dark maul",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GREAT_MACE",
    "plus": 10,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1336
      }
    }
  },
  {
    "enumName": "UNRAND_HIGH_COUNCIL",
    "name": "hat of the High Council",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": 2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1349
      }
    }
  },
  {
    "enumName": "UNRAND_ARC_BLADE",
    "name": "arc blade",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_RAPIER",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1362
      }
    }
  },
  {
    "enumName": "UNRAND_SPELLBINDER",
    "name": "demon whip \"Spellbinder\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DEMON_WHIP",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1377
      }
    }
  },
  {
    "enumName": "UNRAND_LAJATANG_OF_ORDER",
    "name": "lajatang of Order",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_LAJATANG",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1390
      }
    }
  },
  {
    "enumName": "UNRAND_FIRESTARTER",
    "name": "great mace \"Firestarter\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_GREAT_MACE",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1404
      }
    }
  },
  {
    "enumName": "UNRAND_ORANGE_CRYSTAL_PLATE_ARMOUR",
    "name": "orange crystal plate armour",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_CRYSTAL_PLATE_ARMOUR",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1417
      }
    }
  },
  {
    "enumName": "UNRAND_MAJIN",
    "name": "Majin-Bo",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_STAFF",
    "plus": 6,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1428
      }
    }
  },
  {
    "enumName": "UNRAND_GYRE",
    "name": "pair of quick blades \"Gyre\" and \"Gimble\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_QUICK_BLADE",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1448
      }
    }
  },
  {
    "enumName": "UNRAND_ETHERIC_CAGE",
    "name": "Maxwell's etheric cage",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HELMET",
    "plus": 0,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1460
      }
    }
  },
  {
    "enumName": "UNRAND_ETERNAL_TORMENT",
    "name": "crown of Eternal Torment",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1474
      }
    }
  },
  {
    "enumName": "UNRAND_VINES",
    "name": "robe of Vines",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ROBE",
    "plus": 1,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1486
      }
    }
  },
  {
    "enumName": "UNRAND_KRYIAS",
    "name": "Kryia's mail coat",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_SCALE_MAIL",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1498
      }
    }
  },
  {
    "enumName": "UNRAND_FROSTBITE",
    "name": "frozen axe \"Frostbite\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_EXECUTIONERS_AXE",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1511
      }
    }
  },
  {
    "enumName": "UNRAND_TALOS",
    "name": "armour of Talos",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_PLATE_ARMOUR",
    "plus": 12,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1526
      }
    }
  },
  {
    "enumName": "UNRAND_WARLOCK_MIRROR",
    "name": "warlock's mirror",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_BUCKLER",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1538
      }
    }
  },
  {
    "enumName": "UNRAND_AMULET_INVISIBILITY",
    "name": "amulet of invisibility",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_NOTHING",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1553
      }
    }
  },
  {
    "enumName": "UNRAND_THERMIC_ENGINE",
    "name": "Maxwell's thermic engine",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DOUBLE_SWORD",
    "plus": 2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1560
      }
    }
  },
  {
    "enumName": "UNRAND_RIFT",
    "name": "demon trident \"Rift\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_DEMON_TRIDENT",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1575
      }
    }
  },
  {
    "enumName": "UNRAND_BATTLE",
    "name": "sphere of Battle",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ORB",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1587
      }
    }
  },
  {
    "enumName": "UNRAND_EMBRACE",
    "name": "Cigotuvi's embrace",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_LEATHER_ARMOUR",
    "plus": 4,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1599
      }
    }
  },
  {
    "enumName": "UNRAND_SEVEN_LEAGUE_BOOTS",
    "name": "seven-league boots",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_BOOTS",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1614
      }
    }
  },
  {
    "enumName": "UNRAND_POWER_GLOVES",
    "name": "Mad Mage's Maulers",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_GLOVES",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1625
      }
    }
  },
  {
    "enumName": "UNRAND_DREAMSHARD_NECKLACE",
    "name": "dreamshard necklace",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_ACROBAT",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1638
      }
    }
  },
  {
    "enumName": "UNRAND_DELATRA_S_GLOVES",
    "name": "Delatra's gloves",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_GLOVES",
    "plus": 1,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1648
      }
    }
  },
  {
    "enumName": "UNRAND_WOODCUTTER_S_AXE",
    "name": "woodcutter's axe",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_BATTLEAXE",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1660
      }
    }
  },
  {
    "enumName": "UNRAND_THROATCUTTER",
    "name": "Throatcutter",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_LONG_SWORD",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1669
      }
    }
  },
  {
    "enumName": "UNRAND_STAFF_OF_THE_MEEK",
    "name": "staff of the Meek",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_QUARTERSTAFF",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1681
      }
    }
  },
  {
    "enumName": "UNRAND_CONDEMNATION",
    "name": "trishula \"Condemnation\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_TRISHULA",
    "plus": 8,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1693
      }
    }
  },
  {
    "enumName": "UNRAND_AMULET_OF_ELEMENTAL_VULNERABILITY",
    "name": "amulet of Elemental Vulnerability",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_NOTHING",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1707
      }
    }
  },
  {
    "enumName": "UNRAND_MOUNTAIN_BOOTS",
    "name": "mountain boots",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_BOOTS",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1717
      }
    }
  },
  {
    "enumName": "UNRAND_LOCHABER_AXE",
    "name": "Lochaber axe",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_BARDICHE",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1729
      }
    }
  },
  {
    "enumName": "UNRAND_HERMIT_S_PENDANT",
    "name": "Hermit's Pendant",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_FAITH",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1746
      }
    }
  },
  {
    "enumName": "UNRAND_SLICK_SLIPPERS",
    "name": "slick slippers",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_BOOTS",
    "plus": 2,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1756
      }
    }
  },
  {
    "enumName": "UNRAND_FORCE_LANCE",
    "name": "Force Lance",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_SPEAR",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1770
      }
    }
  },
  {
    "enumName": "UNRAND_HOLY_AXE",
    "name": "consecrated labrys",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_BROAD_AXE",
    "plus": 4,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1784
      }
    }
  },
  {
    "enumName": "UNRAND_TOGA_VICTORY",
    "name": "toga \"Victory\"",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ROBE",
    "plus": 0,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1799
      }
    }
  },
  {
    "enumName": "UNRAND_STORM_QUEEN",
    "name": "Storm Queen's Shield",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_KITE_SHIELD",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1816
      }
    }
  },
  {
    "enumName": "UNRAND_DREAMDUST_NECKLACE",
    "name": "dreamdust necklace",
    "objectClass": "OBJ_JEWELLERY",
    "subType": "AMU_ACROBAT",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1829
      }
    }
  },
  {
    "enumName": "UNRAND_HAND_CANNON_MULE",
    "name": "hand cannon \"Mule\"",
    "objectClass": "OBJ_WEAPONS",
    "subType": "WPN_HAND_CANNON",
    "plus": 7,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1835
      }
    }
  },
  {
    "enumName": "UNRAND_GADGETEER",
    "name": "gloves of the gadgeteer",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_GLOVES",
    "plus": 0,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1846
      }
    }
  },
  {
    "enumName": "UNRAND_CHARLATAN_S_ORB",
    "name": "Charlatan's Orb",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ORB",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1860
      }
    }
  },
  {
    "enumName": "UNRAND_JUSTICARS_REGALIA",
    "name": "justicar's regalia",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_SCALE_MAIL",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1870
      }
    }
  },
  {
    "enumName": "UNRAND_SKULL_OF_ZONGULDROK",
    "name": "skull of Zonguldrok",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_ORB",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1883
      }
    }
  },
  {
    "enumName": "UNRAND_FISTICLOAK",
    "name": "fungal fisticloak",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_CLOAK",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1898
      }
    }
  },
  {
    "enumName": "UNRAND_VAINGLORY",
    "name": "crown of vainglory",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_HAT",
    "plus": 3,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1914
      }
    }
  },
  {
    "enumName": "UNRAND_SCARF_INVISIBILITY",
    "name": "scarf of invisibility",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_SCARF",
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1931
      }
    }
  },
  {
    "enumName": "UNRAND_SWAMP_WITCH_SCALES",
    "name": "swamp witch's dragon scales",
    "objectClass": "OBJ_ARMOUR",
    "subType": "ARM_SWAMP_DRAGON_ARMOUR",
    "plus": 5,
    "legacy": false,
    "sources": {
      "entry": {
        "file": "art-data.txt",
        "line": 1939
      }
    }
  }
];

export const UNRAND_BY_NAME: Map<string, ExtractedUnrandEntry> = new Map(
  UNRAND_ENTRIES.map((e) => [e.name.toLowerCase(), e]),
);

export const UNRAND_BY_ENUM: Map<string, ExtractedUnrandEntry> = new Map(
  UNRAND_ENTRIES.map((e) => [e.enumName, e]),
);
