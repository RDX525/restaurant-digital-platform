import { z } from "zod";
import { guestEmailSchema, guestPhoneInputSchema } from "@/lib/validation/guest-contact";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createReservationSchema = z.object({
  guestName: z.string().trim().min(1).max(120),
  guestEmail: guestEmailSchema,
  guestPhone: guestPhoneInputSchema,
  guestCount: z.number().int().positive().max(100),
  date: z.string().regex(dateRegex, "Invalid date format"),
  time: z.string().regex(timeRegex, "Invalid time format"),
  specialRequest: z.string().max(500).optional(),
});

export const updateReservationStatusSchema = z.object({
  action: z.enum(["confirm", "reject", "cancel", "complete", "no_show"]),
  cancellationReason: z.string().max(500).optional(),
});

export const rescheduleReservationSchema = z.object({
  date: z.string().regex(dateRegex),
  time: z.string().regex(timeRegex),
});

export const reservationSettingsSchema = z.object({
  timezone: z.string().min(1).max(64),
  reservation_hours: z.record(
    z.object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
      closed: z.boolean(),
    }),
  ),
  max_party_size: z.number().int().positive().max(100),
  booking_advance_days: z.number().int().min(1).max(365),
  booking_min_notice_hours: z.number().int().min(0).max(168),
  slot_interval_minutes: z.number().int().min(15).max(120),
  max_covers_per_slot: z.number().int().positive().max(500),
});

export const availabilityQuerySchema = z.object({
  date: z.string().regex(dateRegex),
  guestCount: z.coerce.number().int().positive().max(100).default(2),
});
