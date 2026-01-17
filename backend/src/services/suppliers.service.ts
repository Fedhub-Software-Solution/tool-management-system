import suppliersRepository from '../repositories/suppliers.repository';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierFilters,
  SupplierResponse,
} from '../types/supplier.types';
import { NotFoundError, ConflictError } from '../utils/errors';

export class SuppliersService {
  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string): Promise<SupplierResponse> {
    const supplier = await suppliersRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return this.mapToSupplierResponse(supplier);
  }

  /**
   * Get all suppliers with filtering and pagination
   */
  async getAllSuppliers(filters: SupplierFilters = {}) {
    const result = await suppliersRepository.findAll(filters);

    return {
      data: result.suppliers.map((supplier) => this.mapToSupplierResponse(supplier)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Create supplier
   */
  async createSupplier(
    data: CreateSupplierDto,
    createdBy?: string
  ): Promise<SupplierResponse> {
    // Check if supplier code already exists
    const existingSupplier = await suppliersRepository.findBySupplierCode(
      data.supplierCode
    );
    if (existingSupplier) {
      throw new ConflictError('Supplier code already exists');
    }

    // Create supplier
    const supplier = await suppliersRepository.create({
      ...data,
      createdBy,
    });

    if (!supplier) {
      throw new Error('Failed to create supplier');
    }

    return this.mapToSupplierResponse(supplier);
  }

  /**
   * Update supplier
   */
  async updateSupplier(
    id: string,
    data: UpdateSupplierDto
  ): Promise<SupplierResponse> {
    const supplier = await suppliersRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    // Check if supplier code is being changed and if it already exists
    if (data.supplierCode && data.supplierCode !== supplier.supplierCode) {
      const existingSupplier = await suppliersRepository.findBySupplierCode(
        data.supplierCode
      );
      if (existingSupplier) {
        throw new ConflictError('Supplier code already exists');
      }
    }

    const updatedSupplier = await suppliersRepository.update(id, data);

    if (!updatedSupplier) {
      throw new Error('Failed to update supplier');
    }

    return this.mapToSupplierResponse(updatedSupplier);
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string): Promise<void> {
    const supplier = await suppliersRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    await suppliersRepository.delete(id);
  }

  /**
   * Map Supplier entity to SupplierResponse
   */
  private mapToSupplierResponse(supplier: any): SupplierResponse {
    return {
      id: supplier.id,
      supplierCode: supplier.supplierCode,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      pincode: supplier.pincode,
      country: supplier.country,
      gstin: supplier.gstin,
      status: supplier.status,
      rating: supplier.rating ? Number(supplier.rating) : null,
      totalOrders: supplier.totalOrders,
      notes: supplier.notes,
      categories: supplier.categories
        ? supplier.categories.map((cat: any) => cat.category)
        : [],
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      createdBy: supplier.createdBy,
    };
  }
}

export default new SuppliersService();

