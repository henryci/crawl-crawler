import type {
  PlayerData,
  OverallStats,
  OngoingGame,
  Win,
  Streak,
  RecentGame,
  Highscore,
  ComboStats,
  SpeciesStats,
  BackgroundStats,
} from './types.js';

/**
 * Parse character code into species and background
 * e.g. "MDBe" -> { species: "MD", background: "Be" }
 */
function parseCharacter(char: string): { species: string; background: string } {
  // Character codes are typically 4 chars: 2 for species, 2 for background
  // Some species have special markers like * for removed ones
  const species = char.slice(0, 2);
  const background = char.slice(2);
  return { species, background };
}

/**
 * Parse a number from a string, handling commas
 */
function parseNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

/**
 * Parse a percentage from a string like "1.13%"
 */
function parsePercent(str: string): number {
  return parseFloat(str.replace('%', '')) || 0;
}

/**
 * Extract text content from an element, handling the fact that we're using DOM APIs
 */
function getText(el: Element): string {
  return el.textContent?.trim() || '';
}

/**
 * Get href from an anchor element within the given element
 */
function getHref(el: Element): string | null {
  const anchor = el.querySelector('a');
  return anchor?.getAttribute('href') || null;
}

/**
 * Parse the overall stats table
 */
function parseOverallStats(doc: Document): OverallStats {
  const table = doc.querySelector('h3 + table.bordered');
  if (!table) {
    throw new Error('Could not find overall stats table');
  }

  const rows = table.querySelectorAll('tr');
  if (rows.length < 2) {
    throw new Error('Overall stats table has insufficient rows');
  }

  const dataRow = rows[1];
  const cells = dataRow.querySelectorAll('td');

  return {
    totalScore: parseNumber(getText(cells[0])),
    games: parseNumber(getText(cells[1])),
    wins: parseNumber(getText(cells[2])),
    winPercent: parsePercent(getText(cells[3])),
    bestXL: parseNumber(getText(cells[4])),
    bestScore: parseNumber(getText(cells[5])),
    bestScoreMorgueUrl: getHref(cells[5]),
    averageScore: parseNumber(getText(cells[6])),
    firstGame: getText(cells[7]),
    firstGameMorgueUrl: getHref(cells[7]),
    mostRecentGame: getText(cells[8]),
    mostRecentGameMorgueUrl: getHref(cells[8]),
  };
}

/**
 * Parse the ongoing game section if present
 */
function parseOngoingGame(doc: Document): OngoingGame | null {
  // Find the h3 that says "Ongoing Game"
  const headers = Array.from(doc.querySelectorAll('h3'));
  let ongoingHeader: Element | null = null;
  for (const h of headers) {
    if (getText(h).includes('Ongoing Game')) {
      ongoingHeader = h;
      break;
    }
  }

  if (!ongoingHeader) return null;

  // Find the table after this header
  const gameTable = ongoingHeader.closest('.game_table');
  if (!gameTable) return null;

  const table = gameTable.querySelector('table.bordered');
  if (!table) return null;

  const rows = table.querySelectorAll('tr');
  if (rows.length < 2) return null;

  const dataRow = rows[1];
  const cells = dataRow.querySelectorAll('td');
  if (cells.length < 8) return null;

  // Extract server from the header text (e.g., "Ongoing Game (cao)")
  const headerText = getText(ongoingHeader);
  const serverMatch = headerText.match(/\(([^)]+)\)/);
  const server = serverMatch ? serverMatch[1] : 'unknown';

  return {
    character: getText(cells[0]),
    god: getText(cells[1]),
    title: getText(cells[2]),
    place: getText(cells[3]),
    xl: parseNumber(getText(cells[4])),
    turns: parseNumber(getText(cells[5])),
    time: getText(cells[6]),
    status: getText(cells[7]),
    server,
  };
}

/**
 * Parse the wins table
 */
