import { jsonError, jsonOk } from "@/lib/api";
import { createReservation } from "@/lib/reservation/data";
import { createReservationSchema } from "@/lib/reservation/schemas";
import { ReservationValidationError } from "@/lib/reservation/availability";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, {
    scope: "reservations-create",
    limit: 15,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = createReservationSchema.parse({
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      guestPhone: body.guestPhone,
      guestCount: body.guestCount,
      date: body.date,
      time: body.time,
      specialRequest: body.specialRequest,
    });

    const restaurantSlug = body.restaurantSlug;
    if (!restaurantSlug || typeof restaurantSlug !== "string") {
      return jsonError(new Error("restaurantSlug is required"), 422);
    }

    const reservation = await createReservation(restaurantSlug, {
      guestName: parsed.guestName,
      guestEmail: parsed.guestEmail,
      guestPhone: parsed.guestPhone,
      guestCount: parsed.guestCount,
      date: parsed.date,
      time: parsed.time,
      specialRequest: parsed.specialRequest,
    });

    return jsonOk(reservation, 201);
  } catch (error) {
    if (error instanceof ReservationValidationError) {
      return jsonError(error, 422);
    }
    return jsonError(error, 400);
  }
}
