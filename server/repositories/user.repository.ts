import { pool } from '../database/postgres.js';
import { config } from '../config/config.js';
import type { LoginPayload } from '../models/user.model.js';

function parseStoredValue(value: string): LoginPayload {
  try {
    const parsed = JSON.parse(value) as Partial<LoginPayload>;
    if (parsed && typeof parsed.userName === 'string' && parsed.userName) {
      return {
        userName: parsed.userName,
        message: typeof parsed.message === 'string' ? parsed.message : '',
        sentAt: typeof parsed.sentAt === 'string' ? parsed.sentAt : '',
      };
    }
  } catch {
    /* stored as a plain name from older rows */
  }

  return { userName: value, message: '', sentAt: '' };
}

export class UserRepository {
  async getPayload(): Promise<LoginPayload> {
    const result = await pool.query<{ value: string }>(
      'SELECT value FROM public.app_settings WHERE key = $1',
      [config.userNameKey],
    );

    const value = result.rows[0]?.value;
    if (!value) {
      throw new Error(
        `No row found in app_settings for key "${config.userNameKey}". ` +
          "INSERT INTO public.app_settings (key, value) VALUES ('user_name', 'YourName');",
      );
    }

    return parseStoredValue(value);
  }

  async savePayload(payload: LoginPayload): Promise<LoginPayload> {
    await pool.query(
      `INSERT INTO public.app_settings (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [config.userNameKey, JSON.stringify(payload)],
    );
    return payload;
  }
}
