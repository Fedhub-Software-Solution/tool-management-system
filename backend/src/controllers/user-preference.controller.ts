import { Request, Response, NextFunction } from 'express';
import userPreferenceService from '../services/user-preference.service';
import { AuthenticatedRequest } from '../types/common.types';
import { UpdateUserPreferenceDto } from '../types/user-preference.types';

export class UserPreferenceController {
  /**
   * GET /user-preferences
   * Get current user preferences
   */
  async getUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const preferences = await userPreferenceService.getUserPreferences(userId);

      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /user-preferences
   * Update current user preferences
   */
  async updateUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const preferenceData = req.body as UpdateUserPreferenceDto;
      const preferences = await userPreferenceService.updateUserPreferences(userId, preferenceData);

      res.json({
        success: true,
        data: preferences,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /user-preferences/reset
   * Reset current user preferences to defaults
   */
  async resetUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const preferences = await userPreferenceService.resetUserPreferencesToDefaults(userId);

      res.json({
        success: true,
        data: preferences,
        message: 'Preferences reset to defaults successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserPreferenceController();

