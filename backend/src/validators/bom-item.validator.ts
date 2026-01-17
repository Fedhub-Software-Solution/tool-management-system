import { z } from 'zod';

export const createBomItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required').max(255, 'Item name must be less than 255 characters'),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
  unit: z.string().min(1, 'Unit is required').max(50, 'Unit must be less than 50 characters'),
  unitPrice: z.string().min(1, 'Unit price is required').max(100, 'Unit price must be less than 100 characters'),
  supplier: z.string().max(255).optional(),
  partNumber: z.string().max(100).optional(),
  toolNumber: z.string().max(100).optional(),
});

export const updateBomItemSchema = z.object({
  itemName: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(100).optional(),
  unit: z.string().min(1).max(50).optional(),
  unitPrice: z.string().min(1).max(100).optional(),
  supplier: z.string().max(255).optional(),
  partNumber: z.string().max(100).optional(),
  toolNumber: z.string().max(100).optional(),
});

