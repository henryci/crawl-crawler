/**
 * Verify that the curated equipment data covers everything the extract
 * script pulled from DCSS source, and that nothing in our curated tables
 * references a DCSS entity that no longer exists.
 *
 * Run after `pnpm --filter dcss-game-data extract` when bumping the
 * pinned DCSS source SHA. The script exits with code 1 (failing CI) on
 * any of:
 *
 *   - A non-legacy ARTP_* from DCSS lacks a curated entry in properties.ts.
 *   - A curated entry references an ARTP_* that no longer exists.
 *   - dcss-version.json SHA doesn't match the local DCSS source HEAD.
 *
 * Future checks (as the extract surface expands):
 *   - SPWPN_* coverage in brands.ts
 *   - SPARM_* coverage in egos.ts
 *   - Weapon/Armor base table coverage
 *   - Unrand list completeness
 *
 * Usage:
 *   pnpm --filter dcss-game-data verify
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ARTP_ENTRIES,
  CURATED_ARTP_KEYS,
  BRAND_ENTRIES,
  CURATED_BRAND_KEYS,
  EGO_ENTRIES,
  CURATED_EGO_KEYS,
  JEWELRY_ENTRIES,
  CURATED_JEWELRY_KEYS,
  STAFF_ENTRIES,
  CURATED_STAFF_KEYS,
  PROPERTIES,
  getUncoveredEgos,
  getCuratedEgoPropertyRefs,
  getCuratedJewelryPropertyRefs,
  getCuratedStaffPropertyRefs,
} from '../src/equipment/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');
const VERSION_FILE = join(PACKAGE_ROOT, 'dcss-version.json');

interface VersionInfo {
  commit: string;
  date: string;
  sourcePath: string;
}

interface CheckResult {
  name: string;
  ok: boolean;
  details?: string[];
}

function loadVersion(): VersionInfo {
  return JSON.parse(readFileSync(VERSION_FILE, 'utf-8')) as VersionInfo;
}

function resolveDcssRepoRoot(version: VersionInfo): string {
  return resolve(PACKAGE_ROOT, version.sourcePath);
}

/**
 * Check that dcss-version.json's commit SHA matches `git rev-parse HEAD`
 * in the pinned DCSS source tree. Catches the common mistake of "I
 * checked out a new commit but forgot to update dcss-version.json."
 */
function checkSourceSha(version: VersionInfo): CheckResult {
  const repoRoot = resolveDcssRepoRoot(version);
  let head: string;
  try {
    head = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8' }).trim();
  } catch (err) {
    return {
      name: 'DCSS source SHA',
      ok: false,
      details: [`Could not resolve git HEAD in ${repoRoot}: ${(err as Error).message}`],
    };
  }
  if (head === version.commit) {
    return { name: 'DCSS source SHA', ok: true };
  }
  return {
    name: 'DCSS source SHA',
    ok: false,
    details: [
      `dcss-version.json pins: ${version.commit}`,
      `Local source HEAD:      ${head}`,
      `If you updated the source on purpose, also update dcss-version.json.`,
    ],
  };
}

/**
 * Every non-legacy ARTP_* from DCSS must have a curated entry.
 */
function checkArtpCoverage(): CheckResult {
  const missing = ARTP_ENTRIES
    .filter((e) => !e.legacy)
    .filter((e) => !CURATED_ARTP_KEYS.has(e.enumName))
    .map((e) => e.enumName);

  if (missing.length === 0) {
    return { name: 'ARTP coverage', ok: true };
  }
  return {
    name: 'ARTP coverage',
    ok: false,
    details: [
      `${missing.length} non-legacy ARTP_* entries lack curated metadata.`,
      `Add entries to CURATED_ARTP_META in src/equipment/properties.ts for:`,
      ...missing.map((n) => `  - ${n}`),
    ],
  };
}

/**
 * No curated ARTP_* entry should reference an enum value the extract no
 * longer sees. Catches the case where DCSS removes an ARTP and we forget
 * to remove our curated entry.
 */
