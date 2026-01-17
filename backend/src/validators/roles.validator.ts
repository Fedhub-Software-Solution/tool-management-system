import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name must be less than 50 characters'),
  description: z.string().optional(),
  permissions: z.array(z.string().max(100)).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string().max(100)).optional(),
  isActive: z.boolean().optional(),
});

