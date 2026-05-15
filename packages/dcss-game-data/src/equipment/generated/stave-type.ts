/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit 274e6c4f0775ad821a9e0f974ca21d09501f1955
 * Extracted from: item-prop-enum.h (enum stave_type)
 * Re-run: `pnpm --filter dcss-game-data extract`
 */

export interface ExtractedStaffEntry {
  /** DCSS enum name, e.g. 'STAFF_FIRE'. */
  enumName: string;
  /** True for TAG_MAJOR_VERSION == 34 entries. */
  legacy: boolean;
  sources: { enum: { file: string; line: number } };
}

export const STAFF_ENTRIES: ExtractedStaffEntry[] = [
  {
    "enumName": "STAFF_WIZARDRY",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 596
      }
    }
  },
  {
    "enumName": "STAFF_POWER",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 597
      }
    }
  },
  {
    "enumName": "STAFF_FIRE",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 599
      }
    }
  },
  {
    "enumName": "STAFF_COLD",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 601
      }
    }
  },
  {
    "enumName": "STAFF_ALCHEMY",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 602
      }
    }
  },
  {
    "enumName": "STAFF_ENERGY",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 604
      }
    }
  },
  {
    "enumName": "STAFF_NECROMANCY",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 606
      }
    }
  },
  {
    "enumName": "STAFF_CONJURATION",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 607
      }
    }
  },
  {
    "enumName": "STAFF_ENCHANTMENT",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 609
      }
    }
  },
  {
    "enumName": "STAFF_SUMMONING",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 610
      }
    }
  },
  {
    "enumName": "STAFF_AIR",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 612
      }
    }
  },
  {
    "enumName": "STAFF_EARTH",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 613
      }
    }
  },
  {
    "enumName": "STAFF_CHANNELLING",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "item-prop-enum.h",
        "line": 615
      }
    }
  }
];

export const STAFF_BY_NAME: Map<string, ExtractedStaffEntry> = new Map(
  STAFF_ENTRIES.map((e) => [e.enumName, e]),
);
