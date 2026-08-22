import dns from 'node:dns';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ssl = { rejectUnauthorized: false } as const;

function createPool() {
  if (config.db.connectionString) {
    logger.info('Database: using DATABASE_URL');
    return new Pool({ connectionString: config.db.connectionString, ssl });
  }

  logger.info('Database connection', {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    database: config.db.database,
  });

  return new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    ssl,
  });
}

export const pool = createPool();

let databaseReady = false;
let databaseError: string | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;

export function isDatabaseReady(): boolean {
  return databaseReady;
}

export function getDatabaseError(): string | null {
  return databaseError;
}

export async function runMigrations(): Promise<void> {
  const sql = readFileSync(join(__dirname, 'migrations/001_create_app_settings.sql'), 'utf8');
  await pool.query(sql);
}

export async function closeDatabase(): Promise<void> {
  if (retryTimer) clearInterval(retryTimer);
  await pool.end();
}

function buildConnectionError(err: unknown): string {
  const detail = err instanceof Error ? err.message : String(err);
  const ipv6Refused = detail.includes('ECONNREFUSED') && detail.includes(':');
  if (detail.includes('ENOENT') && detail.includes('migrations')) {
    return `Migration file missing under server/database/migrations/. (${detail})`;
  }
  const hints = [
    'Your DB_PASSWORD in server/.env is wrong or missing.',
    'Supabase → Project Settings → Database → copy the database password.',
    'Or paste the full Session pooler URI as DATABASE_URL (Supabase → Connect → Session mode).',
  ];
  if (ipv6Refused) {
    hints.unshift('Direct host db.*.supabase.co is IPv6-only — use the pooler (DB_USE_POOLER=true).');
  }
  return `Database connection failed. ${hints.join(' ')} (${detail})`;
}

export async function connectDatabase(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    await runMigrations();
    databaseReady = true;
    databaseError = null;
    logger.info('Database connected — reading user_name from Supabase app_settings');
    return true;
  } catch (err) {
    databaseReady = false;
    databaseError = buildConnectionError(err);
    return false;
  }
}

let loggedConnectionFailure = false;

export function startDatabaseRetryLoop(intervalMs = 10_000): void {
  const attempt = async () => {
    if (databaseReady) return;
    const ok = await connectDatabase();
    if (!ok) {
      if (!loggedConnectionFailure) {
        loggedConnectionFailure = true;
        logger.warn('Database not ready — API routes return 503 until connected.', {
          error: databaseError,
        });
      }
    } else {
      loggedConnectionFailure = false;
    }
  };

  void attempt();
  retryTimer = setInterval(() => {
    void attempt();
  }, intervalMs);
}

export function requireDatabase(): void {
  if (!databaseReady) {
    throw new Error(databaseError ?? 'Database is not connected');
  }
}
