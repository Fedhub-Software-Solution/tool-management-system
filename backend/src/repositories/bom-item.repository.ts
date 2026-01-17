import prisma from '../config/database';
import { CreateBomItemDto, UpdateBomItemDto } from '../types/bom-item.types';

export class BomItemRepository {
  async findAll() {
    return prisma.bomItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
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
      },
    });
  }

  async findById(id: string) {
    return prisma.bomItem.findUnique({
      where: { id },
      include: {
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
      },
    });
  }

  async create(data: CreateBomItemDto & { createdBy?: string }) {
    return prisma.bomItem.create({
      data: {
        itemName: data.itemName,
        category: data.category,
        unit: data.unit,
        unitPrice: data.unitPrice,
        supplier: data.supplier,
        partNumber: data.partNumber,
        toolNumber: data.toolNumber,
        createdBy: data.createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateBomItemDto & { updatedBy?: string }) {
    return prisma.bomItem.update({
      where: { id },
      data: {
        ...(data.itemName && { itemName: data.itemName }),
        ...(data.category && { category: data.category }),
        ...(data.unit && { unit: data.unit }),
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        ...(data.supplier !== undefined && { supplier: data.supplier }),
        ...(data.partNumber !== undefined && { partNumber: data.partNumber }),
        ...(data.toolNumber !== undefined && { toolNumber: data.toolNumber }),
        updatedBy: data.updatedBy,
      },
      include: {
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
      },
    });
  }

  async delete(id: string) {
    return prisma.bomItem.delete({
      where: { id },
    });
  }
}

export default new BomItemRepository();

