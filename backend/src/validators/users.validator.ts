import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Invalid role' }),
  }).optional(),
  isActive: z.boolean().optional(),
});

