import { z } from 'zod';
import { RequestStatus } from '@prisma/client';

export const createSparesRequestSchema = z.object({
  inventoryItemId: z.string().uuid('Invalid inventory item ID'),
  quantityRequested: z
    .number()
    .int('Quantity requested must be an integer')
    .positive('Quantity requested must be positive'),
  projectId: z.string().uuid('Invalid project ID').optional(),
  purpose: z
    .string()
    .max(1000, 'Purpose must not exceed 1000 characters')
    .optional(),
});

export const fulfillRequestSchema = z.object({
  quantityFulfilled: z
    .number()
    .int('Quantity fulfilled must be an integer')
    .positive('Quantity fulfilled must be positive'),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
});

export const rejectRequestSchema = z.object({
  rejectionReason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Rejection reason must not exceed 1000 characters'),
});

