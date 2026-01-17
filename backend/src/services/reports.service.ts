import prisma from '../config/database';
import { PRStatus, PRType, ProjectStatus, InventoryStatus, RequestStatus, HandoverStatus } from '@prisma/client';
import { DashboardStats, PRSummaryReport, InventorySummaryReport, ProjectSummaryReport, ReportFilters } from '../types/reports.types';

export class ReportsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userRole: string, filters?: ReportFilters): Promise<DashboardStats> {
    const dateFilter = this.buildDateFilter(filters);

    // Projects stats
    const projectsWhere: any = dateFilter;
    const projects = await prisma.project.groupBy({
      by: ['status'],
      where: projectsWhere,
      _count: true,
    });

    const projectsTotal = await prisma.project.count({ where: projectsWhere });
    const projectsByStatus = projects.reduce((acc, p) => {
      acc[p.status] = p._count;
      return acc;
    }, {} as Record<string, number>);

    // PRs stats
    const prsWhere: any = dateFilter;
    const prs = await prisma.purchaseRequisition.groupBy({
      by: ['status', 'prType'],
      where: prsWhere,
      _count: true,
    });

    const prsTotal = await prisma.purchaseRequisition.count({ where: prsWhere });
    const prsByStatus = prs.reduce((acc, p) => {
      if (!acc[p.status]) acc[p.status] = 0;
      acc[p.status] += p._count;
      return acc;
    }, {} as Record<string, number>);

    const prsByType = prs.reduce((acc, p) => {
      if (!acc[p.prType]) acc[p.prType] = 0;
      acc[p.prType] += p._count;
      return acc;
    }, {} as Record<string, number>);

    // Inventory stats
    const inventoryItems = await prisma.inventoryItem.groupBy({
      by: ['status'],
      _count: true,
    });

    const inventoryTotal = await prisma.inventoryItem.count();
    const inventoryByStatus = inventoryItems.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Requests stats
    const requestsWhere: any = dateFilter;
    const requests = await prisma.sparesRequest.groupBy({
      by: ['status'],
      where: requestsWhere,
      _count: true,
    });

    const requestsTotal = await prisma.sparesRequest.count({ where: requestsWhere });
    const requestsByStatus = requests.reduce((acc, r) => {
      acc[r.status] = r._count;
      return acc;
    }, {} as Record<string, number>);

    // Handovers stats
    const handoversWhere: any = dateFilter;
    const handovers = await prisma.toolHandover.groupBy({
      by: ['status'],
      where: handoversWhere,
      _count: true,
    });

    const handoversTotal = await prisma.toolHandover.count({ where: handoversWhere });
    const handoversByStatus = handovers.reduce((acc, h) => {
      acc[h.status] = h._count;
      return acc;
    }, {} as Record<string, number>);

    // Suppliers stats
    const suppliers = await prisma.supplier.groupBy({
      by: ['status'],
      _count: true,
    });

