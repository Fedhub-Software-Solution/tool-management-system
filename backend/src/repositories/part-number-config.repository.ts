import prisma from '../config/database';
import { CreatePartNumberConfigDto, UpdatePartNumberConfigDto } from '../types/part-number-config.types';

// Helper function to generate example from format
function generateExample(format: string, prefix: string): string {
  const year = new Date().getFullYear();
  return format.replace(prefix, prefix).replace('YYYY', year.toString()).replace('XXXX', '0001');
}

export class PartNumberConfigRepository {
  async findAll() {
    return prisma.partNumberConfig.findMany({
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
    return prisma.partNumberConfig.findUnique({
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

  async create(data: CreatePartNumberConfigDto & { createdBy?: string }) {
    const example = generateExample(data.format, data.prefix);
    return prisma.partNumberConfig.create({
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

  async update(id: string, data: UpdatePartNumberConfigDto & { updatedBy?: string }) {
    const existing = await prisma.partNumberConfig.findUnique({ where: { id } });
    if (!existing) return null;

    const prefix = data.prefix ?? existing.prefix;
    const format = data.format ?? existing.format;
    const example = generateExample(format, prefix);

    return prisma.partNumberConfig.update({
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
    return prisma.partNumberConfig.delete({
      where: { id },
    });
  }
}

export default new PartNumberConfigRepository();

