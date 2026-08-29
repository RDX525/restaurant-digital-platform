import { jsonError, jsonOk } from "@/lib/api";
import { PaymentError, handleProviderWebhook } from "@/lib/payment/service";

type Params = { params: Promise<{ provider: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { provider } = await params;
    const rawBody = await request.text();

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result = await handleProviderWebhook(provider, headers, rawBody);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof PaymentError) {
      return jsonError(error, 401);
    }
    return jsonError(error, 400);
  }
}
