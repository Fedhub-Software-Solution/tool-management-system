import { Response } from 'express';
import { reportsService } from '../services/reports.service';
import { AuthenticatedRequest } from '../types/common.types';
import { ReportFilters } from '../types/reports.types';

export class ReportsController {
  /**
   * GET /api/reports/dashboard
   * Get dashboard statistics
   */
  async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    const filters: ReportFilters = {
      dateFilter: req.query.dateFilter as 'month' | 'year' | 'custom' | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };

    const userRole = req.user!.role;
    const stats = await reportsService.getDashboardStats(userRole, filters);

    res.json({
      success: true,
      data: stats,
    });
  }

  /**
   * GET /api/reports/pr-summary
   * Get PR summary report
   */
  async getPRSummaryReport(req: AuthenticatedRequest, res: Response) {
    const filters: ReportFilters = {
      dateFilter: req.query.dateFilter as 'month' | 'year' | 'custom' | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      status: req.query.status as string | undefined,
      projectId: req.query.projectId as string | undefined,
    };

    const report = await reportsService.getPRSummaryReport(filters);

    res.json({
      success: true,
      data: report,
    });
  }

  /**
   * GET /api/reports/inventory
   * Get inventory summary report
   */
  async getInventorySummaryReport(req: AuthenticatedRequest, res: Response) {
    const report = await reportsService.getInventorySummaryReport();

    res.json({
      success: true,
      data: report,
    });
  }

  /**
   * GET /api/reports/projects
   * Get project summary report
   */
  async getProjectSummaryReport(req: AuthenticatedRequest, res: Response) {
    const filters: ReportFilters = {
      dateFilter: req.query.dateFilter as 'month' | 'year' | 'custom' | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      status: req.query.status as string | undefined,
    };

    const report = await reportsService.getProjectSummaryReport(filters);

    res.json({
      success: true,
      data: report,
    });
  }
}

export const reportsController = new ReportsController();

