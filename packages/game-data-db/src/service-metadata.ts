import { query } from './connection.js';

/**
 * Known service metadata keys
 */
export const SERVICE_METADATA_KEYS = {
  STREAK_DOWNLOAD_DATE: 'streak_download_date',
} as const;

export type ServiceMetadataKey = typeof SERVICE_METADATA_KEYS[keyof typeof SERVICE_METADATA_KEYS];

/**
 * Set a service metadata value
 */
export async function setServiceMetadata(key: ServiceMetadataKey, value: string): Promise<void> {
  await query(
    `INSERT INTO service_metadata (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  );
}

/**
 * Get a service metadata value
 */
export async function getServiceMetadata(key: ServiceMetadataKey): Promise<string | null> {
  const result = await query<{ value: string }>(
    'SELECT value FROM service_metadata WHERE key = $1',
    [key]
  );
  return result.rows[0]?.value ?? null;
}

/**
 * Get all service metadata as a key-value object
 */
export async function getAllServiceMetadata(): Promise<Record<string, { value: string; updatedAt: Date }>> {
  const result = await query<{ key: string; value: string; updated_at: Date }>(
    'SELECT key, value, updated_at FROM service_metadata'
  );
  
  const metadata: Record<string, { value: string; updatedAt: Date }> = {};
  for (const row of result.rows) {
    metadata[row.key] = {
      value: row.value,
      updatedAt: row.updated_at,
    };
  }
  return metadata;
}

/**
 * Set the streak download date to the current time
 */
export async function recordStreakDownloadDate(): Promise<void> {
  await setServiceMetadata(
    SERVICE_METADATA_KEYS.STREAK_DOWNLOAD_DATE,
    new Date().toISOString()
  );
}
