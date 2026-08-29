import { getDemoRestaurantId } from "@/lib/utils";
import {
  DEFAULT_MAX_RETRIES,
  RETRY_BACKOFF_MINUTES,
  type NotificationChannel,
  type NotificationDeliveryStatus,
  type NotificationType,
} from "./constants";
import { createDefaultRestaurantPreferences } from "./preferences";
import type { NotificationLogRecord, NotificationPreferences } from "./types";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();

let logs: NotificationLogRecord[] = [];
let preferences: NotificationPreferences[] = [
  createDefaultRestaurantPreferences(DEMO_RESTAURANT_ID),
];

export function resetDemoNotificationStore(): void {
  logs = [];
  preferences = [createDefaultRestaurantPreferences(DEMO_RESTAURANT_ID)];
}

export function getDemoNotificationLogs(): NotificationLogRecord[] {
  return structuredClone(logs);
}

export function getDemoNotificationPreferences(): NotificationPreferences[] {
  return structuredClone(preferences);
}

function assertRestaurant(restaurantId: string): void {
  if (restaurantId !== DEMO_RESTAURANT_ID) {
    throw new Error("Restaurant not found");
  }
}

export function findDemoLogByIdempotencyKey(key: string): NotificationLogRecord | null {
  return logs.find((log) => log.idempotency_key === key) ?? null;
}

export function insertDemoNotificationLog(
  input: Omit<NotificationLogRecord, "id" | "created_at" | "updated_at">,
): NotificationLogRecord {
  assertRestaurant(input.restaurant_id);

  const existing = findDemoLogByIdempotencyKey(input.idempotency_key);
  if (existing && existing.status === "sent") {
    return structuredClone(existing);
  }

  const now = new Date().toISOString();
  const record: NotificationLogRecord = {
    ...input,
    id: existing?.id ?? crypto.randomUUID(),
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  if (existing) {
    Object.assign(existing, record);
    return structuredClone(existing);
  }

  logs.unshift(record);
  return structuredClone(record);
}

export function updateDemoNotificationLog(
  logId: string,
  patch: Partial<NotificationLogRecord>,
): NotificationLogRecord | null {
  const log = logs.find((entry) => entry.id === logId);
  if (!log) return null;

  Object.assign(log, patch, { updated_at: new Date().toISOString() });
  return structuredClone(log);
}

export function listDemoNotificationLogsForRestaurant(
  restaurantId: string,
): NotificationLogRecord[] {
  if (restaurantId !== DEMO_RESTAURANT_ID) return [];

  return logs
    .filter((log) => log.restaurant_id === restaurantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listDemoRetryableLogs(now = new Date()): NotificationLogRecord[] {
  return logs.filter(
    (log) =>
      (log.status === "failed" || log.status === "retrying") &&
      log.retry_count < log.max_retries &&
      log.next_retry_at !== null &&
      log.next_retry_at <= now.toISOString(),
  );
}

export function getDemoRestaurantPreferences(
  restaurantId: string,
): NotificationPreferences {
  assertRestaurant(restaurantId);
  return (
    preferences.find(
      (pref) => pref.restaurant_id === restaurantId && pref.scope === "restaurant",
    ) ?? createDefaultRestaurantPreferences(restaurantId)
  );
}

export function getDemoCustomerPreferences(
  restaurantId: string,
  customerEmail: string,
): NotificationPreferences | null {
  assertRestaurant(restaurantId);
  const normalized = customerEmail.trim().toLowerCase();
  return (
    preferences.find(
      (pref) =>
        pref.restaurant_id === restaurantId &&
        pref.scope === "customer" &&
        pref.customer_email === normalized,
    ) ?? null
  );
}

export function upsertDemoCustomerPreferences(
  restaurantId: string,
  customerEmail: string,
  patch: Partial<Pick<NotificationPreferences, "email_enabled" | "sms_enabled" | "type_overrides">>,
): NotificationPreferences {
  assertRestaurant(restaurantId);
  const normalized = customerEmail.trim().toLowerCase();
  let record = getDemoCustomerPreferences(restaurantId, normalized);

  if (!record) {
    const now = new Date().toISOString();
    record = {
      id: crypto.randomUUID(),
      restaurant_id: restaurantId,
      scope: "customer",
      customer_email: normalized,
      email_enabled: true,
      sms_enabled: true,
      type_overrides: {},
      created_at: now,
      updated_at: now,
    };
    preferences.push(record);
  }

  if (patch.email_enabled !== undefined) record.email_enabled = patch.email_enabled;
  if (patch.sms_enabled !== undefined) record.sms_enabled = patch.sms_enabled;
  if (patch.type_overrides !== undefined) {
    record.type_overrides = { ...record.type_overrides, ...patch.type_overrides };
  }
  record.updated_at = new Date().toISOString();

  return structuredClone(record);
}

export function updateDemoRestaurantPreferences(
  restaurantId: string,
  patch: Partial<Pick<NotificationPreferences, "email_enabled" | "sms_enabled" | "type_overrides">>,
): NotificationPreferences {
  const record = getDemoRestaurantPreferences(restaurantId);
  if (patch.email_enabled !== undefined) record.email_enabled = patch.email_enabled;
  if (patch.sms_enabled !== undefined) record.sms_enabled = patch.sms_enabled;
  if (patch.type_overrides !== undefined) {
    record.type_overrides = { ...record.type_overrides, ...patch.type_overrides };
  }
  record.updated_at = new Date().toISOString();
  return structuredClone(record);
}

export function computeNextRetryAt(retryCount: number): string {
  const minutes =
    RETRY_BACKOFF_MINUTES[Math.min(retryCount, RETRY_BACKOFF_MINUTES.length - 1)] ?? 15;
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function buildIdempotencyKey(input: {
  entityType: string;
  entityId: string;
  notificationType: NotificationType;
  channel: NotificationChannel;
}): string {
  return `${input.entityType}:${input.entityId}:${input.notificationType}:${input.channel}`;
}

export function markDemoLogFailed(
  log: NotificationLogRecord,
  errorMessage: string,
): NotificationLogRecord {
  const retryCount = log.retry_count + 1;
  const canRetry = retryCount < log.max_retries;

  return updateDemoNotificationLog(log.id, {
    status: canRetry ? "retrying" : ("failed" as NotificationDeliveryStatus),
    error_message: errorMessage,
    retry_count: retryCount,
    next_retry_at: canRetry ? computeNextRetryAt(retryCount - 1) : null,
  })!;
}

export { DEFAULT_MAX_RETRIES };
