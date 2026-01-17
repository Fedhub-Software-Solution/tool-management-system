import { SupplierStatus } from '@prisma/client';

export interface CreateSupplierDto {
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  status?: SupplierStatus;
  rating?: number;
  notes?: string;
  categories?: string[];
}

export interface UpdateSupplierDto {
  supplierCode?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  status?: SupplierStatus;
  rating?: number;
  notes?: string;
  categories?: string[];
}

export interface SupplierFilters {
  status?: SupplierStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierResponse {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  gstin?: string | null;
  status: SupplierStatus;
  rating?: number | null;
  totalOrders: number;
  notes?: string | null;
  categories?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
}