function parseWins(doc: Document): Win[] {
  const wins: Win[] = [];

  // Find the Wins h3 and its table
  const headers = Array.from(doc.querySelectorAll('h3'));
  let winsHeader: Element | null = null;
  for (const h of headers) {
    if (getText(h) === 'Wins') {
      winsHeader = h;
      break;
    }
  }

  if (!winsHeader) return wins;

  const gameTable = winsHeader.closest('.game_table');
  if (!gameTable) return wins;

  const table = gameTable.querySelector('table.bordered');
  if (!table) return wins;

  const rows = table.querySelectorAll('tr');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    if (cells.length < 12) continue;

    const character = getText(cells[2]);
    const { species, background } = parseCharacter(character);

    wins.push({
      rank: parseNumber(getText(cells[0])),
      score: parseNumber(getText(cells[1])),
      morgueUrl: getHref(cells[1]),
      character,
      species,
      background,
      title: getText(cells[3]),
      end: getText(cells[4]),
      turns: parseNumber(getText(cells[5])),
      duration: getText(cells[6]),
      god: getText(cells[7]),
      runes: parseNumber(getText(cells[8])),
      time: getText(cells[9]),
      version: getText(cells[10]),
      server: getText(cells[11]),
      serverUrl: getHref(cells[11]),
    });
  }

  return wins;
}

/**
 * Parse streaks table
 */
function parseStreaks(doc: Document): Streak[] {
  const streaks: Streak[] = [];

  const headers = Array.from(doc.querySelectorAll('h3'));
  let streaksHeader: Element | null = null;
  for (const h of headers) {
    if (getText(h) === 'Streaks of Wins') {
      streaksHeader = h;
      break;
    }
  }

  if (!streaksHeader) return streaks;

  const gameTable = streaksHeader.closest('.game_table');
  if (!gameTable) return streaks;

  const table = gameTable.querySelector('table.bordered');
  if (!table) return streaks;

  const rows = table.querySelectorAll('tr');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    if (cells.length < 6) continue;

    // Parse games in the streak
    const gamesCell = cells[4];
    const gameLinks = gamesCell.querySelectorAll('a');
    const games = Array.from(gameLinks).map((a) => ({
      character: getText(a),
      morgueUrl: a.getAttribute('href'),
    }));

    // Parse streak breaker
    const breakerCell = cells[5];
    const breakerLink = breakerCell.querySelector('a');
    const streakBreaker = breakerLink
      ? {
          character: getText(breakerLink),
          morgueUrl: breakerLink.getAttribute('href'),
        }
      : null;

    streaks.push({
      rank: parseNumber(getText(cells[0])),
      wins: parseNumber(getText(cells[1])),
      start: getText(cells[2]),
      end: getText(cells[3]),
      games,
      streakBreaker,
    });
  }

  return streaks;
}

/**
 * Parse recent games table
 */
function parseRecentGames(doc: Document): RecentGame[] {
  const recentGames: RecentGame[] = [];

  const headers = Array.from(doc.querySelectorAll('h3'));
  let recentHeader: Element | null = null;
  for (const h of headers) {
    if (getText(h) === 'Recent Games') {
      recentHeader = h;
      break;
    }
  }

  if (!recentHeader) return recentGames;

  const gameTable = recentHeader.closest('.game_table');
  if (!gameTable) return recentGames;

  const table = gameTable.querySelector('table.bordered');
  if (!table) return recentGames;

  const rows = table.querySelectorAll('tr');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    if (cells.length < 13) continue;

    const character = getText(cells[1]);
    const { species, background } = parseCharacter(character);
    const runesText = getText(cells[9]);

    recentGames.push({
      score: parseNumber(getText(cells[0])),
      morgueUrl: getHref(cells[0]),
      character,
      species,
      background,
      god: getText(cells[2]),
      title: getText(cells[3]),
      place: getText(cells[4]),
      end: getText(cells[5]),
      xl: parseNumber(getText(cells[6])),
      turns: parseNumber(getText(cells[7])),
      duration: getText(cells[8]),
      runes: runesText ? parseNumber(runesText) : null,
      date: getText(cells[10]),
      version: getText(cells[11]),
      server: getText(cells[12]),
      serverUrl: getHref(cells[12]),
    });
  }

  return recentGames;
}

