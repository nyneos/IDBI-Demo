import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data: T | null;
  error: string | null;
}

export function buildSuccess<T>(data: T, statusCode = 200): ApiResponse<T> {
  return { success: true, statusCode, data, error: null };
}

export function buildError(message: string, statusCode = 500): ApiResponse<null> {
  return { success: false, statusCode, data: null, error: message };
}

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json(buildSuccess(data, status));
}

export function sendError(res: Response, message: string, status = 500): void {
  res.status(status).json(buildError(message, status));
}

/** Format a structured SSE event payload (always JSON in `data:` field). */
export function writeSse(res: Response, payload: ApiResponse<unknown>): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
