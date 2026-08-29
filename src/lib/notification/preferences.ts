import type { NotificationChannel, NotificationType } from "./constants";
import type { NotificationPreferences } from "./types";

export function createDefaultRestaurantPreferences(
  restaurantId: string,
): NotificationPreferences {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    restaurant_id: restaurantId,
    scope: "restaurant",
    customer_email: null,
    email_enabled: true,
    sms_enabled: true,
    type_overrides: {},
    created_at: now,
    updated_at: now,
  };
}

export function isChannelEnabledForType(
  restaurantPrefs: NotificationPreferences,
  customerPrefs: NotificationPreferences | null,
  type: NotificationType,
  channel: NotificationChannel,
): boolean {
  const channelEnabled =
    channel === "email"
      ? restaurantPrefs.email_enabled && (customerPrefs?.email_enabled ?? true)
      : restaurantPrefs.sms_enabled && (customerPrefs?.sms_enabled ?? true);

  if (!channelEnabled) return false;

  const restaurantOverride = restaurantPrefs.type_overrides[type]?.[channel];
  if (restaurantOverride === false) return false;

  const customerOverride = customerPrefs?.type_overrides[type]?.[channel];
  if (customerOverride === false) return false;

  return true;
}

export function getEnabledChannels(
  restaurantPrefs: NotificationPreferences,
  customerPrefs: NotificationPreferences | null,
  type: NotificationType,
): NotificationChannel[] {
  const channels: NotificationChannel[] = [];
  if (isChannelEnabledForType(restaurantPrefs, customerPrefs, type, "email")) {
    channels.push("email");
  }
  if (isChannelEnabledForType(restaurantPrefs, customerPrefs, type, "sms")) {
    channels.push("sms");
  }
  return channels;
}
