import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db.js';
import { migrate } from '../database/migrate.js';

test('health returns 503 without leaking database errors', async () => {
  const app = createApp({ query: async () => { throw new Error('private connection details'); } });
  const response = await request(app).get('/health').expect(503);
  assert.deepEqual(response.body, { status: 'unavailable', database: 'down' });
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('database configuration is required', () => {
  assert.throws(() => createPool(''), /DATABASE_URL is required/);
});

test('real PostgreSQL migrations, constraints, rollback, and health', {
  skip: !process.env.TEST_DATABASE_URL && 'Set TEST_DATABASE_URL to an isolated PostgreSQL database',
}, async () => {
  const pool = createPool(process.env.TEST_DATABASE_URL);
  const schema = `test_${process.pid}_${Date.now()}`;
  const client = await pool.connect();
  let directory;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const isolatedPool = { connect: async () => ({
      query: (...args) => client.query(...args), release: () => {},
    }) };
    assert.deepEqual(await migrate(isolatedPool), ['001_initial.sql']);
    assert.deepEqual(await migrate(isolatedPool), []);
    const tables = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = $1', [schema]);
    assert.deepEqual(tables.rows.map(row => row.tablename).sort(),
      ['customers', 'order_items', 'orders', 'products', 'schema_migrations']);
    await client.query("INSERT INTO customers (name, email) VALUES ('Test', 'test@example.com')");
    await assert.rejects(client.query("INSERT INTO customers (name, email) VALUES ('Duplicate', 'test@example.com')"), { code: '23505' });
    await assert.rejects(client.query("INSERT INTO products (name, price) VALUES ('Invalid', -1)"), { code: '23514' });
    await assert.rejects(client.query('INSERT INTO orders (customer_id) VALUES (999999)'), { code: '23503' });
    directory = await mkdtemp(join(tmpdir(), 'backend-migration-'));
    await writeFile(join(directory, '002_broken.sql'), 'CREATE TABLE rollback_probe (id INTEGER); SELECT * FROM missing_table;');
    await assert.rejects(migrate(isolatedPool, pathToFileURL(`${directory}/`)), { code: '42P01' });
    const probe = await client.query("SELECT to_regclass('rollback_probe') AS name");
    assert.equal(probe.rows[0].name, null);
    assert.equal((await client.query('SELECT * FROM schema_migrations')).rowCount, 1);
    const response = await request(createApp(pool)).get('/health').expect(200);
    assert.deepEqual(response.body, { status: 'ok', database: 'up' });
  } finally {
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release();
    await pool.end();
    if (directory) await rm(directory, { recursive: true, force: true });
  }
});
