import prisma from '../config/database';
import { Project, ProjectStatus, Prisma } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto, ProjectFilters } from '../types/project.types';
import { PAGINATION } from '../utils/constants';

export class ProjectsRepository {
  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
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

  async findByProjectNumber(projectNumber: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { projectNumber },
    });
  }

  async findAll(filters: ProjectFilters = {}) {
    const {
      status,
      search,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, PAGINATION.MAX_LIMIT);

    const where: Prisma.ProjectWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerPO: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { toolNumber: { contains: search, mode: 'insensitive' } },
        { projectNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy,
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
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async create(
    data: CreateProjectDto & { projectNumber: string; createdBy: string }
  ): Promise<Project> {
    return prisma.project.create({
      data: {
        projectNumber: data.projectNumber,
        customerPO: data.customerPO,
        partNumber: data.partNumber,
        toolNumber: data.toolNumber,
        price: data.price,
        targetDate: new Date(data.targetDate),
        status: data.status || 'Active',
        description: data.description,
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

  async update(
    id: string,
    data: UpdateProjectDto & { updatedBy?: string }
  ): Promise<Project> {
    const updateData: Prisma.ProjectUpdateInput = {
      ...(data.customerPO && { customerPO: data.customerPO }),
      ...(data.partNumber && { partNumber: data.partNumber }),
      ...(data.toolNumber && { toolNumber: data.toolNumber }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.targetDate && { targetDate: new Date(data.targetDate) }),
      ...(data.status && { status: data.status }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.updatedBy && { updatedBy: data.updatedBy }),
    };

    return prisma.project.update({
      where: { id },
      data: updateData,
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

  async delete(id: string): Promise<Project> {
    return prisma.project.delete({
      where: { id },
    });
  }

  async countByStatus(status: ProjectStatus): Promise<number> {
    return prisma.project.count({
      where: { status },
    });
  }

  async getLatestProjectNumber(): Promise<string | null> {
    const latestProject = await prisma.project.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { projectNumber: true },
    });

    return latestProject?.projectNumber || null;
  }
}

export default new ProjectsRepository();

