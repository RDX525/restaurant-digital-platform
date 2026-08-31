import { beforeEach, describe, expect, it } from "vitest";
import { getDemoFullMenu } from "@/lib/menu/demo-data";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  calculateOrderTotals,
  priceOrderLines,
} from "@/lib/order/pricing";
import {
  createDemoOrder,
  findDemoOrderByIdempotencyKey,
  listDemoOrdersForCustomer,
  resetDemoOrderStore,
  updateDemoOrderStatus,
} from "@/lib/order/demo-store";

const RESTAURANT_ID = getDemoRestaurantId();

function buildOrderInput(idempotencyKey: string) {
  const menu = getDemoFullMenu();
  const item = menu.categories[0]!.items[0]!;
  const lines = priceOrderLines(menu, [
    { menuItemId: item.id, quantity: 1, modifierIds: [] },
  ]);
  const totals = calculateOrderTotals(lines, "pickup");

  return {
    idempotencyKey,
    restaurantId: RESTAURANT_ID,
    restaurantSlug: "harbour-kitchen",
    restaurantName: "Harbour Kitchen",
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
    items: [{ menuItemId: item.id, quantity: 1, modifierIds: [] }],
  };
}

describe("order demo store", () => {
  beforeEach(() => {
    resetDemoOrderStore();
  });

  it("prevents duplicate orders with the same idempotency key", () => {
    const input = buildOrderInput("idem-key-12345");
    const first = createDemoOrder(input);
    const second = createDemoOrder(input);

    expect(second.id).toBe(first.id);
    expect(findDemoOrderByIdempotencyKey("idem-key-12345")?.id).toBe(first.id);
  });

  it("lists customer order history by email", () => {
    createDemoOrder(buildOrderInput("idem-a"));
    createDemoOrder({
      ...buildOrderInput("idem-b"),
      customer: {
        ...buildOrderInput("idem-b").customer,
        email: "other@example.com",
      },
    });

    const history = listDemoOrdersForCustomer("alex@example.com", RESTAURANT_ID);
    expect(history).toHaveLength(1);
    expect(history[0]!.customer.email).toBe("alex@example.com");
  });

  it("enforces order status transitions", () => {
    const order = createDemoOrder(buildOrderInput("idem-status"));
    expect(order.status).toBe("new");
    expect(order.payment_status).toBe("pending");

    updateDemoOrderStatus(RESTAURANT_ID, order.id, "accepted");
    updateDemoOrderStatus(RESTAURANT_ID, order.id, "preparing");
    updateDemoOrderStatus(RESTAURANT_ID, order.id, "ready");
    updateDemoOrderStatus(RESTAURANT_ID, order.id, "completed");

    expect(() =>
      updateDemoOrderStatus(RESTAURANT_ID, order.id, "accepted"),
    ).toThrow(/Cannot transition/);
  });

  it("supports cancellation from active statuses", () => {
    const order = createDemoOrder(buildOrderInput("idem-cancel"));
    updateDemoOrderStatus(RESTAURANT_ID, order.id, "accepted");
    const cancelled = updateDemoOrderStatus(
      RESTAURANT_ID,
      order.id,
      "cancelled",
      "Guest changed mind",
    );

    expect(cancelled?.status).toBe("cancelled");
    expect(cancelled?.cancellation_reason).toBe("Guest changed mind");
  });
});
