import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://tennishq:password@localhost:5432/tennishq'),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  TENNIS_API_KEY: z.string().optional(),
  TENNIS_API_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
