import {
  DEFAULT_MAX_RETRIES,
  type NotificationChannel,
} from "./constants";
import {
  loadCustomerNotificationPreferences,
  loadRestaurantNotificationPreferences,
  persistNotificationLog,
  updateNotificationLogRecord,
} from "./data";
import {
  buildIdempotencyKey,
  computeNextRetryAt,
  findDemoLogByIdempotencyKey,
  markDemoLogFailed,
} from "./demo-store";
import { getEnabledChannels } from "./preferences";
import { getEmailProvider, getSmsProvider } from "./providers";
import { renderNotificationTemplate } from "./templates";
import type { NotificationLogRecord, SendNotificationInput } from "./types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function deliverChannel(
  channel: NotificationChannel,
  input: {
    recipientEmail: string;
    recipientPhone?: string;
    subject: string;
    emailBody: string;
    smsBody: string;
  },
): Promise<{ provider: string; messageId: string }> {
  if (channel === "email") {
    const provider = getEmailProvider();
    const result = await provider.send({
      to: input.recipientEmail,
      subject: input.subject,
      body: input.emailBody,
    });
    return { provider: provider.name, messageId: result.messageId };
  }

  const phone = input.recipientPhone?.trim();
  if (!phone) {
    throw new Error("SMS recipient phone is required");
  }

  const provider = getSmsProvider();
  const result = await provider.send({
    to: phone,
    body: input.smsBody,
  });
  return { provider: provider.name, messageId: result.messageId };
}

async function sendOnChannel(
  input: SendNotificationInput,
  channel: NotificationChannel,
): Promise<NotificationLogRecord> {
  const idempotencyKey = buildIdempotencyKey({
    entityType: input.entityType,
    entityId: input.entityId,
    notificationType: input.notificationType,
    channel,
  });

  if (!isSupabaseConfigured()) {
    const existing = findDemoLogByIdempotencyKey(idempotencyKey);
    if (existing?.status === "sent" && !input.forceRetry) {
      return existing;
    }
  }

  const rendered = renderNotificationTemplate(
    input.notificationType,
    input.templateVariables,
  );

  const pendingRecord = await persistNotificationLog({
    restaurant_id: input.restaurantId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    notification_type: input.notificationType,
    channel,
    recipient: channel === "email" ? input.recipientEmail : (input.recipientPhone ?? ""),
    subject: rendered.subject,
    body: channel === "email" ? rendered.emailBody : rendered.smsBody,
    status: "pending",
    provider: channel === "email" ? getEmailProvider().name : getSmsProvider().name,
    provider_message_id: null,
    error_message: null,
    retry_count: 0,
    max_retries: DEFAULT_MAX_RETRIES,
    next_retry_at: null,
    idempotency_key: idempotencyKey,
    sent_at: null,
  });

  try {
    const delivery = await deliverChannel(channel, {
      recipientEmail: input.recipientEmail,
      recipientPhone: input.recipientPhone,
      subject: rendered.subject,
      emailBody: rendered.emailBody,
      smsBody: rendered.smsBody,
    });

    const sentAt = new Date().toISOString();
    return (
      (await updateNotificationLogRecord(pendingRecord.id, {
        status: "sent",
        provider: delivery.provider,
        provider_message_id: delivery.messageId,
        sent_at: sentAt,
        error_message: null,
        next_retry_at: null,
      })) ?? pendingRecord
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delivery failed";

    if (!isSupabaseConfigured()) {
      return markDemoLogFailed(pendingRecord, message);
    }

    const retryCount = pendingRecord.retry_count + 1;
    const canRetry = retryCount < pendingRecord.max_retries;

    return (
      (await updateNotificationLogRecord(pendingRecord.id, {
        status: canRetry ? "retrying" : "failed",
        error_message: message,
        retry_count: retryCount,
        next_retry_at: canRetry ? computeNextRetryAt(retryCount - 1) : null,
      })) ?? pendingRecord
    );
  }
}

export async function sendTransactionalNotification(
  input: SendNotificationInput,
): Promise<NotificationLogRecord[]> {
  const restaurantPrefs = await loadRestaurantNotificationPreferences(input.restaurantId);
  const customerPrefs = input.customerEmail
    ? await loadCustomerNotificationPreferences(input.restaurantId, input.customerEmail)
    : null;

  const channels = getEnabledChannels(
    restaurantPrefs,
    customerPrefs,
    input.notificationType,
  );

  const results: NotificationLogRecord[] = [];

  for (const channel of channels) {
    if (channel === "sms" && !input.recipientPhone?.trim()) {
      continue;
    }

    results.push(await sendOnChannel(input, channel));
  }

  return results;
}

export async function retryNotificationLog(
  log: NotificationLogRecord,
): Promise<NotificationLogRecord> {
  try {
    let delivery: { provider: string; messageId: string };

    if (log.channel === "email") {
      const provider = getEmailProvider();
      const result = await provider.send({
        to: log.recipient,
        subject: log.subject ?? "",
        body: log.body,
      });
      delivery = { provider: provider.name, messageId: result.messageId };
    } else {
      const provider = getSmsProvider();
      const result = await provider.send({
        to: log.recipient,
        body: log.body,
      });
      delivery = { provider: provider.name, messageId: result.messageId };
    }

    return (
      (await updateNotificationLogRecord(log.id, {
        status: "sent",
        provider: delivery.provider,
        provider_message_id: delivery.messageId,
        sent_at: new Date().toISOString(),
        error_message: null,
        next_retry_at: null,
      })) ?? log
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retry failed";

    if (!isSupabaseConfigured()) {
      return markDemoLogFailed(log, message);
    }

    const retryCount = log.retry_count + 1;
    const canRetry = retryCount < log.max_retries;

    return (
      (await updateNotificationLogRecord(log.id, {
        status: canRetry ? "retrying" : "failed",
        error_message: message,
        retry_count: retryCount,
        next_retry_at: canRetry ? computeNextRetryAt(retryCount - 1) : null,
      })) ?? log
    );
  }
}

export async function processNotificationRetries(): Promise<number> {
  const { listRetryableNotificationLogs } = await import("./data");
  const retryable = await listRetryableNotificationLogs();
  let processed = 0;

  for (const log of retryable) {
    await retryNotificationLog(log);
    processed += 1;
  }

  return processed;
}
