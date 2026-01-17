import { HandoverStatus } from '@prisma/client';
import { handoversRepository } from '../repositories/handovers.repository';
import { prsRepository } from '../repositories/prs.repository';
import { projectsRepository } from '../repositories/projects.repository';
import { inventoryService } from './inventory.service';
import { notificationsService } from './notifications.service';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../utils/errors';
import {
  CreateHandoverDto,
  ApproveHandoverDto,
  RejectHandoverDto,
  HandoverFilters,
  HandoverResponse,
} from '../types/handover.types';
import { generateHandoverNumber } from '../utils/handover-number';

export class HandoversService {
  /**
   * Get handover by ID
   */
  async getHandoverById(id: string): Promise<HandoverResponse> {
    const handover = await handoversRepository.findById(id);

    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    return handover;
  }

  /**
   * Get all handovers with filtering and pagination
   */
  async getAllHandovers(
    filters: HandoverFilters,
  ): Promise<{
    data: HandoverResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const result = await handoversRepository.findAll(filters);

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
   * Create new handover
   */
  async createHandover(
    data: CreateHandoverDto,
    userId: string,
  ): Promise<HandoverResponse> {
    // Validate PR exists and is in correct status
    const pr = await prsRepository.findById(data.prId);
    if (!pr) {
      throw new NotFoundError('Purchase Requisition not found');
    }

    // Validate project exists
    const project = await projectsRepository.findById(data.projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Validate PR belongs to project
    if (pr.projectId !== data.projectId) {
      throw new BadRequestError(
        'Purchase Requisition does not belong to the specified project',
      );
    }

    // Validate PR is in ItemsReceived status
    if (pr.status !== 'ItemsReceived') {
      throw new BadRequestError(
        'Purchase Requisition must be in ItemsReceived status to create handover',
      );
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError('At least one item is required');
    }

    // Validate all PR items exist and belong to the PR
    const prItems = await Promise.all(
      data.items.map(async (item) => {
        const prItem = await prsRepository.findPRItemById(item.prItemId);
        if (!prItem) {
          throw new NotFoundError(`PR Item ${item.prItemId} not found`);
        }
        if (prItem.prId !== data.prId) {
          throw new BadRequestError(
            `PR Item ${item.prItemId} does not belong to the specified PR`,
          );
        }
        return prItem;
      }),
    );

    // Validate critical spares if provided
    if (data.criticalSpares && data.criticalSpares.length > 0) {
      await Promise.all(
        data.criticalSpares.map(async (spare) => {
          const prItem = await prsRepository.findPRItemById(spare.prItemId);
          if (!prItem) {
            throw new NotFoundError(`PR Item ${spare.prItemId} not found`);
          }
          if (prItem.prId !== data.prId) {
            throw new BadRequestError(
              `PR Item ${spare.prItemId} does not belong to the specified PR`,
            );
          }
        }),
      );
    }

    // Generate handover number
    const handoverNumber = await generateHandoverNumber();

    // Prepare handover items
    const handoverItems = [
      ...data.items.map((item) => ({
        prItemId: item.prItemId,
        receivedQuantity: item.receivedQuantity,
        isCriticalSpare: false,
      })),
      ...(data.criticalSpares || []).map((spare) => ({
        prItemId: spare.prItemId,
        receivedQuantity: spare.quantity,
        isCriticalSpare: true,
      })),
    ];

    // Create handover
    const handover = await handoversRepository.create({
      handoverNumber,
      projectId: data.projectId,
      prId: data.prId,
      toolSetDescription: data.toolSetDescription,
      initiatedBy: userId,
      items: handoverItems,
    });

    // Notify Maintenance
    await notificationsService.notifyHandoverPending(
      handover.id,
      handover.handoverNumber,
    );

    return handover;
  }

  /**
   * Approve handover
   */
  async approveHandover(
    id: string,
    data: ApproveHandoverDto,
    userId: string,
  ): Promise<HandoverResponse> {
    const handover = await handoversRepository.findById(id);

    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    // Validate status
    if (handover.status !== HandoverStatus.PendingInspection) {
      throw new BadRequestError(
        'Handover can only be approved when status is PendingInspection',
      );
    }

    // Approve handover
    const approvedHandover = await handoversRepository.approve(id, {
      inspectedBy: userId,
      remarks: data.remarks,
    });

    // Update inventory - add items to inventory
    const pr = await prsRepository.findById(approvedHandover.prId);
    if (!pr) {
      throw new NotFoundError('Purchase Requisition not found');
    }

    const project = await projectsRepository.findById(
      approvedHandover.projectId,
    );
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Add all items to inventory
    for (const item of approvedHandover.items) {
      const prItem = await prsRepository.findPRItemById(item.prItemId);
      if (prItem) {
        await inventoryService.addStockFromHandover({
          partNumber: project.partNumber,
          toolNumber: project.toolNumber,
          itemCode: prItem.itemCode || undefined,
          name: item.itemName,
          quantity: item.receivedQuantity,
          handoverId: approvedHandover.id,
          prId: approvedHandover.prId,
          prNumber: pr.prNumber,
          projectId: approvedHandover.projectId,
          performedBy: userId,
        });
      }
    }

    // Add critical spares to inventory
    for (const spare of approvedHandover.criticalSpares) {
      const prItem = await prsRepository.findPRItemById(spare.prItemId);
      if (prItem) {
        await inventoryService.addStockFromHandover({
          partNumber: project.partNumber,
          toolNumber: project.toolNumber,
          itemCode: prItem.itemCode || undefined,
          name: spare.itemName,
          quantity: spare.receivedQuantity,
          handoverId: approvedHandover.id,
          prId: approvedHandover.prId,
          prNumber: pr.prNumber,
          projectId: approvedHandover.projectId,
          performedBy: userId,
        });
      }
    }

    return approvedHandover;
  }

  /**
   * Reject handover
   */
  async rejectHandover(
    id: string,
    data: RejectHandoverDto,
    userId: string,
  ): Promise<HandoverResponse> {
    const handover = await handoversRepository.findById(id);

    if (!handover) {
      throw new NotFoundError('Handover not found');
    }

    // Validate status
    if (handover.status !== HandoverStatus.PendingInspection) {
      throw new BadRequestError(
        'Handover can only be rejected when status is PendingInspection',
      );
    }

    // Validate remarks
    if (!data.remarks || data.remarks.trim().length === 0) {
      throw new BadRequestError('Remarks are required for rejection');
    }

    // Reject handover
    const rejectedHandover = await handoversRepository.reject(id, {
      inspectedBy: userId,
      remarks: data.remarks,
    });

    return rejectedHandover;
  }
}

export const handoversService = new HandoversService();

