/**
 * Overall player statistics
 */
export interface OverallStats {
  totalScore: number;
  games: number;
  wins: number;
  winPercent: number;
  bestXL: number;
  bestScore: number;
  bestScoreMorgueUrl: string | null;
  averageScore: number;
  firstGame: string;
  firstGameMorgueUrl: string | null;
  mostRecentGame: string;
  mostRecentGameMorgueUrl: string | null;
}

/**
 * Ongoing game information
 */
export interface OngoingGame {
  character: string;
  god: string;
  title: string;
  place: string;
  xl: number;
  turns: number;
  time: string;
  status: string;
  server: string;
}

/**
 * A winning game record
 */
export interface Win {
  rank: number;
  score: number;
  morgueUrl: string | null;
  character: string; // e.g. "MDBe"
  species: string; // e.g. "MD"
  background: string; // e.g. "Be"
  title: string;
  end: string;
  turns: number;
  duration: string;
  god: string;
  runes: number;
  time: string;
  version: string;
  server: string;
  serverUrl: string | null;
}

/**
 * A streak of consecutive wins
 */
export interface Streak {
  rank: number;
  wins: number;
  start: string;
  end: string;
  games: Array<{
    character: string;
    morgueUrl: string | null;
  }>;
  streakBreaker: {
    character: string;
    morgueUrl: string | null;
  } | null;
}

/**
 * A recent game record (can be win or loss)
 */
export interface RecentGame {
  score: number;
  morgueUrl: string | null;
  character: string;
  species: string;
  background: string;
  god: string;
  title: string;
  place: string;
  end: string;
  xl: number;
  turns: number;
  duration: string;
  runes: number | null;
  date: string;
  version: string;
  server: string;
  serverUrl: string | null;
}

/**
 * Highscore entry
 */
export interface Highscore {
  character: string;
  species: string;
  background: string;
  score: number;
  morgueUrl: string | null;
  isWin: boolean;
}

/**
 * Stats for a specific combo (species + background)
 */
export interface ComboStats {
  species: string;
  background: string;
  wins: number;
  games: number;
  bestXL: number;
  winPercent: number;
}

/**
 * Species-level aggregate stats
 */
export interface SpeciesStats {
  species: string;
  wins: number;
  games: number;
  bestXL: number;
  winPercent: number;
}

/**
 * Background-level aggregate stats
 */
export interface BackgroundStats {
  background: string;
  wins: number;
  games: number;
  bestXL: number;
  winPercent: number;
}

/**
 * Full parsed player data
 */
export interface PlayerData {
  playerName: string;
  overallStats: OverallStats;
  ongoingGame: OngoingGame | null;
  wins: Win[];
  streaks: Streak[];
  recentGames: RecentGame[];
  comboHighscores: Highscore[];
  speciesHighscores: Highscore[];
  classHighscores: Highscore[];
  comboStats: ComboStats[];
  speciesStats: SpeciesStats[];
  backgroundStats: BackgroundStats[];
  lastUpdated: string | null;
}