/**
 * Parse highscore entries from a div
 */
function parseHighscoreSection(doc: Document, title: string): Highscore[] {
  const highscores: Highscore[] = [];

  const headers = Array.from(doc.querySelectorAll('h3'));
  let sectionHeader: Element | null = null;
  for (const h of headers) {
    if (getText(h) === title) {
      sectionHeader = h;
      break;
    }
  }

  if (!sectionHeader) return highscores;

  const container = sectionHeader.nextElementSibling;
  if (!container) return highscores;

  // Check if it says "None"
  if (getText(container).trim() === 'None') return highscores;

  // Parse the entries (format: "CharCode* (score)")
  const links = Array.from(container.querySelectorAll('a'));
  for (const link of links) {
    const text = link.textContent || '';
    const isWin = text.includes('*');
    const character = text.replace('*', '').trim();
    const { species, background } = parseCharacter(character);

    // Get the score from the following text node
    const nextText = link.nextSibling?.textContent || '';
    const scoreMatch = nextText.match(/\((\d+)\)/);
    const score = scoreMatch ? parseNumber(scoreMatch[1]) : 0;

    highscores.push({
      character,
      species,
      background,
      score,
      morgueUrl: link.getAttribute('href'),
      isWin,
    });
  }

  return highscores;
}

/**
 * Parse the stat tables (Winning Characters, Games Played, Best Character Levels)
 */
function parseStatTables(doc: Document): {
  comboStats: ComboStats[];
  speciesStats: SpeciesStats[];
  backgroundStats: BackgroundStats[];
} {
  const comboStats: ComboStats[] = [];
  const speciesStatsMap = new Map<string, SpeciesStats>();
  const backgroundStatsMap = new Map<string, BackgroundStats>();

  // Find all stat-table tables
  const statTables = doc.querySelectorAll('table.stat-table');

  // We need to correlate three tables: Winning Characters, Games Played, Best Character Levels
  // They all have the same structure with species as rows and backgrounds as columns

  // Find the tables by their preceding h3
  const headers = Array.from(doc.querySelectorAll('h3'));
  let winningCharsTable: Element | null = null;
  let gamesPlayedTable: Element | null = null;
  let bestXLTable: Element | null = null;

  for (const h of headers) {
    const text = getText(h);
    const nextTable = h.nextElementSibling;
    if (nextTable?.classList.contains('stat-table')) {
      if (text === 'Winning Characters') {
        winningCharsTable = nextTable;
      } else if (text === 'Games Played') {
        gamesPlayedTable = nextTable;
      } else if (text === 'Best Character Levels') {
        bestXLTable = nextTable;
      }
    }
  }

  if (!winningCharsTable || !gamesPlayedTable || !bestXLTable) {
    return { comboStats, speciesStats: [], backgroundStats: [] };
  }

  // Parse the background headers from the first row
  const headerRow = winningCharsTable.querySelector('tr');
  if (!headerRow) return { comboStats, speciesStats: [], backgroundStats: [] };

  const headerCells = headerRow.querySelectorAll('th');
  const backgrounds: string[] = [];
  for (let i = 1; i < headerCells.length - 2; i++) {
    // Skip first and last two columns
    backgrounds.push(getText(headerCells[i]));
  }

  // Parse each species row
  const winRows = winningCharsTable.querySelectorAll('tr');
  const gameRows = gamesPlayedTable.querySelectorAll('tr');
  const xlRows = bestXLTable.querySelectorAll('tr');

  // Skip header and footer rows
  for (let rowIdx = 1; rowIdx < winRows.length - 1; rowIdx++) {
    const winRow = winRows[rowIdx];
    const gameRow = gameRows[rowIdx];
    const xlRow = xlRows[rowIdx];

    const winCells = winRow.querySelectorAll('td, th');
    const gameCells = gameRow.querySelectorAll('td, th');
    const xlCells = xlRow.querySelectorAll('td, th');

    if (winCells.length < 2) continue;

    const species = getText(winCells[0]);
    if (!species) continue;

    let speciesWins = 0;
    let speciesGames = 0;
    let speciesBestXL = 0;

    // Parse each background column
    for (let colIdx = 1; colIdx < winCells.length - 1; colIdx++) {
      // Skip last column (total)
      const background = backgrounds[colIdx - 1];
      if (!background) continue;

      const wins = parseNumber(getText(winCells[colIdx]));
      const games = parseNumber(getText(gameCells[colIdx]));
      const bestXL = parseNumber(getText(xlCells[colIdx]));

      // Only add if there's any data
      if (wins > 0 || games > 0) {
        const winPercent = games > 0 ? (wins / games) * 100 : 0;
        comboStats.push({
          species,
          background,
          wins,
          games,
          bestXL,
          winPercent,
        });

        speciesWins += wins;
        speciesGames += games;
        speciesBestXL = Math.max(speciesBestXL, bestXL);

        // Update background stats
        const bgStats = backgroundStatsMap.get(background) || {
          background,
          wins: 0,
          games: 0,
          bestXL: 0,
          winPercent: 0,
        };
        bgStats.wins += wins;
        bgStats.games += games;
        bgStats.bestXL = Math.max(bgStats.bestXL, bestXL);
        backgroundStatsMap.set(background, bgStats);
      }
    }

    // Add species stats if there's any data
    if (speciesGames > 0) {
      speciesStatsMap.set(species, {
        species,
        wins: speciesWins,
        games: speciesGames,
        bestXL: speciesBestXL,
        winPercent: (speciesWins / speciesGames) * 100,
      });
    }
  }

  // Compute win percentages for backgrounds
  for (const bgStats of backgroundStatsMap.values()) {
    bgStats.winPercent =
      bgStats.games > 0 ? (bgStats.wins / bgStats.games) * 100 : 0;
  }

  return {
    comboStats,
    speciesStats: Array.from(speciesStatsMap.values()),
    backgroundStats: Array.from(backgroundStatsMap.values()),
  };
}

