import type { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { sendError, sendSuccess, buildSuccess, buildError, writeSse } from '../utils/response.js';
import { logError } from '../utils/logger.js';
import type { LoginPayload } from '../models/user.model.js';

const userService = new UserService();

function fingerprint(payload: LoginPayload): string {
  return `${payload.userName}|${payload.message}|${payload.sentAt}`;
}

function readPayload(body: unknown): LoginPayload | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Partial<LoginPayload>;
  const userName = typeof raw.userName === 'string' ? raw.userName.trim() : '';
  if (!userName) return null;
  return {
    userName,
    message: typeof raw.message === 'string' ? raw.message : '',
    sentAt: typeof raw.sentAt === 'string' ? raw.sentAt : new Date().toISOString(),
  };
}

export class UserController {
  static async getUserName(_req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.getPayload();
      sendSuccess(res, result);
    } catch (err) {
      logError('getUserName failed', err);
      sendError(res, 'Failed to read user name from app_settings', 500);
    }
  }

  static async saveUserName(req: Request, res: Response): Promise<void> {
    try {
      const payload = readPayload(req.body);
      if (!payload) {
        sendError(res, 'JSON body must include userName', 400);
        return;
      }
      const saved = await userService.savePayload(payload);
      sendSuccess(res, saved);
    } catch (err) {
      logError('saveUserName failed', err);
      sendError(res, 'Failed to save JSON to app_settings', 500);
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
        const payload = await userService.getPayload();
        const next = fingerprint(payload);
        if (next !== lastSent) {
          lastSent = next;
          writeSse(res, buildSuccess(payload, 200));
        } else {
          writeSse(res, buildSuccess(null, 200));
        }
      } catch (err) {
        logError('SSE push failed', err);
        writeSse(res, buildError('Failed to read user name from app_settings', 500));
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
