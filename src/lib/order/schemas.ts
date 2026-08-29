import { z } from "zod";

export const orderLineInputSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive().max(99),
  modifierIds: z.array(z.string().uuid()).default([]),
  specialInstructions: z.string().max(500).optional(),
});

export const createOrderSchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
  restaurantSlug: z.string().min(1),
  items: z.array(orderLineInputSchema).min(1).max(50),
  customer: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    phone: z.string().min(1).max(40),
    orderType: z.enum(["pickup", "delivery", "dine_in"]),
    address: z.string().max(500),
    notes: z.string().max(500),
  }),
});

export const initiatePaymentSchema = z.object({
  outcome: z.enum(["success", "failure"]).default("success"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["accepted", "preparing", "ready", "completed", "cancelled"]),
  cancellationReason: z.string().max(500).optional(),
});

export const orderHistoryQuerySchema = z.object({
  email: z.string().email(),
  restaurantSlug: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
});
