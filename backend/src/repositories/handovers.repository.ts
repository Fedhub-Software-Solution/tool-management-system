import { Prisma, HandoverStatus } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { HandoverFilters, HandoverResponse } from '../types/handover.types';

export class HandoversRepository {
  /**
   * Find handover by ID with all relations
   */
  async findById(id: string): Promise<HandoverResponse | null> {
    const handover = await prisma.toolHandover.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        pr: {
          select: {
            id: true,
            prNumber: true,
            prType: true,
            status: true,
          },
        },
        initiator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        handoverItems: {
          include: {
            prItem: true,
          },
        },
      },
    });

    if (!handover) {
      return null;
    }

    return this.mapToHandoverResponse(handover);
  }

  /**
   * Find handover by handover number
   */
  async findByHandoverNumber(
    handoverNumber: string,
  ): Promise<HandoverResponse | null> {
    const handover = await prisma.toolHandover.findUnique({
      where: { handoverNumber },
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        pr: {
          select: {
            id: true,
            prNumber: true,
            prType: true,
            status: true,
          },
        },
        initiator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        handoverItems: {
          include: {
            prItem: true,
          },
        },
      },
    });

    if (!handover) {
      return null;
    }

    return this.mapToHandoverResponse(handover);
  }

  /**
   * Find all handovers with filtering and pagination
   */
  async findAll(filters: HandoverFilters): Promise<{
    data: HandoverResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      projectId,
      prId,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ToolHandoverWhereInput = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (prId) {
      where.prId = prId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { handoverNumber: { contains: search, mode: 'insensitive' } },
        { toolSetDescription: { contains: search, mode: 'insensitive' } },
        {
          project: {
            OR: [
              { projectNumber: { contains: search, mode: 'insensitive' } },
              { customerPO: { contains: search, mode: 'insensitive' } },
              { partNumber: { contains: search, mode: 'insensitive' } },
              { toolNumber: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          pr: {
            prNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.ToolHandoverOrderByWithRelationInput = {};
    if (sortBy === 'handoverNumber') {
      orderBy.handoverNumber = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else if (sortBy === 'initiatedAt') {
      orderBy.initiatedAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get total count
    const total = await prisma.toolHandover.count({ where });

    // Get handovers
    const handovers = await prisma.toolHandover.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        pr: {
          select: {
            id: true,
            prNumber: true,
            prType: true,
            status: true,
          },
        },
        initiator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        handoverItems: {
          include: {
            prItem: true,
          },
        },
      },
    });

    const data = handovers.map((handover) =>
      this.mapToHandoverResponse(handover),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create new handover with items
   */
  async create(
    data: {
      handoverNumber: string;
      projectId: string;
      prId: string;
      toolSetDescription: string;
      initiatedBy: string;
      items: Array<{
        prItemId: string;
        receivedQuantity: number;
        isCriticalSpare: boolean;
      }>;
    },
  ): Promise<HandoverResponse> {
    // First, fetch all PR items to get their details
    const prItems = await prisma.pRItem.findMany({
      where: {
        id: {
          in: data.items.map((item) => item.prItemId),
        },
      },
    });

    // Create a map of PR item ID to PR item details
    const prItemMap = new Map(prItems.map((item) => [item.id, item]));

    // Create handover with items
    const handover = await prisma.toolHandover.create({
      data: {
        handoverNumber: data.handoverNumber,
        projectId: data.projectId,
        prId: data.prId,
        toolSetDescription: data.toolSetDescription,
        initiatedBy: data.initiatedBy,
        status: HandoverStatus.PendingInspection,
        handoverItems: {
          create: data.items.map((item) => {
            const prItem = prItemMap.get(item.prItemId);
            if (!prItem) {
              throw new NotFoundError(`PR Item ${item.prItemId} not found`);
            }
            return {
              prItemId: item.prItemId,
              receivedQuantity: item.receivedQuantity,
              isCriticalSpare: item.isCriticalSpare,
              itemName: prItem.name,
              specification: prItem.specification,
              quantity: prItem.quantity,
              requirements: prItem.requirements,
            };
          }),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        pr: {
          select: {
            id: true,
            prNumber: true,
            prType: true,
            status: true,
          },
        },
        initiator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        handoverItems: {
          include: {
            prItem: true,
          },
        },
      },
    });

    return this.mapToHandoverResponse(handover);
  }

  /**
   * Approve handover
   */
  async approve(
    id: string,
    data: {
      inspectedBy: string;
      remarks?: string;
    },
  ): Promise<HandoverResponse> {
    const handover = await prisma.toolHandover.update({
      where: { id },
      data: {
        status: HandoverStatus.Approved,
        inspectedBy: data.inspectedBy,
        inspectionDate: new Date(),
        completedAt: new Date(),
        remarks: data.remarks || null,
      },
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        pr: {
          select: {
            id: true,
            prNumber: true,
            prType: true,
            status: true,
          },
        },
        initiator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        handoverItems: {
          include: {
            prItem: true,
          },
        },
      },
    });

    return this.mapToHandoverResponse(handover);
  }

  /**
   * Reject handover
   */
  async reject(
    id: string,
    data: {
      inspectedBy: string;
      remarks: string;
    },
  ): Promise<HandoverResponse> {
    const handover = await prisma.toolHandover.update({
      where: { id },
      data: {
        status: HandoverStatus.Rejected,
        inspectedBy: data.inspectedBy,
        inspectionDate: new Date(),
        remarks: data.remarks,
      },
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            customerPO: true,
            partNumber: true,
            toolNumber: true,
          },
        },
        pr: {
          select: {
            id: true,
            prNumber: true,
            prType: true,
            status: true,
          },
        },
        initiator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        handoverItems: {
          include: {
            prItem: true,
          },
        },
      },
    });

    return this.mapToHandoverResponse(handover);
  }

  /**
   * Get latest handover number for sequence generation
   */
  async getLatestHandoverNumber(): Promise<string | null> {
    const latest = await prisma.toolHandover.findFirst({
      orderBy: {
        handoverNumber: 'desc',
      },
      select: {
        handoverNumber: true,
      },
    });

    return latest?.handoverNumber || null;
  }

  /**
   * Map Prisma handover to HandoverResponse
   */
  private mapToHandoverResponse(handover: any): HandoverResponse {
    const items = handover.handoverItems.filter(
      (item: any) => !item.isCriticalSpare,
    );
    const criticalSpares = handover.handoverItems.filter(
      (item: any) => item.isCriticalSpare,
    );

    return {
      id: handover.id,
      handoverNumber: handover.handoverNumber,
      projectId: handover.projectId,
      project: handover.project,
      prId: handover.prId,
      pr: handover.pr,
      toolSetDescription: handover.toolSetDescription,
      status: handover.status,
      remarks: handover.remarks,
      initiatedBy: handover.initiatedBy,
      initiator: handover.initiator,
      initiatedAt: handover.initiatedAt,
      inspectedBy: handover.inspectedBy,
      inspector: handover.inspector,
      inspectionDate: handover.inspectionDate,
      completedAt: handover.completedAt,
      items: items.map((item: any) => ({
        id: item.id,
        prItemId: item.prItemId,
        itemName: item.itemName,
        specification: item.specification,
        quantity: item.quantity,
        requirements: item.requirements,
        receivedQuantity: item.receivedQuantity,
        isCriticalSpare: item.isCriticalSpare,
        createdAt: item.createdAt,
      })),
      criticalSpares: criticalSpares.map((item: any) => ({
        id: item.id,
        prItemId: item.prItemId,
        itemName: item.itemName,
        specification: item.specification,
        quantity: item.quantity,
        requirements: item.requirements,
        receivedQuantity: item.receivedQuantity,
        isCriticalSpare: item.isCriticalSpare,
        createdAt: item.createdAt,
      })),
      createdAt: handover.createdAt,
      updatedAt: handover.updatedAt,
    };
  }
}

export const handoversRepository = new HandoversRepository();

