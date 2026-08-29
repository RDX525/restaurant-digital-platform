import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import { resetDemoOrderStore, createDemoOrder } from "@/lib/order/demo-store";
import { getDemoFullMenu } from "@/lib/menu/demo-data";
import { calculateOrderTotals, priceOrderLines } from "@/lib/order/pricing";
import {
  getDemoCustomerByEmail,
  listDemoCustomersForRestaurant,
  resetDemoCustomerStore,
  syncDemoCustomerFromOrder,
  syncDemoCustomerFromOrderPayment,
  syncDemoCustomerFromReservation,
} from "@/lib/customer/demo-store";

const RESTAURANT_ID = getDemoRestaurantId();

function buildOrderInput(idempotencyKey: string) {
  const menu = getDemoFullMenu();
  const item = menu.categories[0]!.items[0]!;
  const lines = priceOrderLines(menu, [{ menuItemId: item.id, quantity: 1, modifierIds: [] }]);
  const totals = calculateOrderTotals(lines, "pickup");

  return {
    idempotencyKey,
    restaurantId: RESTAURANT_ID,
    restaurantSlug: "demo-restaurant",
    restaurantName: "Demo Restaurant",
    orderType: "pickup" as const,
    customer: {
      name: "Alex Guest",
      email: "alex@example.com",
      phone: "+64 21 000 0000",
      orderType: "pickup" as const,
      address: "",
      notes: "",
    },
    pricedItems: lines,
    totals,
  };
}

describe("customer demo store", () => {
  beforeEach(() => {
    resetDemoCustomerStore();
    resetDemoOrderStore();
  });

  it("creates and updates a customer profile from orders", () => {
    syncDemoCustomerFromOrder({
      restaurantId: RESTAURANT_ID,
      customer: {
        name: "Alex Guest",
        email: "alex@example.com",
        phone: "+64 21 000 0000",
      },
      placedAt: "2026-08-25T10:00:00.000Z",
    });

    const profile = getDemoCustomerByEmail(RESTAURANT_ID, "alex@example.com");
    expect(profile?.total_orders).toBe(1);
    expect(profile?.name).toBe("Alex Guest");
  });

  it("updates spend when order payment status changes", () => {
    const order = createDemoOrder(buildOrderInput("customer-payment-test"));
    syncDemoCustomerFromOrder({
      restaurantId: RESTAURANT_ID,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      },
      placedAt: order.placed_at,
    });

    syncDemoCustomerFromOrderPayment({
      restaurantId: RESTAURANT_ID,
      email: order.customer.email,
      previousStatus: "pending",
      nextStatus: "paid",
      orderTotal: order.total,
    });

    const profile = getDemoCustomerByEmail(RESTAURANT_ID, order.customer.email);
    expect(profile?.paid_order_count).toBe(1);
    expect(profile?.total_spend).toBe(order.total);
  });

  it("creates profiles from reservations", () => {
    syncDemoCustomerFromReservation({
      restaurantId: RESTAURANT_ID,
      guest: {
        name: "Jordan Lee",
        email: "jordan@example.com",
        phone: "+64 21 444 4444",
      },
      createdAt: "2026-09-02T18:00:00.000Z",
    });

    const profile = getDemoCustomerByEmail(RESTAURANT_ID, "jordan@example.com");
    expect(profile?.total_reservations).toBe(1);
    expect(profile?.last_reservation_at).toBe("2026-09-02T18:00:00.000Z");
  });

  it("searches customers by name, phone, and email", () => {
    syncDemoCustomerFromOrder({
      restaurantId: RESTAURANT_ID,
      customer: {
        name: "Sam Rivera",
        email: "sam@example.com",
        phone: "+64 21 555 5555",
      },
      placedAt: "2026-08-25T10:00:00.000Z",
    });

    expect(listDemoCustomersForRestaurant(RESTAURANT_ID, "sam@example.com")).toHaveLength(1);
    expect(listDemoCustomersForRestaurant(RESTAURANT_ID, "Rivera")).toHaveLength(1);
    expect(listDemoCustomersForRestaurant(RESTAURANT_ID, "5555")).toHaveLength(1);
    expect(listDemoCustomersForRestaurant(RESTAURANT_ID, "missing")).toHaveLength(0);
  });
});
