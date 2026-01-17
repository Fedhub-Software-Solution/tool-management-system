import { z } from 'zod';

export const createPartNumberConfigSchema = z.object({
  prefix: z.string().min(1, 'Prefix is required').max(50, 'Prefix must be less than 50 characters'),
  format: z.string().min(1, 'Format is required').max(100, 'Format must be less than 100 characters'),
  autoIncrement: z.boolean().optional(),
});

export const updatePartNumberConfigSchema = z.object({
  prefix: z.string().min(1).max(50).optional(),
  format: z.string().min(1).max(100).optional(),
  autoIncrement: z.boolean().optional(),
});

