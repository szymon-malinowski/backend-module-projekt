import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createPool } from '../src/db.js';

export async function migrate(pool, directory = new URL('./migrations/', import.meta.url)) {
  const names = (await readdir(directory)).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize migration runners using a transaction-scoped advisory lock.
    await client.query('SELECT pg_advisory_xact_lock(20261002)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map(row => row.name));
    const completed = [];
    for (const name of names) {
      if (applied.has(name)) continue;
      await client.query(await readFile(new URL(name, directory), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      completed.push(name);
    }
    await client.query('COMMIT');
    return completed;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let pool;
  try {
    pool = createPool();
    const completed = await migrate(pool);
    console.log(completed.length ? `Applied: ${completed.join(', ')}` : 'Database is up to date.');
  } catch {
    console.error('Migration failed. Check DATABASE_URL, database availability, and migration SQL.');
    process.exitCode = 1;
  } finally {
    if (pool) await pool.end();
  }
}
