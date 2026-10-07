import { test, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { orderRoutes } from '../src/orders/routes.js';
import { errorHandler } from '../src/middleware/errors.js';

const tokens = { verify: jest.fn(() => 4), sign: jest.fn() };
const auth = { Authorization: 'Bearer token' };
const product = (id, price = '12.34', stock = 5) => ({ id, name: `P${id}`, price, stock });
function appFor(database, account = { id: 4, role: 'customer', customerId: 9 }) {
  tokens.verify.mockReturnValue(account.id); database.account ??= { findUnique: jest.fn() }; database.account.findUnique.mockResolvedValue(account);
  const app = express(); app.use(express.json()); app.use('/orders', orderRoutes(database, tokens)); app.use(errorHandler); return app;
}
function transactionDatabase(order = { id: 1, customerId: 9, status: 'pending', createdAt: '2026-10-07T08:00:00.000Z', items: [{ id: 1, productId: 2, quantity: 2, unitPrice: '12.34' }] }) {
  const tx = { product: { findMany: jest.fn().mockResolvedValue([product(2)]), updateMany: jest.fn().mockResolvedValue({ count: 1 }) }, order: { create: jest.fn().mockResolvedValue(order) } };
  return { tx, database: { $transaction: jest.fn(fn => fn(tx)), account: { findUnique: jest.fn() } } };
}

test('customer order creation uses stored prices, decrements stock atomically, and returns total', async () => {
  const { database, tx } = transactionDatabase();
  const response = await request(appFor(database)).post('/orders').set(auth).send({ items: [{ productId: 2, quantity: 2 }] }).expect(201);
  expect(response.body).toEqual({ data: { id: 1, customerId: 9, status: 'pending', createdAt: '2026-10-07T08:00:00.000Z', items: [{ id: 1, productId: 2, quantity: 2, unitPrice: '12.34' }], total: '24.68' } });
  expect(tx.product.updateMany).toHaveBeenCalledWith({ where: { id: 2, stock: { gte: 2 } }, data: { stock: { decrement: 2 } } });
  expect(tx.order.create).toHaveBeenCalledWith({ data: { customerId: 9, status: 'pending', items: { create: [{ productId: 2, quantity: 2, unitPrice: '12.34' }] } }, include: { items: true } });
});

test('staff cannot create orders and client cannot supply price, total, status, or customer ID', async () => {
  const { database } = transactionDatabase();
  await request(appFor(database, { id: 1, role: 'staff', customerId: null })).post('/orders').set(auth).send({ items: [{ productId: 2, quantity: 1 }] }).expect(403);
  for (const body of [
    { items: [{ productId: 2, quantity: 1, unitPrice: '1.00' }] }, { items: [{ productId: 2, quantity: 1 }], total: '1.00' },
    { items: [{ productId: 2, quantity: 1 }], status: 'paid' }, { items: [{ productId: 2, quantity: 1 }], customerId: 1 },
  ]) await request(appFor(transactionDatabase().database)).post('/orders').set(auth).send(body).expect(400);
});

test.each([
  { items: [] }, { items: [{ productId: 2, quantity: 0 }] }, { items: [{ productId: 2.5, quantity: 1 }] },
  { items: [{ productId: 2, quantity: 1 }, { productId: 2, quantity: 1 }] }, { items: [{ productId: 2, quantity: 1, extra: true }] },
])('invalid order input is rejected before transaction: %j', async body => {
  const { database } = transactionDatabase(); await request(appFor(database)).post('/orders').set(auth).send(body).expect(400); expect(database.$transaction).not.toHaveBeenCalled();
});

test('missing products and insufficient stock abort transaction without creating an order', async () => {
  const missing = transactionDatabase(); missing.tx.product.findMany.mockResolvedValue([]);
  await request(appFor(missing.database)).post('/orders').set(auth).send({ items: [{ productId: 99, quantity: 1 }] }).expect(404);
  expect(missing.tx.order.create).not.toHaveBeenCalled();
  const stock = transactionDatabase(); stock.tx.product.updateMany.mockResolvedValue({ count: 0 });
  await request(appFor(stock.database)).post('/orders').set(auth).send({ items: [{ productId: 2, quantity: 99 }] }).expect(409);
  expect(stock.tx.order.create).not.toHaveBeenCalled();
});

test('transaction failures return safe errors and no partial response', async () => {
  const database = { $transaction: jest.fn().mockRejectedValue(new Error('private database error')), account: { findUnique: jest.fn() } };
  await request(appFor(database)).post('/orders').set(auth).send({ items: [{ productId: 2, quantity: 1 }] }).expect(500, { error: 'Internal server error' });
});
