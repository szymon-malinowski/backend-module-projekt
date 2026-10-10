import { test, expect, jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const tokens = { verify: jest.fn(), sign: jest.fn() };
const database = { account: { findUnique: jest.fn() }, customer: {}, product: {}, order: {} };

test('CORS allows the configured origin and rejects another origin', async () => {
  const previous = process.env.CLIENT_ORIGIN;
  process.env.CLIENT_ORIGIN = 'https://client.example';
  try {
    const app = createApp(database, { tokens });
    await request(app).get('/health').set('Origin', 'https://client.example').expect(response => expect(response.headers['access-control-allow-origin']).toBe('https://client.example'));
    await request(app).get('/health').set('Origin', 'https://evil.example').expect(response => expect(response.headers['access-control-allow-origin']).toBeUndefined());
  } finally { process.env.CLIENT_ORIGIN = previous; }
});

test('auth rate limiter returns 429 with retry metadata', async () => {
  const app = createApp(database, { tokens });
  const body = { email: 'bad@example.com', password: 'wrong password' };
  for (let i = 0; i < 10; i += 1) await request(app).post('/auth/login').send(body).expect(401);
  const response = await request(app).post('/auth/login').send(body).expect(429);
  expect(response.body).toEqual({ error: 'Too many requests' });
  expect(response.headers['retry-after']).toMatch(/^\d+$/);
  expect(response.headers['x-ratelimit-limit']).toBe('10');
});
