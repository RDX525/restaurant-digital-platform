import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { PAYMENT_SESSION_TTL_MS } from "./constants";
import {
  createDemoPaymentSession,
  createDemoPaymentTransaction,
  getDemoPaymentSessionById,
  getDemoPaymentSessionByProviderId,
  hasProcessedDemoWebhookEvent,
  markDemoWebhookEventProcessed,
  updateDemoPaymentSessionStatus,
} from "./demo-store";
import type { PaymentSessionStatus, PaymentTransactionStatus, PaymentTransactionType } from "./constants";
import type {
  PaymentSessionRecord,
  PaymentTransactionRecord,
} from "./types";

function shouldUseDemoStore(restaurantId: string): boolean {
  return isDemoRestaurantId(restaurantId) && !isSupabaseConfigured();
}

export async function insertPaymentSession(input: {
  orderId: string;
  restaurantId: string;
  provider: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  providerSessionId: string;
}): Promise<PaymentSessionRecord> {
  if (shouldUseDemoStore(input.restaurantId)) {
    return createDemoPaymentSession(input);
  }

  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + PAYMENT_SESSION_TTL_MS).toISOString();

  const { data: existing } = await supabase
    .from("payment_sessions")
    .select("*")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) return mapSessionRow(existing);

  const { data, error } = await supabase
    .from("payment_sessions")
    .insert({
      order_id: input.orderId,
      restaurant_id: input.restaurantId,
      provider: input.provider,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      provider_session_id: input.providerSessionId,
      idempotency_key: input.idempotencyKey,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSessionRow(data);
}

export async function getPaymentSessionById(sessionId: string): Promise<PaymentSessionRecord | null> {
  if (!isSupabaseConfigured()) {
    return getDemoPaymentSessionById(sessionId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  return data ? mapSessionRow(data) : getDemoPaymentSessionById(sessionId);
}

export async function getPaymentSessionByProviderId(
  providerSessionId: string,
): Promise<PaymentSessionRecord | null> {
  if (!isSupabaseConfigured()) {
    return getDemoPaymentSessionByProviderId(providerSessionId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_sessions")
    .select("*")
    .eq("provider_session_id", providerSessionId)
    .maybeSingle();

  return data ? mapSessionRow(data) : getDemoPaymentSessionByProviderId(providerSessionId);
}

export async function updatePaymentSessionStatus(
  sessionId: string,
  status: PaymentSessionStatus,
): Promise<PaymentSessionRecord | null> {
  if (!isSupabaseConfigured()) {
    return updateDemoPaymentSessionStatus(sessionId, status);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_sessions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return data ? mapSessionRow(data) : null;
}

export async function getPaymentSessionByOrderId(
  orderId: string,
): Promise<PaymentSessionRecord | null> {
  if (!isSupabaseConfigured()) {
    const { getDemoPaymentSessionByOrderId } = await import("./demo-store");
    return getDemoPaymentSessionByOrderId(orderId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_sessions")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return mapSessionRow(data);

  const { getDemoPaymentSessionByOrderId } = await import("./demo-store");
  return getDemoPaymentSessionByOrderId(orderId);
}

export async function insertPaymentTransaction(input: {
  paymentSessionId: string;
  orderId: string;
  provider: string;
  providerTransactionId: string;
  transactionType: PaymentTransactionType;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
}): Promise<PaymentTransactionRecord> {
  if (!isSupabaseConfigured()) {
    return createDemoPaymentTransaction(input);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .insert({
      payment_session_id: input.paymentSessionId,
      order_id: input.orderId,
      provider: input.provider,
      provider_transaction_id: input.providerTransactionId,
      transaction_type: input.transactionType,
      status: input.status,
      amount: input.amount,
      currency: input.currency,
    })
    .select()
    .single();

  if (error) throw error;
  return mapTransactionRow(data);
}

export async function recordWebhookEvent(input: {
  provider: string;
  eventId: string;
  eventType: string;
  paymentSessionId?: string;
  orderId?: string;
  payload: Record<string, unknown>;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    if (hasProcessedDemoWebhookEvent(input.provider, input.eventId)) return false;
    markDemoWebhookEventProcessed(input.provider, input.eventId);
    return true;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payment_webhook_events").insert({
    provider: input.provider,
    event_id: input.eventId,
    event_type: input.eventType,
    payment_session_id: input.paymentSessionId ?? null,
    order_id: input.orderId ?? null,
    payload: input.payload,
  });

  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

function mapSessionRow(row: Record<string, unknown>): PaymentSessionRecord {
  return {
    id: row.id as string,
    order_id: row.order_id as string,
    restaurant_id: row.restaurant_id as string,
    provider: row.provider as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    status: row.status as PaymentSessionStatus,
    provider_session_id: (row.provider_session_id as string) ?? null,
    idempotency_key: (row.idempotency_key as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    expires_at: (row.expires_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapTransactionRow(row: Record<string, unknown>): PaymentTransactionRecord {
  return {
    id: row.id as string,
    payment_session_id: row.payment_session_id as string,
    order_id: row.order_id as string,
    provider: row.provider as string,
    provider_transaction_id: row.provider_transaction_id as string,
    transaction_type: row.transaction_type as PaymentTransactionRecord["transaction_type"],
    status: row.status as PaymentTransactionRecord["status"],
    amount: Number(row.amount),
    currency: row.currency as string,
    created_at: row.created_at as string,
  };
}
