import { Router } from 'express';
import rolesController from '../controllers/roles.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createRoleSchema,
  updateRoleSchema,
} from '../validators/roles.validator';

const router = Router();

// All role routes require authentication
router.use(authenticate);

/**
 * GET /roles
 * Get all roles
 * Authorization: All authenticated users
 */
router.get(
  '/',
  rolesController.getAllRoles.bind(rolesController)
);

/**
 * GET /roles/:id
 * Get role by ID
 * Authorization: All authenticated users
 */
router.get(
  '/:id',
  rolesController.getRoleById.bind(rolesController)
);

/**
 * POST /roles
 * Create role
 * Authorization: Approver only
 */
router.post(
  '/',
  authorize('Approver'),
  validate(createRoleSchema),
  rolesController.createRole.bind(rolesController)
);

/**
 * PUT /roles/:id
 * Update role
 * Authorization: Approver only
 */
router.put(
  '/:id',
  authorize('Approver'),
  validate(updateRoleSchema),
  rolesController.updateRole.bind(rolesController)
);

/**
 * DELETE /roles/:id
 * Delete role
 * Authorization: Approver only
 */
router.delete(
  '/:id',
  authorize('Approver'),
  rolesController.deleteRole.bind(rolesController)
);

export default router;

