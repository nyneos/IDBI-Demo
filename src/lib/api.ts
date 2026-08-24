import axios, { isAxiosError } from 'axios';
import type { LoginPayload } from '@/loginPayload';

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
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 60_000,
});

function isHtmlResponse(data: unknown): boolean {
  return typeof data === 'string' && /^\s*<!doctype html|^\s*<html/i.test(data);
}

export function getApiErrorMessage(error: unknown): string {
  const target = import.meta.env.DEV
    ? `${window.location.origin}/api (proxied to ${configuredBase})`
    : `${configuredBase}/api`;

  if (isAxiosError(error)) {
    if (error.response) {
      const body = error.response.data;
      if (isHtmlResponse(body)) {
        return 'Got HTML instead of API data. Redeploy the frontend so it points to the Render API.';
      }
      const parsed = body as ApiResponse | string;
      const detail =
        typeof parsed === 'string'
          ? parsed
          : (parsed.error ?? JSON.stringify(parsed));
      const code = typeof parsed === 'object' && parsed?.statusCode ? parsed.statusCode : error.response.status;
      return `${error.config?.method?.toUpperCase() ?? 'GET'} ${error.config?.url ?? '/api/user-name'} failed (${code}): ${detail}`;
    }
    if (error.code === 'ECONNABORTED') {
      if (import.meta.env.DEV) {
        return `Request timed out — API not responding at ${target}. Start the server: cd server && npm run dev`;
      }
      return 'Request timed out — the API may still be waking up. Free hosting can take up to ~50 seconds. Wait and try again.';
    }
    if (error.request) {
      if (import.meta.env.DEV) {
        return `Network error — cannot reach API at ${target}. Start the server: cd server && npm run dev`;
      }
      return `Cannot reach the API (${configuredBase}). Free hosting sleeps when idle and can take up to ~50 seconds to start — wait and click Continue again.`;
    }
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return 'Unknown error while calling the API';
}

function parsePayload(body: unknown): LoginPayload {
  if (isHtmlResponse(body)) {
    throw new Error('Got HTML instead of API data. Redeploy the frontend so it points to the Render API.');
  }
  const parsed = body as ApiResponse<LoginPayload>;
  if (!parsed || typeof parsed !== 'object' || !parsed.success || !parsed.data?.userName) {
    throw new Error(parsed?.error ?? 'Failed to load dashboard data');
  }
  return parsed.data;
}

export async function sendLoginPayload(payload: LoginPayload): Promise<LoginPayload> {
  const { data: body } = await api.post<ApiResponse<LoginPayload>>('/api/user-name', payload);
  return parsePayload(body);
}

export async function fetchLoginPayload(): Promise<LoginPayload> {
  const { data: body } = await api.get<ApiResponse<LoginPayload>>('/api/user-name');
  return parsePayload(body);
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
