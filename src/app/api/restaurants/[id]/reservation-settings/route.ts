import { jsonError, jsonOk } from "@/lib/api";
import {
  loadReservationSettings,
  saveReservationSettings,
} from "@/lib/reservation/data";
import { reservationSettingsSchema } from "@/lib/reservation/schemas";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const settings = await loadReservationSettings(id);
    if (!settings) return jsonError(new Error("Settings not found"), 404);
    return jsonOk(settings);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const body = await request.json();
    const parsed = reservationSettingsSchema.parse(body);

    const settings = await saveReservationSettings(id, {
      timezone: parsed.timezone,
      reservation_hours: parsed.reservation_hours,
      max_party_size: parsed.max_party_size,
      booking_advance_days: parsed.booking_advance_days,
      booking_min_notice_hours: parsed.booking_min_notice_hours,
      slot_interval_minutes: parsed.slot_interval_minutes,
      max_covers_per_slot: parsed.max_covers_per_slot,
    });

    return jsonOk(settings);
  } catch (error) {
    return jsonError(error, 400);
  }
}
