import { test, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { productRoutes } from '../src/products/routes.js';
import { errorHandler } from '../src/middleware/errors.js';

const tokens = { verify: jest.fn(() => 1), sign: jest.fn() };
const date = '2026-10-06T08:00:00.000Z';
const product = id => ({ id, name: `Product ${id}`, description: 'Description', price: '12.34', stock: 5, createdAt: date });
function appFor(database, auth = { id: 1, role: 'staff', customerId: null }) {
  tokens.verify.mockReturnValue(auth.id); database.account ??= { findUnique: jest.fn() }; database.account.findUnique.mockResolvedValue(auth);
  const app = express(); app.use(express.json()); app.use('/products', productRoutes(database, tokens)); app.use(errorHandler); return app;
}
const bearer = { Authorization: 'Bearer token' };

test('product reads are public and stable ordered', async () => {
  const database = { product: { findMany: jest.fn().mockResolvedValue([product(2), product(1)]), count: jest.fn().mockResolvedValue(2) } };
  const app = appFor(database, { id: 1, role: 'customer', customerId: 1 });
  await request(app).get('/products').expect(200, { data: [product(2), product(1)], pagination: { page: 1, limit: 20, total: 2 } });
});

test('staff can create and update products with normalized values', async () => {
  const created = product(1); const updated = { ...created, name: 'Updated', price: '13.00', stock: 8 };
  const database = { product: { create: jest.fn().mockResolvedValue(created), update: jest.fn().mockResolvedValue(updated) } };
  const app = appFor(database);
  await request(app).post('/products').set(bearer).send({ name: ' Product 1 ', description: 'Description', price: '12.34', stock: 5 }).expect(201, { data: created });
  expect(database.product.create).toHaveBeenCalledWith({ data: { name: 'Product 1', description: 'Description', price: '12.34', stock: 5 } });
  await request(app).patch('/products/1').set(bearer).send({ name: ' Updated ', price: '13.00', stock: 8 }).expect(200, { data: updated });
  expect(database.product.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { name: 'Updated', price: '13.00', stock: 8 } });
});

test('customers cannot write products and missing authentication is rejected', async () => {
  const database = { product: { create: jest.fn() } };
  const app = appFor(database, { id: 2, role: 'customer', customerId: 2 });
  await request(app).post('/products').set(bearer).send({ name: 'x', price: '1.00', stock: 1 }).expect(403);
  await request(app).post('/products').send({ name: 'x', price: '1.00', stock: 1 }).expect(401);
});

test.each([
  { name: '', price: '1.00', stock: 1 }, { name: 'x', price: '-1', stock: 1 }, { name: 'x', price: '1.001', stock: 1 },
  { name: 'x', price: '1.00', stock: -1 }, { name: 'x', price: '1.00', stock: 1.5 }, { name: 'x', price: '1.00' },
  { name: 'x', price: '1.00', stock: 1, extra: true }, { name: 'x', price: '1.00', stock: 1, description: 'x'.repeat(5001) },
])('invalid product input is rejected before writes: %j', async body => {
  const database = { product: { create: jest.fn() } };
  await request(appFor(database)).post('/products').set(bearer).send(body).expect(400);
  expect(database.product.create).not.toHaveBeenCalled();
});

test('patch requires at least one allowed field and validates IDs', async () => {
  const database = { product: { update: jest.fn() } };
  const app = appFor(database);
  await request(app).patch('/products/1').set(bearer).send({}).expect(400);
  await request(app).patch('/products/nope').set(bearer).send({ stock: 2 }).expect(400);
  await request(app).patch('/products/1').set(bearer).send({ role: 'staff' }).expect(400);
});

test('product detail and deletion handle missing products, references, and safe errors', async () => {
  const database = { product: { findUnique: jest.fn().mockResolvedValue(product(1)), delete: jest.fn() }, orderItem: { count: jest.fn().mockResolvedValue(1) } };
  const app = appFor(database);
  await request(app).get('/products/1').expect(200, { data: product(1) });
  await request(app).get('/products/9').expect(200, { data: product(1) });
  await request(app).delete('/products/1').set(bearer).expect(409, { error: 'Product is referenced by orders' });
  database.orderItem.count.mockResolvedValue(0);
  await request(app).delete('/products/1').set(bearer).expect(204);
  database.product.findUnique.mockResolvedValue(null);
  await request(app).delete('/products/1').set(bearer).expect(404);
});

test('unexpected product database errors are hidden', async () => {
  const database = { product: { findMany: jest.fn().mockRejectedValue(new Error('secret')), count: jest.fn().mockResolvedValue(0) } };
  await request(appFor(database)).get('/products').expect(500, { error: 'Internal server error' });
});
