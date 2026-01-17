import { Router } from 'express';
import userPreferenceController from '../controllers/user-preference.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateUserPreferenceSchema } from '../validators/user-preference.validator';

const router = Router();

// All user preference routes require authentication
router.use(authenticate);

/**
 * GET /user-preferences
 * Get current user preferences
 * Authorization: All authenticated users
 */
router.get(
  '/',
  userPreferenceController.getUserPreferences.bind(userPreferenceController)
);

/**
 * PUT /user-preferences
 * Update current user preferences
 * Authorization: All authenticated users (own preferences only)
 */
router.put(
  '/',
  validate(updateUserPreferenceSchema),
  userPreferenceController.updateUserPreferences.bind(userPreferenceController)
);

/**
 * POST /user-preferences/reset
 * Reset current user preferences to defaults
 * Authorization: All authenticated users (own preferences only)
 */
router.post(
  '/reset',
  userPreferenceController.resetUserPreferences.bind(userPreferenceController)
);

export default router;

