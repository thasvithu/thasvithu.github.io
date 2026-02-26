import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { config } from './config.js';

if (!config.databaseUrl) {
  console.warn('DATABASE_URL is not set. API endpoints that need DB will fail until configured.');
}

const connectionString = normalizeDatabaseUrl(config.databaseUrl);

export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

function normalizeDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return rawUrl;
  }
}
