import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEntityType,
  NotificationType,
  PreferenceScope,
} from "./constants";

export interface NotificationTemplate {
  subject: string;
  emailBody: string;
  smsBody: string;
}

export interface NotificationPreferences {
  id: string;
  restaurant_id: string;
  scope: PreferenceScope;
  customer_email: string | null;
  email_enabled: boolean;
  sms_enabled: boolean;
  type_overrides: Partial<
    Record<NotificationType, Partial<Record<NotificationChannel, boolean>>>
  >;
  created_at: string;
  updated_at: string;
}

export interface NotificationLogRecord {
  id: string;
  restaurant_id: string;
  entity_type: NotificationEntityType;
  entity_id: string;
  notification_type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  body: string;
  status: NotificationDeliveryStatus;
  provider: string;
  provider_message_id: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  idempotency_key: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendNotificationInput {
  restaurantId: string;
  entityType: NotificationEntityType;
  entityId: string;
  notificationType: NotificationType;
  recipientEmail: string;
  recipientPhone?: string;
  customerEmail?: string;
  templateVariables: Record<string, string>;
  forceRetry?: boolean;
}

export interface EmailSendInput {
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, string>;
}

export interface EmailSendResult {
  messageId: string;
}

export interface SmsSendInput {
  to: string;
  body: string;
  metadata?: Record<string, string>;
}

export interface SmsSendResult {
  messageId: string;
}

export interface EmailProvider {
  readonly name: string;
  send(input: EmailSendInput): Promise<EmailSendResult>;
}

export interface SmsProvider {
  readonly name: string;
  send(input: SmsSendInput): Promise<SmsSendResult>;
}

export interface PublicNotificationLog {
  id: string;
  entityType: NotificationEntityType;
  entityId: string;
  notificationType: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  status: NotificationDeliveryStatus;
  provider: string;
  errorMessage: string | null;
  retryCount: number;
  sentAt: string | null;
  createdAt: string;
}

export interface PublicNotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  typeOverrides: NotificationPreferences["type_overrides"];
}
