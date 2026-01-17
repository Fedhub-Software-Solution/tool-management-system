import { RequestStatus } from '@prisma/client';
import { requestsRepository } from '../repositories/requests.repository';
import { inventoryService } from './inventory.service';
import { notificationsService } from './notifications.service';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../utils/errors';
import {
  CreateSparesRequestDto,
  FulfillRequestDto,
  RejectRequestDto,
  RequestFilters,
  SparesRequestResponse,
} from '../types/request.types';
import { generateRequestNumber } from '../utils/request-number';

export class RequestsService {
  /**
   * Get request by ID
   */
  async getRequestById(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<SparesRequestResponse> {
    const request = await requestsRepository.findById(id);

    if (!request) {
      throw new NotFoundError('Request not found');
    }

    // Indentor can only view their own requests
    if (userRole === 'Indentor' && request.requestedBy !== userId) {
      throw new ForbiddenError('You can only view your own requests');
    }

    return request;
  }

  /**
   * Get all requests with filtering and pagination
   */
  async getAllRequests(
    filters: RequestFilters,
    userId: string,
    userRole: string,
  ): Promise<{
    data: SparesRequestResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    // Indentor can only see their own requests
    if (userRole === 'Indentor') {
      filters.requestedBy = userId;
    }

    const result = await requestsRepository.findAll(filters);

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Create new request
   */
  async createRequest(
    data: CreateSparesRequestDto,
    userId: string,
  ): Promise<SparesRequestResponse> {
    // Validate inventory item exists
    const inventoryItem = await inventoryService.getInventoryItemById(
      data.inventoryItemId,
    );

    // Generate request number
    const requestNumber = await generateRequestNumber();

    // Create request
    const request = await requestsRepository.create({
      requestNumber,
      requestedBy: userId,
      inventoryItemId: data.inventoryItemId,
      quantityRequested: data.quantityRequested,
      projectId: data.projectId,
      purpose: data.purpose,
    });

    // Notify Spares
    await notificationsService.notifyRequestCreated(
      request.id,
      request.requestNumber,
      request.itemName,
    );

    return request;
  }

  /**
   * Fulfill request
   */
  async fulfillRequest(
    id: string,
    data: FulfillRequestDto,
    userId: string,
  ): Promise<SparesRequestResponse> {
    const request = await requestsRepository.findById(id);

    if (!request) {
      throw new NotFoundError('Request not found');
    }

    // Validate status
    if (request.status === RequestStatus.Fulfilled) {
      throw new BadRequestError('Request is already fulfilled');
    }

    if (request.status === RequestStatus.Rejected) {
      throw new BadRequestError('Cannot fulfill a rejected request');
    }

    // Validate quantity
    if (data.quantityFulfilled <= 0) {
      throw new BadRequestError('Quantity fulfilled must be positive');
    }

    const remainingQuantity =
      request.quantityRequested - request.quantityFulfilled;

    if (data.quantityFulfilled > remainingQuantity) {
      throw new BadRequestError(
        `Cannot fulfill more than ${remainingQuantity} items (remaining quantity)`,
      );
    }

    // Check inventory availability
    const inventoryItem = await inventoryService.getInventoryItemById(
      request.inventoryItemId,
    );

    if (inventoryItem.currentStock < data.quantityFulfilled) {
      throw new BadRequestError(
        `Insufficient stock. Available: ${inventoryItem.currentStock}, Requested: ${data.quantityFulfilled}`,
      );
    }

    // Remove stock from inventory
    await inventoryService.removeStockForRequest(
      request.inventoryItemId,
      data.quantityFulfilled,
      request.id,
      userId,
      request.purpose || undefined,
    );

    // Fulfill request
    const fulfilledRequest = await requestsRepository.fulfill(id, {
      quantityFulfilled: data.quantityFulfilled,
      fulfilledBy: userId,
      notes: data.notes,
    });

    return fulfilledRequest;
  }

  /**
   * Reject request
   */
  async rejectRequest(
    id: string,
    data: RejectRequestDto,
    userId: string,
  ): Promise<SparesRequestResponse> {
    const request = await requestsRepository.findById(id);

    if (!request) {
      throw new NotFoundError('Request not found');
    }

    // Validate status
    if (request.status === RequestStatus.Fulfilled) {
      throw new BadRequestError('Cannot reject a fulfilled request');
    }

    if (request.status === RequestStatus.Rejected) {
      throw new BadRequestError('Request is already rejected');
    }

    // Validate rejection reason
    if (!data.rejectionReason || data.rejectionReason.trim().length === 0) {
      throw new BadRequestError('Rejection reason is required');
    }

    // Reject request
    const rejectedRequest = await requestsRepository.reject(id, {
      rejectionReason: data.rejectionReason,
    });

    return rejectedRequest;
  }
}

export const requestsService = new RequestsService();

