import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP request failed', meta);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP client error', meta);
    } else {
      logger.http('HTTP request', meta);
    }
  });

  next();
}
