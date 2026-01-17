import prisma from '../config/database';
import { User, UserRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from '../types/user.types';

export class UsersRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { employeeId },
    });
  }

  async create(data: CreateUserDto & { passwordHash: string }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        employeeId: data.employeeId,
        phone: data.phone,
        department: data.department,
      },
    });
  }

  async update(id: string, data: UpdateUserDto & { updatedBy?: string }): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedBy: data.updatedBy,
      },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async findAll(includeInactive = false): Promise<User[]> {
    return prisma.user.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async deactivate(id: string, updatedBy: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy,
      },
    });
  }

  async activate(id: string, updatedBy: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        updatedBy,
      },
    });
  }
}

export default new UsersRepository();

