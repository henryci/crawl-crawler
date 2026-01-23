// Database connection utilities
export { getPool, query, getClient, closePool, withTransaction } from './connection.js';

// Service metadata utilities
export {
  SERVICE_METADATA_KEYS,
  setServiceMetadata,
  getServiceMetadata,
  getAllServiceMetadata,
  recordStreakDownloadDate,
  recordComboRecordsDownloadDate,
} from './service-metadata.js';
export type { ServiceMetadataKey } from './service-metadata.js';

// Re-export types
export type { Pool, PoolClient, QueryResult } from 'pg';
