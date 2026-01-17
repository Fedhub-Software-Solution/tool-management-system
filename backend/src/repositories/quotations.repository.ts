import prisma from '../config/database';
import { Quotation, QuotationStatus, Prisma } from '@prisma/client';
import { CreateQuotationDto, QuotationFilters } from '../types/quotation.types';
import { PAGINATION } from '../utils/constants';

export class QuotationsRepository {
  async findById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        pr: {
          select: {
            id: true,
            prNumber: true,
          },
        },
        supplier: {
          select: {
            id: true,
            supplierCode: true,
            name: true,
            rating: true,
          },
        },
        submitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        quotationItems: {
          include: {
            prItem: {
              select: {
                id: true,
                name: true,
                specification: true,
              },
            },
          },
        },
      },
    });
  }

  async findByQuotationNumber(quotationNumber: string): Promise<Quotation | null> {
    return prisma.quotation.findUnique({
      where: { quotationNumber },
    });
  }

  async findAll(filters: QuotationFilters = {}) {
    const {
      prId,
      supplierId,
      status,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, PAGINATION.MAX_LIMIT);

    const where: Prisma.QuotationWhereInput = {};

    if (prId) {
      where.prId = prId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.QuotationOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          pr: {
            select: {
              id: true,
              prNumber: true,
            },
          },
          supplier: {
            select: {
              id: true,
              supplierCode: true,
              name: true,
            },
          },
          quotationItems: {
            take: 5, // Limit items for list view
          },
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return {
      quotations,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findByPRId(prId: string) {
    return prisma.quotation.findMany({
      where: { prId },
      include: {
        supplier: {
          select: {
            id: true,
            supplierCode: true,
            name: true,
            rating: true,
          },
        },
        quotationItems: {
          include: {
            prItem: {
              select: {
                id: true,
                name: true,
                specification: true,
              },
            },
          },
        },
      },
      orderBy: {
        totalPrice: 'asc',
      },
    });
  }

  async create(
    data: CreateQuotationDto & {
      quotationNumber: string;
      quotationFileUrl?: string;
      submittedBy?: string;
    }
  ) {
    const { items, ...quotationData } = data;

    return prisma.$transaction(async (tx) => {
      // Create quotation
      const quotation = await tx.quotation.create({
        data: {
          quotationNumber: quotationData.quotationNumber,
          prId: quotationData.prId,
          supplierId: quotationData.supplierId,
          totalPrice: items.reduce((sum, item) => sum + item.totalPrice, 0),
          deliveryTerms: quotationData.deliveryTerms,
          deliveryDate: quotationData.deliveryDate
            ? new Date(quotationData.deliveryDate)
            : null,
          validityDate: quotationData.validityDate
            ? new Date(quotationData.validityDate)
            : null,
          notes: quotationData.notes,
          quotationFileUrl: quotationData.quotationFileUrl,
          submittedBy: quotationData.submittedBy,
          status: 'Pending',
        },
        include: {
          pr: {
            select: {
              id: true,
              prNumber: true,
            },
          },
          supplier: {
            select: {
              id: true,
              supplierCode: true,
              name: true,
            },
          },
        },
      });

      // Create quotation items
      await tx.quotationItem.createMany({
        data: items.map((item) => ({
          quotationId: quotation.id,
          prItemId: item.prItemId,
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        })),
      });

      // Fetch complete quotation
      return this.findById(quotation.id);
    });
  }

  async evaluate(
    id: string,
    status: QuotationStatus,
    evaluatedBy: string,
    notes?: string
  ) {
    return prisma.quotation.update({
      where: { id },
      data: {
        status,
        evaluatedBy,
        evaluatedAt: new Date(),
        notes: notes || undefined,
      },
    });
  }

  async getLatestQuotationNumber(): Promise<string | null> {
    const latestQuotation = await prisma.quotation.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { quotationNumber: true },
    });

    return latestQuotation?.quotationNumber || null;
  }
}

export default new QuotationsRepository();

