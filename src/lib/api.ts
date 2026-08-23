import axios, { isAxiosError } from 'axios';

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

/** In dev, use Vite proxy (same origin). In production, use VITE_API_BASE_URL. */
const configuredBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? '');
export const API_BASE_URL = import.meta.env.DEV ? '' : configuredBase;

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data: T | null;
  error: string | null;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
});

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response) {
      const body = error.response.data as ApiResponse | string;
      const detail =
        typeof body === 'string'
          ? body
          : (body.error ?? JSON.stringify(body));
      const code = typeof body === 'object' && body?.statusCode ? body.statusCode : error.response.status;
      return `${error.config?.method?.toUpperCase() ?? 'GET'} ${error.config?.url ?? '/api/user-name'} failed (${code}): ${detail}`;
    }

    if (error.code === 'ECONNABORTED') {
      if (import.meta.env.DEV) {
        return 'Request timed out — API not responding. Start the server: cd server && npm run dev';
      }
      return 'Request timed out — the API may still be waking up. Free hosting can take up to ~50 seconds on first request. Wait and try again.';
    }

    if (error.request) {
      if (import.meta.env.DEV) {
        return 'Network error — cannot reach API. Start the server: cd server && npm run dev';
      }
      if (!configuredBase) {
        return 'API URL is not configured. Set VITE_API_BASE_URL in Vercel (e.g. https://your-api.onrender.com).';
      }
      if (isLocalhostUrl(configuredBase)) {
        return 'API is pointing at localhost in production. Set VITE_API_BASE_URL to your deployed API URL in Vercel and redeploy.';
      }
      return `Cannot reach the API (${configuredBase}). On free hosting the server sleeps when idle and can take up to ~50 seconds to start — wait a moment and click Continue again.`;
    }

    return error.message;
  }

  if (error instanceof Error) return error.message;
  return 'Unknown error while calling the API';
}

export async function fetchUserName(): Promise<string> {
  const { data: body } = await api.get<ApiResponse<{ userName: string }>>('/api/user-name');
  if (!body.success || !body.data?.userName) {
    throw new Error(body.error ?? 'Failed to load user name');
  }
  return body.data.userName;
}

export function userNameStreamUrl(): string {
  if (import.meta.env.DEV) return '/api/user-name/stream';
  if (!configuredBase) return '/api/user-name/stream';
  return `${configuredBase}/api/user-name/stream`;
}

export function parseSsePayload<T>(raw: string): ApiResponse<T> | null {
  try {
    return JSON.parse(raw) as ApiResponse<T>;
  } catch {
    return null;
  }
}
