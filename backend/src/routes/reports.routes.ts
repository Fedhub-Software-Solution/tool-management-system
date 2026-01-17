import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { reportsController } from '../controllers/reports.controller';

const router = Router();

/**
 * GET /api/reports/dashboard
 * Get dashboard statistics
 * Authorization: All roles (data filtered by role)
 */
router.get(
  '/dashboard',
  authenticate,
  reportsController.getDashboardStats.bind(reportsController),
);

/**
 * GET /api/reports/pr-summary
 * Get PR summary report
 * Authorization: Approver, NPD
 */
router.get(
  '/pr-summary',
  authenticate,
  reportsController.getPRSummaryReport.bind(reportsController),
);

/**
 * GET /api/reports/inventory
 * Get inventory summary report
 * Authorization: All roles
 */
router.get(
  '/inventory',
  authenticate,
  reportsController.getInventorySummaryReport.bind(reportsController),
);

/**
 * GET /api/reports/projects
 * Get project summary report
 * Authorization: All roles
 */
router.get(
  '/projects',
  authenticate,
  reportsController.getProjectSummaryReport.bind(reportsController),
);

export default router;

