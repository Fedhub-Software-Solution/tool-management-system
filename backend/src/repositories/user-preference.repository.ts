import prisma from '../config/database';
import { UpdateUserPreferenceDto } from '../types/user-preference.types';

export class UserPreferenceRepository {
  async findByUserId(userId: string) {
    let preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    // If no preference exists, create default preference
    if (!preference) {
      preference = await prisma.userPreference.create({
        data: {
          userId,
        },
      });
    }

    return preference;
  }

  async update(userId: string, data: UpdateUserPreferenceDto) {
    // First ensure preference exists
    const existing = await this.findByUserId(userId);

    return prisma.userPreference.update({
      where: { userId },
      data: {
        ...(data.emailNotifications !== undefined && { emailNotifications: data.emailNotifications }),
        ...(data.newPrCreation !== undefined && { newPrCreation: data.newPrCreation }),
        ...(data.quotationUpdates !== undefined && { quotationUpdates: data.quotationUpdates }),
        ...(data.approvalRequests !== undefined && { approvalRequests: data.approvalRequests }),
        ...(data.lowStockAlerts !== undefined && { lowStockAlerts: data.lowStockAlerts }),
        ...(data.compactView !== undefined && { compactView: data.compactView }),
        ...(data.showCurrencyAsINR !== undefined && { showCurrencyAsINR: data.showCurrencyAsINR }),
        ...(data.autoRefreshDashboard !== undefined && { autoRefreshDashboard: data.autoRefreshDashboard }),
      },
    });
  }

  async resetToDefaults(userId: string) {
    return prisma.userPreference.update({
      where: { userId },
      data: {
        emailNotifications: true,
        newPrCreation: true,
        quotationUpdates: true,
        approvalRequests: true,
        lowStockAlerts: true,
        compactView: true,
        showCurrencyAsINR: true,
        autoRefreshDashboard: true,
      },
    });
  }
}

export default new UserPreferenceRepository();

