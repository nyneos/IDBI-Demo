import type { Request, Response } from 'express';
import { getDatabaseError, isDatabaseReady } from '../database/postgres.js';
import { sendSuccess } from '../utils/response.js';

export class HealthController {
  static getHealth(_req: Request, res: Response): void {
    sendSuccess(res, {
      status: 'ok',
      database: isDatabaseReady() ? 'connected' : 'disconnected',
      error: isDatabaseReady() ? null : getDatabaseError(),
    });
  }
}
