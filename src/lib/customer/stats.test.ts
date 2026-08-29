import { describe, expect, it } from "vitest";
import {
  applyOrderPaymentChange,
  applyOrderPlaced,
  applyReservationCreated,
  computeAverageOrderValue,
  createEmptyProfile,
  matchesCustomerSearch,
} from "@/lib/customer/stats";

describe("customer stats", () => {
  it("computes average order value from paid orders", () => {
    expect(
      computeAverageOrderValue({
        total_spend: 120,
        paid_order_count: 3,
      }),
    ).toBe(40);
  });

  it("updates order statistics when an order is placed", () => {
    const profile = createEmptyProfile({
      restaurantId: "00000000-0000-4000-8000-000000000001",
      email: "guest@example.com",
      name: "Guest",
      phone: "+64 21 000 0000",
    });

    applyOrderPlaced(profile, {
      customer: {
        name: "Updated Guest",
        email: "guest@example.com",
        phone: "+64 21 111 1111",
        address: "1 Queen Street",
      },
      placedAt: "2026-08-25T10:00:00.000Z",
    });

    expect(profile.total_orders).toBe(1);
    expect(profile.first_order_at).toBe("2026-08-25T10:00:00.000Z");
    expect(profile.last_order_at).toBe("2026-08-25T10:00:00.000Z");
    expect(profile.name).toBe("Updated Guest");
    expect(profile.address).toBe("1 Queen Street");
  });

  it("updates spend when payment status becomes paid and reverses on refund", () => {
    const profile = createEmptyProfile({
      restaurantId: "00000000-0000-4000-8000-000000000001",
      email: "guest@example.com",
    });

    applyOrderPaymentChange(profile, {
      previousStatus: "pending",
      nextStatus: "paid",
      orderTotal: 42.5,
    });

    expect(profile.paid_order_count).toBe(1);
    expect(profile.total_spend).toBe(42.5);

    applyOrderPaymentChange(profile, {
      previousStatus: "paid",
      nextStatus: "refunded",
      orderTotal: 42.5,
    });

    expect(profile.paid_order_count).toBe(0);
    expect(profile.total_spend).toBe(0);
  });

  it("updates reservation statistics", () => {
    const profile = createEmptyProfile({
      restaurantId: "00000000-0000-4000-8000-000000000001",
      email: "guest@example.com",
    });

    applyReservationCreated(profile, {
      guest: {
        name: "Taylor",
        email: "guest@example.com",
        phone: "+64 21 222 2222",
      },
      createdAt: "2026-09-01T18:00:00.000Z",
    });

    expect(profile.total_reservations).toBe(1);
    expect(profile.last_reservation_at).toBe("2026-09-01T18:00:00.000Z");
    expect(profile.name).toBe("Taylor");
  });

  it("matches search queries against name, phone, and email", () => {
    const profile = createEmptyProfile({
      restaurantId: "00000000-0000-4000-8000-000000000001",
      email: "alex@example.com",
      name: "Alex Guest",
      phone: "+64 21 333 3333",
    });

    expect(matchesCustomerSearch(profile, "alex")).toBe(true);
    expect(matchesCustomerSearch(profile, "3333")).toBe(true);
    expect(matchesCustomerSearch(profile, "Guest")).toBe(true);
    expect(matchesCustomerSearch(profile, "unknown")).toBe(false);
  });
});
