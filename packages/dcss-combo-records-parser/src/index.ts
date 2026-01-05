export { parseComboRecords, parseComboRecordsWithAnalytics } from './parser.js';
export {
  defaultLegacyConfig,
  getSpeciesName,
  getBackgroundName,
  isSpeciesRemoved,
  isBackgroundRemoved,
  isComboRestricted,
  isRecordLegacy,
  reusedSpeciesCodes,
  reusedBackgroundCodes,
  compareVersions,
  isVersionBefore,
} from './legacy-config.js';
export type {
  ComboRecord,
  ComboRecordsData,
  ComboRecordsWithAnalytics,
  SpeciesAggregate,
  BackgroundAggregate,
  LegacyConfig,
} from './types.js';
export type { ReusedCode } from './legacy-config.js';

