import { jsonError, jsonOk } from "@/lib/api";
import { PaymentError, initiateDemoProviderRefund } from "@/lib/payment/service";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string; orderId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id, orderId } = await params;
    await guardRestaurantRoute(id);

    await initiateDemoProviderRefund({ orderId, restaurantId: id });
    return jsonOk({ status: "refunded" });
  } catch (error) {
    if (error instanceof PaymentError) {
      return jsonError(error, 422);
    }
    return jsonError(error, 400);
  }
}
