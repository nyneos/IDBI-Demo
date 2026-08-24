import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireDatabaseMiddleware } from '../middleware/database.middleware.js';

const router = Router();

router.get('/user-name', requireDatabaseMiddleware, UserController.getUserName);
router.post('/user-name', requireDatabaseMiddleware, UserController.saveUserName);
router.get('/user-name/stream', requireDatabaseMiddleware, UserController.streamUserName);

export default router;
