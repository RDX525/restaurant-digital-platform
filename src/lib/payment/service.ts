import { getOrderById as getOrderByIdFromData, updateOrderPaymentStatus as updateOrderPaymentStatusFromData } from "@/lib/order/data";
import { getPaymentProvider, getDemoPaymentProvider } from "./providers";
import {
  getPaymentSessionById,
  getPaymentSessionByOrderId,
  getPaymentSessionByProviderId,
  insertPaymentSession,
  insertPaymentTransaction,
  recordWebhookEvent,
  updatePaymentSessionStatus,
} from "./data";
import {
  createDemoFailureEvent,
  createDemoRefundEvent,
  createDemoSuccessEvent,
} from "./providers/demo";
import type {
  PaymentSessionView,
  PaymentWebhookEvent,
} from "./types";

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

function toSessionView(session: {
  id: string;
  order_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentSessionView["status"];
  expires_at: string | null;
}): PaymentSessionView {
  return {
    id: session.id,
    orderId: session.order_id,
    provider: session.provider,
    amount: session.amount,
    currency: session.currency,
    status: session.status,
    expiresAt: session.expires_at,
  };
}

export async function createPaymentSessionForOrder(input: {
  orderId: string;
  restaurantId: string;
  restaurantSlug?: string;
  amount: number;
  currency?: string;
  idempotencyKey: string;
  customerEmail: string;
}): Promise<PaymentSessionView> {
  const provider = getPaymentProvider();
  const currency = input.currency ?? "NZD";

  const providerSession = await provider.createSession({
    orderId: input.orderId,
    restaurantId: input.restaurantId,
    amount: input.amount,
    currency,
    idempotencyKey: input.idempotencyKey,
    customerEmail: input.customerEmail,
    metadata: input.restaurantSlug
      ? { restaurantSlug: input.restaurantSlug }
      : undefined,
  });

  const session = await insertPaymentSession({
    orderId: input.orderId,
    restaurantId: input.restaurantId,
    provider: provider.name,
    amount: input.amount,
    currency,
    idempotencyKey: `${input.idempotencyKey}:payment`,
    providerSessionId: providerSession.providerSessionId,
  });

  return {
    ...toSessionView(session),
    checkoutUrl: providerSession.checkoutUrl,
  };
}

export async function getPaymentSessionView(sessionId: string): Promise<PaymentSessionView | null> {
  const session = await getPaymentSessionById(sessionId);
  return session ? toSessionView(session) : null;
}

export async function processVerifiedWebhook(
  providerName: string,
  event: PaymentWebhookEvent,
): Promise<{ processed: boolean; orderId?: string }> {
  const session =
    await getPaymentSessionByProviderId(event.providerSessionId);

  if (!session) {
    throw new PaymentError("Payment session not found for webhook event.");
  }

  if (session.amount !== event.amount || session.currency !== event.currency) {
    throw new PaymentError("Webhook amount does not match payment session.");
  }

  const isNew = await recordWebhookEvent({
    provider: providerName,
    eventId: event.eventId,
    eventType: event.type,
    paymentSessionId: session.id,
    orderId: session.order_id,
    payload: event as unknown as Record<string, unknown>,
  });

  if (!isNew) {
    return { processed: false, orderId: session.order_id };
  }

  switch (event.type) {
    case "payment.succeeded":
      await updatePaymentSessionStatus(session.id, "succeeded");
      await insertPaymentTransaction({
        paymentSessionId: session.id,
        orderId: session.order_id,
        provider: providerName,
        providerTransactionId: event.providerTransactionId,
        transactionType: "charge",
        status: "succeeded",
        amount: event.amount,
        currency: event.currency,
      });
      await updateOrderPaymentStatusFromData(session.order_id, "paid");
      break;

    case "payment.failed":
      await updatePaymentSessionStatus(session.id, "failed");
      await insertPaymentTransaction({
        paymentSessionId: session.id,
        orderId: session.order_id,
        provider: providerName,
        providerTransactionId: event.providerTransactionId,
        transactionType: "charge",
        status: "failed",
        amount: event.amount,
        currency: event.currency,
      });
      await updateOrderPaymentStatusFromData(session.order_id, "failed");
      break;

    case "payment.refunded":
      await insertPaymentTransaction({
        paymentSessionId: session.id,
        orderId: session.order_id,
        provider: providerName,
        providerTransactionId: event.providerTransactionId,
        transactionType: "refund",
        status: "succeeded",
        amount: event.amount,
        currency: event.currency,
      });
      await updateOrderPaymentStatusFromData(session.order_id, "refunded");
      break;
  }

  return { processed: true, orderId: session.order_id };
}

