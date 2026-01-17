import { Router } from 'express';
import departmentsController from '../controllers/departments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from '../validators/departments.validator';

const router = Router();

// All department routes require authentication
router.use(authenticate);

/**
 * GET /departments
 * Get all departments
 * Authorization: All authenticated users
 */
router.get(
  '/',
  departmentsController.getAllDepartments.bind(departmentsController)
);

/**
 * GET /departments/:id
 * Get department by ID
 * Authorization: All authenticated users
 */
router.get(
  '/:id',
  departmentsController.getDepartmentById.bind(departmentsController)
);

/**
 * POST /departments
 * Create department
 * Authorization: Approver only
 */
router.post(
  '/',
  authorize('Approver'),
  validate(createDepartmentSchema),
  departmentsController.createDepartment.bind(departmentsController)
);

/**
 * PUT /departments/:id
 * Update department
 * Authorization: Approver only
 */
router.put(
  '/:id',
  authorize('Approver'),
  validate(updateDepartmentSchema),
  departmentsController.updateDepartment.bind(departmentsController)
);

/**
 * DELETE /departments/:id
 * Delete department
 * Authorization: Approver only
 */
router.delete(
  '/:id',
  authorize('Approver'),
  departmentsController.deleteDepartment.bind(departmentsController)
);

export default router;

