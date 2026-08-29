import type {
  PaymentSessionStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
  PaymentWebhookEventType,
} from "./constants";

export interface PaymentProviderSessionInput {
  orderId: string;
  restaurantId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

export interface PaymentProviderSessionResult {
  providerSessionId: string;
  checkoutUrl?: string;
  clientSecret?: string;
}

export interface PaymentWebhookEvent {
  eventId: string;
  type: PaymentWebhookEventType;
  providerSessionId: string;
  providerTransactionId: string;
  amount: number;
  currency: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentRefundInput {
  providerTransactionId: string;
  providerSessionId: string;
  amount: number;
  currency: string;
  reason?: string;
}

export interface PaymentRefundResult {
  providerRefundId: string;
  status: PaymentTransactionStatus;
}

export interface PaymentProvider {
  readonly name: string;
  createSession(input: PaymentProviderSessionInput): Promise<PaymentProviderSessionResult>;
  verifyWebhookSignature(
    headers: Record<string, string | undefined>,
    rawBody: string,
  ): boolean;
  parseWebhookEvent(
    rawBody: string,
    headers?: Record<string, string | undefined>,
  ): PaymentWebhookEvent;
  refund?(input: PaymentRefundInput): Promise<PaymentRefundResult>;
}

export interface PaymentSessionRecord {
  id: string;
  order_id: string;
  restaurant_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentSessionStatus;
  provider_session_id: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionRecord {
  id: string;
  payment_session_id: string;
  order_id: string;
  provider: string;
  provider_transaction_id: string;
  transaction_type: PaymentTransactionType;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
  created_at: string;
}

export interface PaymentSessionView {
  id: string;
  orderId: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentSessionStatus;
  expiresAt: string | null;
  checkoutUrl?: string;
}

export interface CreateOrderPaymentResult {
  paymentSession: PaymentSessionView;
}
