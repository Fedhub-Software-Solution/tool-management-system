import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import { handoversController } from '../controllers/handovers.controller';
import {
  createHandoverSchema,
  approveHandoverSchema,
  rejectHandoverSchema,
} from '../validators/handovers.validator';

const router = Router();

/**
 * GET /api/handovers
 * Get all handovers with filtering and pagination
 * Authorization: NPD, Maintenance
 */
router.get(
  '/',
  authenticate,
  authorize('NPD', 'Maintenance'),
  handoversController.getAllHandovers.bind(handoversController),
);

/**
 * GET /api/handovers/:id
 * Get handover by ID
 * Authorization: NPD, Maintenance
 */
router.get(
  '/:id',
  authenticate,
  authorize('NPD', 'Maintenance'),
  handoversController.getHandoverById.bind(handoversController),
);

/**
 * POST /api/handovers
 * Create new handover
 * Authorization: NPD only
 */
router.post(
  '/',
  authenticate,
  authorize('NPD'),
  validate(createHandoverSchema),
  handoversController.createHandover.bind(handoversController),
);

/**
 * POST /api/handovers/:id/approve
 * Approve handover
 * Authorization: Maintenance only
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize('Maintenance'),
  validate(approveHandoverSchema),
  handoversController.approveHandover.bind(handoversController),
);

/**
 * POST /api/handovers/:id/reject
 * Reject handover
 * Authorization: Maintenance only
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('Maintenance'),
  validate(rejectHandoverSchema),
  handoversController.rejectHandover.bind(handoversController),
);

export default router;

