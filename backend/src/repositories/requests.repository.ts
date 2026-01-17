import { Prisma, RequestStatus } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import {
  RequestFilters,
  SparesRequestResponse,
} from '../types/request.types';
import { PAGINATION } from '../utils/constants';

export class RequestsRepository {
  /**
   * Find request by ID with all relations
   */
  async findById(id: string): Promise<SparesRequestResponse | null> {
    const request = await prisma.sparesRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            partNumber: true,
            toolNumber: true,
            itemCode: true,
            currentStock: true,
            minStockLevel: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        fulfiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    if (!request) {
      return null;
    }

    return this.mapToRequestResponse(request);
  }

  /**
   * Find request by request number
   */
  async findByRequestNumber(
    requestNumber: string,
  ): Promise<SparesRequestResponse | null> {
    const request = await prisma.sparesRequest.findUnique({
      where: { requestNumber },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            partNumber: true,
            toolNumber: true,
            itemCode: true,
            currentStock: true,
            minStockLevel: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        fulfiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    if (!request) {
      return null;
    }

    return this.mapToRequestResponse(request);
  }

  /**
   * Find all requests with filtering and pagination
   */
  async findAll(filters: RequestFilters): Promise<{
    data: SparesRequestResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      requestedBy,
      inventoryItemId,
      projectId,
      search,
      sortBy = 'requestDate',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, PAGINATION.MAX_LIMIT);

    // Build where clause
    const where: Prisma.SparesRequestWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (requestedBy) {
      where.requestedBy = requestedBy;
    }

    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { itemName: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { toolNumber: { contains: search, mode: 'insensitive' } },
        {
          inventoryItem: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.SparesRequestOrderByWithRelationInput = {};
    if (sortBy === 'requestNumber') {
      orderBy.requestNumber = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else if (sortBy === 'requestDate') {
      orderBy.requestDate = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get total count
    const total = await prisma.sparesRequest.count({ where });

    // Get requests
    const requests = await prisma.sparesRequest.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            partNumber: true,
            toolNumber: true,
            itemCode: true,
            currentStock: true,
            minStockLevel: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        fulfiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    const data = requests.map((request) => this.mapToRequestResponse(request));

    return {
      data,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Create new request
   */
  async create(
    data: {
      requestNumber: string;
      requestedBy: string;
      inventoryItemId: string;
      quantityRequested: number;
      projectId?: string;
      purpose?: string;
    },
  ): Promise<SparesRequestResponse> {
    // Get inventory item details
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
    });

    if (!inventoryItem) {
      throw new NotFoundError('Inventory item not found');
    }

    const request = await prisma.sparesRequest.create({
      data: {
        requestNumber: data.requestNumber,
        requestedBy: data.requestedBy,
        inventoryItemId: data.inventoryItemId,
        itemName: inventoryItem.name,
        partNumber: inventoryItem.partNumber,
        toolNumber: inventoryItem.toolNumber,
        quantityRequested: data.quantityRequested,
        quantityFulfilled: 0,
        status: RequestStatus.Pending,
        projectId: data.projectId,
        purpose: data.purpose,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            partNumber: true,
            toolNumber: true,
            itemCode: true,
            currentStock: true,
            minStockLevel: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        fulfiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    return this.mapToRequestResponse(request);
  }

  /**
   * Fulfill request
   */
  async fulfill(
    id: string,
    data: {
      quantityFulfilled: number;
      fulfilledBy: string;
      notes?: string;
    },
  ): Promise<SparesRequestResponse> {
    // Get current request
    const currentRequest = await prisma.sparesRequest.findUnique({
      where: { id },
    });

    if (!currentRequest) {
      throw new NotFoundError('Request not found');
    }

    const newQuantityFulfilled =
      currentRequest.quantityFulfilled + data.quantityFulfilled;
    const quantityRemaining =
      currentRequest.quantityRequested - newQuantityFulfilled;

    let newStatus: RequestStatus;
    if (quantityRemaining <= 0) {
      newStatus = RequestStatus.Fulfilled;
    } else {
      newStatus = RequestStatus.PartiallyFulfilled;
    }

    const request = await prisma.sparesRequest.update({
      where: { id },
      data: {
        quantityFulfilled: newQuantityFulfilled,
        status: newStatus,
        fulfilledBy: data.fulfilledBy,
        fulfilledAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            partNumber: true,
            toolNumber: true,
            itemCode: true,
            currentStock: true,
            minStockLevel: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        fulfiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    return this.mapToRequestResponse(request);
  }

  /**
   * Reject request
   */
  async reject(
    id: string,
    data: {
      rejectionReason: string;
    },
  ): Promise<SparesRequestResponse> {
    const request = await prisma.sparesRequest.update({
      where: { id },
      data: {
        status: RequestStatus.Rejected,
        rejectionReason: data.rejectionReason,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            partNumber: true,
            toolNumber: true,
            itemCode: true,
            currentStock: true,
            minStockLevel: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        fulfiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    return this.mapToRequestResponse(request);
  }

  /**
   * Get latest request number for sequence generation
   */
  async getLatestRequestNumber(): Promise<string | null> {
    const latest = await prisma.sparesRequest.findFirst({
      orderBy: {
        requestNumber: 'desc',
      },
      select: {
        requestNumber: true,
      },
    });

    return latest?.requestNumber || null;
  }

  /**
   * Map Prisma request to RequestResponse
   */
  private mapToRequestResponse(request: any): SparesRequestResponse {
    return {
      id: request.id,
      requestNumber: request.requestNumber,
      requestedBy: request.requestedBy,
      requester: request.requester,
      inventoryItemId: request.inventoryItemId,
      inventoryItem: request.inventoryItem,
      itemName: request.itemName,
      partNumber: request.partNumber,
      toolNumber: request.toolNumber,
      quantityRequested: request.quantityRequested,
      quantityFulfilled: request.quantityFulfilled,
      status: request.status,
      requestDate: request.requestDate,
      projectId: request.projectId,
      project: request.project,
      purpose: request.purpose,
      fulfilledAt: request.fulfilledAt,
      fulfilledBy: request.fulfilledBy,
      fulfiller: request.fulfiller,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}

export const requestsRepository = new RequestsRepository();

