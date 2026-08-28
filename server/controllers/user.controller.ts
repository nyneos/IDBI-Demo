import type { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import {
  addUserNameSseClient,
  broadcastUserName,
  removeUserNameSseClient,
  sendUserNameToClient,
} from '../services/user-name-sse.hub.js';
import { sendError, sendSuccess, buildError, writeSse } from '../utils/response.js';
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
      // Push to all open Dashboard SSE clients immediately (no wait for poll)
      broadcastUserName(saved.userName);
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
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const client = addUserNameSseClient(res);
    let closed = false;

    const pushFromDb = async () => {
      if (closed) return;
      try {
        const { userName } = await userService.getUserName();
        sendUserNameToClient(client, userName);
      } catch (err) {
        logError('SSE push failed', err);
        writeSse(res, buildError('Failed to read user_name from app_settings', 500));
      }
    };

    await pushFromDb();
    // Backup poll for external DB edits; Login → Dashboard updates use broadcast (instant)
    const timer = setInterval(pushFromDb, userService.getSseIntervalMs());

    req.on('close', () => {
      closed = true;
      clearInterval(timer);
      removeUserNameSseClient(client);
    });
  }
}
