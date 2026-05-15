/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit 274e6c4f0775ad821a9e0f974ca21d09501f1955
 * Extracted from: item-prop-enum.h (enum jewellery_type)
 * Re-run: `pnpm --filter dcss-game-data extract`
 */

export interface ExtractedJewelryEntry {
  /** DCSS enum name, e.g. 'RING_FIRE'. */
  enumName: string;
  /** 'ring' or 'amulet'. */
  kind: 'ring' | 'amulet';
  /** True for TAG_MAJOR_VERSION == 34 entries. */
  legacy: boolean;
  sources: { enum: { file: string; line: number } };
}

export const JEWELRY_ENTRIES: ExtractedJewelryEntry[] = [
  {
    "enumName": "RING_REGENERATION",
    "kind": "ring",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 211
      }
    }
  },
  {
    "enumName": "RING_PROTECTION",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 213
      }
    }
  },
  {
    "enumName": "RING_PROTECTION_FROM_FIRE",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 215
      }
    }
  },
  {
    "enumName": "RING_POISON_RESISTANCE",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 216
      }
    }
  },
  {
    "enumName": "RING_PROTECTION_FROM_COLD",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 217
      }
    }
  },
  {
    "enumName": "RING_STRENGTH",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 218
      }
    }
  },
  {
    "enumName": "RING_SLAYING",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 219
      }
    }
  },
  {
    "enumName": "RING_SEE_INVISIBLE",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 220
      }
    }
  },
  {
    "enumName": "RING_RESIST_CORROSION",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 221
      }
    }
  },
  {
    "enumName": "RING_ATTENTION",
    "kind": "ring",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 223
      }
    }
  },
  {
    "enumName": "RING_TELEPORTATION",
    "kind": "ring",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 224
      }
    }
  },
  {
    "enumName": "RING_EVASION",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 226
      }
    }
  },
  {
    "enumName": "RING_SUSTAIN_ATTRIBUTES",
    "kind": "ring",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 228
      }
    }
  },
  {
    "enumName": "RING_STEALTH",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 230
      }
    }
  },
  {
    "enumName": "RING_DEXTERITY",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 231
      }
    }
  },
  {
    "enumName": "RING_INTELLIGENCE",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 232
      }
    }
  },
  {
    "enumName": "RING_WIZARDRY",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 233
      }
    }
  },
  {
    "enumName": "RING_MAGICAL_POWER",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 234
      }
    }
  },
  {
    "enumName": "RING_FLIGHT",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 235
      }
    }
  },
  {
    "enumName": "RING_POSITIVE_ENERGY",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 236
      }
    }
  },
  {
    "enumName": "RING_WILLPOWER",
    "kind": "ring",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 237
      }
    }
  },
  {
    "enumName": "RING_FIRE",
    "kind": "ring",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 239
      }
    }
  },
  {
    "enumName": "RING_ICE",
    "kind": "ring",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 240
      }
    }
  },
  {
    "enumName": "RING_TELEPORT_CONTROL",
    "kind": "ring",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 241
      }
    }
  },
  {
    "enumName": "AMU_HARM",
    "kind": "amulet",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 253
      }
    }
  },
  {
    "enumName": "AMU_ACROBAT",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 259
      }
    }
  },
  {
    "enumName": "AMU_MANA_REGENERATION",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 261
      }
    }
  },
  {
    "enumName": "AMU_THE_GOURMAND",
    "kind": "amulet",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 263
      }
    }
  },
  {
    "enumName": "AMU_CONSERVATION",
    "kind": "amulet",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 264
      }
    }
  },
  {
    "enumName": "AMU_CONTROLLED_FLIGHT",
    "kind": "amulet",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 265
      }
    }
  },
  {
    "enumName": "AMU_INACCURACY",
    "kind": "amulet",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 266
      }
    }
  },
  {
    "enumName": "AMU_NOTHING",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 268
      }
    }
  },
  {
    "enumName": "AMU_GUARDIAN_SPIRIT",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 269
      }
    }
  },
  {
    "enumName": "AMU_FAITH",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 270
      }
    }
  },
  {
    "enumName": "AMU_REFLECTION",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 271
      }
    }
  },
  {
    "enumName": "AMU_REGENERATION",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 272
      }
    }
  },
  {
    "enumName": "AMU_WILDSHAPE",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 273
      }
    }
  },
  {
    "enumName": "AMU_CHEMISTRY",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 274
      }
    }
  },
  {
    "enumName": "AMU_DISSIPATION",
    "kind": "amulet",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 275
      }
    }
  }
];

export const JEWELRY_BY_NAME: Map<string, ExtractedJewelryEntry> = new Map(
  JEWELRY_ENTRIES.map((e) => [e.enumName, e]),
);
