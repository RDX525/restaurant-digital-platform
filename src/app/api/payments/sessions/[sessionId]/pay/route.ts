import { jsonError, jsonOk } from "@/lib/api";
import { PaymentError, initiateDemoProviderCharge } from "@/lib/payment/service";
import { initiatePaymentSchema } from "@/lib/order/schemas";
import { isDemoPaymentProvider } from "@/lib/payment/config";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    if (!isDemoPaymentProvider()) {
      return jsonError(new Error("Direct pay endpoint is only available for the demo provider."), 501);
    }

    const { sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = initiatePaymentSchema.parse(body);

    await initiateDemoProviderCharge({
      sessionId,
      outcome: parsed.outcome,
    });

    return jsonOk({ status: "processing" });
  } catch (error) {
    if (error instanceof PaymentError) {
      return jsonError(error, 422);
    }
    return jsonError(error, 400);
  }
}
