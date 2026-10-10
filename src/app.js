import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errors.js';
import { authRoutes } from './auth/routes.js';
import { createTokens } from './auth/tokens.js';
import { customerRoutes } from './customers/routes.js';
import { productRoutes } from './products/routes.js';
import { orderRoutes } from './orders/routes.js';
import { rateLimit } from './middleware/rate-limit.js';

export function createApp(database, { tokens = createTokens() } = {}) {
  const app = express();
  const allowedOrigin = process.env.CLIENT_ORIGIN;
  app.use(cors({ origin: (origin, callback) => {
    if (!origin || (allowedOrigin && origin === allowedOrigin)) return callback(null, true);
    return callback(null, false);
  }, optionsSuccessStatus: 204 }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await database.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'unavailable', database: 'down' });
    }
  });

  app.use('/auth', rateLimit({ max: 10 }), authRoutes(database, tokens));
  app.use('/customers', customerRoutes(database, tokens));
  app.use('/products', productRoutes(database, tokens));
  app.use('/orders', orderRoutes(database, tokens));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
