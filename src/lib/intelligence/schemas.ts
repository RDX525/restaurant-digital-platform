import { z } from "zod";
import { INSIGHT_TYPES } from "./constants";

export const askRestaurantSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

export const menuDescriptionSchema = z.object({
  itemName: z.string().trim().min(1).max(120),
  category: z.string().trim().max(120).optional(),
  ingredients: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
  tone: z.enum(["friendly", "elegant", "casual"]).default("friendly"),
});

export const insightsQuerySchema = z.object({
  type: z.enum(INSIGHT_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const toolPresetSchema = z.enum(["today", "yesterday", "7d", "30d", "custom"]);

export const salesSummaryParamsSchema = z.object({
  preset: toolPresetSchema.default("7d"),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const topItemsParamsSchema = z.object({
  preset: toolPresetSchema.default("7d"),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const salesTrendsParamsSchema = z.object({
  weeks: z.coerce.number().int().min(1).max(12).default(4),
});
