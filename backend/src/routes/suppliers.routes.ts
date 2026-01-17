import { Router } from 'express';
import suppliersController from '../controllers/suppliers.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createSupplierSchema,
  updateSupplierSchema,
} from '../validators/suppliers.validator';

const router = Router();

/**
 * GET /suppliers
 * Get all suppliers with filtering and pagination
 * Authorization: All authenticated users
 */
router.get(
  '/',
  authenticate,
  suppliersController.getAllSuppliers.bind(suppliersController)
);

/**
 * GET /suppliers/:id
 * Get supplier by ID
 * Authorization: All authenticated users
 */
router.get(
  '/:id',
  authenticate,
  suppliersController.getSupplierById.bind(suppliersController)
);

/**
 * POST /suppliers
 * Create new supplier
 * Authorization: Approver only
 */
router.post(
  '/',
  authenticate,
  authorize(['Approver']),
  validate(createSupplierSchema),
  suppliersController.createSupplier.bind(suppliersController)
);

/**
 * PUT /suppliers/:id
 * Update supplier
 * Authorization: Approver only
 */
router.put(
  '/:id',
  authenticate,
  authorize(['Approver']),
  validate(updateSupplierSchema),
  suppliersController.updateSupplier.bind(suppliersController)
);

/**
 * DELETE /suppliers/:id
 * Delete supplier
 * Authorization: Approver only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['Approver']),
  suppliersController.deleteSupplier.bind(suppliersController)
);

export default router;

