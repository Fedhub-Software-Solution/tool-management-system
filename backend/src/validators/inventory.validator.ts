import { z } from 'zod';
import { InventoryStatus, TransactionType } from '@prisma/client';

const inventoryStatusEnum = z.nativeEnum(InventoryStatus, {
  errorMap: () => ({ message: 'Invalid inventory status' }),
});

const transactionTypeEnum = z.nativeEnum(TransactionType, {
  errorMap: () => ({ message: 'Invalid transaction type' }),
});

export const createInventoryItemSchema = z.object({
  partNumber: z
    .string()
    .min(1, 'Part number is required')
    .max(100, 'Part number must not exceed 100 characters'),
  toolNumber: z
    .string()
    .min(1, 'Tool number is required')
    .max(100, 'Tool number must not exceed 100 characters'),
  itemCode: z
    .string()
    .max(100, 'Item code must not exceed 100 characters')
    .optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must not exceed 255 characters'),
  currentStock: z
    .number()
    .int('Current stock must be an integer')
    .nonnegative('Current stock must be non-negative')
    .optional(),
  minStockLevel: z
    .number()
    .int('Min stock level must be an integer')
    .nonnegative('Min stock level must be non-negative'),
  maxStockLevel: z
    .number()
    .int('Max stock level must be an integer')
    .positive('Max stock level must be positive')
    .optional(),
  unitOfMeasure: z
    .string()
    .max(50, 'Unit of measure must not exceed 50 characters')
    .optional(),
  location: z
    .string()
    .max(100, 'Location must not exceed 100 characters')
    .optional(),
  notes: z.string().optional(),
});

export const updateInventoryItemSchema = z.object({
  minStockLevel: z
    .number()
    .int('Min stock level must be an integer')
    .nonnegative('Min stock level must be non-negative')
    .optional(),
  maxStockLevel: z
    .number()
    .int('Max stock level must be an integer')
    .positive('Max stock level must be positive')
    .optional(),
  unitOfMeasure: z
    .string()
    .max(50, 'Unit of measure must not exceed 50 characters')
    .optional(),
  location: z
    .string()
    .max(100, 'Location must not exceed 100 characters')
    .optional(),
  notes: z.string().optional(),
});

export const adjustStockSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive'),
  type: transactionTypeEnum,
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
});

