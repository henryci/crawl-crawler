import { parseHTML } from 'linkedom';
import type {
  ComboRecord,
  ComboRecordsData,
  ComboRecordsWithAnalytics,
  SpeciesAggregate,
  BackgroundAggregate,
} from './types.js';
import type { LegacyConfig } from './legacy-config.js';
import {
  defaultLegacyConfig,
  getSpeciesName,
  getBackgroundName,
  isSpeciesRemoved,
  isBackgroundRemoved,
} from './legacy-config.js';

/**
 * Parse character code into species and background
 * e.g. "MiBe" -> { species: "Mi", background: "Be" }
 */
function parseCharacter(char: string): { species: string; background: string } {
  if (char.length >= 4) {
    return { species: char.slice(0, 2), background: char.slice(2) };
  }
  return { species: char, background: '' };
}

/**
 * Parse a number from a string, handling commas
 */
function parseNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

/**
 * Parse date from "YYYY-MM-DD HH:MM:SS" to ISO format
 */
function parseDate(dateStr: string): string {
  return dateStr.trim().replace(' ', 'T');
}

/**
 * Get text content from element
 */
function getText(el: Element | null): string {
  return el?.textContent?.trim() || '';
}

/**
 * Get href from anchor element
 */
function getHref(el: Element | null): string | null {
  const anchor = el?.querySelector('a') || (el?.tagName === 'A' ? el : null);
  return anchor?.getAttribute('href') || null;
}

/**
 * Parse the combo records table from HTML
 */
export function parseComboRecords(html: string, sourceUrl: string): ComboRecordsData {
  const { document } = parseHTML(html);

  const records: ComboRecord[] = [];
  const table = document.querySelector('table');
  if (!table) {
    throw new Error('Could not find combo records table');
  }

  const rows = table.querySelectorAll('tr');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    if (cells.length < 13) continue;

    const character = getText(cells[2]);
    const { species, background } = parseCharacter(character);

    records.push({
      rank: parseNumber(getText(cells[0])),
      score: parseNumber(getText(cells[1])),
      morgueUrl: getHref(cells[1]),
      character,
      species,
      background,
      player: getText(cells[3]),
      playerUrl: getHref(cells[3]),
      god: getText(cells[4]),
      title: getText(cells[5]),
      place: getText(cells[6]),
      end: getText(cells[7]),
      xl: parseNumber(getText(cells[8])),
      turns: parseNumber(getText(cells[9])),
      duration: getText(cells[10]),
      runes: parseNumber(getText(cells[11])),
      date: parseDate(getText(cells[12])),
      version: getText(cells[13]),
      server: getText(cells[14]),
      serverUrl: getHref(cells[14]),
    });
  }

  const pageText = document.body?.textContent || '';
  const lastUpdatedMatch = pageText.match(/Last updated\s+(.+?)\s*$/m);

  return {
    records,
    lastUpdated: lastUpdatedMatch ? lastUpdatedMatch[1].trim() : null,
    fetchedAt: new Date().toISOString(),
    sourceUrl,
    totalRecords: records.length,
  };
}

/**
 * Generic function to compute aggregate statistics.
 * Reduces duplication between species and background aggregation.
 */
interface AggregateInput {
  key: string;
  score: number;
  runes: number;
  date: string;
  version: string;
}

interface AggregateResult {
  key: string;
  recordCount: number;
  totalScore: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  oldestRecordDate: string;
  newestRecordDate: string;
  avgRunes: number;
  latestVersion: string;
}

function computeAggregates(inputs: AggregateInput[]): AggregateResult[] {
  const statsMap = new Map<string, {
    scores: number[];
    runes: number[];
    dates: string[];
    versions: string[];
  }>();

  for (const input of inputs) {
    const existing = statsMap.get(input.key);
    if (existing) {
      existing.scores.push(input.score);
      existing.runes.push(input.runes);
      existing.dates.push(input.date);
      existing.versions.push(input.version);
    } else {
      statsMap.set(input.key, {
        scores: [input.score],
        runes: [input.runes],
        dates: [input.date],
        versions: [input.version],
      });
    }
  }

  const results: AggregateResult[] = [];

  for (const [key, data] of statsMap) {
    const sortedDates = [...data.dates].sort();
    const totalScore = data.scores.reduce((a, b) => a + b, 0);
    const totalRunes = data.runes.reduce((a, b) => a + b, 0);
    const latestVersion = [...data.versions].sort().pop() || '';

    results.push({
      key,
      recordCount: data.scores.length,
      totalScore,
      avgScore: Math.round(totalScore / data.scores.length),
      minScore: Math.min(...data.scores),
      maxScore: Math.max(...data.scores),
      oldestRecordDate: sortedDates[0],
      newestRecordDate: sortedDates[sortedDates.length - 1],
      avgRunes: Math.round((totalRunes / data.runes.length) * 10) / 10,
      latestVersion,
    });
  }

  return results.sort((a, b) => b.recordCount - a.recordCount);
}

function computeSpeciesStats(records: ComboRecord[]): SpeciesAggregate[] {
  const inputs = records.map(r => ({
    key: r.species,
    score: r.score,
    runes: r.runes,
    date: r.date,
    version: r.version,
  }));

  return computeAggregates(inputs).map(agg => ({
    species: agg.key,
    speciesName: getSpeciesName(agg.key, agg.latestVersion),
    isRemoved: isSpeciesRemoved(agg.key, agg.latestVersion),
    recordCount: agg.recordCount,
    totalScore: agg.totalScore,
    avgScore: agg.avgScore,
    minScore: agg.minScore,
    maxScore: agg.maxScore,
    oldestRecordDate: agg.oldestRecordDate,
    newestRecordDate: agg.newestRecordDate,
    avgRunes: agg.avgRunes,
  }));
}

function computeBackgroundStats(records: ComboRecord[]): BackgroundAggregate[] {
  const inputs = records.map(r => ({
    key: r.background,
    score: r.score,
    runes: r.runes,
    date: r.date,
    version: r.version,
  }));

  return computeAggregates(inputs).map(agg => ({
    background: agg.key,
    backgroundName: getBackgroundName(agg.key, agg.latestVersion),
    isRemoved: isBackgroundRemoved(agg.key, agg.latestVersion),
    recordCount: agg.recordCount,
    totalScore: agg.totalScore,
    avgScore: agg.avgScore,
    minScore: agg.minScore,
    maxScore: agg.maxScore,
    oldestRecordDate: agg.oldestRecordDate,
    newestRecordDate: agg.newestRecordDate,
    avgRunes: agg.avgRunes,
  }));
}

/**
 * Parse combo records and compute analytics
 */
export function parseComboRecordsWithAnalytics(
  html: string,
  sourceUrl: string,
  config: LegacyConfig = defaultLegacyConfig
): ComboRecordsWithAnalytics {
  const baseData = parseComboRecords(html, sourceUrl);

  return {
    ...baseData,
    speciesStats: computeSpeciesStats(baseData.records),
    backgroundStats: computeBackgroundStats(baseData.records),
    legacyConfig: config,
  };
}
