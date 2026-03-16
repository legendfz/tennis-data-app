import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env['DATABASE_URL'] ?? 'postgresql://tennishq:password@localhost:5432/tennishq',
  },
  verbose: true,
  strict: true,
} satisfies Config;
