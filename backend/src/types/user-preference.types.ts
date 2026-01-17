export interface UserPreferenceResponse {
  id: string;
  userId: string;
  emailNotifications: boolean;
  newPrCreation: boolean;
  quotationUpdates: boolean;
  approvalRequests: boolean;
  lowStockAlerts: boolean;
  compactView: boolean;
  showCurrencyAsINR: boolean;
  autoRefreshDashboard: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserPreferenceDto {
  emailNotifications?: boolean;
  newPrCreation?: boolean;
  quotationUpdates?: boolean;
  approvalRequests?: boolean;
  lowStockAlerts?: boolean;
  compactView?: boolean;
  showCurrencyAsINR?: boolean;
  autoRefreshDashboard?: boolean;
}

