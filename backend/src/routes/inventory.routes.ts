import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import { inventoryController } from '../controllers/inventory.controller';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  adjustStockSchema,
} from '../validators/inventory.validator';

const router = Router();

/**
 * GET /api/inventory
 * Get all inventory items with filtering and pagination
 * Authorization: All roles
 */
router.get(
  '/',
  authenticate,
  inventoryController.getAllInventoryItems.bind(inventoryController),
);

/**
 * GET /api/inventory/low-stock
 * Get low stock items
 * Authorization: Spares only
 */
router.get(
  '/low-stock',
  authenticate,
  authorize('Spares'),
  inventoryController.getLowStockItems.bind(inventoryController),
);

/**
 * GET /api/inventory/:id
 * Get inventory item by ID (with optional history)
 * Authorization: All roles
 */
router.get(
  '/:id',
  authenticate,
  inventoryController.getInventoryItemById.bind(inventoryController),
);

/**
 * POST /api/inventory
 * Create inventory item
 * Authorization: Spares only
 */
router.post(
  '/',
  authenticate,
  authorize('Spares'),
  validate(createInventoryItemSchema),
  inventoryController.createInventoryItem.bind(inventoryController),
);

/**
 * PUT /api/inventory/:id
 * Update inventory item
 * Authorization: Spares only
 */
router.put(
  '/:id',
  authenticate,
  authorize('Spares'),
  validate(updateInventoryItemSchema),
  inventoryController.updateInventoryItem.bind(inventoryController),
);

/**
 * POST /api/inventory/:id/adjust
 * Adjust stock manually
 * Authorization: Spares only
 */
router.post(
  '/:id/adjust',
  authenticate,
  authorize('Spares'),
  validate(adjustStockSchema),
  inventoryController.adjustStock.bind(inventoryController),
);

export default router;

