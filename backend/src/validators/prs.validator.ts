import { z } from 'zod';
import { PRStatus, PRType } from '@prisma/client';

const prTypeEnum = z.nativeEnum(PRType, {
  errorMap: () => ({ message: 'Invalid PR type' }),
});

const prStatusEnum = z.nativeEnum(PRStatus, {
  errorMap: () => ({ message: 'Invalid PR status' }),
});

const prItemSchema = z.object({
  itemCode: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  specification: z.string().min(1, 'Specification is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  requirements: z.string().optional(),
  bomUnitPrice: z.number().nonnegative('BOM unit price must be non-negative').optional(),
  sequenceNumber: z.number().int().positive().optional(),
});

const criticalSpareSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  notes: z.string().optional(),
});

export const createPRSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  prType: prTypeEnum,
  modRefReason: z.string().optional(),
  items: z.array(prItemSchema).min(1, 'At least one item is required'),
  supplierIds: z.array(z.string().uuid('Invalid supplier ID')).optional(),
  criticalSpares: z.array(criticalSpareSchema).optional(),
});

export const updatePRSchema = z.object({
  prType: prTypeEnum.optional(),
  modRefReason: z.string().optional(),
  items: z.array(prItemSchema).min(1).optional(),
  supplierIds: z.array(z.string().uuid('Invalid supplier ID')).optional(),
  criticalSpares: z.array(criticalSpareSchema).optional(),
});

export const approvePRSchema = z.object({
  comments: z.string().optional(),
});

export const rejectPRSchema = z.object({
  comments: z.string().min(1, 'Comments are required for rejection'),
});

