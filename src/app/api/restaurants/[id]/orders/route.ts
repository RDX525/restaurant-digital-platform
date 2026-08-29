import { jsonError, jsonOk } from "@/lib/api";
import { listOrdersForRestaurant, recordToPlacedOrder } from "@/lib/order/data";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { loadRestaurantById } from "@/lib/restaurant/data";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const restaurant = await loadRestaurantById(id);
    if (!restaurant) {
      return jsonError(new Error("Restaurant not found"), 404);
    }

    const orders = await listOrdersForRestaurant(id);
    return jsonOk(
      orders.map((order) =>
        recordToPlacedOrder(order, restaurant.slug, restaurant.name),
      ),
    );
  } catch (error) {
    return jsonError(error, 500);
  }
}
