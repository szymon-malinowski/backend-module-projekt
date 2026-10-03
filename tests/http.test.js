import { test, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { ApiError, asyncHandler, errorHandler } from '../src/middleware/errors.js';
import { validate } from '../src/middleware/validate.js';

test('unknown paths and unsupported methods return JSON 404', async () => {
  for (const response of [
    await request(createApp({})).get('/missing?secret=private'),
    await request(createApp({})).post('/health'),
  ]) {
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Route not found' });
  }
});

test('invalid and oversized JSON receive safe errors', async () => {
  const app = createApp({});
  const malformed = await request(app).post('/missing').type('json').send('{"secret":');
  expect(malformed.status).toBe(400);
  expect(malformed.body).toEqual({ error: 'Invalid JSON body' });
  const large = await request(app).post('/missing').send({ value: 'x'.repeat(102400) });
  expect(large.status).toBe(413);
  expect(large.body).toEqual({ error: 'Request body too large' });
});

function validationApp(source = 'body', options) {
  const app = express();
  app.use(express.json());
  app.post('/probe/:name', validate(source, {
    name: value => typeof value === 'string' && value.trim() ? undefined : 'Expected a nonempty string',
  }, options), (req, res) => res.json(req[source]));
  app.use(errorHandler);
  return app;
}

test('validation accepts valid body, params and query without coercion', async () => {
  await request(validationApp()).post('/probe/Ada').send({ name: 'Ada' }).expect(200, { name: 'Ada' });
  await request(validationApp('params')).post('/probe/Ada').expect(200, { name: 'Ada' });
  await request(validationApp('query')).post('/probe/Ada?name=Ada').expect(200, { name: 'Ada' });
});

test.each([
  [{}, 'Required field'],
  [{ name: 123 }, 'Expected a nonempty string'],
  [{ name: null }, 'Expected a nonempty string'],
  [{ name: ' ' }, 'Expected a nonempty string'],
  [{ name: 'Ada', role: 'staff' }, 'Unknown field'],
  [[], 'Expected an object'],
])('validation rejects invalid body %j', async (body, message) => {
  const response = await request(validationApp()).post('/probe/Ada').send(body).expect(400);
  expect(response.body.error).toBe('Validation failed');
  expect(response.body.details[0].message).toBe(message);
});

test('optional fields may be absent but are checked when supplied', async () => {
  const app = validationApp('body', { required: [] });
  await request(app).post('/probe/Ada').send({}).expect(200);
  await request(app).post('/probe/Ada').send({ name: false }).expect(400);
});

test('repeated query parameters and unknown query keys are rejected', async () => {
  await request(validationApp('query')).post('/probe/Ada?name=Ada&name=Bob').expect(400);
  await request(validationApp('query')).post('/probe/Ada?name=Ada&extra=1').expect(400);
});

test('sync and async unexpected failures hide internal messages, stack and status', async () => {
  const app = express();
  const failure = () => { throw Object.assign(new Error('private database password'), { status: 401 }); };
  app.get('/sync', failure);
  app.get('/async', asyncHandler(async () => failure()));
  app.get('/conflict', (req, res, next) => next(new ApiError(409, 'Resource conflict')));
  app.use(errorHandler);
  for (const path of ['/sync', '/async']) {
    await request(app).get(path).expect(500, { error: 'Internal server error' });
  }
  await request(app).get('/conflict').expect(409, { error: 'Resource conflict' });
});