    const suppliersTotal = await prisma.supplier.count();
    const suppliersByStatus = suppliers.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      projects: {
        total: projectsTotal,
        active: projectsByStatus[ProjectStatus.Active] || 0,
        completed: projectsByStatus[ProjectStatus.Completed] || 0,
        cancelled: projectsByStatus[ProjectStatus.Cancelled] || 0,
        onHold: projectsByStatus[ProjectStatus.OnHold] || 0,
      },
      prs: {
        total: prsTotal,
        pendingApproval: prsByStatus[PRStatus.Submitted] || 0,
        approved: prsByStatus[PRStatus.Approved] || 0,
        sentToSupplier: prsByStatus[PRStatus.SentToSupplier] || 0,
        evaluationPending: prsByStatus[PRStatus.EvaluationPending] || 0,
        submittedForApproval: prsByStatus[PRStatus.SubmittedForApproval] || 0,
        awarded: prsByStatus[PRStatus.Awarded] || 0,
        itemsReceived: prsByStatus[PRStatus.ItemsReceived] || 0,
        rejected: prsByStatus[PRStatus.Rejected] || 0,
        byType: {
          newSet: prsByType[PRType.NewSet] || 0,
          modification: prsByType[PRType.Modification] || 0,
          refurbished: prsByType[PRType.Refurbished] || 0,
        },
      },
      inventory: {
        totalItems: inventoryTotal,
        inStock: inventoryByStatus[InventoryStatus.InStock] || 0,
        lowStock: inventoryByStatus[InventoryStatus.LowStock] || 0,
        outOfStock: inventoryByStatus[InventoryStatus.OutOfStock] || 0,
      },
      requests: {
        total: requestsTotal,
        pending: requestsByStatus[RequestStatus.Pending] || 0,
        fulfilled: requestsByStatus[RequestStatus.Fulfilled] || 0,
        partiallyFulfilled: requestsByStatus[RequestStatus.PartiallyFulfilled] || 0,
        rejected: requestsByStatus[RequestStatus.Rejected] || 0,
      },
      handovers: {
        total: handoversTotal,
        pendingInspection: handoversByStatus[HandoverStatus.PendingInspection] || 0,
        approved: handoversByStatus[HandoverStatus.Approved] || 0,
        rejected: handoversByStatus[HandoverStatus.Rejected] || 0,
      },
      suppliers: {
        total: suppliersTotal,
        active: suppliersByStatus['Active'] || 0,
        inactive: suppliersByStatus['Inactive'] || 0,
      },
    };
  }

  /**
   * Get PR summary report
   */
  async getPRSummaryReport(filters?: ReportFilters): Promise<PRSummaryReport> {
    const dateFilter = this.buildDateFilter(filters);
    const where: any = dateFilter;

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    const prs = await prisma.purchaseRequisition.findMany({
      where,
      include: {
        prItems: true,
      },
    });

    const total = prs.length;
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    let totalValue = 0;

    prs.forEach((pr) => {
      // Count by status
      byStatus[pr.status] = (byStatus[pr.status] || 0) + 1;

      // Count by type
      byType[pr.prType] = (byType[pr.prType] || 0) + 1;

      // Calculate total value from PR items
      const prValue = pr.prItems.reduce((sum, item) => {
        return sum + (item.bomUnitPrice || 0) * item.quantity;
      }, 0);
      totalValue += prValue;
    });

    const averageValue = total > 0 ? totalValue / total : 0;

    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = filters?.endDate
      ? new Date(filters.endDate)
      : new Date();

    return {
      total,
      byStatus,
      byType,
      totalValue,
      averageValue,
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Get inventory summary report
   */
  async getInventorySummaryReport(): Promise<InventorySummaryReport> {
    const items = await prisma.inventoryItem.findMany();
    const transactions = await prisma.stockTransaction.findMany({
      where: {
        transactionDate: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    const totalItems = items.length;
    const byStatus: Record<string, number> = {};
    let totalStockValue = 0;

    items.forEach((item) => {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      // Note: Stock value calculation would need unit price, which isn't in inventory
      // This is a placeholder
    });

    const lowStockItems = items.filter(
      (item) => item.status === InventoryStatus.LowStock,
    ).length;
    const outOfStockItems = items.filter(
      (item) => item.status === InventoryStatus.OutOfStock,
    ).length;

    return {
      totalItems,
      byStatus,
      totalStockValue,
      lowStockItems,
      outOfStockItems,
      recentTransactions: transactions.length,
    };
  }

  /**
   * Get project summary report
   */
  async getProjectSummaryReport(filters?: ReportFilters): Promise<ProjectSummaryReport> {
    const dateFilter = this.buildDateFilter(filters);
    const where: any = dateFilter;

    if (filters?.status) {
      where.status = filters.status;
    }

    const projects = await prisma.project.findMany({
      where,
    });

    const total = projects.length;
    const byStatus: Record<string, number> = {};
    let totalBudget = 0;

    projects.forEach((project) => {
      byStatus[project.status] = (byStatus[project.status] || 0) + 1;
      totalBudget += project.price || 0;
    });

    const averageBudget = total > 0 ? totalBudget / total : 0;

    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = filters?.endDate
      ? new Date(filters.endDate)
      : new Date();

    return {
      total,
      byStatus,
      totalBudget,
      averageBudget,
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Build date filter for queries
   */
  private buildDateFilter(filters?: ReportFilters): any {
    if (!filters) {
      return {};
    }

    const dateFilter: any = {};

    if (filters.startDate && filters.endDate) {
      dateFilter.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters.dateFilter === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter.createdAt = {
        gte: startOfMonth,
      };
    } else if (filters.dateFilter === 'year') {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      dateFilter.createdAt = {
        gte: startOfYear,
      };
    }

    return dateFilter;
  }
}

export const reportsService = new ReportsService();

