import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { validate } from '../middleware/validation.middleware';
import { requestsController } from '../controllers/requests.controller';
import {
  createSparesRequestSchema,
  fulfillRequestSchema,
  rejectRequestSchema,
} from '../validators/requests.validator';

const router = Router();

/**
 * GET /api/requests
 * Get all requests with filtering and pagination
 * Authorization: Spares (all), Indentor (own requests)
 */
router.get(
  '/',
  authenticate,
  requestsController.getAllRequests.bind(requestsController),
);

/**
 * GET /api/requests/:id
 * Get request by ID
 * Authorization: Spares (all), Indentor (own only)
 */
router.get(
  '/:id',
  authenticate,
  requestsController.getRequestById.bind(requestsController),
);

/**
 * POST /api/requests
 * Create new request
 * Authorization: Indentor only
 */
router.post(
  '/',
  authenticate,
  authorize('Indentor'),
  validate(createSparesRequestSchema),
  requestsController.createRequest.bind(requestsController),
);

/**
 * POST /api/requests/:id/fulfill
 * Fulfill request
 * Authorization: Spares only
 */
router.post(
  '/:id/fulfill',
  authenticate,
  authorize('Spares'),
  validate(fulfillRequestSchema),
  requestsController.fulfillRequest.bind(requestsController),
);

/**
 * POST /api/requests/:id/reject
 * Reject request
 * Authorization: Spares only
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('Spares'),
  validate(rejectRequestSchema),
  requestsController.rejectRequest.bind(requestsController),
);

export default router;