/**
 * Parse the last updated timestamp
 */
function parseLastUpdated(doc: Document): string | null {
  const updateDiv = doc.querySelector('.updatetime');
  if (!updateDiv) return null;

  const text = getText(updateDiv);
  const match = text.match(/Last updated (.+)/);
  return match ? match[1].trim() : null;
}

/**
 * Parse the player name from the page
 */
function parsePlayerName(doc: Document): string {
  const h2 = doc.querySelector('h2');
  if (!h2) return 'Unknown';

  const text = getText(h2);
  const match = text.match(/Player:\s*(.+)/);
  return match ? match[1].trim() : 'Unknown';
}

/**
 * Main parser function - parses HTML string into PlayerData
 */
export function parsePlayerPage(html: string): PlayerData {
  // Use DOMParser if available (browser), otherwise throw an error
  // This is designed to run in the browser
  if (typeof DOMParser === 'undefined') {
    throw new Error(
      'DOMParser not available. This parser is designed to run in a browser environment.',
    );
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const playerName = parsePlayerName(doc);
  const overallStats = parseOverallStats(doc);
  const ongoingGame = parseOngoingGame(doc);
  const wins = parseWins(doc);
  const streaks = parseStreaks(doc);
  const recentGames = parseRecentGames(doc);
  const comboHighscores = parseHighscoreSection(doc, 'Combo Highscores');
  const speciesHighscores = parseHighscoreSection(doc, 'Species Highscores');
  const classHighscores = parseHighscoreSection(doc, 'Class Highscores');
  const { comboStats, speciesStats, backgroundStats } = parseStatTables(doc);
  const lastUpdated = parseLastUpdated(doc);

  return {
    playerName,
    overallStats,
    ongoingGame,
    wins,
    streaks,
    recentGames,
    comboHighscores,
    speciesHighscores,
    classHighscores,
    comboStats,
    speciesStats,
    backgroundStats,
    lastUpdated,
  };
}

