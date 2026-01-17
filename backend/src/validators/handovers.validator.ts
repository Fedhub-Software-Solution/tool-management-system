import { z } from 'zod';
import { HandoverStatus } from '@prisma/client';

export const createHandoverSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  prId: z.string().uuid('Invalid PR ID'),
  toolSetDescription: z
    .string()
    .min(1, 'Tool set description is required')
    .max(500, 'Tool set description must not exceed 500 characters'),
  items: z
    .array(
      z.object({
        prItemId: z.string().uuid('Invalid PR item ID'),
        receivedQuantity: z
          .number()
          .int('Received quantity must be an integer')
          .positive('Received quantity must be positive'),
      }),
    )
    .min(1, 'At least one item is required'),
  criticalSpares: z
    .array(
      z.object({
        prItemId: z.string().uuid('Invalid PR item ID'),
        quantity: z
          .number()
          .int('Quantity must be an integer')
          .positive('Quantity must be positive'),
      }),
    )
    .optional(),
});

export const approveHandoverSchema = z.object({
  remarks: z
    .string()
    .max(1000, 'Remarks must not exceed 1000 characters')
    .optional(),
});

export const rejectHandoverSchema = z.object({
  remarks: z
    .string()
    .min(1, 'Remarks are required for rejection')
    .max(1000, 'Remarks must not exceed 1000 characters'),
});

