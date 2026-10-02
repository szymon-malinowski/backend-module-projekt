import express from 'express';
import cors from 'cors';

export function createApp(database) {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || false }));
  app.use(express.json());

  app.get('/health', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await database.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'unavailable', database: 'down' });
    }
  });

  return app;
}
