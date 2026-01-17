import { Router } from 'express';
import usersController from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
} from '../validators/users.validator';
import { changePasswordSchema } from '../validators/auth.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * GET /users
 * Get all users (Approver only)
 */
router.get(
  '/',
  authorize('Approver'),
  usersController.getAllUsers
);

/**
 * GET /users/:id
 * Get user by ID
 */
router.get('/:id', usersController.getUserById);

/**
 * POST /users
 * Create user (Approver only)
 */
router.post(
  '/',
  authorize('Approver'),
  validate(createUserSchema),
  usersController.createUser
);

/**
 * PUT /users/:id
 * Update user
 */
router.put(
  '/:id',
  validate(updateUserSchema),
  usersController.updateUser
);

/**
 * POST /users/:id/change-password
 * Change password
 */
router.post(
  '/:id/change-password',
  validate(changePasswordSchema),
  usersController.changePassword
);

export default router;

