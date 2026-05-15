/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit 274e6c4f0775ad821a9e0f974ca21d09501f1955
 * Extracted from: item-prop-enum.h (enum special_armour_type), item-name.cc
 *                 (special_armour_type_name switch tables)
 * Re-run: `pnpm --filter dcss-game-data extract`
 */

export interface ExtractedEgoEntry {
  /** DCSS enum name, e.g. 'SPARM_FIRE_RESISTANCE'. */
  enumName: string;
  /**
   * Brace-format ego name as it appears in some morgue contexts ("rF+").
   * For standard egos this often is itself a property contribution that
   * can be tokenized.
   */
  terseName: string;
  /** Item-name suffix ("fire resistance"). */
  verboseName: string;
  /** True for real egos a player can find on armor (excludes sentinels). */
  realEgo: boolean;
  /** True for TAG_MAJOR_VERSION == 34 entries (old save-file compat). */
  legacy: boolean;
  /** Source locations for traceability. */
  sources: {
    enum: { file: string; line: number };
    name: { file: string; line: number };
  };
}

export const EGO_ENTRIES: ExtractedEgoEntry[] = [
  {
    "enumName": "SPARM_NORMAL",
    "terseName": "",
    "verboseName": "",
    "realEgo": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 487
      },
      "name": {
        "file": "item-name.cc",
        "line": 598
      }
    }
  },
  {
    "enumName": "SPARM_RUNNING",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "realEgo": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 489
      },
      "name": {
        "file": "item-name.cc",
        "line": 600
      }
    }
  },
  {
    "enumName": "SPARM_FIRE_RESISTANCE",
    "terseName": "rF+",
    "verboseName": "fire resistance",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 491
      },
      "name": {
        "file": "item-name.cc",
        "line": 602
      }
    }
  },
  {
    "enumName": "SPARM_COLD_RESISTANCE",
    "terseName": "rC+",
    "verboseName": "cold resistance",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 492
      },
      "name": {
        "file": "item-name.cc",
        "line": 603
      }
    }
  },
  {
    "enumName": "SPARM_POISON_RESISTANCE",
    "terseName": "rPois",
    "verboseName": "poison resistance",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 493
      },
      "name": {
        "file": "item-name.cc",
        "line": 604
      }
    }
  },
  {
    "enumName": "SPARM_CORROSION_RESISTANCE",
    "terseName": "rCorr",
    "verboseName": "corrosion resistance",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 495
      },
      "name": {
        "file": "item-name.cc",
        "line": 621
      }
    }
  },
  {
    "enumName": "SPARM_SEE_INVISIBLE",
    "terseName": "SInv",
    "verboseName": "see invisible",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 497
      },
      "name": {
        "file": "item-name.cc",
        "line": 605
      }
    }
  },
  {
    "enumName": "SPARM_INVISIBILITY",
    "terseName": "+Inv",
    "verboseName": "invisibility",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 498
      },
      "name": {
        "file": "item-name.cc",
        "line": 606
      }
    }
  },
  {
    "enumName": "SPARM_STRENGTH",
    "terseName": "Str+3",
    "verboseName": "strength",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 499
      },
      "name": {
        "file": "item-name.cc",
        "line": 607
      }
    }
  },
  {
    "enumName": "SPARM_DEXTERITY",
    "terseName": "Dex+3",
    "verboseName": "dexterity",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 500
      },
      "name": {
        "file": "item-name.cc",
        "line": 608
      }
    }
  },
  {
    "enumName": "SPARM_INTELLIGENCE",
    "terseName": "Int+3",
    "verboseName": "intelligence",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 501
      },
      "name": {
        "file": "item-name.cc",
        "line": 609
      }
    }
  },
  {
    "enumName": "SPARM_PONDEROUSNESS",
    "terseName": "Ponderous",
    "verboseName": "ponderousness",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 502
      },
      "name": {
        "file": "item-name.cc",
        "line": 610
      }
    }
  },
  {
    "enumName": "SPARM_FLYING",
    "terseName": "Fly",
    "verboseName": "flying",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 503
      },
      "name": {
        "file": "item-name.cc",
        "line": 611
      }
    }
  },
  {
    "enumName": "SPARM_WILLPOWER",
    "terseName": "Will+",
    "verboseName": "willpower",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 504
      },
      "name": {
        "file": "item-name.cc",
        "line": 612
      }
    }
  },
  {
    "enumName": "SPARM_PROTECTION",
    "terseName": "AC+3",
    "verboseName": "protection",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 505
      },
      "name": {
        "file": "item-name.cc",
        "line": 613
      }
    }
  },
  {
    "enumName": "SPARM_STEALTH",
    "terseName": "Stlth+",
    "verboseName": "stealth",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 506
      },
      "name": {
        "file": "item-name.cc",
        "line": 614
      }
    }
  },
  {
    "enumName": "SPARM_RESISTANCE",
    "terseName": "rC+ rF+",
    "verboseName": "resistance",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 507
      },
      "name": {
        "file": "item-name.cc",
        "line": 615
      }
    }
  },
  {
    "enumName": "SPARM_POSITIVE_ENERGY",
    "terseName": "rN+",
    "verboseName": "positive energy",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 508
      },
      "name": {
        "file": "item-name.cc",
        "line": 616
      }
    }
  },
  {
    "enumName": "SPARM_ARCHMAGI",
    "terseName": "Archmagi",
    "verboseName": "the Archmagi",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 509
      },
      "name": {
        "file": "item-name.cc",
        "line": 617
      }
    }
  },
  {
    "enumName": "SPARM_CORROSION_RESISTANCE",
    "terseName": "rCorr",
    "verboseName": "corrosion resistance",
    "realEgo": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 511
      },
      "name": {
        "file": "item-name.cc",
        "line": 621
      }
    }
  },
  {
    "enumName": "SPARM_REFLECTION",
    "terseName": "Reflect",
    "verboseName": "reflection",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 513
      },
      "name": {
        "file": "item-name.cc",
        "line": 622
      }
    }
  },
  {
    "enumName": "SPARM_SPIRIT_SHIELD",
    "terseName": "Spirit",
    "verboseName": "spirit shield",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 514
      },
      "name": {
        "file": "item-name.cc",
        "line": 623
      }
    }
  },
  {
    "enumName": "SPARM_HURLING",
    "terseName": "Hurl",
    "verboseName": "hurling",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 515
      },
      "name": {
        "file": "item-name.cc",
        "line": 624
      }
    }
  },
  {
    "enumName": "SPARM_JUMPING",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "realEgo": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 517
      },
      "name": {
        "file": "item-name.cc",
        "line": 619
      }
    }
  },
  {
    "enumName": "SPARM_REPULSION",
    "terseName": "Repulsion",
    "verboseName": "repulsion",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 519
      },
      "name": {
        "file": "item-name.cc",
        "line": 625
      }
    }
  },
  {
    "enumName": "SPARM_CLOUD_IMMUNE",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "realEgo": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 521
      },
      "name": {
        "file": "item-name.cc",
        "line": 627
      }
    }
  },
  {
    "enumName": "SPARM_HARM",
    "terseName": "Harm",
    "verboseName": "harm",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 523
      },
      "name": {
        "file": "item-name.cc",
        "line": 629
      }
    }
  },
  {
    "enumName": "SPARM_SHADOWS",
    "terseName": "Shadows",
    "verboseName": "shadows",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 524
      },
      "name": {
        "file": "item-name.cc",
        "line": 630
      }
    }
  },
  {
    "enumName": "SPARM_RAMPAGING",
    "terseName": "Rampage",
    "verboseName": "rampaging",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 525
      },
      "name": {
        "file": "item-name.cc",
        "line": 631
      }
    }
  },
  {
    "enumName": "SPARM_INFUSION",
    "terseName": "Infuse",
    "verboseName": "infusion",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 526
      },
      "name": {
        "file": "item-name.cc",
        "line": 632
      }
    }
  },
  {
    "enumName": "SPARM_LIGHT",
    "terseName": "Light",
    "verboseName": "light",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 527
      },
      "name": {
        "file": "item-name.cc",
        "line": 633
      }
    }
  },
  {
    "enumName": "SPARM_RAGE",
    "terseName": "*Rage",
    "verboseName": "wrath",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 528
      },
      "name": {
        "file": "item-name.cc",
        "line": 634
      }
    }
  },
  {
    "enumName": "SPARM_MAYHEM",
    "terseName": "Mayhem",
    "verboseName": "mayhem",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 529
      },
      "name": {
        "file": "item-name.cc",
        "line": 635
      }
    }
  },
  {
    "enumName": "SPARM_GUILE",
    "terseName": "Guile",
    "verboseName": "guile",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 530
      },
      "name": {
        "file": "item-name.cc",
        "line": 636
      }
    }
  },
  {
    "enumName": "SPARM_ENERGY",
    "terseName": "Energy",
    "verboseName": "energy",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 531
      },
      "name": {
        "file": "item-name.cc",
        "line": 637
      }
    }
  },
  {
    "enumName": "SPARM_SNIPING",
    "terseName": "Snipe",
    "verboseName": "sniping",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 532
      },
      "name": {
        "file": "item-name.cc",
        "line": 638
      }
    }
  },
  {
    "enumName": "SPARM_ICE",
    "terseName": "Ice",
    "verboseName": "ice",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 533
      },
      "name": {
        "file": "item-name.cc",
        "line": 639
      }
    }
  },
  {
    "enumName": "SPARM_FIRE",
    "terseName": "Fire",
    "verboseName": "fire",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 534
      },
      "name": {
        "file": "item-name.cc",
        "line": 640
      }
    }
  },
  {
    "enumName": "SPARM_AIR",
    "terseName": "Air",
    "verboseName": "air",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 535
      },
      "name": {
        "file": "item-name.cc",
        "line": 641
      }
    }
  },
  {
    "enumName": "SPARM_EARTH",
    "terseName": "Earth",
    "verboseName": "earth",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 536
      },
      "name": {
        "file": "item-name.cc",
        "line": 642
      }
    }
  },
  {
    "enumName": "SPARM_ARCHERY",
    "terseName": "Archery",
    "verboseName": "archery",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 537
      },
      "name": {
        "file": "item-name.cc",
        "line": 643
      }
    }
  },
  {
    "enumName": "SPARM_COMMAND",
    "terseName": "Command",
    "verboseName": "command",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 538
      },
      "name": {
        "file": "item-name.cc",
        "line": 644
      }
    }
  },
  {
    "enumName": "SPARM_DEATH",
    "terseName": "Death",
    "verboseName": "death",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 539
      },
      "name": {
        "file": "item-name.cc",
        "line": 645
      }
    }
  },
  {
    "enumName": "SPARM_RESONANCE",
    "terseName": "Resonance",
    "verboseName": "resonance",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 540
      },
      "name": {
        "file": "item-name.cc",
        "line": 646
      }
    }
  },
  {
    "enumName": "SPARM_PARRYING",
    "terseName": "Parrying",
    "verboseName": "parrying",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 541
      },
      "name": {
        "file": "item-name.cc",
        "line": 647
      }
    }
  },
  {
    "enumName": "SPARM_GLASS",
    "terseName": "Glass",
    "verboseName": "glass",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 542
      },
      "name": {
        "file": "item-name.cc",
        "line": 648
      }
    }
  },
  {
    "enumName": "SPARM_PYROMANIA",
    "terseName": "Pyromania",
    "verboseName": "pyromania",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 543
      },
      "name": {
        "file": "item-name.cc",
        "line": 649
      }
    }
  },
  {
    "enumName": "SPARM_STARDUST",
    "terseName": "Stardust",
    "verboseName": "stardust",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 544
      },
      "name": {
        "file": "item-name.cc",
        "line": 650
      }
    }
  },
  {
    "enumName": "SPARM_MESMERISM",
    "terseName": "Mesmerism",
    "verboseName": "mesmerism",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 545
      },
      "name": {
        "file": "item-name.cc",
        "line": 651
      }
    }
  },
  {
    "enumName": "SPARM_ATTUNEMENT",
    "terseName": "Attunement",
    "verboseName": "attunement",
    "realEgo": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 546
      },
      "name": {
        "file": "item-name.cc",
        "line": 652
      }
    }
  },
  {
    "enumName": "NUM_REAL_SPECIAL_ARMOURS",
    "terseName": "",
    "verboseName": "",
    "realEgo": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 547
      },
      "name": {
        "file": "item-name.cc",
        "line": 0
      }
    }
  },
  {
    "enumName": "NUM_SPECIAL_ARMOURS",
    "terseName": "",
    "verboseName": "",
    "realEgo": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 548
      },
      "name": {
        "file": "item-name.cc",
        "line": 0
      }
    }
  }
];

export const EGO_BY_NAME: Map<string, ExtractedEgoEntry> = new Map(
  EGO_ENTRIES.map((e) => [e.enumName, e]),
);
