import { closeDatabase, runMigrations } from './postgres.js';
import { logger, logError } from '../utils/logger.js';

async function main() {
  await runMigrations();
  logger.info('Migration complete — app_settings table ready');
  await closeDatabase();
}

main().catch((err) => {
  logError('Migration failed', err);
  closeDatabase().finally(() => process.exit(1));
});
