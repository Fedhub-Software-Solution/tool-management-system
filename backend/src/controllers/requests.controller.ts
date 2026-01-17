import { Response } from 'express';
import { requestsService } from '../services/requests.service';
import { AuthenticatedRequest } from '../types/common.types';
import {
  CreateSparesRequestDto,
  FulfillRequestDto,
  RejectRequestDto,
} from '../types/request.types';

export class RequestsController {
  /**
   * GET /api/requests
   * Get all requests with filtering and pagination
   */
  async getAllRequests(req: AuthenticatedRequest, res: Response) {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
      status: req.query.status as any,
      requestedBy: req.query.requestedBy as string | undefined,
      inventoryItemId: req.query.inventoryItemId as string | undefined,
      projectId: req.query.projectId as string | undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const userId = req.user!.id;
    const userRole = req.user!.role;

    const result = await requestsService.getAllRequests(
      filters,
      userId,
      userRole,
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }

  /**
   * GET /api/requests/:id
   * Get request by ID
   */
  async getRequestById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const request = await requestsService.getRequestById(id, userId, userRole);

    res.json({
      success: true,
      data: request,
    });
  }

  /**
   * POST /api/requests
   * Create new request (Indentor only)
   */
  async createRequest(req: AuthenticatedRequest, res: Response) {
    const data = req.body as CreateSparesRequestDto;
    const userId = req.user!.id;

    const request = await requestsService.createRequest(data, userId);

    res.status(201).json({
      success: true,
      data: request,
      message: 'Spares request created successfully',
    });
  }

  /**
   * POST /api/requests/:id/fulfill
   * Fulfill request (Spares only)
   */
  async fulfillRequest(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = req.body as FulfillRequestDto;
    const userId = req.user!.id;

    const request = await requestsService.fulfillRequest(id, data, userId);

    res.json({
      success: true,
      data: request,
      message: 'Request fulfilled successfully',
    });
  }

  /**
   * POST /api/requests/:id/reject
   * Reject request (Spares only)
   */
  async rejectRequest(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = req.body as RejectRequestDto;
    const userId = req.user!.id;

    const request = await requestsService.rejectRequest(id, data, userId);

    res.json({
      success: true,
      data: request,
      message: 'Request rejected',
    });
  }
}

export const requestsController = new RequestsController();

