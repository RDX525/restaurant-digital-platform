import { jsonError, jsonOk } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth/api-auth";
import { getActiveRestaurantSummary } from "@/lib/auth/active-restaurant";

export async function GET() {
  try {
    const auth = await requireApiAuth();
    const restaurant = await getActiveRestaurantSummary(auth);
    return jsonOk(restaurant);
  } catch (error) {
    return jsonError(error, 500);
  }
}
