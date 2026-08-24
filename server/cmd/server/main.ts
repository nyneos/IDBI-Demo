import express from 'express';
import { config } from '../../config/config.js';
import { closeDatabase, isDatabaseReady, startDatabaseRetryLoop } from '../../database/postgres.js';
import { corsMiddleware } from '../../middleware/cors.middleware.js';
import { loggerMiddleware } from '../../middleware/logger.middleware.js';
import { registerRoutes } from '../../routes/index.js';
import { UserService } from '../../services/user.service.js';
import { logger, logError } from '../../utils/logger.js';

let loggedUserName = false;

async function logInitialUserName(): Promise<void> {
  if (!isDatabaseReady() || loggedUserName) return;
  const userService = new UserService();
  const payload = await userService.getPayload();
  loggedUserName = true;
  logger.info('Loaded user_name from app_settings', { userName: payload.userName });
}

async function bootstrap() {
  logger.info('Starting dashboard API server', {
    port: config.port,
    env: config.nodeEnv,
    logLevel: config.logLevel,
  });

  const app = express();

  app.use(corsMiddleware);
  app.use(loggerMiddleware);
  app.use(express.json());

  registerRoutes(app);

  const server = app.listen(config.port, () => {
    logger.info(`API server listening on http://localhost:${config.port}`);
    startDatabaseRetryLoop();
    const nameTimer = setInterval(() => {
      void logInitialUserName().then(() => {
        if (loggedUserName) clearInterval(nameTimer);
      });
    }, 2_000);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logError(`Port ${config.port} is already in use. Stop the other process or change PORT in server/.env.`, err);
    } else {
      logError('Server listen failed', err);
    }
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logError('Server failed to start', err);
  closeDatabase().finally(() => process.exit(1));
});
