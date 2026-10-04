import { test, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { hashPassword, verifyPassword } from '../src/auth/passwords.js';
import { authenticate, createTokens } from '../src/auth/tokens.js';
import { errorHandler } from '../src/middleware/errors.js';

const credentials = { name: ' Ada ', email: ' ADA@Example.com ', password: 'a long test password' };
const tokens = createTokens();

test('passwords are salted, verified exactly and never stored in plaintext', async () => {
  const first = await hashPassword(credentials.password);
  const second = await hashPassword(credentials.password);
  expect(first).not.toBe(second);
  expect(first).not.toContain(credentials.password);
  expect(await verifyPassword(credentials.password, first)).toBe(true);
  expect(await verifyPassword(credentials.password + ' ', first)).toBe(false);
  expect(await verifyPassword(credentials.password, 'invalid')).toBe(false);
});

test('registration normalizes profile, fixes role and returns only customer data', async () => {
  const customer = { id: 7, name: 'Ada', email: 'ada@example.com' };
  const tx = { customer: { create: jest.fn().mockResolvedValue(customer) }, account: { create: jest.fn() } };
  const database = { $transaction: jest.fn(fn => fn(tx)) };
  const response = await request(createApp(database)).post('/auth/register').send(credentials).expect(201);
  expect(response.body).toEqual({ data: customer });
  expect(response.headers.location).toBe('/customers/7');
  expect(response.headers['cache-control']).toBe('no-store');
  expect(tx.customer.create).toHaveBeenCalledWith({ data: { name: 'Ada', email: 'ada@example.com' } });
  const account = tx.account.create.mock.calls[0][0].data;
  expect(account).toMatchObject({ customerId: 7, role: 'customer', email: 'ada@example.com' });
  expect(await verifyPassword(credentials.password, account.passwordHash)).toBe(true);
});

test.each([
  { ...credentials, role: 'staff' }, { ...credentials, customerId: 4 },
  { ...credentials, password: 'short' }, { ...credentials, password: 'x'.repeat(129) },
  { ...credentials, email: 'bad' }, { ...credentials, name: ' ' },
  { ...credentials, name: 'x'.repeat(121) }, { ...credentials, email: null },
])('invalid registration is rejected before database writes: %j', async body => {
  const database = { $transaction: jest.fn() };
  await request(createApp(database)).post('/auth/register').send(body).expect(400);
  expect(database.$transaction).not.toHaveBeenCalled();
});

test('duplicate registration returns 409; unexpected storage errors are safe', async () => {
  for (const [error, status, message] of [
    [{ code: 'P2002' }, 409, 'Email already registered'],
    [new Error('private database details'), 500, 'Internal server error'],
  ]) {
    const database = { $transaction: jest.fn().mockRejectedValue(error) };
    await request(createApp(database)).post('/auth/register').send(credentials).expect(status, { error: message });
  }
});

test('login returns a verifiable expiring token and generic invalid-credential errors', async () => {
  const passwordHash = await hashPassword(credentials.password);
  const account = { id: 3, passwordHash };
  const database = { account: { findUnique: jest.fn().mockResolvedValue(account) } };
  const app = createApp(database);
  const body = { email: credentials.email, password: credentials.password };
  const response = await request(app).post('/auth/login').send(body).expect(200);
  expect(database.account.findUnique).toHaveBeenCalledWith({ where: { email: 'ada@example.com' } });
  expect(response.body).toEqual({ accessToken: expect.any(String), tokenType: 'Bearer', expiresIn: 3600 });
  expect(tokens.verify(response.body.accessToken)).toBe(3);
  expect(response.headers['cache-control']).toBe('no-store');
  const claims = jwt.decode(response.body.accessToken);
  expect(claims.exp - claims.iat).toBe(3600);
  expect(claims).not.toHaveProperty('passwordHash');
  await request(app).post('/auth/login').send({ ...body, password: 'wrong password here' })
    .expect(401, { error: 'Invalid credentials' });
  database.account.findUnique.mockResolvedValue(null);
  await request(app).post('/auth/login').send(body).expect(401, { error: 'Invalid credentials' });
});

function protectedApp(database) {
  const app = express();
  app.get('/private', authenticate(database, tokens), (req, res) => res.json(req.auth));
  app.use(errorHandler);
  return app;
}

test('authentication loads current permissions and rejects deleted accounts', async () => {
  const database = { account: { findUnique: jest.fn().mockResolvedValue({ id: 3, role: 'staff', customerId: null }) } };
  const app = protectedApp(database);
  const token = tokens.sign(3);
  await request(app).get('/private').auth(token, { type: 'bearer' }).expect(200, { id: 3, role: 'staff', customerId: null });
  expect(database.account.findUnique).toHaveBeenCalledWith({ where: { id: 3 }, select: { id: true, role: true, customerId: true } });
  database.account.findUnique.mockResolvedValue(null);
  await request(app).get('/private').auth(token, { type: 'bearer' }).expect(401);
  database.account.findUnique.mockRejectedValue(new Error('private failure'));
  await request(app).get('/private').auth(token, { type: 'bearer' }).expect(500, { error: 'Internal server error' });
});

test('missing, malformed, tampered, expired and wrong-purpose tokens fail before storage access', async () => {
  const options = { subject: '3', issuer: 'backend-module-rest-api', audience: 'backend-module-clients', expiresIn: 3600 };
  const sign = (payload, overrides = {}, secret = process.env.JWT_SECRET) => jwt.sign(payload, secret, { ...options, ...overrides });
  const invalid = [
    '', 'Basic abc', 'Bearer nonsense', 'Bearer a b',
    `Bearer ${sign({}, {}, 'another-secret-of-more-than-32-bytes')}`,
    `Bearer ${sign({}, { expiresIn: -1 })}`,
    `Bearer ${sign({}, { algorithm: 'HS384' })}`,
    `Bearer ${sign({}, { audience: 'other-app' })}`,
    `Bearer ${sign({}, { issuer: 'other-issuer' })}`,
    `Bearer ${sign({}, { subject: '0' })}`,
    `Bearer ${sign({}, { subject: '2147483648' })}`,
    `Bearer ${sign({ iat: Math.floor(Date.now() / 1000) + 60 })}`,
    `Bearer ${jwt.sign({ sub: '3', iss: options.issuer, aud: options.audience }, process.env.JWT_SECRET)}`,
  ];
  const database = { account: { findUnique: jest.fn() } };
  for (const authorization of invalid) {
    await request(protectedApp(database)).get('/private').set('Authorization', authorization)
      .expect(401, { error: 'Authentication required' });
  }
  expect(database.account.findUnique).not.toHaveBeenCalled();
});

test('token configuration refuses absent or short secrets', () => {
  expect(() => createTokens('')).toThrow(/JWT_SECRET/);
  expect(() => createTokens('short')).toThrow(/JWT_SECRET/);
});
