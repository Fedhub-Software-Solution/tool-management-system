import prisma from '../config/database';
import { CreateRoleDto, UpdateRoleDto } from '../types/role.types';

export class RolesRepository {
  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    
    const roles = await prisma.role.findMany({
      where,
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

    // Get user count for each role (match Role.name with User.role enum)
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        try {
          const userCount = await prisma.user.count({
            where: { role: role.name as any },
          });
          return {
            ...role,
            userCount,
          };
        } catch (error) {
          // If role name doesn't match enum, return 0
          return {
            ...role,
            userCount: 0,
          };
        }
      })
    );

    return rolesWithUserCount;
  }

  async findById(id: string) {
    const role = await prisma.role.findUnique({
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

    if (role) {
      try {
        const userCount = await prisma.user.count({
          where: { role: role.name as any },
        });
        return {
          ...role,
          userCount,
        };
      } catch (error) {
        // If role name doesn't match enum, return 0
        return {
          ...role,
          userCount: 0,
        };
      }
    }

    return role;
  }

  async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  async create(data: CreateRoleDto & { createdBy?: string }) {
    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
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

  async update(id: string, data: UpdateRoleDto & { updatedBy?: string }) {
    return prisma.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
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
    return prisma.role.delete({
      where: { id },
    });
  }
}

export default new RolesRepository();

