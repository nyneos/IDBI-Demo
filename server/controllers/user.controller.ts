import type { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { sendError, sendSuccess, buildSuccess, buildError, writeSse } from '../utils/response.js';
import { logError } from '../utils/logger.js';

const userService = new UserService();

function readUserName(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { userName?: unknown }).userName;
  if (typeof raw !== 'string') return null;
  const userName = raw.trim();
  return userName || null;
}

export class UserController {
  static async getUserName(_req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.getUserName();
      sendSuccess(res, result);
    } catch (err) {
      logError('getUserName failed', err);
      sendError(res, 'Failed to read user_name from app_settings', 500);
    }
  }

  static async saveUserName(req: Request, res: Response): Promise<void> {
    try {
      const userName = readUserName(req.body);
      if (!userName) {
        sendError(res, 'JSON body must include userName string', 400);
        return;
      }
      const saved = await userService.saveUserName(userName);
      sendSuccess(res, saved);
    } catch (err) {
      logError('saveUserName failed', err);
      sendError(res, 'Failed to save user_name to app_settings', 500);
    }
  }

  static async streamUserName(req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let lastSent: string | null = null;
    let closed = false;

    const push = async () => {
      if (closed) return;
      try {
        const { userName } = await userService.getUserName();
        // Only emit a data event when the DB value actually changes
        if (userName !== lastSent) {
          lastSent = userName;
          writeSse(res, buildSuccess({ userName }, 200));
        }
      } catch (err) {
        logError('SSE push failed', err);
        writeSse(res, buildError('Failed to read user_name from app_settings', 500));
      }
    };

    await push();
    const timer = setInterval(push, userService.getSseIntervalMs());

    req.on('close', () => {
      closed = true;
      clearInterval(timer);
    });
  }
}
