import type { Express } from 'express';
import healthRoutes from './health.routes.js';
import userRoutes from './user.routes.js';

export function registerRoutes(app: Express): void {
  app.use('/api', healthRoutes);
  app.use('/api', userRoutes);
}
