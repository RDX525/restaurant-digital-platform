import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import {
  getDemoCustomerPreferences,
  getDemoRestaurantPreferences,
  insertDemoNotificationLog,
  listDemoNotificationLogsForRestaurant,
  listDemoRetryableLogs,
  updateDemoNotificationLog,
  upsertDemoCustomerPreferences,
  updateDemoRestaurantPreferences,
} from "./demo-store";
import { createDefaultRestaurantPreferences } from "./preferences";
import type {
  NotificationLogRecord,
  NotificationPreferences,
  PublicNotificationLog,
  PublicNotificationPreferences,
} from "./types";

function shouldUseDemoStore(restaurantId: string): boolean {
  return isDemoRestaurantId(restaurantId) && !isSupabaseConfigured();
}

function mapPreferencesRow(row: Record<string, unknown>): NotificationPreferences {
  return {
    id: row.id as string,
    restaurant_id: row.restaurant_id as string,
    scope: row.scope as NotificationPreferences["scope"],
    customer_email: (row.customer_email as string | null) ?? null,
    email_enabled: row.email_enabled as boolean,
    sms_enabled: row.sms_enabled as boolean,
    type_overrides: (row.type_overrides as NotificationPreferences["type_overrides"]) ?? {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapLogRow(row: Record<string, unknown>): NotificationLogRecord {
  return {
    id: row.id as string,
    restaurant_id: row.restaurant_id as string,
    entity_type: row.entity_type as NotificationLogRecord["entity_type"],
    entity_id: row.entity_id as string,
    notification_type: row.notification_type as NotificationLogRecord["notification_type"],
    channel: row.channel as NotificationLogRecord["channel"],
    recipient: row.recipient as string,
    subject: (row.subject as string | null) ?? null,
    body: row.body as string,
    status: row.status as NotificationLogRecord["status"],
    provider: row.provider as string,
    provider_message_id: (row.provider_message_id as string | null) ?? null,
    error_message: (row.error_message as string | null) ?? null,
    retry_count: Number(row.retry_count ?? 0),
    max_retries: Number(row.max_retries ?? 3),
    next_retry_at: (row.next_retry_at as string | null) ?? null,
    idempotency_key: row.idempotency_key as string,
    sent_at: (row.sent_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapPublicLog(record: NotificationLogRecord): PublicNotificationLog {
  return {
    id: record.id,
    entityType: record.entity_type,
    entityId: record.entity_id,
    notificationType: record.notification_type,
    channel: record.channel,
    recipient: record.recipient,
    subject: record.subject,
    status: record.status,
    provider: record.provider,
    errorMessage: record.error_message,
    retryCount: record.retry_count,
    sentAt: record.sent_at,
    createdAt: record.created_at,
  };
}

export async function loadRestaurantNotificationPreferences(
  restaurantId: string,
): Promise<NotificationPreferences> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    if (!isDemoRestaurantId(restaurantId)) {
      throw new Error("Restaurant not found");
    }
    return getDemoRestaurantPreferences(restaurantId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("scope", "restaurant")
    .maybeSingle();

  if (error) throw error;
  return data ? mapPreferencesRow(data) : createDefaultRestaurantPreferences(restaurantId);
}

export async function loadCustomerNotificationPreferences(
  restaurantId: string,
  customerEmail: string,
): Promise<NotificationPreferences | null> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? getDemoCustomerPreferences(restaurantId, customerEmail)
      : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("scope", "customer")
    .eq("customer_email", customerEmail.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data ? mapPreferencesRow(data) : null;
}

export async function saveRestaurantNotificationPreferences(
  restaurantId: string,
  patch: PublicNotificationPreferences,
): Promise<NotificationPreferences> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    if (!isDemoRestaurantId(restaurantId)) throw new Error("Restaurant not found");
    return updateDemoRestaurantPreferences(restaurantId, {
      email_enabled: patch.emailEnabled,
      sms_enabled: patch.smsEnabled,
      type_overrides: patch.typeOverrides,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert({
      restaurant_id: restaurantId,
      scope: "restaurant",
      customer_email: null,
      email_enabled: patch.emailEnabled,
      sms_enabled: patch.smsEnabled,
      type_overrides: patch.typeOverrides,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapPreferencesRow(data);
}

export async function saveCustomerNotificationPreferences(
  restaurantId: string,
  customerEmail: string,
  patch: PublicNotificationPreferences,
): Promise<NotificationPreferences> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    if (!isDemoRestaurantId(restaurantId)) throw new Error("Restaurant not found");
    return upsertDemoCustomerPreferences(restaurantId, customerEmail, {
      email_enabled: patch.emailEnabled,
      sms_enabled: patch.smsEnabled,
      type_overrides: patch.typeOverrides,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert({
      restaurant_id: restaurantId,
      scope: "customer",
      customer_email: customerEmail.trim().toLowerCase(),
      email_enabled: patch.emailEnabled,
      sms_enabled: patch.smsEnabled,
      type_overrides: patch.typeOverrides,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapPreferencesRow(data);
}

export async function persistNotificationLog(
  record: Omit<NotificationLogRecord, "id" | "created_at" | "updated_at">,
): Promise<NotificationLogRecord> {
  if (shouldUseDemoStore(record.restaurant_id) || !isSupabaseConfigured()) {
    return insertDemoNotificationLog(record);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_logs")
    .upsert({
      restaurant_id: record.restaurant_id,
      entity_type: record.entity_type,
      entity_id: record.entity_id,
      notification_type: record.notification_type,
      channel: record.channel,
      recipient: record.recipient,
      subject: record.subject,
      body: record.body,
      status: record.status,
      provider: record.provider,
      provider_message_id: record.provider_message_id,
      error_message: record.error_message,
      retry_count: record.retry_count,
      max_retries: record.max_retries,
      next_retry_at: record.next_retry_at,
      idempotency_key: record.idempotency_key,
      sent_at: record.sent_at,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapLogRow(data);
}

export async function updateNotificationLogRecord(
  logId: string,
  patch: Partial<NotificationLogRecord>,
): Promise<NotificationLogRecord | null> {
  if (!isSupabaseConfigured()) {
    return updateDemoNotificationLog(logId, patch);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_logs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", logId)
    .select("*")
    .single();

  if (error) throw error;
  return data ? mapLogRow(data) : null;
}

export async function listNotificationLogsForRestaurant(
  restaurantId: string,
): Promise<PublicNotificationLog[]> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? listDemoNotificationLogsForRestaurant(restaurantId).map(mapPublicLog)
      : [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_logs")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapPublicLog(mapLogRow(row)));
}

export async function listRetryableNotificationLogs(): Promise<NotificationLogRecord[]> {
  if (!isSupabaseConfigured()) {
    return listDemoRetryableLogs();
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("notification_logs")
    .select("*")
    .in("status", ["failed", "retrying"])
    .lte("next_retry_at", now);

  if (error) throw error;
  return (data ?? []).map(mapLogRow).filter((log) => log.retry_count < log.max_retries);
}

export function mapPublicPreferences(
  prefs: NotificationPreferences,
): PublicNotificationPreferences {
  return {
    emailEnabled: prefs.email_enabled,
    smsEnabled: prefs.sms_enabled,
    typeOverrides: prefs.type_overrides,
  };
}
