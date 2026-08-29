import { jsonError, jsonOk } from "@/lib/api";
import { listReservationsForRestaurant } from "@/lib/reservation/data";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const reservations = await listReservationsForRestaurant(id);
    return jsonOk(reservations);
  } catch (error) {
    return jsonError(error, 500);
  }
}
