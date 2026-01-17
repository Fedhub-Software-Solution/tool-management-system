import { Router } from 'express';
import partNumberConfigController from '../controllers/part-number-config.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createPartNumberConfigSchema,
  updatePartNumberConfigSchema,
} from '../validators/part-number-config.validator';

const router = Router();

// All part number config routes require authentication
router.use(authenticate);

/**
 * GET /part-number-configs
 * Get all part number configurations
 * Authorization: All authenticated users
 */
router.get(
  '/',
  partNumberConfigController.getAllPartNumberConfigs.bind(partNumberConfigController)
);

/**
 * GET /part-number-configs/:id
 * Get part number config by ID
 * Authorization: All authenticated users
 */
router.get(
  '/:id',
  partNumberConfigController.getPartNumberConfigById.bind(partNumberConfigController)
);

/**
 * POST /part-number-configs
 * Create part number config
 * Authorization: Approver only
 */
router.post(
  '/',
  authorize('Approver'),
  validate(createPartNumberConfigSchema),
  partNumberConfigController.createPartNumberConfig.bind(partNumberConfigController)
);

/**
 * PUT /part-number-configs/:id
 * Update part number config
 * Authorization: Approver only
 */
router.put(
  '/:id',
  authorize('Approver'),
  validate(updatePartNumberConfigSchema),
  partNumberConfigController.updatePartNumberConfig.bind(partNumberConfigController)
);

/**
 * DELETE /part-number-configs/:id
 * Delete part number config
 * Authorization: Approver only
 */
router.delete(
  '/:id',
  authorize('Approver'),
  partNumberConfigController.deletePartNumberConfig.bind(partNumberConfigController)
);

export default router;

