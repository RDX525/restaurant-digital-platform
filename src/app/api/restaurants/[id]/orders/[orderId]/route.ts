import { after } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { getOrderForRestaurant, recordToPlacedOrder, updateOrderStatus } from "@/lib/order/data";
import { updateOrderStatusSchema } from "@/lib/order/schemas";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { auditFromAuth } from "@/lib/audit/log";
import { notifyOrderStatusChange } from "@/lib/notification/dispatch";
import { loadRestaurantById } from "@/lib/restaurant/data";
import { DEMO_RESTAURANT_SLUG } from "@/lib/restaurant/demo-data";

type Params = { params: Promise<{ id: string; orderId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, orderId } = await params;
    await guardRestaurantRoute(id, "orders.manage");
    const order = await getOrderForRestaurant(id, orderId);
    if (!order) return jsonError(new Error("Order not found"), 404);
    return jsonOk(recordToPlacedOrder(order, DEMO_RESTAURANT_SLUG, "Demo Restaurant"));
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, orderId } = await params;
    const auth = await guardRestaurantRoute(id, "orders.manage");
    const body = await request.json();
    const parsed = updateOrderStatusSchema.parse(body);

    const updated = await updateOrderStatus(
      id,
      orderId,
      parsed.status,
      parsed.cancellationReason,
    );

    if (!updated) return jsonError(new Error("Order not found"), 404);

    after(async () => {
      try {
        const restaurant = await loadRestaurantById(id, { galleryLimit: 0 });
        await notifyOrderStatusChange(
          updated.record,
          parsed.status,
          restaurant?.name ?? updated.placed.restaurantName,
          parsed.cancellationReason,
        );
        await auditFromAuth(auth, {
          restaurantId: id,
          action: "order.status_updated",
          entityType: "order",
          entityId: orderId,
          metadata: { status: parsed.status },
        });
      } catch (error) {
        console.error("Order status follow-up failed", error);
      }
    });

    return jsonOk(updated.placed);
  } catch (error) {
    return jsonError(error, 400);
  }
}