export async function handleProviderWebhook(
  providerName: string,
  headers: Record<string, string | undefined>,
  rawBody: string,
): Promise<{ processed: boolean; orderId?: string }> {
  const provider = getPaymentProvider();
  if (provider.name !== providerName) {
    throw new PaymentError("Payment provider mismatch.");
  }

  if (!provider.verifyWebhookSignature(headers, rawBody)) {
    throw new PaymentError("Invalid webhook signature.");
  }

  const event = provider.parseWebhookEvent(rawBody, headers);
  return processVerifiedWebhook(providerName, event);
}

export async function initiateDemoProviderCharge(input: {
  sessionId: string;
  outcome: "success" | "failure";
}): Promise<void> {
  const demoProvider = getDemoPaymentProvider();
  const session = await getPaymentSessionById(input.sessionId);

  if (!session) throw new PaymentError("Payment session not found.");
  if (session.status !== "pending") {
    throw new PaymentError("Payment session is not payable.");
  }

  if (session.expires_at && new Date(session.expires_at).getTime() <= Date.now()) {
    throw new PaymentError("Payment session has expired.");
  }

  await updatePaymentSessionStatus(session.id, "processing");

  const order = await getOrderByIdFromData(session.order_id);
  if (!order) throw new PaymentError("Order not found for payment session.");

  const eventId = `demo_evt_${crypto.randomUUID()}`;
  const providerTransactionId = `demo_txn_${crypto.randomUUID()}`;

  const event =
    input.outcome === "success"
      ? createDemoSuccessEvent({
          eventId,
          providerSessionId: session.provider_session_id!,
          providerTransactionId,
          amount: session.amount,
          currency: session.currency,
          orderId: session.order_id,
        })
      : createDemoFailureEvent({
          eventId,
          providerSessionId: session.provider_session_id!,
          providerTransactionId,
          amount: session.amount,
          currency: session.currency,
          orderId: session.order_id,
        });

  const { rawBody, signature } = demoProvider.buildSignedWebhookPayload(event);
  await handleProviderWebhook("demo", { "x-payment-signature": signature }, rawBody);
}

export async function initiateDemoProviderRefund(input: {
  orderId: string;
  restaurantId: string;
}): Promise<void> {
  const order = await getOrderByIdFromData(input.orderId);
  if (!order || order.restaurant_id !== input.restaurantId) {
    throw new PaymentError("Order not found.");
  }
  if (order.payment_status !== "paid") {
    throw new PaymentError("Only paid orders can be refunded.");
  }

  const demoProvider = getDemoPaymentProvider();
  const session = await getPaymentSessionByOrderId(input.orderId);
  const providerSessionId = session?.provider_session_id ?? `demo_sess_${input.orderId.slice(0, 8)}`;
  const chargeTxnId = `demo_txn_${input.orderId.slice(0, 8)}`;

  const event = createDemoRefundEvent({
    eventId: `demo_ref_evt_${crypto.randomUUID()}`,
    providerSessionId,
    providerTransactionId: `demo_ref_${crypto.randomUUID()}`,
    amount: order.total,
    currency: "NZD",
    orderId: input.orderId,
  });

  if (demoProvider.refund) {
    await demoProvider.refund({
      providerTransactionId: chargeTxnId,
      providerSessionId,
      amount: order.total,
      currency: "NZD",
    });
  }

  const { rawBody, signature } = demoProvider.buildSignedWebhookPayload(event);
  await handleProviderWebhook("demo", { "x-payment-signature": signature }, rawBody);
}

export async function simulateWebhookForTests(
  providerName: string,
  headers: Record<string, string | undefined>,
  rawBody: string,
): Promise<{ processed: boolean; orderId?: string }> {
  return handleProviderWebhook(providerName, headers, rawBody);
}

// Re-export for tests
export { createDemoSuccessEvent, createDemoFailureEvent };
