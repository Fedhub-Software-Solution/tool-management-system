export interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    onHold: number;
  };
  prs: {
    total: number;
    pendingApproval: number;
    approved: number;
    sentToSupplier: number;
    evaluationPending: number;
    submittedForApproval: number;
    awarded: number;
    itemsReceived: number;
    rejected: number;
    byType: {
      newSet: number;
      modification: number;
      refurbished: number;
    };
  };
  inventory: {
    totalItems: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalStockValue?: number;
  };
  requests: {
    total: number;
    pending: number;
    fulfilled: number;
    partiallyFulfilled: number;
    rejected: number;
  };
  handovers: {
    total: number;
    pendingInspection: number;
    approved: number;
    rejected: number;
  };
  suppliers: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface PRSummaryReport {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalValue: number;
  averageValue: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface InventorySummaryReport {
  totalItems: number;
  byStatus: Record<string, number>;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentTransactions: number;
}

export interface ProjectSummaryReport {
  total: number;
  byStatus: Record<string, number>;
  totalBudget: number;
  averageBudget: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  dateFilter?: 'month' | 'year' | 'custom';
  projectId?: string;
  status?: string;
}

