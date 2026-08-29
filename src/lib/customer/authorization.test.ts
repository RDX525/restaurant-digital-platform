import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  getDemoCustomerByEmail,
  getDemoCustomerById,
  resetDemoCustomerStore,
  syncDemoCustomerFromOrder,
} from "@/lib/customer/demo-store";

const RESTAURANT_ID = getDemoRestaurantId();
const OTHER_RESTAURANT_ID = "00000000-0000-4000-8000-000000009999";

describe("customer authorization", () => {
  beforeEach(() => {
    resetDemoCustomerStore();
  });

  it("rejects writes for unknown restaurants", () => {
    expect(() =>
      syncDemoCustomerFromOrder({
        restaurantId: OTHER_RESTAURANT_ID,
        customer: {
          name: "Guest",
          email: "guest@example.com",
          phone: "+64 21 000 0000",
        },
        placedAt: "2026-08-25T10:00:00.000Z",
      }),
    ).toThrow(/Restaurant not found/);
  });

  it("scopes customer reads to the restaurant tenant", () => {
    const profile = syncDemoCustomerFromOrder({
      restaurantId: RESTAURANT_ID,
      customer: {
        name: "Scoped Guest",
        email: "scoped@example.com",
        phone: "+64 21 666 6666",
      },
      placedAt: "2026-08-25T10:00:00.000Z",
    });

    expect(getDemoCustomerById(RESTAURANT_ID, profile.id)?.email).toBe("scoped@example.com");
    expect(getDemoCustomerById(OTHER_RESTAURANT_ID, profile.id)).toBeNull();
    expect(getDemoCustomerByEmail(OTHER_RESTAURANT_ID, "scoped@example.com")).toBeNull();
  });
});
