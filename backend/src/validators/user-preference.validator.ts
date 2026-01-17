import { z } from 'zod';

export const updateUserPreferenceSchema = z.object({
  emailNotifications: z.boolean().optional(),
  newPrCreation: z.boolean().optional(),
  quotationUpdates: z.boolean().optional(),
  approvalRequests: z.boolean().optional(),
  lowStockAlerts: z.boolean().optional(),
  compactView: z.boolean().optional(),
  showCurrencyAsINR: z.boolean().optional(),
  autoRefreshDashboard: z.boolean().optional(),
});

