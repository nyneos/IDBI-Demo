import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import winston from 'winston';
import { config } from '../config/config.js';

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const logsDir = join(serverRoot, 'logs');

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaKeys = Object.keys(meta).filter((k) => k !== 'service');
  const metaStr =
    metaKeys.length > 0
      ? ` ${JSON.stringify(Object.fromEntries(metaKeys.map((k) => [k, meta[k]])))}`
      : '';
  const base = `${ts} [${level}] ${message}${metaStr}`;
  return stack ? `${base}\n${stack}` : base;
});

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: { service: 'dashboard-api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat,
      ),
    }),
    new winston.transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  ],
});

/** Normalize unknown errors for structured logging. */
export function logError(message: string, error: unknown, meta: Record<string, unknown> = {}): void {
  if (error instanceof Error) {
    logger.error(message, { ...meta, error: error.message, stack: error.stack });
    return;
  }
  logger.error(message, { ...meta, error: String(error) });
}
