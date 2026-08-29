import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  listDemoNotificationLogsForRestaurant,
  resetDemoNotificationStore,
} from "@/lib/notification/demo-store";
import { sendTransactionalNotification } from "@/lib/notification/service";
import { setUseRecordingNotificationProviders } from "@/lib/notification/providers";

const RESTAURANT_ID = getDemoRestaurantId();
const OTHER_RESTAURANT_ID = "00000000-0000-4000-8000-000000009999";

describe("notification authorization", () => {
  beforeEach(() => {
    resetDemoNotificationStore();
    setUseRecordingNotificationProviders(true);
  });

  it("scopes notification logs to the restaurant tenant", async () => {
    await sendTransactionalNotification({
      restaurantId: RESTAURANT_ID,
      entityType: "order",
      entityId: "order-auth-1",
      notificationType: "ORDER_RECEIVED",
      recipientEmail: "guest@example.com",
      templateVariables: {
        customerName: "Guest",
        orderNumber: "ORD-1",
        orderTotal: "$10.00",
        restaurantName: "Demo Restaurant",
      },
    });

    expect(listDemoNotificationLogsForRestaurant(RESTAURANT_ID).length).toBeGreaterThan(0);
    expect(listDemoNotificationLogsForRestaurant(OTHER_RESTAURANT_ID)).toHaveLength(0);
  });
});
