import { jsonError, jsonOk } from "@/lib/api";
import { getAvailabilityForRestaurant } from "@/lib/reservation/data";
import { availabilityQuerySchema } from "@/lib/reservation/schemas";
import { ReservationValidationError } from "@/lib/reservation/availability";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const restaurantSlug = url.searchParams.get("restaurantSlug");
    if (!restaurantSlug) {
      return jsonError(new Error("restaurantSlug is required"), 422);
    }

    const parsed = availabilityQuerySchema.parse({
      date: url.searchParams.get("date"),
      guestCount: url.searchParams.get("guestCount") ?? undefined,
    });

    const availability = await getAvailabilityForRestaurant(
      restaurantSlug,
      parsed.date,
      parsed.guestCount,
    );

    return jsonOk(availability);
  } catch (error) {
    if (error instanceof ReservationValidationError) {
      return jsonError(error, 422);
    }
    return jsonError(error, 400);
  }
}
