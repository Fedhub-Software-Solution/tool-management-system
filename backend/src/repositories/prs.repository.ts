import prisma from '../config/database';
import { PurchaseRequisition, PRStatus, PRType, Prisma } from '@prisma/client';
import { CreatePRDto, UpdatePRDto, PRFilters } from '../types/pr.types';
import { PAGINATION } from '../utils/constants';

export class PRsRepository {
  async findById(id: string) {
    return prisma.purchaseRequisition.findUnique({
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
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        awardedSupplier: {
          select: {
            id: true,
            supplierCode: true,
            name: true,
          },
        },
        prItems: {
          orderBy: { sequenceNumber: 'asc' },
        },
        criticalSpares: true,
      },
    });
  }

  async findByPRNumber(prNumber: string): Promise<PurchaseRequisition | null> {
    return prisma.purchaseRequisition.findUnique({
      where: { prNumber },
    });
  }

  async findAll(filters: PRFilters = {}) {
    const {
      status,
      prType,
      projectId,
      search,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, PAGINATION.MAX_LIMIT);

    const where: Prisma.PurchaseRequisitionWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (prType) {
      where.prType = prType;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (search) {
      where.OR = [
        { prNumber: { contains: search, mode: 'insensitive' } },
        { project: { customerPO: { contains: search, mode: 'insensitive' } } },
        { project: { partNumber: { contains: search, mode: 'insensitive' } } },
        { project: { toolNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: Prisma.PurchaseRequisitionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [prs, total] = await Promise.all([
      prisma.purchaseRequisition.findMany({
        where,
        skip,
        take,
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
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          awardedSupplier: {
            select: {
              id: true,
              supplierCode: true,
              name: true,
            },
          },
          prItems: {
            orderBy: { sequenceNumber: 'asc' },
            take: 5, // Limit items for list view
          },
        },
      }),
      prisma.purchaseRequisition.count({ where }),
    ]);

    return {
      prs,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async create(data: CreatePRDto & { prNumber: string; createdBy: string }) {
    const { items, supplierIds, criticalSpares, ...prData } = data;

    // Create PR with items and critical spares in a transaction
    return prisma.$transaction(async (tx) => {
      // Create PR
      const pr = await tx.purchaseRequisition.create({
        data: {
          prNumber: prData.prNumber,
          projectId: prData.projectId,
          prType: prData.prType,
          modRefReason: prData.modRefReason,
          status: 'Submitted',
          createdBy: prData.createdBy,
          prItems: {
            create: items.map((item, index) => ({
              itemCode: item.itemCode,
              name: item.name,
              specification: item.specification,
              quantity: item.quantity,
              requirements: item.requirements,
              bomUnitPrice: item.bomUnitPrice,
              sequenceNumber: item.sequenceNumber ?? index + 1,
            })),
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
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          prItems: true,
        },
      });

      // Create critical spares if provided
      if (criticalSpares && criticalSpares.length > 0) {
        // Map critical spares to PR items
        const criticalSpareData = criticalSpares.map((cs, index) => ({
          prId: pr.id,
          prItemId: pr.prItems[index]?.id || pr.prItems[0]?.id || '',
          quantity: cs.quantity,
          notes: cs.notes,
        })).filter(cs => cs.prItemId); // Filter out invalid mappings

        if (criticalSpareData.length > 0) {
          await tx.criticalSpare.createMany({
            data: criticalSpareData,
          });
        }
      }

      // Create PR-Supplier relationships if provided
      if (supplierIds && supplierIds.length > 0) {
        await tx.pRSupplier.createMany({
          data: supplierIds.map((supplierId) => ({
            prId: pr.id,
            supplierId,
            status: 'Invited',
            invitedBy: prData.createdBy,
          })),
        });
      }

      // Fetch the complete PR with all relations
      return this.findById(pr.id);
    });
  }

  async update(id: string, data: UpdatePRDto & { updatedBy?: string }) {
    const { items, supplierIds, criticalSpares, ...prData } = data;

    return prisma.$transaction(async (tx) => {
      // Update PR basic fields
      const updateData: Prisma.PurchaseRequisitionUpdateInput = {
        ...(prData.prType && { prType: prData.prType }),
        ...(prData.modRefReason !== undefined && { modRefReason: prData.modRefReason }),
        ...(data.updatedBy && { updatedBy: data.updatedBy }),
      };

      const pr = await tx.purchaseRequisition.update({
        where: { id },
        data: updateData,
      });

      // Update items if provided
      if (items) {
        // Delete existing items
        await tx.pRItem.deleteMany({
          where: { prId: id },
        });

        // Delete existing critical spares
        await tx.criticalSpare.deleteMany({
          where: { prId: id },
        });

        // Create new items
        const createdItems = await Promise.all(
          items.map((item, index) =>
            tx.pRItem.create({
              data: {
                prId: id,
                itemCode: item.itemCode,
                name: item.name,
                specification: item.specification,
                quantity: item.quantity,
                requirements: item.requirements,
                bomUnitPrice: item.bomUnitPrice,
                sequenceNumber: item.sequenceNumber ?? index + 1,
              },
            })
          )
        );

        // Create critical spares if provided
        if (criticalSpares && criticalSpares.length > 0) {
          const criticalSpareData = criticalSpares.map((cs, index) => ({
            prId: id,
            prItemId: createdItems[index]?.id || createdItems[0]?.id || '',
            quantity: cs.quantity,
            notes: cs.notes,
          })).filter(cs => cs.prItemId);

          if (criticalSpareData.length > 0) {
            await tx.criticalSpare.createMany({
              data: criticalSpareData,
            });
          }
        }
      }

      // Update suppliers if provided
      if (supplierIds) {
        // Delete existing PR-Supplier relationships
        await tx.pRSupplier.deleteMany({
          where: { prId: id },
        });

        // Create new relationships
        if (supplierIds.length > 0) {
          await tx.pRSupplier.createMany({
            data: supplierIds.map((supplierId) => ({
              prId: id,
              supplierId,
              status: 'Invited',
              invitedBy: data.updatedBy,
            })),
          });
        }
      }

      // Fetch updated PR
      return this.findById(id);
    });
  }

  async approve(id: string, approvedBy: string, comments?: string) {
    return prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedBy,
        approvedAt: new Date(),
        approverComments: comments,
      },
    });
  }

  async reject(id: string, approvedBy: string, comments: string) {
    return prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'Rejected',
        approvedBy,
        approvedAt: new Date(),
        approverComments: comments,
      },
    });
  }

  async sendToSuppliers(id: string, updatedBy: string) {
    return prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'SentToSupplier',
        updatedBy,
      },
    });
  }

  async delete(id: string): Promise<PurchaseRequisition> {
    return prisma.purchaseRequisition.delete({
      where: { id },
    });
  }

  async getLatestPRNumber(): Promise<string | null> {
    const latestPR = await prisma.purchaseRequisition.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { prNumber: true },
    });

    return latestPR?.prNumber || null;
  }

  /**
   * Find PR item by ID
   */
  async findPRItemById(id: string) {
    return prisma.pRItem.findUnique({
      where: { id },
      include: {
        pr: true,
      },
    });
  }
}

export default new PRsRepository();

