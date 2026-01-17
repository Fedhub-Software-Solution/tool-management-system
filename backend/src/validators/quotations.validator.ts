import { z } from 'zod';
import { QuotationStatus } from '@prisma/client';

const quotationStatusEnum = z.nativeEnum(QuotationStatus, {
  errorMap: () => ({ message: 'Invalid quotation status' }),
});

const quotationItemSchema = z.object({
  prItemId: z.string().uuid('Invalid PR item ID'),
  itemName: z.string().min(1, 'Item name is required').max(255),
  unitPrice: z.number().positive('Unit price must be positive'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  totalPrice: z.number().positive('Total price must be positive'),
});

export const createQuotationSchema = z.object({
  prId: z.string().uuid('Invalid PR ID'),
  supplierId: z.string().uuid('Invalid supplier ID'),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
  deliveryTerms: z.string().max(100).optional(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  validityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  notes: z.string().optional(),
});

export const evaluateQuotationSchema = z.object({
  status: quotationStatusEnum,
  notes: z.string().optional(),
});

export const awardPRSchema = z.object({
  quotationId: z.string().uuid('Invalid quotation ID'),
  supplierId: z.string().uuid('Invalid supplier ID'),
});

