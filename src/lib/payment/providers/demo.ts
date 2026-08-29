import type { PaymentProvider, PaymentProviderSessionInput, PaymentProviderSessionResult, PaymentRefundInput, PaymentRefundResult, PaymentWebhookEvent } from "../types";
import { buildWebhookSignatureHeader, verifyWebhookSignature } from "../webhook-signature";
import { getPaymentDemoWebhookSecret } from "../config";

export class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo";

  async createSession(input: PaymentProviderSessionInput): Promise<PaymentProviderSessionResult> {
    return {
      providerSessionId: `demo_sess_${input.orderId.replace(/-/g, "").slice(0, 16)}`,
    };
  }

  verifyWebhookSignature(
    headers: Record<string, string | undefined>,
    rawBody: string,
  ): boolean {
    const signature = headers["x-payment-signature"] ?? headers["X-Payment-Signature"];
    return verifyWebhookSignature(rawBody, signature, getPaymentDemoWebhookSecret());
  }

  parseWebhookEvent(rawBody: string): PaymentWebhookEvent {
    const payload = JSON.parse(rawBody) as PaymentWebhookEvent;
    return payload;
  }

  buildSignedWebhookPayload(event: PaymentWebhookEvent): {
    rawBody: string;
    signature: string;
  } {
    const rawBody = JSON.stringify(event);
    return {
      rawBody,
      signature: buildWebhookSignatureHeader(rawBody),
    };
  }

  async refund(input: PaymentRefundInput): Promise<PaymentRefundResult> {
    return {
      providerRefundId: `demo_ref_${input.providerTransactionId}`,
      status: "succeeded",
    };
  }
}

export function createDemoSuccessEvent(input: {
  eventId: string;
  providerSessionId: string;
  providerTransactionId: string;
  amount: number;
  currency: string;
  orderId: string;
}): PaymentWebhookEvent {
  return {
    eventId: input.eventId,
    type: "payment.succeeded",
    providerSessionId: input.providerSessionId,
    providerTransactionId: input.providerTransactionId,
    amount: input.amount,
    currency: input.currency,
    orderId: input.orderId,
  };
}

export function createDemoFailureEvent(input: {
  eventId: string;
  providerSessionId: string;
  providerTransactionId: string;
  amount: number;
  currency: string;
  orderId: string;
}): PaymentWebhookEvent {
  return {
    eventId: input.eventId,
    type: "payment.failed",
    providerSessionId: input.providerSessionId,
    providerTransactionId: input.providerTransactionId,
    amount: input.amount,
    currency: input.currency,
    orderId: input.orderId,
  };
}

export function createDemoRefundEvent(input: {
  eventId: string;
  providerSessionId: string;
  providerTransactionId: string;
  amount: number;
  currency: string;
  orderId: string;
}): PaymentWebhookEvent {
  return {
    eventId: input.eventId,
    type: "payment.refunded",
    providerSessionId: input.providerSessionId,
    providerTransactionId: input.providerTransactionId,
    amount: input.amount,
    currency: input.currency,
    orderId: input.orderId,
  };
}
