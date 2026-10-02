import 'dotenv/config';
import pg from 'pg';

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required. See .env.example.');
  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 3000,
    query_timeout: 3000,
    max: 10,
  });
  pool.on('error', () => console.error('Unexpected idle database connection error'));
  return pool;
}
