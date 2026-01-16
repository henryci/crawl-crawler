// Database connection utilities
export { getPool, query, getClient, closePool, withTransaction } from './connection.js';

// Re-export types
export type { Pool, PoolClient, QueryResult } from 'pg';
