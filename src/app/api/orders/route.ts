import { cookies } from "next/headers";
import { jsonError, jsonOk } from "@/lib/api";
import { createOrder, listOrdersForCustomer } from "@/lib/order/data";
import { OrderValidationError } from "@/lib/order/pricing";
import { createOrderSchema, orderHistoryQuerySchema } from "@/lib/order/schemas";
import { createPaymentSessionForOrder } from "@/lib/payment/service";
import { TABLE_SESSION_COOKIE } from "@/lib/table/session";
import { loadRestaurantBySlug } from "@/lib/restaurant/data";
import { isProductionRuntime } from "@/lib/env/runtime";
import {
  createOrderHistoryAccessToken,
  createPaymentSessionAccessToken,
  verifyOrderHistoryAccessToken,
} from "@/lib/security/access-tokens";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, {
    scope: "orders-history",
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const url = new URL(request.url);
    const parsed = orderHistoryQuerySchema.parse({
      email: url.searchParams.get("email"),
      restaurantSlug: url.searchParams.get("restaurantSlug") ?? undefined,
      accessToken: url.searchParams.get("accessToken") ?? undefined,
    });

    if (isProductionRuntime()) {
      if (!parsed.restaurantSlug || !parsed.accessToken) {
        return jsonError(new Error("Access token required."), 401);
      }
      if (
        !verifyOrderHistoryAccessToken(
          parsed.accessToken,
          parsed.email,
          parsed.restaurantSlug,
        )
      ) {
        return jsonError(new Error("Invalid or expired access token."), 403);
      }
    }

    const orders = await listOrdersForCustomer(parsed.email, parsed.restaurantSlug);
    return jsonOk(orders);
  } catch (error) {
    return jsonError(error, 400);
  }
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, {
    scope: "orders-create",
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = createOrderSchema.parse(body);

    const restaurant = await loadRestaurantBySlug(parsed.restaurantSlug);
    if (!restaurant) {
      return jsonError(new OrderValidationError("Restaurant not found."), 404);
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(TABLE_SESSION_COOKIE)?.value ?? null;

    const order = await createOrder(
      {
        idempotencyKey: parsed.idempotencyKey,
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        restaurantName: restaurant.name,
        orderType: parsed.customer.orderType,
        customer: parsed.customer,
        items: parsed.items,
      },
      sessionToken,
    );

    const paymentSession = await createPaymentSessionForOrder({
      orderId: order.id,
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      amount: order.totals.total,
      idempotencyKey: parsed.idempotencyKey,
      customerEmail: parsed.customer.email,
    });

    return jsonOk(
      {
        order: { ...order, paymentSessionId: paymentSession.id, paymentStatus: "pending" as const },
        paymentSession,
        orderHistoryAccessToken: createOrderHistoryAccessToken(
          parsed.customer.email,
          restaurant.slug,
        ),
        paymentSessionAccessToken: createPaymentSessionAccessToken(paymentSession.id),
      },
      201,
    );
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return jsonError(error, 422);
    }
    return jsonError(error, 400);
  }
}
