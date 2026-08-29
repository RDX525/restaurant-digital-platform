import { z } from "zod";

export const createTableSchema = z.object({
  label: z.string().min(1).max(64),
  location_id: z.string().uuid().optional(),
});

export const updateTableSchema = z.object({
  label: z.string().min(1).max(64).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const dineInOrderSessionSchema = z.object({
  sessionToken: z.string().min(16),
});
