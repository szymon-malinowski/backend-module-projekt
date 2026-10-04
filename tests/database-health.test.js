import assert from 'node:assert/strict';
import { jest, test } from '@jest/globals';
import { execFileSync } from 'node:child_process';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPrisma } from '../src/db.js';

const cli = 'node_modules/prisma/build/index.js';
// These integration tests launch several Prisma CLI processes; cold Windows starts can exceed one minute.
jest.setTimeout(180000);
function migrate(url) {
  return execFileSync(process.execPath, [cli, 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8',
  });
}

test('health returns 200 after a Prisma query succeeds', async () => {
  let queried = false;
  const app = createApp({ $queryRaw: async (sql) => {
    assert.equal(sql[0], 'SELECT 1');
    queried = true;
    return [{ '?column?': 1 }];
  } });
  const response = await request(app).get('/health').expect(200);
  assert.equal(queried, true);
  assert.deepEqual(response.body, { status: 'ok', database: 'up' });
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('health returns 503 without leaking database errors', async () => {
  const app = createApp({ $queryRaw: async () => { throw new Error('private connection details'); } });
  const response = await request(app).get('/health').expect(503);
  assert.deepEqual(response.body, { status: 'unavailable', database: 'down' });
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('database configuration is required', () => {
  assert.throws(() => createPrisma(''), /DATABASE_URL is required/);
});

(process.env.TEST_DATABASE_URL ? test : test.skip)('real Prisma migrations, models, constraints, transactions, and health', async () => {
  const schema = `test_${process.pid}_${Date.now()}`;
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('schema', schema);
  const prisma = createPrisma(url.href);
  const admin = createPrisma(process.env.TEST_DATABASE_URL);
  try {
    migrate(url.href);
    assert.match(migrate(url.href), /No pending migrations/);
    const customer = await prisma.customer.create({ data: { name: 'Test', email: 'test@example.com' } });
    await assert.rejects(prisma.customer.create({ data: { name: 'Duplicate', email: customer.email } }), { code: 'P2002' });
    const product = await prisma.product.create({ data: { name: 'Product', price: '12.34', stock: 5 } });
    assert.equal(product.price.toFixed(2), '12.34');
    for (const data of [{ price: '-1' }, { stock: -1 }]) {
      await assert.rejects(prisma.product.update({ where: { id: product.id }, data }));
    }
    await assert.rejects(prisma.order.create({ data: { customerId: 999999 } }), { code: 'P2003' });
    await assert.rejects(prisma.order.create({ data: { customerId: customer.id, status: 'invalid' } }));
    const order = await prisma.order.create({ data: {
      customerId: customer.id,
      items: { create: { productId: product.id, quantity: 2, unitPrice: product.price } },
    }, include: { customer: true, items: { include: { product: true } } } });
    assert.equal(order.customer.email, customer.email);
    assert.equal(order.items[0].product.name, product.name);
    for (const data of [{ quantity: 0 }, { unitPrice: '-1' }]) {
      await assert.rejects(prisma.orderItem.update({ where: { id: order.items[0].id }, data }));
    }
    await assert.rejects(prisma.product.delete({ where: { id: product.id } }), { code: 'P2003' });
    await assert.rejects(prisma.$transaction(async (tx) => {
      await tx.customer.create({ data: { name: 'Rollback', email: 'rollback@example.com' } });
      throw new Error('rollback probe');
    }), /rollback probe/);
    assert.equal(await prisma.customer.count(), 1);
    const response = await request(createApp(prisma)).get('/health').expect(200);
    assert.deepEqual(response.body, { status: 'ok', database: 'up' });
    await prisma.customer.delete({ where: { id: customer.id } });
    assert.equal(await prisma.order.count(), 0);
    assert.equal(await prisma.orderItem.count(), 0);
  } finally {
    await prisma.$disconnect();
    // This identifier is generated above, never supplied by the caller.
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.$disconnect();
  }
});

(process.env.TEST_DATABASE_URL ? test : test.skip)('baselining the legacy schema preserves existing data', async () => {
  const { readFile } = await import('node:fs/promises');
  const schema = `baseline_${process.pid}_${Date.now()}`;
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('schema', schema);
  const admin = createPrisma(process.env.TEST_DATABASE_URL);
  const prisma = createPrisma(url.href);
  try {
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    const legacySql = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
    await admin.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
      for (const sql of legacySql.split(';').filter(sql => sql.trim())) {
        await tx.$executeRawUnsafe(sql);
      }
      await tx.$executeRaw`INSERT INTO customers (name, email) VALUES ('Existing customer', 'existing@example.com')`;
    });
    execFileSync(process.execPath, [cli, 'migrate', 'resolve', '--applied', '001_initial'], {
      env: { ...process.env, DATABASE_URL: url.href }, encoding: 'utf8',
    });
    // Baseline only the legacy migration, then apply the new account migration.
    migrate(url.href);
    assert.match(migrate(url.href), /No pending migrations/);
    const customer = await prisma.customer.findUnique({ where: { email: 'existing@example.com' } });
    assert.equal(customer.name, 'Existing customer');
  } finally {
    await prisma.$disconnect();
    try {
      await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await admin.$disconnect();
    }
  }
});

(process.env.TEST_DATABASE_URL ? test : test.skip)('real registration, account constraints, duplicate races and transaction rollback', async () => {
  const schema = `auth_${process.pid}_${Date.now()}`;
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('schema', schema);
  const prisma = createPrisma(url.href);
  const admin = createPrisma(process.env.TEST_DATABASE_URL);
  try {
    migrate(url.href);
    const app = createApp(prisma);
    const body = { name: ' Ada ', email: ' ADA@Example.com ', password: 'integration test password' };
    const results = await Promise.all([
      request(app).post('/auth/register').send(body),
      request(app).post('/auth/register').send(body),
    ]);
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(await prisma.customer.count(), 1);
    assert.equal(await prisma.account.count(), 1);
    const account = await prisma.account.findUnique({ where: { email: 'ada@example.com' } });
    assert.equal(account.role, 'customer');
    assert.notEqual(account.passwordHash, body.password);
    const response = results.find(result => result.status === 201);
    assert.equal(response.body.data.name, 'Ada');
    assert.equal(JSON.stringify(response.body).includes('password'), false);
    await request(app).post('/auth/login').send({ email: body.email, password: body.password }).expect(200);
    for (const data of [
      { email: 'role@example.com', role: 'admin' },
      { email: 'orphan@example.com', role: 'customer' },
      { email: 'UPPER@example.com', role: 'staff' },
      { email: 'fk@example.com', role: 'customer', customerId: 2147483647 },
      { email: 'duplicate-link@example.com', role: 'customer', customerId: account.customerId },
    ]) {
      await assert.rejects(prisma.account.create({ data: { passwordHash: account.passwordHash, ...data } }));
    }
    // Existing staff email collides only on the second write: customer insert must roll back.
    await prisma.account.create({ data: { email: 'staff@example.com', role: 'staff', passwordHash: account.passwordHash } });
    await request(app).post('/auth/register').send({ ...body, email: 'staff@example.com' }).expect(409);
    assert.equal(await prisma.customer.count(), 1);
    await prisma.customer.delete({ where: { id: account.customerId } });
    assert.equal(await prisma.account.findUnique({ where: { id: account.id } }), null);
  } finally {
    await prisma.$disconnect();
    try {
      await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await admin.$disconnect();
    }
  }
});
