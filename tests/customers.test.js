import { test, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { customerRoutes } from '../src/customers/routes.js';
import { errorHandler } from '../src/middleware/errors.js';

const tokens = { verify: jest.fn(() => 1), sign: jest.fn(() => 'token') };
const date = '2026-10-05T08:00:00.000Z';
const customer = id => ({ id, name: `Customer ${id}`, email: `customer${id}@example.com`, createdAt: date });
function appFor(database, auth = { id: 1, role: 'staff', customerId: null }) {
  tokens.verify.mockReturnValue(auth.id);
  database.account ??= { findUnique: jest.fn().mockResolvedValue(auth) };
  database.account.findUnique.mockResolvedValue(auth);
  const app = express(); app.use(express.json()); app.use('/customers', customerRoutes(database, tokens)); app.use(errorHandler); return app;
}
const auth = { Authorization: 'Bearer token' };

test('staff can list and create customers with normalized public responses', async () => {
  const database = {
    customer: {
      findMany: jest.fn().mockResolvedValue([customer(2), { ...customer(1), email: 'one@example.com' }]), count: jest.fn().mockResolvedValue(2),
      create: jest.fn().mockResolvedValue({ ...customer(3), name: 'Ada', email: 'ada@example.com' }),
    }, account: { findUnique: jest.fn() },
  };
  const app = appFor(database);
  await request(app).get('/customers').set(auth).expect(200, { data: [customer(2), { ...customer(1), email: 'one@example.com' }], pagination: { page: 1, limit: 20, total: 2 } });
  await request(app).post('/customers').set(auth).send({ name: ' Ada ', email: ' ADA@Example.com ' }).expect(201, { data: { ...customer(3), name: 'Ada', email: 'ada@example.com' } });
  expect(database.customer.create).toHaveBeenCalledWith({ data: { name: 'Ada', email: 'ada@example.com' } });
});

test('customer can read and update only their own profile; other profiles are hidden', async () => {
  const tx = { customer: { update: jest.fn().mockResolvedValue({ ...customer(7), name: 'Updated' }) }, account: { updateMany: jest.fn() } };
  const database = { customer: { findUnique: jest.fn().mockResolvedValue(customer(7)), update: tx.customer.update }, account: { findUnique: jest.fn() }, $transaction: jest.fn(fn => fn(tx)) };
  const app = appFor(database, { id: 10, role: 'customer', customerId: 7 });
  await request(app).get('/customers/7').set(auth).expect(200, { data: customer(7) });
  await request(app).get('/customers/8').set(auth).expect(404, { error: 'Resource not found' });
  await request(app).patch('/customers/7').set(auth).send({ name: 'Updated' }).expect(200, { data: { ...customer(7), name: 'Updated' } });
  await request(app).patch('/customers/8').set(auth).send({ name: 'Nope' }).expect(404);
  expect(database.customer.update).toHaveBeenCalled();
});

test('staff can update email transactionally and duplicate email is a conflict', async () => {
  const updated = { ...customer(4), email: 'new@example.com' };
  const tx = { customer: { update: jest.fn().mockResolvedValue(updated) }, account: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
  const database = { customer: { findUnique: jest.fn().mockResolvedValue(customer(4)) }, $transaction: jest.fn(fn => fn(tx)), account: { findUnique: jest.fn() } };
  const app = appFor(database);
  await request(app).patch('/customers/4').set(auth).send({ email: ' NEW@Example.com ' }).expect(200, { data: updated });
  expect(tx.account.updateMany).toHaveBeenCalledWith({ where: { customerId: 4 }, data: { email: 'new@example.com' } });
  database.$transaction.mockRejectedValue({ code: 'P2002' });
  await request(app).patch('/customers/4').set(auth).send({ email: 'taken@example.com' }).expect(409, { error: 'Email already registered' });
});

test.each([
  ['get', '/customers/0'], ['get', '/customers/nope'], ['patch', '/customers/nope'],
])('invalid customer route input is rejected', async (method, path) => {
  const database = { customer: {}, account: { findUnique: jest.fn() } };
  const response = await request(appFor(database))[method](path).set(auth).send(method === 'patch' ? { name: 'x' } : undefined);
  expect(response.status).toBe(400);
});

test('empty and unknown updates, forbidden writes, and invalid creates are rejected', async () => {
  const database = { customer: { findUnique: jest.fn().mockResolvedValue(customer(1)), create: jest.fn() }, account: { findUnique: jest.fn() } };
  const app = appFor(database, { id: 9, role: 'customer', customerId: 1 });
  await request(app).get('/customers').set(auth).expect(403);
  await request(app).post('/customers').set(auth).send({ name: 'x', email: 'x@example.com' }).expect(403);
  await request(app).patch('/customers/1').set(auth).send({}).expect(400);
  await request(app).patch('/customers/1').set(auth).send({ role: 'staff' }).expect(400);
});

test('staff deletion checks existence and order constraints before deleting', async () => {
  const database = { customer: { findUnique: jest.fn().mockResolvedValue(customer(1)), delete: jest.fn() }, order: { count: jest.fn().mockResolvedValue(2) }, account: { findUnique: jest.fn() } };
  const app = appFor(database);
  await request(app).delete('/customers/1').set(auth).expect(409, { error: 'Customer has orders' });
  expect(database.customer.delete).not.toHaveBeenCalled();
  database.order.count.mockResolvedValue(0);
  await request(app).delete('/customers/1').set(auth).expect(204);
  database.customer.findUnique.mockResolvedValue(null);
  await request(app).delete('/customers/1').set(auth).expect(404);
});

test('database failures return safe errors', async () => {
  const database = { customer: { findMany: jest.fn().mockRejectedValue(new Error('secret')), count: jest.fn().mockResolvedValue(0) }, account: { findUnique: jest.fn() } };
  await request(appFor(database)).get('/customers').set(auth).expect(500, { error: 'Internal server error' });
});
