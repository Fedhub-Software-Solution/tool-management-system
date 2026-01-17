import { Request, Response } from 'express';
import { handoversService } from '../services/handovers.service';
import { AuthenticatedRequest } from '../types/common.types';
import {
  CreateHandoverDto,
  ApproveHandoverDto,
  RejectHandoverDto,
} from '../types/handover.types';

export class HandoversController {
  /**
   * GET /api/handovers
   * Get all handovers with filtering and pagination
   */
  async getAllHandovers(req: AuthenticatedRequest, res: Response) {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
      projectId: req.query.projectId as string | undefined,
      prId: req.query.prId as string | undefined,
      status: req.query.status as any,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await handoversService.getAllHandovers(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }

  /**
   * GET /api/handovers/:id
   * Get handover by ID
   */
  async getHandoverById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    const handover = await handoversService.getHandoverById(id);

    res.json({
      success: true,
      data: handover,
    });
  }

  /**
   * POST /api/handovers
   * Create new handover (NPD only)
   */
  async createHandover(req: AuthenticatedRequest, res: Response) {
    const data = req.body as CreateHandoverDto;
    const userId = req.user!.id;

    const handover = await handoversService.createHandover(data, userId);

    res.status(201).json({
      success: true,
      data: handover,
      message: 'Tool handover created successfully',
    });
  }

  /**
   * POST /api/handovers/:id/approve
   * Approve handover (Maintenance only)
   */
  async approveHandover(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = req.body as ApproveHandoverDto;
    const userId = req.user!.id;

    const handover = await handoversService.approveHandover(id, data, userId);

    res.json({
      success: true,
      data: handover,
      message: 'Handover approved. Inventory will be updated.',
    });
  }

  /**
   * POST /api/handovers/:id/reject
   * Reject handover (Maintenance only)
   */
  async rejectHandover(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = req.body as RejectHandoverDto;
    const userId = req.user!.id;

    const handover = await handoversService.rejectHandover(id, data, userId);

    res.json({
      success: true,
      data: handover,
      message: 'Handover rejected',
    });
  }
}

export const handoversController = new HandoversController();

