import { z } from "zod";
import { ANALYTICS_EVENT_TYPES, DATE_RANGE_PRESETS } from "./constants";

export const recordAnalyticsEventSchema = z.object({
  restaurantSlug: z.string().min(1),
  eventType: z.enum(ANALYTICS_EVENT_TYPES),
  sessionId: z.string().max(128).optional(),
  path: z.string().max(256).optional(),
  menuItemId: z.string().uuid().optional(),
  metadata: z.record(z.string()).optional(),
});

export const analyticsQuerySchema = z.object({
  preset: z.enum(DATE_RANGE_PRESETS).default("7d"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
