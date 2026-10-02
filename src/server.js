import 'dotenv/config';
import { createApp } from './app.js';
import { createPrisma } from './db.js';

const prisma = createPrisma();
const app = createApp(prisma);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`API listening on ${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async () => {
      await prisma.$disconnect();
    });
  });
}
export default app;