function checkArtpDeadReferences(): CheckResult {
  const knownEnumNames = new Set(ARTP_ENTRIES.map((e) => e.enumName));
  const dead = [...CURATED_ARTP_KEYS].filter((n) => !knownEnumNames.has(n));
  if (dead.length === 0) {
    return { name: 'ARTP dead references', ok: true };
  }
  return {
    name: 'ARTP dead references',
    ok: false,
    details: [
      `${dead.length} curated entries reference ARTPs that no longer exist:`,
      ...dead.map((n) => `  - ${n}`),
      `Either DCSS removed these, or the extract is broken. Investigate before deleting.`,
    ],
  };
}

/**
 * Every real SPWPN_* (real weapon brand a player can find) must have a
 * curated entry in brands.ts.
 */
function checkBrandCoverage(): CheckResult {
  const missing = BRAND_ENTRIES
    .filter((e) => e.realBrand)
    .filter((e) => !CURATED_BRAND_KEYS.has(e.enumName))
    .map((e) => e.enumName);
  if (missing.length === 0) return { name: 'Brand coverage', ok: true };
  return {
    name: 'Brand coverage',
    ok: false,
    details: [
      `${missing.length} real SPWPN_* entries lack curated metadata.`,
      `Add entries to CURATED_BRAND_META in src/equipment/brands.ts for:`,
      ...missing.map((n) => `  - ${n}`),
    ],
  };
}

function checkBrandDeadReferences(): CheckResult {
  const known = new Set(BRAND_ENTRIES.map((e) => e.enumName));
  const dead = [...CURATED_BRAND_KEYS].filter((n) => !known.has(n));
  if (dead.length === 0) return { name: 'Brand dead references', ok: true };
  return {
    name: 'Brand dead references',
    ok: false,
    details: [
      `${dead.length} curated brand entries reference SPWPN_* that no longer exist:`,
      ...dead.map((n) => `  - ${n}`),
    ],
  };
}

/**
 * Every real SPARM_* must be in ARMOR_EGOS — either via auto-parse from
 * the terse name or via curated metadata.
 */
function checkEgoCoverage(): CheckResult {
  const uncovered = getUncoveredEgos();
  if (uncovered.length === 0) return { name: 'Ego coverage', ok: true };
  return {
    name: 'Ego coverage',
    ok: false,
    details: [
      `${uncovered.length} real SPARM_* entries neither auto-parse from terse name nor have a curated entry.`,
      `Add entries to CURATED_EGO_META in src/equipment/egos.ts for:`,
      ...uncovered.map((n) => `  - ${n}`),
    ],
  };
}

function checkEgoDeadReferences(): CheckResult {
  const known = new Set(EGO_ENTRIES.map((e) => e.enumName));
  const dead = [...CURATED_EGO_KEYS].filter((n) => !known.has(n));
  if (dead.length === 0) return { name: 'Ego dead references', ok: true };
  return {
    name: 'Ego dead references',
    ok: false,
    details: [
      `${dead.length} curated ego entries reference SPARM_* that no longer exist:`,
      ...dead.map((n) => `  - ${n}`),
    ],
  };
}

/**
 * Curated ego contributions reference PropertyKeys; those must exist in
 * the PROPERTIES registry. Catches typos like 'Strength' vs 'Str'.
 */
function checkEgoPropertyRefs(): CheckResult {
  const refs = getCuratedEgoPropertyRefs();
  const missing = refs.filter((p) => !PROPERTIES[p]);
  if (missing.length === 0) return { name: 'Ego property refs', ok: true };
  return {
    name: 'Ego property refs',
    ok: false,
    details: [
      `${missing.length} curated ego contributions reference unknown PropertyKeys:`,
      ...missing.map((p) => `  - '${p}'`),
      `Either fix the typo in egos.ts or add the property to properties.ts.`,
    ],
  };
}

/** Every non-legacy ring/amulet must have a curated entry. */
function checkJewelryCoverage(): CheckResult {
  const missing = JEWELRY_ENTRIES
    .filter((e) => !e.legacy)
    .filter((e) => !CURATED_JEWELRY_KEYS.has(e.enumName))
    .map((e) => e.enumName);
  if (missing.length === 0) return { name: 'Jewelry coverage', ok: true };
  return {
    name: 'Jewelry coverage',
    ok: false,
    details: [
      `${missing.length} non-legacy ring/amulet entries lack curated metadata.`,
      `Add entries to CURATED_JEWELRY in src/equipment/jewelry.ts for:`,
      ...missing.map((n) => `  - ${n}`),
    ],
  };
}

