import { Router } from 'express';
import bomItemController from '../controllers/bom-item.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createBomItemSchema,
  updateBomItemSchema,
} from '../validators/bom-item.validator';

const router = Router();

// All BOM item routes require authentication
router.use(authenticate);

/**
 * GET /bom-items
 * Get all BOM items
 * Authorization: All authenticated users
 */
router.get(
  '/',
  bomItemController.getAllBomItems.bind(bomItemController)
);

/**
 * GET /bom-items/:id
 * Get BOM item by ID
 * Authorization: All authenticated users
 */
router.get(
  '/:id',
  bomItemController.getBomItemById.bind(bomItemController)
);

/**
 * POST /bom-items
 * Create BOM item
 * Authorization: Approver only
 */
router.post(
  '/',
  authorize('Approver'),
  validate(createBomItemSchema),
  bomItemController.createBomItem.bind(bomItemController)
);

/**
 * PUT /bom-items/:id
 * Update BOM item
 * Authorization: Approver only
 */
router.put(
  '/:id',
  authorize('Approver'),
  validate(updateBomItemSchema),
  bomItemController.updateBomItem.bind(bomItemController)
);

/**
 * DELETE /bom-items/:id
 * Delete BOM item
 * Authorization: Approver only
 */
router.delete(
  '/:id',
  authorize('Approver'),
  bomItemController.deleteBomItem.bind(bomItemController)
);

export default router;

