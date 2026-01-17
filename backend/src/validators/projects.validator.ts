import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

const projectStatusEnum = z.nativeEnum(ProjectStatus, {
  errorMap: () => ({ message: 'Invalid project status' }),
});

export const createProjectSchema = z.object({
  customerPO: z.string().min(1, 'Customer PO is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  toolNumber: z.string().min(1, 'Tool number is required'),
  price: z.number().positive('Price must be positive'),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  status: projectStatusEnum.optional(),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  customerPO: z.string().min(1, 'Customer PO is required').optional(),
  partNumber: z.string().min(1, 'Part number is required').optional(),
  toolNumber: z.string().min(1, 'Tool number is required').optional(),
  price: z.number().positive('Price must be positive').optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  status: projectStatusEnum.optional(),
  description: z.string().optional(),
});

