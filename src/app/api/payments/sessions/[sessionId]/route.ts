import { jsonError, jsonOk } from "@/lib/api";
import { getPaymentSessionView } from "@/lib/payment/service";
import { getOrderById } from "@/lib/order/data";
import { isProductionRuntime } from "@/lib/env/runtime";
import { verifyPaymentSessionAccessToken } from "@/lib/security/access-tokens";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(request: Request, { params }: Params) {
  const limited = await enforceRateLimit(request, {
    scope: "payment-session-read",
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const { sessionId } = await params;

    if (isProductionRuntime()) {
      const accessToken = new URL(request.url).searchParams.get("accessToken");
      if (!accessToken || !verifyPaymentSessionAccessToken(accessToken, sessionId)) {
        return jsonError(new Error("Access token required."), 403);
      }
    }

    const session = await getPaymentSessionView(sessionId);
    if (!session) {
      return jsonError(new Error("Payment session not found"), 404);
    }

    const order = await getOrderById(session.orderId);

    return jsonOk({
      session,
      orderPaymentStatus: order?.payment_status ?? "pending",
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}
