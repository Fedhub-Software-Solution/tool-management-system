import { Router } from 'express';
import prsController from '../controllers/prs.controller';
import quotationsController from '../controllers/quotations.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createPRSchema,
  updatePRSchema,
  approvePRSchema,
  rejectPRSchema,
} from '../validators/prs.validator';
import { awardPRSchema } from '../validators/quotations.validator';

const router = Router();

/**
 * GET /prs
 * Get all PRs with filtering and pagination
 * Authorization: Approver, NPD
 */
router.get(
  '/',
  authenticate,
  authorize(['Approver', 'NPD']),
  prsController.getAllPRs.bind(prsController)
);

/**
 * GET /prs/:id
 * Get PR by ID
 * Authorization: Approver, NPD
 */
router.get(
  '/:id',
  authenticate,
  authorize(['Approver', 'NPD']),
  prsController.getPRById.bind(prsController)
);

/**
 * POST /prs
 * Create new PR
 * Authorization: NPD only
 */
router.post(
  '/',
  authenticate,
  authorize(['NPD']),
  validate(createPRSchema),
  prsController.createPR.bind(prsController)
);

/**
 * PUT /prs/:id
 * Update PR (before approval)
 * Authorization: NPD only
 */
router.put(
  '/:id',
  authenticate,
  authorize(['NPD']),
  validate(updatePRSchema),
  prsController.updatePR.bind(prsController)
);

/**
 * POST /prs/:id/approve
 * Approve PR
 * Authorization: Approver only
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize(['Approver']),
  validate(approvePRSchema),
  prsController.approvePR.bind(prsController)
);

/**
 * POST /prs/:id/reject
 * Reject PR
 * Authorization: Approver only
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize(['Approver']),
  validate(rejectPRSchema),
  prsController.rejectPR.bind(prsController)
);

/**
 * POST /prs/:id/send-to-suppliers
 * Send PR to suppliers
 * Authorization: NPD only
 */
router.post(
  '/:id/send-to-suppliers',
  authenticate,
  authorize(['NPD']),
  prsController.sendToSuppliers.bind(prsController)
);

/**
 * DELETE /prs/:id
 * Delete PR (only if Submitted)
 * Authorization: NPD only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['NPD']),
  prsController.deletePR.bind(prsController)
);

/**
 * POST /prs/:id/award
 * Award PR to a supplier
 * Authorization: NPD only
 */
router.post(
  '/:id/award',
  authenticate,
  authorize(['NPD']),
  validate(awardPRSchema),
  prsController.awardPR.bind(prsController)
);

/**
 * GET /prs/:prId/quotations/compare
 * Compare quotations for a PR
 * Authorization: Approver, NPD
 */
router.get(
  '/:prId/quotations/compare',
  authenticate,
  authorize(['Approver', 'NPD']),
  quotationsController.compareQuotations.bind(quotationsController)
);

export default router;

