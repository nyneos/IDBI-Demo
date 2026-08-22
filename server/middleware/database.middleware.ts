import type { Request, Response, NextFunction } from 'express';
import { getDatabaseError, isDatabaseReady } from '../database/postgres.js';
import { sendError } from '../utils/response.js';

export function requireDatabaseMiddleware(_req: Request, res: Response, next: NextFunction): void {
  if (isDatabaseReady()) {
    next();
    return;
  }
  sendError(res, getDatabaseError() ?? 'Database is not connected', 503);
}
