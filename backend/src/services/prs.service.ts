import prisma from '../config/database';
import prsRepository from '../repositories/prs.repository';
import projectsRepository from '../repositories/projects.repository';
import suppliersRepository from '../repositories/suppliers.repository';
import { notificationsService } from './notifications.service';
import { generatePRNumber } from '../utils/pr-number';
import {
  CreatePRDto,
  UpdatePRDto,
  PRFilters,
  PRResponse,
  ApprovePRDto,
  RejectPRDto,
} from '../types/pr.types';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { PRStatus } from '@prisma/client';

export class PRsService {
  /**
   * Get PR by ID
   */
  async getPRById(id: string): Promise<PRResponse> {
    const pr = await prsRepository.findById(id);

    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    return this.mapToPRResponse(pr);
  }

  /**
   * Get all PRs with filtering and pagination
   */
  async getAllPRs(filters: PRFilters = {}) {
    const result = await prsRepository.findAll(filters);

    return {
      data: result.prs.map((pr) => this.mapToPRResponse(pr)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Create PR
   */
  async createPR(data: CreatePRDto, createdBy: string): Promise<PRResponse> {
    // Validate project exists
    const project = await projectsRepository.findById(data.projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Generate PR number
    const prNumber = await generatePRNumber(() =>
      prsRepository.getLatestPRNumber()
    );

    // Check if PR number already exists (unlikely but possible)
    const existingPR = await prsRepository.findByPRNumber(prNumber);
    if (existingPR) {
      throw new ConflictError('PR number already exists');
    }

    // Validate modRefReason for Modification/Refurbished types
    if (
      (data.prType === 'Modification' || data.prType === 'Refurbished') &&
      !data.modRefReason
    ) {
      throw new BadRequestError(
        'Modification/Refurbishment reason is required'
      );
    }

    // Create PR
    const pr = await prsRepository.create({
      ...data,
      prNumber,
      createdBy,
    });

    if (!pr) {
      throw new Error('Failed to create PR');
    }

    const prResponse = this.mapToPRResponse(pr);

    // Notify Approver
    await notificationsService.notifyPRCreated(prResponse.id, prNumber);

    return prResponse;
  }

  /**
   * Update PR (only before approval)
   */
  async updatePR(
    id: string,
    data: UpdatePRDto,
    updatedBy: string
  ): Promise<PRResponse> {
    const pr = await prsRepository.findById(id);

    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    // Check if PR can be updated (only Submitted status)
    if (pr.status !== 'Submitted') {
      throw new BadRequestError(
        'PR can only be updated when status is Submitted'
      );
    }

    // Validate modRefReason if PR type is being changed
    if (
      data.prType &&
      (data.prType === 'Modification' || data.prType === 'Refurbished') &&
      !data.modRefReason
    ) {
      // Use existing modRefReason if not provided
      if (!pr.modRefReason) {
        throw new BadRequestError(
          'Modification/Refurbishment reason is required'
        );
      }
    }

    const updatedPR = await prsRepository.update(id, {
      ...data,
      updatedBy,
    });

    if (!updatedPR) {
      throw new Error('Failed to update PR');
    }

    return this.mapToPRResponse(updatedPR);
  }

  /**
   * Approve PR
   */
  async approvePR(
    id: string,
    data: ApprovePRDto,
    approvedBy: string
  ): Promise<PRResponse> {
    const pr = await prsRepository.findById(id);

    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    // Check if PR can be approved (must be Submitted)
    if (pr.status !== 'Submitted') {
      throw new BadRequestError('PR can only be approved when status is Submitted');
    }

    // Approve PR
    await prsRepository.approve(id, approvedBy, data.comments);

    // Fetch updated PR
    const updatedPR = await prsRepository.findById(id);

    if (!updatedPR) {
      throw new Error('Failed to fetch updated PR');
    }

    const prResponse = this.mapToPRResponse(updatedPR);

    // Notify NPD
    await notificationsService.notifyPRApproved(prResponse.id, prResponse.prNumber);

    return prResponse;
  }

  /**
   * Reject PR
   */
  async rejectPR(
    id: string,
    data: RejectPRDto,
    approvedBy: string
  ): Promise<PRResponse> {
    const pr = await prsRepository.findById(id);

    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    // Check if PR can be rejected (must be Submitted)
    if (pr.status !== 'Submitted') {
      throw new BadRequestError('PR can only be rejected when status is Submitted');
    }

    // Reject PR
    await prsRepository.reject(id, approvedBy, data.comments);

    // Fetch updated PR
    const updatedPR = await prsRepository.findById(id);

    if (!updatedPR) {
      throw new Error('Failed to fetch updated PR');
    }

    return this.mapToPRResponse(updatedPR);
  }

  /**
   * Send PR to suppliers
   */
  async sendToSuppliers(id: string, updatedBy: string): Promise<PRResponse> {
    const pr = await prsRepository.findById(id);

    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    // Check if PR can be sent to suppliers (must be Approved)
    if (pr.status !== 'Approved') {
      throw new BadRequestError('PR must be approved before sending to suppliers');
    }

    // Update status
    await prsRepository.sendToSuppliers(id, updatedBy);

    // Fetch updated PR
    const updatedPR = await prsRepository.findById(id);

    if (!updatedPR) {
      throw new Error('Failed to fetch updated PR');
    }

    return this.mapToPRResponse(updatedPR);
  }

  /**
   * Delete PR
   */
  async deletePR(id: string): Promise<void> {
    const pr = await prsRepository.findById(id);

    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    // Only allow deletion if PR is in Submitted status
    if (pr.status !== 'Submitted') {
      throw new BadRequestError('PR can only be deleted when status is Submitted');
    }

    await prsRepository.delete(id);
  }

  /**
   * Award PR to a supplier
   */
  async awardPR(
    id: string,
    supplierId: string,
    quotationId: string,
    updatedBy: string
  ): Promise<PRResponse> {
    const pr = await prsRepository.findById(id);

    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    // Check if PR can be awarded (must be in EvaluationPending or SubmittedForApproval status)
    if (pr.status !== 'EvaluationPending' && pr.status !== 'SubmittedForApproval') {
      throw new BadRequestError(
        'PR can only be awarded when status is EvaluationPending or SubmittedForApproval'
      );
    }

    // Validate supplier exists
    const supplier = await suppliersRepository.findById(supplierId);
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    // Update PR status to Awarded and set awarded supplier
    await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'Awarded',
        awardedSupplierId: supplierId,
        updatedBy,
      },
    });

    // Fetch updated PR
    const updatedPR = await prsRepository.findById(id);

    if (!updatedPR) {
      throw new Error('Failed to fetch updated PR');
    }

    return this.mapToPRResponse(updatedPR);
  }

  /**
   * Map PR entity to PRResponse
   */
  private mapToPRResponse(pr: any): PRResponse {
    return {
      id: pr.id,
      prNumber: pr.prNumber,
      projectId: pr.projectId,
      project: pr.project
        ? {
            id: pr.project.id,
            projectNumber: pr.project.projectNumber,
            customerPO: pr.project.customerPO,
            partNumber: pr.project.partNumber,
            toolNumber: pr.project.toolNumber,
          }
        : undefined,
      prType: pr.prType,
      status: pr.status,
      modRefReason: pr.modRefReason,
      approverComments: pr.approverComments,
      itemsReceivedDate: pr.itemsReceivedDate,
      awardedSupplierId: pr.awardedSupplierId,
      awardedSupplier: pr.awardedSupplier
        ? {
            id: pr.awardedSupplier.id,
            supplierCode: pr.awardedSupplier.supplierCode,
            name: pr.awardedSupplier.name,
          }
        : null,
      createdBy: pr.creator || pr.createdBy,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
      updatedBy: pr.updater || pr.updatedBy || null,
      approvedAt: pr.approvedAt,
      approvedBy: pr.approver || pr.approvedBy || null,
      items: pr.prItems
        ? pr.prItems.map((item: any) => ({
            id: item.id,
            itemCode: item.itemCode,
            name: item.name,
            specification: item.specification,
            quantity: item.quantity,
            requirements: item.requirements,
            bomUnitPrice: item.bomUnitPrice,
            sequenceNumber: item.sequenceNumber,
            createdAt: item.createdAt,
          }))
        : undefined,
      criticalSpares: pr.criticalSpares
        ? pr.criticalSpares.map((cs: any) => ({
            id: cs.id,
            prItemId: cs.prItemId,
            quantity: cs.quantity,
            notes: cs.notes,
            createdAt: cs.createdAt,
          }))
        : undefined,
    };
  }
}

export default new PRsService();

