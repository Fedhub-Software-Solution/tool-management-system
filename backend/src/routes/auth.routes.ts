import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

/**
 * POST /auth/login
 * Login user
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

/**
 * POST /auth/logout
 * Logout user (stateless - client removes token)
 */
router.post('/logout', authController.logout);

export default router;

