import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  getDemoNotificationLogs,
  resetDemoNotificationStore,
  updateDemoNotificationLog,
  updateDemoRestaurantPreferences,
} from "@/lib/notification/demo-store";
import { setUseRecordingNotificationProviders } from "@/lib/notification/providers";
import { demoSentMessages, resetDemoSentMessages } from "@/lib/notification/providers/demo";
import {
  processNotificationRetries,
  sendTransactionalNotification,
} from "@/lib/notification/service";
import { notifyTeamInvite } from "@/lib/notification/dispatch";
import { isChannelEnabledForType, createDefaultRestaurantPreferences } from "@/lib/notification/preferences";

const RESTAURANT_ID = getDemoRestaurantId();

describe("notification preferences", () => {
  it("respects restaurant channel toggles", () => {
    const restaurantPrefs = createDefaultRestaurantPreferences(RESTAURANT_ID);
    restaurantPrefs.sms_enabled = false;

    expect(isChannelEnabledForType(restaurantPrefs, null, "ORDER_RECEIVED", "email")).toBe(true);
    expect(isChannelEnabledForType(restaurantPrefs, null, "ORDER_RECEIVED", "sms")).toBe(false);
  });

  it("respects customer overrides", () => {
    const restaurantPrefs = createDefaultRestaurantPreferences(RESTAURANT_ID);
    const customerPrefs = createDefaultRestaurantPreferences(RESTAURANT_ID);
    customerPrefs.scope = "customer";
    customerPrefs.customer_email = "guest@example.com";
    customerPrefs.type_overrides = { ORDER_RECEIVED: { email: false } };

    expect(
      isChannelEnabledForType(restaurantPrefs, customerPrefs, "ORDER_RECEIVED", "email"),
    ).toBe(false);
  });
});

describe("notification service", () => {
  beforeEach(() => {
    resetDemoNotificationStore();
    resetDemoSentMessages();
    setUseRecordingNotificationProviders(true);
    vi.unstubAllEnvs();
  });

  it("sends transactional email and logs delivery", async () => {
    const logs = await sendTransactionalNotification({
      restaurantId: RESTAURANT_ID,
      entityType: "order",
      entityId: "order-1",
      notificationType: "ORDER_RECEIVED",
      recipientEmail: "guest@example.com",
      recipientPhone: "+64 21 000 0000",
      customerEmail: "guest@example.com",
      templateVariables: {
        customerName: "Guest",
        orderNumber: "ORD-1",
        orderTotal: "$10.00",
        restaurantName: "Demo Restaurant",
      },
    });

    expect(logs.some((log) => log.status === "sent" && log.channel === "email")).toBe(true);
    expect(demoSentMessages.some((msg) => msg.channel === "email")).toBe(true);
  });

  it("is idempotent for the same entity event and channel", async () => {
    const input = {
      restaurantId: RESTAURANT_ID,
      entityType: "order" as const,
      entityId: "order-2",
      notificationType: "ORDER_ACCEPTED" as const,
      recipientEmail: "guest@example.com",
      templateVariables: {
        customerName: "Guest",
        orderNumber: "ORD-2",
        orderTotal: "$10.00",
        restaurantName: "Demo Restaurant",
      },
    };

    await sendTransactionalNotification(input);
    await sendTransactionalNotification(input);

    const emailLogs = getDemoNotificationLogs().filter(
      (log) => log.notification_type === "ORDER_ACCEPTED" && log.channel === "email",
    );
    expect(emailLogs).toHaveLength(1);
  });

  it("marks failed deliveries for retry and eventually succeeds", async () => {
    vi.stubEnv("NOTIFICATION_DEMO_SIMULATE_FAILURE", "true");

    const logs = await sendTransactionalNotification({
      restaurantId: RESTAURANT_ID,
      entityType: "reservation",
      entityId: "res-1",
      notificationType: "RESERVATION_CONFIRMED",
      recipientEmail: "guest@example.com",
      templateVariables: {
        guestName: "Guest",
        guestCount: "2",
        reservationDate: "2026-09-05",
        reservationTime: "18:00",
        restaurantName: "Demo Restaurant",
      },
    });

    expect(logs[0]?.status).toBe("retrying");
    expect(logs[0]?.next_retry_at).toBeTruthy();

    updateDemoNotificationLog(logs[0]!.id, {
      next_retry_at: new Date(Date.now() - 60_000).toISOString(),
    });

    vi.stubEnv("NOTIFICATION_DEMO_SIMULATE_FAILURE", "false");

    const processed = await processNotificationRetries();
    expect(processed).toBeGreaterThan(0);

    const updated = getDemoNotificationLogs().find((log) => log.entity_id === "res-1");
    expect(updated?.status).toBe("sent");
  });

  it("skips SMS when restaurant disables SMS", async () => {
    updateDemoRestaurantPreferences(RESTAURANT_ID, { sms_enabled: false });

    const logs = await sendTransactionalNotification({
      restaurantId: RESTAURANT_ID,
      entityType: "order",
      entityId: "order-3",
      notificationType: "ORDER_READY",
      recipientEmail: "guest@example.com",
      recipientPhone: "+64 21 000 0000",
      templateVariables: {
        customerName: "Guest",
        orderNumber: "ORD-3",
        orderTotal: "$10.00",
        orderType: "pickup",
        restaurantName: "Demo Restaurant",
      },
    });

    expect(logs.every((log) => log.channel === "email")).toBe(true);
    expect(demoSentMessages.some((msg) => msg.channel === "sms")).toBe(false);
  });

  it("sends a team invite email", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_FROM_EMAIL", "");

    const result = await notifyTeamInvite({
      restaurantName: "Harbour Kitchen",
      email: "teammate@example.com",
      role: "staff",
      acceptUrl: "https://example.com/auth/accept-invite?token=abc",
      inviterName: "owner@harbour.test",
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe("demo");
    expect(
      demoSentMessages.some(
        (msg) =>
          msg.channel === "email" &&
          msg.recipient === "teammate@example.com" &&
          msg.body.includes("https://example.com/auth/accept-invite?token=abc"),
      ),
    ).toBe(true);
  });
});
