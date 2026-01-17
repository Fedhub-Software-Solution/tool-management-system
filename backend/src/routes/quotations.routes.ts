import { Router } from 'express';
import quotationsController from '../controllers/quotations.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import { uploadQuotationFile } from '../utils/file-upload';
import {
  createQuotationSchema,
  evaluateQuotationSchema,
} from '../validators/quotations.validator';

const router = Router();

/**
 * GET /quotations
 * Get all quotations with filtering and pagination
 * Authorization: Approver, NPD
 */
router.get(
  '/',
  authenticate,
  authorize(['Approver', 'NPD']),
  quotationsController.getAllQuotations.bind(quotationsController)
);

/**
 * GET /quotations/:id
 * Get quotation by ID
 * Authorization: Approver, NPD
 */
router.get(
  '/:id',
  authenticate,
  authorize(['Approver', 'NPD']),
  quotationsController.getQuotationById.bind(quotationsController)
);

/**
 * POST /quotations
 * Create quotation (with optional file upload)
 * Authorization: All authenticated users (suppliers can submit, NPD can create)
 */
router.post(
  '/',
  authenticate,
  uploadQuotationFile.single('file'),
  validate(createQuotationSchema),
  quotationsController.createQuotation.bind(quotationsController)
);

/**
 * PUT /quotations/:id/evaluate
 * Evaluate quotation
 * Authorization: NPD only
 */
router.put(
  '/:id/evaluate',
  authenticate,
  authorize(['NPD']),
  validate(evaluateQuotationSchema),
  quotationsController.evaluateQuotation.bind(quotationsController)
);

/**
 * GET /prs/:prId/quotations/compare
 * Compare quotations for a PR
 * Authorization: Approver, NPD
 */
// This will be added to prs.routes.ts instead

export default router;

