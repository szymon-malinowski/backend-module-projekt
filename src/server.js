import 'dotenv/config';
import { createApp } from './app.js';
import { createPool } from './db.js';

const pool = createPool();
const app = createApp(pool);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`API listening on ${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async () => {
      await pool.end();
    });
  });
}
export default app;
