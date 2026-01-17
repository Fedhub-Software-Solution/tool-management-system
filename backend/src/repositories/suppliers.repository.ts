import prisma from '../config/database';
import { Supplier, SupplierStatus, Prisma } from '@prisma/client';
import { CreateSupplierDto, UpdateSupplierDto, SupplierFilters } from '../types/supplier.types';
import { PAGINATION } from '../utils/constants';

export class SuppliersRepository {
  async findById(id: string) {
    return prisma.supplier.findUnique({
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
        categories: true,
      },
    });
  }

  async findBySupplierCode(supplierCode: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { supplierCode },
    });
  }

  async findAll(filters: SupplierFilters = {}) {
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

    const where: Prisma.SupplierWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { supplierCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.SupplierOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          categories: true,
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      suppliers,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async create(data: CreateSupplierDto & { createdBy?: string }) {
    const { categories, ...supplierData } = data;

    return prisma.$transaction(async (tx) => {
      // Create supplier
      const supplier = await tx.supplier.create({
        data: {
          supplierCode: supplierData.supplierCode,
          name: supplierData.name,
          contactPerson: supplierData.contactPerson,
          email: supplierData.email,
          phone: supplierData.phone,
          address: supplierData.address,
          city: supplierData.city,
          state: supplierData.state,
          pincode: supplierData.pincode,
          country: supplierData.country || 'India',
          gstin: supplierData.gstin,
          status: supplierData.status || 'Active',
          rating: supplierData.rating,
          notes: supplierData.notes,
          createdBy: supplierData.createdBy,
        },
        include: {
          categories: true,
        },
      });

      // Create categories if provided
      if (categories && categories.length > 0) {
        await tx.supplierCategory.createMany({
          data: categories.map((category) => ({
            supplierId: supplier.id,
            category,
          })),
          skipDuplicates: true,
        });

        // Fetch supplier with categories using transaction
        return tx.supplier.findUnique({
          where: { id: supplier.id },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            categories: true,
          },
        });
      }

      return supplier;
    });
  }

  async update(id: string, data: UpdateSupplierDto) {
    const { categories, ...supplierData } = data;

    return prisma.$transaction(async (tx) => {
      // Update supplier
      const updateData: Prisma.SupplierUpdateInput = {
        ...(supplierData.supplierCode && { supplierCode: supplierData.supplierCode }),
        ...(supplierData.name && { name: supplierData.name }),
        ...(supplierData.contactPerson !== undefined && { contactPerson: supplierData.contactPerson }),
        ...(supplierData.email !== undefined && { email: supplierData.email }),
        ...(supplierData.phone !== undefined && { phone: supplierData.phone }),
        ...(supplierData.address !== undefined && { address: supplierData.address }),
        ...(supplierData.city !== undefined && { city: supplierData.city }),
        ...(supplierData.state !== undefined && { state: supplierData.state }),
        ...(supplierData.pincode !== undefined && { pincode: supplierData.pincode }),
        ...(supplierData.country !== undefined && { country: supplierData.country }),
        ...(supplierData.gstin !== undefined && { gstin: supplierData.gstin }),
        ...(supplierData.status && { status: supplierData.status }),
        ...(supplierData.rating !== undefined && { rating: supplierData.rating }),
        ...(supplierData.notes !== undefined && { notes: supplierData.notes }),
      };

      const supplier = await tx.supplier.update({
        where: { id },
        data: updateData,
      });

      // Update categories if provided
      if (categories !== undefined) {
        // Delete existing categories
        await tx.supplierCategory.deleteMany({
          where: { supplierId: id },
        });

        // Create new categories
        if (categories.length > 0) {
          await tx.supplierCategory.createMany({
            data: categories.map((category) => ({
              supplierId: id,
              category,
            })),
          });
        }
      }

      // Fetch updated supplier with categories
      return this.findById(id);
    });
  }

  async delete(id: string): Promise<Supplier> {
    return prisma.supplier.delete({
      where: { id },
    });
  }
}

export default new SuppliersRepository();

