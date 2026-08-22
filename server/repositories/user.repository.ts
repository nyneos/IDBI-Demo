import { pool } from '../database/postgres.js';
import { config } from '../config/config.js';

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
          "INSERT INTO public.app_settings (key, value) VALUES ('user_name', 'YourName');",
      );
    }

    return value;
  }
}
