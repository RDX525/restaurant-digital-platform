import { z } from "zod";

export const customerSearchSchema = z.object({
  q: z.string().max(120).optional(),
});
