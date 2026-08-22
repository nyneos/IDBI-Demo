import dotenv from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(serverRoot, '.env') });

const develMode = process.env.DEVEL_MODE === 'true';
const nodeEnv = process.env.NODE_ENV ?? (develMode ? 'development' : 'production');

export const config = {
  port: Number(process.env.PORT ?? 8081),
  nodeEnv,
  isDev: develMode || nodeEnv !== 'production',
  logLevel: process.env.LOG_LEVEL ?? (nodeEnv === 'production' ? 'info' : 'debug'),
  userNameKey: 'user_name',
  sseIntervalMs: Number(process.env.SSE_INTERVAL_MS ?? 5_000),
  db: {
    connectionString: process.env.DATABASE_URL ?? '',
    host: process.env.DB_HOST ?? process.env.DB_POOLER_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? process.env.DB_DATABASE ?? 'postgres',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
  },
} as const;
