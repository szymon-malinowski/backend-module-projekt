import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export function createPrisma(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required. See .env.example.');
  const url = new URL(connectionString);
  const schema = url.searchParams.get('schema') || 'public';
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 3000,
    query_timeout: 3000,
    max: 10,
  }, { schema, onPoolError: () => console.error('Unexpected idle database connection error') });
  return new PrismaClient({ adapter });
}
