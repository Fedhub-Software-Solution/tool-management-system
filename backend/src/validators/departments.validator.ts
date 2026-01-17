import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100, 'Department name must be less than 100 characters'),
  head: z.string().min(1, 'Department head is required').max(255, 'Department head must be less than 255 characters'),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  head: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

