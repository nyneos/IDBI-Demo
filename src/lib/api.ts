import axios, { isAxiosError } from 'axios';

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

/** In dev, use Vite proxy (same origin). In production, use API_BASE_URL from .env. */
const configuredBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081');
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
  timeout: 15_000,
});

export function getApiErrorMessage(error: unknown): string {
  const target = import.meta.env.DEV
    ? `${window.location.origin}/api (proxied to ${configuredBase})`
    : `${configuredBase}/api`;

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
      return `Request timed out — API not responding at ${target}`;
    }
    if (error.request) {
      return `Network error — cannot reach API at ${target}. Start the server: cd server && npm run dev`;
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
  return import.meta.env.DEV
    ? '/api/user-name/stream'
    : `${configuredBase}/api/user-name/stream`;
}

export function parseSsePayload<T>(raw: string): ApiResponse<T> | null {
  try {
    return JSON.parse(raw) as ApiResponse<T>;
  } catch {
    return null;
  }
}
