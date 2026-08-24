import { pool } from '../database/postgres.js';
import { config } from '../config/config.js';

function normalizeStoredValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  // Migrate older JSON rows like {"userName":"Kanav",...} → plain string
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { userName?: unknown };
      if (typeof parsed.userName === 'string' && parsed.userName.trim()) {
        return parsed.userName.trim();
      }
    } catch {
      /* treat as plain text */
    }
  }

  return trimmed;
}

export class UserRepository {
  async getUserName(): Promise<string> {
    const result = await pool.query<{ value: string }>(
      'SELECT value FROM public.app_settings WHERE key = $1',
      [config.userNameKey],
    );

    const value = result.rows[0]?.value;
    if (!value) {
      throw new Error(
        `No row found in app_settings for key "${config.userNameKey}". ` +
          "INSERT INTO public.app_settings (key, value) VALUES ('user_name', 'Kanav');",
      );
    }

    return normalizeStoredValue(value);
  }

  async saveUserName(userName: string): Promise<string> {
    const next = userName.trim();
    if (!next) throw new Error('userName cannot be empty');

    await pool.query(
      `INSERT INTO public.app_settings (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [config.userNameKey, next],
    );
    return next;
  }
}
