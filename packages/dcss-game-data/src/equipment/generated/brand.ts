/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit 274e6c4f0775ad821a9e0f974ca21d09501f1955
 * Extracted from: item-prop-enum.h (enum brand_type), item-name.cc
 *                 (weapon_brands_terse / verbose / adj arrays)
 * Re-run: `pnpm --filter dcss-game-data extract`
 */

export interface ExtractedBrandEntry {
  /** DCSS enum name, e.g. 'SPWPN_FLAMING'. */
  enumName: string;
  /** Brace-format brand name as it appears in artefact braces ("flame"). */
  terseName: string;
  /** Item-name suffix ("flaming" — used as "weapon of flaming"). */
  verboseName: string;
  /** Adjective form ("flaming sword"). */
  adjectiveName: string;
  /**
   * True for brands a player can actually find on a weapon. Excludes
   * sentinels (SPWPN_NORMAL, NUM_*), debug entries, and species/ability
   * brands like SPWPN_ACID or SPWPN_CONFUSE.
   */
  realBrand: boolean;
  /** True for TAG_MAJOR_VERSION == 34 entries (old save-file compat). */
  legacy: boolean;
  /** Source locations for traceability. */
  sources: {
    enum: { file: string; line: number };
  };
}

export const BRAND_ENTRIES: ExtractedBrandEntry[] = [
  {
    "enumName": "SPWPN_NORMAL",
    "terseName": "",
    "verboseName": "",
    "adjectiveName": "",
    "realBrand": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 135
      }
    }
  },
  {
    "enumName": "SPWPN_FLAMING",
    "terseName": "flame",
    "verboseName": "flaming",
    "adjectiveName": "flaming",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 136
      }
    }
  },
  {
    "enumName": "SPWPN_FREEZING",
    "terseName": "freeze",
    "verboseName": "freezing",
    "adjectiveName": "freezing",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 137
      }
    }
  },
  {
    "enumName": "SPWPN_HOLY_WRATH",
    "terseName": "holy",
    "verboseName": "holy wrath",
    "adjectiveName": "holy",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 138
      }
    }
  },
  {
    "enumName": "SPWPN_ELECTROCUTION",
    "terseName": "elec",
    "verboseName": "electrocution",
    "adjectiveName": "electric",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 139
      }
    }
  },
  {
    "enumName": "SPWPN_ORC_SLAYING",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "adjectiveName": "obsolete",
    "realBrand": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 141
      }
    }
  },
  {
    "enumName": "SPWPN_DRAGON_SLAYING",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "adjectiveName": "obsolete",
    "realBrand": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 142
      }
    }
  },
  {
    "enumName": "SPWPN_VENOM",
    "terseName": "venom",
    "verboseName": "venom",
    "adjectiveName": "venomous",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 144
      }
    }
  },
  {
    "enumName": "SPWPN_PROTECTION",
    "terseName": "protect",
    "verboseName": "protection",
    "adjectiveName": "protective",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 145
      }
    }
  },
  {
    "enumName": "SPWPN_DRAINING",
    "terseName": "drain",
    "verboseName": "draining",
    "adjectiveName": "draining",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 146
      }
    }
  },
  {
    "enumName": "SPWPN_SPEED",
    "terseName": "speed",
    "verboseName": "speed",
    "adjectiveName": "fast",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 147
      }
    }
  },
  {
    "enumName": "SPWPN_HEAVY",
    "terseName": "heavy",
    "verboseName": "heavy",
    "adjectiveName": "heavy",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 148
      }
    }
  },
  {
    "enumName": "SPWPN_FLAME",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "adjectiveName": "obsolete",
    "realBrand": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 150
      }
    }
  },
  {
    "enumName": "SPWPN_FROST",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "adjectiveName": "obsolete",
    "realBrand": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 151
      }
    }
  },
  {
    "enumName": "SPWPN_VAMPIRISM",
    "terseName": "vamp",
    "verboseName": "vampirism",
    "adjectiveName": "vampiric",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 153
      }
    }
  },
  {
    "enumName": "SPWPN_PAIN",
    "terseName": "pain",
    "verboseName": "pain",
    "adjectiveName": "painful",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 154
      }
    }
  },
  {
    "enumName": "SPWPN_ANTIMAGIC",
    "terseName": "antimagic",
    "verboseName": "antimagic",
    "adjectiveName": "antimagic",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 155
      }
    }
  },
  {
    "enumName": "SPWPN_DISTORTION",
    "terseName": "distort",
    "verboseName": "distortion",
    "adjectiveName": "distorting",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 156
      }
    }
  },
  {
    "enumName": "SPWPN_REACHING",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "adjectiveName": "obsolete",
    "realBrand": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 158
      }
    }
  },
  {
    "enumName": "SPWPN_RETURNING",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "adjectiveName": "obsolete",
    "realBrand": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 159
      }
    }
  },
  {
    "enumName": "SPWPN_CHAOS",
    "terseName": "chaos",
    "verboseName": "chaos",
    "adjectiveName": "chaotic",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 161
      }
    }
  },
  {
    "enumName": "SPWPN_EVASION",
    "terseName": "obsolete",
    "verboseName": "obsolescence",
    "adjectiveName": "obsolete",
    "realBrand": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 163
      }
    }
  },
  {
    "enumName": "SPWPN_CONFUSE",
    "terseName": "confuse",
    "verboseName": "confusion",
    "adjectiveName": "confusing",
    "realBrand": false,
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 170
      }
    }
  },
  {
    "enumName": "SPWPN_PENETRATION",
    "terseName": "penet",
    "verboseName": "penetration",
    "adjectiveName": "penetrating",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 172
      }
    }
  },
  {
    "enumName": "SPWPN_REAPING",
    "terseName": "reap",
    "verboseName": "reaping",
    "adjectiveName": "reaping",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 173
      }
    }
  },
  {
    "enumName": "SPWPN_SPECTRAL",
    "terseName": "spect",
    "verboseName": "spectralising",
    "adjectiveName": "spectral",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 174
      }
    }
  },
  {
    "enumName": "SPWPN_REBUKE",
    "terseName": "rebuke",
    "verboseName": "rebuke",
    "adjectiveName": "rebuking",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 175
      }
    }
  },
  {
    "enumName": "SPWPN_VALOUR",
    "terseName": "valour",
    "verboseName": "valour",
    "adjectiveName": "valourous",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 176
      }
    }
  },
  {
    "enumName": "SPWPN_ENTANGLING",
    "terseName": "entangle",
    "verboseName": "entangling",
    "adjectiveName": "entangling",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 177
      }
    }
  },
  {
    "enumName": "SPWPN_SUNDERING",
    "terseName": "sunder",
    "verboseName": "sundering",
    "adjectiveName": "sundering",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 178
      }
    }
  },
  {
    "enumName": "SPWPN_CONCUSSION",
    "terseName": "concuss",
    "verboseName": "concussion",
    "adjectiveName": "concussing",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 179
      }
    }
  },
  {
    "enumName": "SPWPN_DEVIOUS",
    "terseName": "devious",
    "verboseName": "devious",
    "adjectiveName": "devious",
    "realBrand": true,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 180
      }
    }
  },
  {
    "enumName": "NUM_REAL_SPECIAL_WEAPONS",
    "terseName": "num_special",
    "verboseName": "num_special",
    "adjectiveName": "num_special",
    "realBrand": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 183
      }
    }
  },
  {
    "enumName": "SPWPN_ACID",
    "terseName": "acid",
    "verboseName": "acid",
    "adjectiveName": "acidic",
    "realBrand": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 185
      }
    }
  },
  {
    "enumName": "SPWPN_CONFUSE",
    "terseName": "confuse",
    "verboseName": "confusion",
    "adjectiveName": "confusing",
    "realBrand": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 187
      }
    }
  },
  {
    "enumName": "SPWPN_WEAKNESS",
    "terseName": "weak",
    "verboseName": "weakness",
    "adjectiveName": "weakening",
    "realBrand": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 189
      }
    }
  },
  {
    "enumName": "SPWPN_VULNERABILITY",
    "terseName": "vuln",
    "verboseName": "vulnerability",
    "adjectiveName": "will-reducing",
    "realBrand": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 190
      }
    }
  },
  {
    "enumName": "SPWPN_FOUL_FLAME",
    "terseName": "foul flame",
    "verboseName": "foul flame",
    "adjectiveName": "foul flame",
    "realBrand": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 191
      }
    }
  },
  {
    "enumName": "SPWPN_DEBUG_RANDART",
    "terseName": "debug",
    "verboseName": "debug",
    "adjectiveName": "debug",
    "realBrand": false,
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 192
      }
    }
  }
];

export const BRAND_BY_NAME: Map<string, ExtractedBrandEntry> = new Map(
  BRAND_ENTRIES.map((e) => [e.enumName, e]),
);
