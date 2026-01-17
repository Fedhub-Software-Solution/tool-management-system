import userPreferenceRepository from '../repositories/user-preference.repository';
import { UpdateUserPreferenceDto, UserPreferenceResponse } from '../types/user-preference.types';

export class UserPreferenceService {
  /**
   * Get user preferences (creates default if not exists)
   */
  async getUserPreferences(userId: string): Promise<UserPreferenceResponse> {
    const preference = await userPreferenceRepository.findByUserId(userId);
    return this.mapToUserPreferenceResponse(preference);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, data: UpdateUserPreferenceDto): Promise<UserPreferenceResponse> {
    const preference = await userPreferenceRepository.update(userId, data);
    return this.mapToUserPreferenceResponse(preference);
  }

  /**
   * Reset user preferences to defaults
   */
  async resetUserPreferencesToDefaults(userId: string): Promise<UserPreferenceResponse> {
    const preference = await userPreferenceRepository.resetToDefaults(userId);
    return this.mapToUserPreferenceResponse(preference);
  }

  /**
   * Map UserPreference entity to UserPreferenceResponse
   */
  private mapToUserPreferenceResponse(preference: any): UserPreferenceResponse {
    return {
      id: preference.id,
      userId: preference.userId,
      emailNotifications: preference.emailNotifications,
      newPrCreation: preference.newPrCreation,
      quotationUpdates: preference.quotationUpdates,
      approvalRequests: preference.approvalRequests,
      lowStockAlerts: preference.lowStockAlerts,
      compactView: preference.compactView,
      showCurrencyAsINR: preference.showCurrencyAsINR,
      autoRefreshDashboard: preference.autoRefreshDashboard,
      createdAt: preference.createdAt.toISOString(),
      updatedAt: preference.updatedAt.toISOString(),
    };
  }
}

export default new UserPreferenceService();

