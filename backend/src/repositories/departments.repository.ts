import prisma from '../config/database';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../types/department.types';

export class DepartmentsRepository {
  async findAll() {
    const departments = await prisma.department.findMany({
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

    // Calculate member count for each department by counting users with matching department name
    const departmentsWithMemberCount = await Promise.all(
      departments.map(async (dept) => {
        const memberCount = await prisma.user.count({
          where: {
            department: dept.name,
            isActive: true,
          },
        });
        return {
          ...dept,
          members: memberCount,
        };
      })
    );

    return departmentsWithMemberCount;
  }

  async findById(id: string) {
    const department = await prisma.department.findUnique({
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

    if (department) {
      const memberCount = await prisma.user.count({
        where: {
          department: department.name,
          isActive: true,
        },
      });
      return {
        ...department,
        members: memberCount,
      };
    }

    return department;
  }

  async findByName(name: string) {
    return prisma.department.findUnique({
      where: { name },
    });
  }

  async create(data: CreateDepartmentDto & { createdBy?: string }) {
    return prisma.department.create({
      data: {
        name: data.name,
        head: data.head,
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

  async update(id: string, data: UpdateDepartmentDto & { updatedBy?: string }) {
    return prisma.department.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.head !== undefined && { head: data.head }),
        ...(data.description !== undefined && { description: data.description }),
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
    return prisma.department.delete({
      where: { id },
    });
  }
}

export default new DepartmentsRepository();

