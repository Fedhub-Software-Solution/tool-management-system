import { Request, Response, NextFunction } from 'express';
import prsService from '../services/prs.service';
import {
  CreatePRDto,
  UpdatePRDto,
  PRFilters,
  ApprovePRDto,
  RejectPRDto,
} from '../types/pr.types';

export class PRsController {
  /**
   * GET /prs
   * Get all PRs with filtering and pagination
   */
  async getAllPRs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: PRFilters = {
        status: req.query.status as any,
        prType: req.query.prType as any,
        projectId: req.query.projectId as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await prsService.getAllPRs(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /prs/:id
   * Get PR by ID
   */
  async getPRById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const pr = await prsService.getPRById(id);

      res.json({
        success: true,
        data: pr,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /prs
   * Create new PR (NPD only)
   */
  async createPR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prData = req.body as CreatePRDto;
      const userId = (req as any).user.id;

      const pr = await prsService.createPR(prData, userId);

      res.status(201).json({
        success: true,
        data: pr,
        message: 'PR created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /prs/:id
   * Update PR (NPD only, before approval)
   */
  async updatePR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const prData = req.body as UpdatePRDto;
      const userId = (req as any).user.id;

      const pr = await prsService.updatePR(id, prData, userId);

      res.json({
        success: true,
        data: pr,
        message: 'PR updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /prs/:id/approve
   * Approve PR (Approver only)
   */
  async approvePR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const approveData = req.body as ApprovePRDto;
      const userId = (req as any).user.id;

      const pr = await prsService.approvePR(id, approveData, userId);

      res.json({
        success: true,
        data: pr,
        message: 'PR approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /prs/:id/reject
   * Reject PR (Approver only)
   */
  async rejectPR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const rejectData = req.body as RejectPRDto;
      const userId = (req as any).user.id;

      const pr = await prsService.rejectPR(id, rejectData, userId);

      res.json({
        success: true,
        data: pr,
        message: 'PR rejected successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /prs/:id/send-to-suppliers
   * Send PR to suppliers (NPD only)
   */
  async sendToSuppliers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const pr = await prsService.sendToSuppliers(id, userId);

      res.json({
        success: true,
        data: pr,
        message: 'PR sent to suppliers successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /prs/:id
   * Delete PR (NPD only, only if Submitted)
   */
  async deletePR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await prsService.deletePR(id);

      res.json({
        success: true,
        message: 'PR deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /prs/:id/award
   * Award PR to a supplier (NPD only)
   */
  async awardPR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { quotationId, supplierId } = req.body;
      const userId = (req as any).user.id;

      const pr = await prsService.awardPR(id, supplierId, quotationId, userId);

      res.json({
        success: true,
        data: pr,
        message: 'PR awarded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PRsController();

