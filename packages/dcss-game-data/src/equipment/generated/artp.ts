/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Source: DCSS commit 274e6c4f0775ad821a9e0f974ca21d09501f1955
 * Extracted from: artefact-prop-type.h, artefact.cc, describe.cc
 * Re-run: `pnpm --filter dcss-game-data extract`
 */

export interface ExtractedArtpEntry {
  /** DCSS enum name, e.g. 'ARTP_FIRE'. */
  enumName: string;
  /** Abbreviation as printed in morgue braces, e.g. 'rF'. */
  abbreviation: string;
  /** Value semantics from artp_data[].value_types. */
  valueType: 'any' | 'bool' | 'positive' | 'brand';
  /** prop_note display type from describe.cc, mapped to our rendering. */
  renderingHint: 'int' | 'pip' | 'bool';
  /** In-game description from _get_all_artp_desc_data. */
  description: string;
  /** True for TAG_MAJOR_VERSION == 34 entries (old save-file compat). */
  legacy: boolean;
  /** Source locations for traceability. */
  sources: {
    enum: { file: string; line: number };
    artpData: { file: string; line: number };
    descData?: { file: string; line: number };
  };
}

export const ARTP_ENTRIES: ExtractedArtpEntry[] = [
  {
    "enumName": "ARTP_BRAND",
    "abbreviation": "Brand",
    "valueType": "brand",
    "renderingHint": "bool",
    "description": "",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 10
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 895
      }
    }
  },
  {
    "enumName": "ARTP_AC",
    "abbreviation": "AC",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your AC (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 11
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 896
      },
      "descData": {
        "file": "describe.cc",
        "line": 327
      }
    }
  },
  {
    "enumName": "ARTP_EVASION",
    "abbreviation": "EV",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your evasion (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 12
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 897
      },
      "descData": {
        "file": "describe.cc",
        "line": 330
      }
    }
  },
  {
    "enumName": "ARTP_STRENGTH",
    "abbreviation": "Str",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your strength (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 13
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 898
      },
      "descData": {
        "file": "describe.cc",
        "line": 333
      }
    }
  },
  {
    "enumName": "ARTP_INTELLIGENCE",
    "abbreviation": "Int",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your intelligence (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 14
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 900
      },
      "descData": {
        "file": "describe.cc",
        "line": 336
      }
    }
  },
  {
    "enumName": "ARTP_DEXTERITY",
    "abbreviation": "Dex",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your dexterity (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 15
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 902
      },
      "descData": {
        "file": "describe.cc",
        "line": 339
      }
    }
  },
  {
    "enumName": "ARTP_FIRE",
    "abbreviation": "rF",
    "valueType": "any",
    "renderingHint": "pip",
    "description": "fire",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 16
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 904
      },
      "descData": {
        "file": "describe.cc",
        "line": 345
      }
    }
  },
  {
    "enumName": "ARTP_COLD",
    "abbreviation": "rC",
    "valueType": "any",
    "renderingHint": "pip",
    "description": "cold",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 17
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 906
      },
      "descData": {
        "file": "describe.cc",
        "line": 348
      }
    }
  },
  {
    "enumName": "ARTP_ELECTRICITY",
    "abbreviation": "rElec",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It insulates you from electricity.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 18
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 908
      },
      "descData": {
        "file": "describe.cc",
        "line": 351
      }
    }
  },
  {
    "enumName": "ARTP_POISON",
    "abbreviation": "rPois",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It protects you from poison.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 19
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 910
      },
      "descData": {
        "file": "describe.cc",
        "line": 354
      }
    }
  },
  {
    "enumName": "ARTP_NEGATIVE_ENERGY",
    "abbreviation": "rN",
    "valueType": "any",
    "renderingHint": "pip",
    "description": "negative energy",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 20
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 912
      },
      "descData": {
        "file": "describe.cc",
        "line": 357
      }
    }
  },
  {
    "enumName": "ARTP_WILLPOWER",
    "abbreviation": "Will",
    "valueType": "any",
    "renderingHint": "pip",
    "description": "buggy willpower",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 21
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 914
      },
      "descData": {
        "file": "describe.cc",
        "line": 360
      }
    }
  },
  {
    "enumName": "ARTP_SEE_INVISIBLE",
    "abbreviation": "SInv",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It lets you see invisible.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 22
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 916
      },
      "descData": {
        "file": "describe.cc",
        "line": 369
      }
    }
  },
  {
    "enumName": "ARTP_INVISIBLE",
    "abbreviation": "+Inv",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It lets you turn invisible.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 23
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 918
      },
      "descData": {
        "file": "describe.cc",
        "line": 372
      }
    }
  },
  {
    "enumName": "ARTP_FLY",
    "abbreviation": "Fly",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It grants you flight.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 24
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 920
      },
      "descData": {
        "file": "describe.cc",
        "line": 375
      }
    }
  },
  {
    "enumName": "ARTP_BLINK",
    "abbreviation": "+Blink",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It lets you blink.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 25
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 922
      },
      "descData": {
        "file": "describe.cc",
        "line": 378
      }
    }
  },
  {
    "enumName": "ARTP_BERSERK",
    "abbreviation": "+Rage",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 27
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 925
      }
    }
  },
  {
    "enumName": "ARTP_NOISE",
    "abbreviation": "*Noise",
    "valueType": "positive",
    "renderingHint": "bool",
    "description": "It may make a loud noise when swung.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 29
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 928
      },
      "descData": {
        "file": "describe.cc",
        "line": 381
      }
    }
  },
  {
    "enumName": "ARTP_PREVENT_SPELLCASTING",
    "abbreviation": "-Cast",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It prevents spellcasting.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 30
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 930
      },
      "descData": {
        "file": "describe.cc",
        "line": 384
      }
    }
  },
  {
    "enumName": "ARTP_CAUSE_TELEPORTATION",
    "abbreviation": "*Tele",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 32
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 933
      }
    }
  },
  {
    "enumName": "ARTP_PREVENT_TELEPORTATION",
    "abbreviation": "-Tele",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It prevents most forms of teleportation.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 34
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 936
      },
      "descData": {
        "file": "describe.cc",
        "line": 387
      }
    }
  },
  {
    "enumName": "ARTP_ANGRY",
    "abbreviation": "*Rage",
    "valueType": "positive",
    "renderingHint": "bool",
    "description": "It berserks you when you make melee attacks (%d% chance).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 35
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 938
      },
      "descData": {
        "file": "describe.cc",
        "line": 390
      }
    }
  },
  {
    "enumName": "ARTP_METABOLISM",
    "abbreviation": "Hungry",
    "valueType": "positive",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 37
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 941
      }
    }
  },
  {
    "enumName": "ARTP_CONTAM",
    "abbreviation": "^Contam",
    "valueType": "positive",
    "renderingHint": "bool",
    "description": "It causes magical contamination when unequipped.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 39
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 943
      },
      "descData": {
        "file": "describe.cc",
        "line": 396
      }
    }
  },
  {
    "enumName": "ARTP_ACCURACY",
    "abbreviation": "Acc",
    "valueType": "any",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 41
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 946
      }
    }
  },
  {
    "enumName": "ARTP_SLAYING",
    "abbreviation": "Slay",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your accuracy & damage with ranged weapons and melee (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 43
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 948
      },
      "descData": {
        "file": "describe.cc",
        "line": 342
      }
    }
  },
  {
    "enumName": "ARTP_CURSE",
    "abbreviation": "*Curse",
    "valueType": "positive",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 45
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 952
      }
    }
  },
  {
    "enumName": "ARTP_STEALTH",
    "abbreviation": "Stlth",
    "valueType": "any",
    "renderingHint": "pip",
    "description": "buggy stealth",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 47
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 954
      },
      "descData": {
        "file": "describe.cc",
        "line": 433
      }
    }
  },
  {
    "enumName": "ARTP_MAGICAL_POWER",
    "abbreviation": "MP",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your magic capacity (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 48
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 956
      },
      "descData": {
        "file": "describe.cc",
        "line": 366
      }
    }
  },
  {
    "enumName": "ARTP_BASE_DELAY",
    "abbreviation": "Delay",
    "valueType": "any",
    "renderingHint": "bool",
    "description": "",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 49
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 958
      }
    }
  },
  {
    "enumName": "ARTP_HP",
    "abbreviation": "HP",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your health (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 50
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 959
      },
      "descData": {
        "file": "describe.cc",
        "line": 363
      }
    }
  },
  {
    "enumName": "ARTP_CLARITY",
    "abbreviation": "Clar",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It protects you from confusion, rage, mesmerisation and fear.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 51
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 961
      },
      "descData": {
        "file": "describe.cc",
        "line": 393
      }
    }
  },
  {
    "enumName": "ARTP_BASE_ACC",
    "abbreviation": "BAcc",
    "valueType": "any",
    "renderingHint": "bool",
    "description": "",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 52
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 962
      }
    }
  },
  {
    "enumName": "ARTP_BASE_DAM",
    "abbreviation": "BDam",
    "valueType": "any",
    "renderingHint": "bool",
    "description": "",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 53
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 963
      }
    }
  },
  {
    "enumName": "ARTP_RMSL",
    "abbreviation": "RMsl",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It protects you from missiles.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 54
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 964
      },
      "descData": {
        "file": "describe.cc",
        "line": 399
      }
    }
  },
  {
    "enumName": "ARTP_FOG",
    "abbreviation": "+Fog",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 56
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 966
      }
    }
  },
  {
    "enumName": "ARTP_REGENERATION",
    "abbreviation": "Regen",
    "valueType": "bool",
    "renderingHint": "pip",
    "description": "It increases your rate of health regeneration.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 58
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 968
      },
      "descData": {
        "file": "describe.cc",
        "line": 402
      }
    }
  },
  {
    "enumName": "ARTP_SUSTAT",
    "abbreviation": "SustAt",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 60
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 971
      }
    }
  },
  {
    "enumName": "ARTP_NO_UPGRADE",
    "abbreviation": "nupgr",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 62
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 973
      }
    }
  },
  {
    "enumName": "ARTP_RCORR",
    "abbreviation": "rCorr",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It protects you from acid and corrosion.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 63
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 974
      },
      "descData": {
        "file": "describe.cc",
        "line": 405
      }
    }
  },
  {
    "enumName": "ARTP_RMUT",
    "abbreviation": "rMut",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It protects you from mutation.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 64
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 976
      },
      "descData": {
        "file": "describe.cc",
        "line": 408
      }
    }
  },
  {
    "enumName": "ARTP_TWISTER",
    "abbreviation": "+Twstr",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 66
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 978
      }
    }
  },
  {
    "enumName": "ARTP_CORRODE",
    "abbreviation": "*Corrode",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It may corrode you when you take damage.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 68
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 981
      },
      "descData": {
        "file": "describe.cc",
        "line": 411
      }
    }
  },
  {
    "enumName": "ARTP_DRAIN",
    "abbreviation": "^Drain",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It drains your maximum health when unequipped.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 69
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 983
      },
      "descData": {
        "file": "describe.cc",
        "line": 414
      }
    }
  },
  {
    "enumName": "ARTP_SLOW",
    "abbreviation": "*Slow",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It may slow you when you take damage.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 70
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 985
      },
      "descData": {
        "file": "describe.cc",
        "line": 417
      }
    }
  },
  {
    "enumName": "ARTP_FRAGILE",
    "abbreviation": "^Fragile",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It will be destroyed if unequipped.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 71
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 987
      },
      "descData": {
        "file": "describe.cc",
        "line": 420
      }
    }
  },
  {
    "enumName": "ARTP_SHIELDING",
    "abbreviation": "SH",
    "valueType": "any",
    "renderingHint": "int",
    "description": "It affects your SH (%d).",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 72
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 989
      },
      "descData": {
        "file": "describe.cc",
        "line": 423
      }
    }
  },
  {
    "enumName": "ARTP_HARM",
    "abbreviation": "Harm",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases damage dealt and taken.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 73
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 990
      },
      "descData": {
        "file": "describe.cc",
        "line": 426
      }
    }
  },
  {
    "enumName": "ARTP_RAMPAGING",
    "abbreviation": "Rampage",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It causes one to take an extra step when moving towards enemies, briefly stunning them if this results in an attack.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 74
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 992
      },
      "descData": {
        "file": "describe.cc",
        "line": 429
      }
    }
  },
  {
    "enumName": "ARTP_ARCHMAGI",
    "abbreviation": "Archmagi",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your magical spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 75
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 994
      },
      "descData": {
        "file": "describe.cc",
        "line": 436
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_CONJ",
    "abbreviation": "Conj",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Conjurations spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 76
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 996
      },
      "descData": {
        "file": "describe.cc",
        "line": 439
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_HEXES",
    "abbreviation": "Hexes",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Hexes spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 77
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 998
      },
      "descData": {
        "file": "describe.cc",
        "line": 442
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_SUMM",
    "abbreviation": "Summ",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Summonings spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 78
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1000
      },
      "descData": {
        "file": "describe.cc",
        "line": 445
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_NECRO",
    "abbreviation": "Necro",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Necromancy spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 79
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1002
      },
      "descData": {
        "file": "describe.cc",
        "line": 448
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_TLOC",
    "abbreviation": "Tloc",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Translocations spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 80
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1004
      },
      "descData": {
        "file": "describe.cc",
        "line": 451
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_TMUT",
    "abbreviation": "Tmut",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "",
    "legacy": true,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 82
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1007
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_FIRE",
    "abbreviation": "Fire",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Fire spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 84
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1010
      },
      "descData": {
        "file": "describe.cc",
        "line": 454
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_ICE",
    "abbreviation": "Ice",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Ice spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 85
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1012
      },
      "descData": {
        "file": "describe.cc",
        "line": 457
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_AIR",
    "abbreviation": "Air",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Air spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 86
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1014
      },
      "descData": {
        "file": "describe.cc",
        "line": 460
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_EARTH",
    "abbreviation": "Earth",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Earth spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 87
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1016
      },
      "descData": {
        "file": "describe.cc",
        "line": 463
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_ALCHEMY",
    "abbreviation": "Alch",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Alchemy spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 88
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1018
      },
      "descData": {
        "file": "describe.cc",
        "line": 466
      }
    }
  },
  {
    "enumName": "ARTP_ACROBAT",
    "abbreviation": "Acrobat",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases your evasion after moving or waiting.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 89
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1021
      },
      "descData": {
        "file": "describe.cc",
        "line": 472
      }
    }
  },
  {
    "enumName": "ARTP_MANA_REGENERATION",
    "abbreviation": "RegenMP",
    "valueType": "bool",
    "renderingHint": "pip",
    "description": "It increases your rate of magic regeneration.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 90
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1023
      },
      "descData": {
        "file": "describe.cc",
        "line": 475
      }
    }
  },
  {
    "enumName": "ARTP_WIZARDRY",
    "abbreviation": "Wiz",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the success rate of your magical spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 91
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1025
      },
      "descData": {
        "file": "describe.cc",
        "line": 478
      }
    }
  },
  {
    "enumName": "ARTP_ENHANCE_FORGECRAFT",
    "abbreviation": "Forge",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It increases the power of your Forgecraft spells.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 92
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1027
      },
      "descData": {
        "file": "describe.cc",
        "line": 469
      }
    }
  },
  {
    "enumName": "ARTP_SILENCE",
    "abbreviation": "*Silence",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It may silence you when you take damage.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 93
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1029
      },
      "descData": {
        "file": "describe.cc",
        "line": 481
      }
    }
  },
  {
    "enumName": "ARTP_BANE",
    "abbreviation": "Bane",
    "valueType": "bool",
    "renderingHint": "bool",
    "description": "It inflicts you with a random bane when you equip it.",
    "legacy": false,
    "sources": {
      "enum": {
        "file": "artefact-prop-type.h",
        "line": 94
      },
      "artpData": {
        "file": "artefact.cc",
        "line": 1031
      },
      "descData": {
        "file": "describe.cc",
        "line": 484
      }
    }
  }
];

export const ARTP_BY_NAME: Map<string, ExtractedArtpEntry> = new Map(
  ARTP_ENTRIES.map((e) => [e.enumName, e]),
);
