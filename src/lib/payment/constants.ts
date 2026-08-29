export const PAYMENT_SESSION_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export const PAYMENT_TRANSACTION_TYPES = ["charge", "refund"] as const;

export const PAYMENT_TRANSACTION_STATUSES = ["pending", "succeeded", "failed"] as const;

export const PAYMENT_WEBHOOK_EVENT_TYPES = [
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
] as const;

export type PaymentSessionStatus = (typeof PAYMENT_SESSION_STATUSES)[number];
export type PaymentTransactionType = (typeof PAYMENT_TRANSACTION_TYPES)[number];
export type PaymentTransactionStatus = (typeof PAYMENT_TRANSACTION_STATUSES)[number];
export type PaymentWebhookEventType = (typeof PAYMENT_WEBHOOK_EVENT_TYPES)[number];

export const PAYMENT_SESSION_TTL_MS = 30 * 60 * 1000;
