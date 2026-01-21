/**
 * Type definitions for DCSS game data.
 */

/**
 * A species (also known as race) in DCSS.
 */
export interface Species {
  /** Two-letter code (e.g., "Mi" for Minotaur) */
  code: string;
  /** Full name (e.g., "Minotaur") */
  name: string;
  /** Alternative names this species has been known by */
  aliases?: string[];
  /** Version when this species was added (null if original) */
  addedInVersion?: string;
  /** Version when this species was removed (null if still playable) */
  removedInVersion?: string;
  /** If this code was reused from another species, info about the old species */
  previousCode?: {
    /** Name of the species that previously used this code */
    name: string;
    /** Version when the code was reassigned */
    reassignedInVersion: string;
  };
}

/**
 * A background (also known as class) in DCSS.
 */
export interface Background {
  /** Two-letter code (e.g., "Fi" for Fighter) */
  code: string;
  /** Full name (e.g., "Fighter") */
  name: string;
  /** Alternative names this background has been known by */
  aliases?: string[];
  /** Version when this background was added (null if original) */
  addedInVersion?: string;
  /** Version when this background was removed (null if still playable) */
  removedInVersion?: string;
  /** If this code was reused from another background, info about the old background */
  previousCode?: {
    /** Name of the background that previously used this code */
    name: string;
    /** Version when the code was reassigned */
    reassignedInVersion: string;
  };
}

/**
 * A god in DCSS.
 */
export interface God {
  /** Full canonical name (e.g., "Kikubaaqudgha") */
  name: string;
  /** Common short name or nickname (e.g., "Kiku") */
  shortName?: string;
  /** Title/epithet (e.g., "the Destroyer" for Makhleb) */
  epithet?: string;
  /** Version when this god was added (null if original) */
  addedInVersion?: string;
  /** Version when this god was removed (null if still available) */
  removedInVersion?: string;
}

/**
 * A dungeon branch in DCSS.
 */
export interface Branch {
  /** Full canonical name (e.g., "Orcish Mines") */
  name: string;
  /** Short abbreviation used in notes (e.g., "Orc") */
  shortName: string;
  /** Whether this is a portal vault (temporary) */
  isPortal: boolean;
  /** Version when this branch was added (null if original) */
  addedInVersion?: string;
  /** Version when this branch was removed (null if still available) */
  removedInVersion?: string;
}

/**
 * A combo restriction - a species/background combination that is not allowed.
 */
export interface ComboRestriction {
  /** Species code */
  species: string;
  /** Background code */
  background: string;
  /** Reason for restriction */
  reason?: string;
  /** Version when this restriction was added */
  addedInVersion?: string;
  /** Version when this restriction was removed (null if still restricted) */
  removedInVersion?: string;
}

/**
 * Configuration for legacy/removed content handling.
 */
export interface LegacyConfig {
  /** Species codes that are no longer playable */
  removedSpecies: string[];
  /** Background codes that are no longer playable */
  removedBackgrounds: string[];
  /** Combo codes (e.g., "DgBe") that are restricted even though species/background exist */
  restrictedCombos: string[];
  /** Human-readable names for species codes */
  speciesNames: Record<string, string>;
  /** Human-readable names for background codes */
  backgroundNames: Record<string, string>;
}

/**
 * Information about a reused code (species or background code that was reassigned).
 */
export interface ReusedCode {
  /** Name used before the cutoff version */
  oldName: string;
  /** Name used from the cutoff version onwards */
  newName: string;
  /** Version where the code changed (exclusive - versions before this use oldName) */
  cutoffVersion: string;
  /** Whether the old usage is removed from the game */
  oldIsRemoved: boolean;
}
