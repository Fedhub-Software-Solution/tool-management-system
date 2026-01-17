import prisma from '../config/database';
import { CreateToolNumberConfigDto, UpdateToolNumberConfigDto } from '../types/tool-number-config.types';

// Helper function to generate example from format
function generateExample(format: string, prefix: string): string {
  const year = new Date().getFullYear();
  return format.replace(prefix, prefix).replace('YYYY', year.toString()).replace('XXXX', '0001');
}

export class ToolNumberConfigRepository {
  async findAll() {
    return prisma.toolNumberConfig.findMany({
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
    return prisma.toolNumberConfig.findUnique({
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

  async create(data: CreateToolNumberConfigDto & { createdBy?: string }) {
    return prisma.toolNumberConfig.create({
      data: {
        prefix: data.prefix,
        format: data.format,
        autoIncrement: data.autoIncrement ?? true,
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

  async update(id: string, data: UpdateToolNumberConfigDto & { updatedBy?: string }) {
    const existing = await prisma.toolNumberConfig.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.toolNumberConfig.update({
      where: { id },
      data: {
        ...(data.prefix && { prefix: data.prefix }),
        ...(data.format && { format: data.format }),
        ...(data.autoIncrement !== undefined && { autoIncrement: data.autoIncrement }),
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
    return prisma.toolNumberConfig.delete({
      where: { id },
    });
  }
}

export default new ToolNumberConfigRepository();

