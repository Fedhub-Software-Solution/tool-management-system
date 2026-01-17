import { Router } from 'express';
import toolNumberConfigController from '../controllers/tool-number-config.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createToolNumberConfigSchema,
  updateToolNumberConfigSchema,
} from '../validators/tool-number-config.validator';

const router = Router();

// All tool number config routes require authentication
router.use(authenticate);

/**
 * GET /tool-number-configs
 * Get all tool number configurations
 * Authorization: All authenticated users
 */
router.get(
  '/',
  toolNumberConfigController.getAllToolNumberConfigs.bind(toolNumberConfigController)
);

/**
 * GET /tool-number-configs/:id
 * Get tool number config by ID
 * Authorization: All authenticated users
 */
router.get(
  '/:id',
  toolNumberConfigController.getToolNumberConfigById.bind(toolNumberConfigController)
);

/**
 * POST /tool-number-configs
 * Create tool number config
 * Authorization: Approver only
 */
router.post(
  '/',
  authorize('Approver'),
  validate(createToolNumberConfigSchema),
  toolNumberConfigController.createToolNumberConfig.bind(toolNumberConfigController)
);

/**
 * PUT /tool-number-configs/:id
 * Update tool number config
 * Authorization: Approver only
 */
router.put(
  '/:id',
  authorize('Approver'),
  validate(updateToolNumberConfigSchema),
  toolNumberConfigController.updateToolNumberConfig.bind(toolNumberConfigController)
);

/**
 * DELETE /tool-number-configs/:id
 * Delete tool number config
 * Authorization: Approver only
 */
router.delete(
  '/:id',
  authorize('Approver'),
  toolNumberConfigController.deleteToolNumberConfig.bind(toolNumberConfigController)
);

export default router;

