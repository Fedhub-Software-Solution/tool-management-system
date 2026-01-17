import { z } from 'zod';
import { SupplierStatus } from '@prisma/client';

const supplierStatusEnum = z.nativeEnum(SupplierStatus, {
  errorMap: () => ({ message: 'Invalid supplier status' }),
});

export const createSupplierSchema = z.object({
  supplierCode: z.string().min(1, 'Supplier code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  contactPerson: z.string().max(255).optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  gstin: z.string().max(15).optional(),
  status: supplierStatusEnum.optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
  categories: z.array(z.string().max(100)).optional(),
});

export const updateSupplierSchema = z.object({
  supplierCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  contactPerson: z.string().max(255).optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  gstin: z.string().max(15).optional(),
  status: supplierStatusEnum.optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
  categories: z.array(z.string().max(100)).optional(),
});

