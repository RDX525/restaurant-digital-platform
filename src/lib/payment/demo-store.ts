import { PAYMENT_SESSION_TTL_MS } from "./constants";
import type { PaymentSessionStatus, PaymentTransactionStatus, PaymentTransactionType } from "./constants";
import type {
  PaymentSessionRecord,
  PaymentTransactionRecord,
} from "./types";

let sessions: PaymentSessionRecord[] = [];
let transactions: PaymentTransactionRecord[] = [];
const processedWebhookEvents = new Set<string>();

export function resetDemoPaymentStore(): void {
  sessions = [];
  transactions = [];
  processedWebhookEvents.clear();
}

export function getDemoPaymentSessions(): PaymentSessionRecord[] {
  return structuredClone(sessions);
}

export function createDemoPaymentSession(input: {
  orderId: string;
  restaurantId: string;
  provider: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  providerSessionId: string;
}): PaymentSessionRecord {
  const existing = sessions.find((s) => s.idempotency_key === input.idempotencyKey);
  if (existing) return existing;

  const now = new Date();
  const session: PaymentSessionRecord = {
    id: crypto.randomUUID(),
    order_id: input.orderId,
    restaurant_id: input.restaurantId,
    provider: input.provider,
    amount: input.amount,
    currency: input.currency,
    status: "pending",
    provider_session_id: input.providerSessionId,
    idempotency_key: input.idempotencyKey,
    metadata: {},
    expires_at: new Date(now.getTime() + PAYMENT_SESSION_TTL_MS).toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
  sessions.push(session);
  return session;
}

export function getDemoPaymentSessionById(sessionId: string): PaymentSessionRecord | null {
  return sessions.find((s) => s.id === sessionId) ?? null;
}

export function getDemoPaymentSessionByProviderId(
  providerSessionId: string,
): PaymentSessionRecord | null {
  return sessions.find((s) => s.provider_session_id === providerSessionId) ?? null;
}

export function updateDemoPaymentSessionStatus(
  sessionId: string,
  status: PaymentSessionStatus,
): PaymentSessionRecord | null {
  const session = getDemoPaymentSessionById(sessionId);
  if (!session) return null;
  session.status = status;
  session.updated_at = new Date().toISOString();
  return session;
}

export function getDemoPaymentSessionByOrderId(orderId: string): PaymentSessionRecord | null {
  return sessions.find((s) => s.order_id === orderId) ?? null;
}

export function createDemoPaymentTransaction(input: {
  paymentSessionId: string;
  orderId: string;
  provider: string;
  providerTransactionId: string;
  transactionType: PaymentTransactionType;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
}): PaymentTransactionRecord {
  const transaction: PaymentTransactionRecord = {
    id: crypto.randomUUID(),
    payment_session_id: input.paymentSessionId,
    order_id: input.orderId,
    provider: input.provider,
    provider_transaction_id: input.providerTransactionId,
    transaction_type: input.transactionType,
    status: input.status,
    amount: input.amount,
    currency: input.currency,
    created_at: new Date().toISOString(),
  };
  transactions.push(transaction);
  return transaction;
}

export function hasProcessedDemoWebhookEvent(provider: string, eventId: string): boolean {
  return processedWebhookEvents.has(`${provider}:${eventId}`);
}

export function markDemoWebhookEventProcessed(provider: string, eventId: string): void {
  processedWebhookEvents.add(`${provider}:${eventId}`);
}

export function getDemoTransactionsForOrder(orderId: string): PaymentTransactionRecord[] {
  return transactions.filter((t) => t.order_id === orderId);
}

export function getDemoChargeTransaction(orderId: string): PaymentTransactionRecord | null {
  return (
    transactions.find(
      (t) => t.order_id === orderId && t.transaction_type === "charge" && t.status === "succeeded",
    ) ?? null
  );
}
