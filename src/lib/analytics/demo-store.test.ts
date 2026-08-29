import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  listDemoAnalyticsEventsForRestaurant,
  recordDemoAnalyticsEvent,
  resetDemoAnalyticsStore,
} from "./demo-store";

const RESTAURANT_ID = getDemoRestaurantId();
const OTHER_RESTAURANT_ID = "00000000-0000-4000-8000-000000009999";

describe("analytics demo store", () => {
  beforeEach(() => {
    resetDemoAnalyticsStore();
  });

  it("scopes analytics events to the restaurant tenant", () => {
    recordDemoAnalyticsEvent({
      restaurantId: RESTAURANT_ID,
      eventType: "MENU_VIEW",
      path: "/menu",
    });

    expect(listDemoAnalyticsEventsForRestaurant(RESTAURANT_ID)).toHaveLength(1);
    expect(listDemoAnalyticsEventsForRestaurant(OTHER_RESTAURANT_ID)).toHaveLength(0);
  });
});