function checkJewelryDeadReferences(): CheckResult {
  const known = new Set(JEWELRY_ENTRIES.map((e) => e.enumName));
  const dead = [...CURATED_JEWELRY_KEYS].filter((n) => !known.has(n));
  if (dead.length === 0) return { name: 'Jewelry dead references', ok: true };
  return {
    name: 'Jewelry dead references',
    ok: false,
    details: [
      `${dead.length} curated jewelry entries reference RING_*/AMU_* that no longer exist:`,
      ...dead.map((n) => `  - ${n}`),
    ],
  };
}

function checkJewelryPropertyRefs(): CheckResult {
  const refs = getCuratedJewelryPropertyRefs();
  const missing = refs.filter((p) => !PROPERTIES[p]);
  if (missing.length === 0) return { name: 'Jewelry property refs', ok: true };
  return {
    name: 'Jewelry property refs',
    ok: false,
    details: [
      `${missing.length} curated jewelry contributions reference unknown PropertyKeys:`,
      ...missing.map((p) => `  - '${p}'`),
    ],
  };
}

/** Every non-legacy staff must have a curated entry. */
function checkStaffCoverage(): CheckResult {
  const missing = STAFF_ENTRIES
    .filter((e) => !e.legacy)
    .filter((e) => !CURATED_STAFF_KEYS.has(e.enumName))
    .map((e) => e.enumName);
  if (missing.length === 0) return { name: 'Staff coverage', ok: true };
  return {
    name: 'Staff coverage',
    ok: false,
    details: [
      `${missing.length} non-legacy staff entries lack curated metadata.`,
      `Add entries to CURATED_STAVES in src/equipment/staves.ts for:`,
      ...missing.map((n) => `  - ${n}`),
    ],
  };
}

function checkStaffDeadReferences(): CheckResult {
  const known = new Set(STAFF_ENTRIES.map((e) => e.enumName));
  const dead = [...CURATED_STAFF_KEYS].filter((n) => !known.has(n));
  if (dead.length === 0) return { name: 'Staff dead references', ok: true };
  return {
    name: 'Staff dead references',
    ok: false,
    details: [
      `${dead.length} curated staff entries reference STAFF_* that no longer exist:`,
      ...dead.map((n) => `  - ${n}`),
    ],
  };
}

function checkStaffPropertyRefs(): CheckResult {
  const refs = getCuratedStaffPropertyRefs();
  const missing = refs.filter((p) => !PROPERTIES[p]);
  if (missing.length === 0) return { name: 'Staff property refs', ok: true };
  return {
    name: 'Staff property refs',
    ok: false,
    details: [
      `${missing.length} curated staff contributions reference unknown PropertyKeys:`,
      ...missing.map((p) => `  - '${p}'`),
    ],
  };
}

function printResult(r: CheckResult): void {
  const marker = r.ok ? '✓' : '✗';
  console.log(`${marker} ${r.name}`);
  if (r.details) {
    for (const line of r.details) console.log(`  ${line}`);
  }
}

function main(): void {
  const version = loadVersion();
  console.log(`Verifying against DCSS commit ${version.commit}`);
  console.log('');

  const results: CheckResult[] = [
    checkSourceSha(version),
    checkArtpCoverage(),
    checkArtpDeadReferences(),
    checkBrandCoverage(),
    checkBrandDeadReferences(),
    checkEgoCoverage(),
    checkEgoDeadReferences(),
    checkEgoPropertyRefs(),
    checkJewelryCoverage(),
    checkJewelryDeadReferences(),
    checkJewelryPropertyRefs(),
    checkStaffCoverage(),
    checkStaffDeadReferences(),
    checkStaffPropertyRefs(),
  ];

  for (const r of results) printResult(r);

  const failed = results.filter((r) => !r.ok);
  console.log('');
  if (failed.length === 0) {
    console.log(`All ${results.length} checks passed.`);
    return;
  }
  console.log(`${failed.length} of ${results.length} checks failed.`);
  process.exit(1);
}

main();
