export const NOTIFICATION_CHANNELS = ["email", "sms"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_DELIVERY_STATUSES = [
  "pending",
  "sent",
  "failed",
  "retrying",
] as const;

export type NotificationDeliveryStatus = (typeof NOTIFICATION_DELIVERY_STATUSES)[number];

export const NOTIFICATION_ENTITY_TYPES = ["order", "reservation"] as const;

export type NotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "ORDER_RECEIVED",
  "ORDER_ACCEPTED",
  "ORDER_READY",
  "ORDER_COMPLETED",
  "ORDER_CANCELLED",
  "RESERVATION_RECEIVED",
  "RESERVATION_CONFIRMED",
  "RESERVATION_REMINDER",
  "RESERVATION_CANCELLED",
  "RESERVATION_CHANGED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const ORDER_NOTIFICATION_TYPES: NotificationType[] = [
  "ORDER_RECEIVED",
  "ORDER_ACCEPTED",
  "ORDER_READY",
  "ORDER_COMPLETED",
  "ORDER_CANCELLED",
];

export const RESERVATION_NOTIFICATION_TYPES: NotificationType[] = [
  "RESERVATION_RECEIVED",
  "RESERVATION_CONFIRMED",
  "RESERVATION_REMINDER",
  "RESERVATION_CANCELLED",
  "RESERVATION_CHANGED",
];

export const DEFAULT_MAX_RETRIES = 3;

export const RETRY_BACKOFF_MINUTES = [1, 5, 15] as const;

export const PREFERENCE_SCOPES = ["restaurant", "customer"] as const;

export type PreferenceScope = (typeof PREFERENCE_SCOPES)[number];
