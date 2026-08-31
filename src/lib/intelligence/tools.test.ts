import { describe, expect, it } from "vitest";
import type { OrderRecord } from "@/lib/order/types";
import { getDemoRestaurantId } from "@/lib/utils";
import { executeIntelligenceTool } from "./tools";
import { buildReportForPreset, computeInactiveCustomers, computeSalesTrends } from "./tools/metrics";

const RESTAURANT_ID = getDemoRestaurantId();
const OTHER_RESTAURANT_ID = "00000000-0000-4000-8000-000000009999";
const NOW = new Date("2026-08-25T02:00:00.000Z");

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-1",
    order_number: "ORD-1001",
    restaurant_id: RESTAURANT_ID,
    location_id: null,
    table_id: null,
    session_id: null,
    table_label: null,
    order_type: "pickup",
    status: "completed",
    payment_status: "paid",
    customer: {
      name: "Alex",
      email: "alex@example.com",
      phone: "+64 21 000 0001",
      orderType: "pickup",
      address: "",
      notes: "",
    },
    customer_email: "alex@example.com",
    items: [
      {
        menuItemId: "item-burger",
        name: "Classic Burger",
        basePrice: 18,
        quantity: 2,
        modifiers: [],
        lineTotal: 36,
      },
    ],
    subtotal: 36,
    discount_amount: 0,
    delivery_fee: 0,
    tax_amount: 0,
    total: 36,
    idempotency_key: "key-1",
    cancellation_reason: null,
    cancelled_at: null,
    placed_at: "2026-08-25T06:00:00.000Z",
    estimated_ready_at: "2026-08-25T06:30:00.000Z",
    updated_at: "2026-08-25T06:00:00.000Z",
    ...overrides,
  };
}

describe("intelligence tools", () => {
  it("returns zeroed sales summary for empty order data", async () => {
    const summary = await executeIntelligenceTool({
      restaurantId: RESTAURANT_ID,
      tool: "get_sales_summary",
      arguments: { preset: "7d" },
      now: NOW,
    });

    expect(summary.revenue).toBe(0);
    expect(summary.orders).toBe(0);
    expect(summary.averageOrderValue).toBe(0);
  });

  it("calculates verified revenue from paid orders only", () => {
    const report = buildReportForPreset({
      orders: [
        makeOrder({ total: 36, payment_status: "paid" }),
        makeOrder({ id: "pending", total: 99, payment_status: "pending" }),
      ],
      reservations: [],
      timezone: "Pacific/Auckland",
      preset: "today",
      now: NOW,
    });

    expect(report.revenue).toBe(36);
    expect(report.orders).toBe(1);
    expect(report.averageOrderValue).toBe(36);
  });

  it("identifies inactive customers from paid order history", () => {
    const orders = [
      makeOrder({
        id: "o1",
        customer_email: "repeat@example.com",
        placed_at: "2026-07-01T06:00:00.000Z",
      }),
      makeOrder({
        id: "o2",
        customer_email: "repeat@example.com",
        placed_at: "2026-07-15T06:00:00.000Z",
      }),
    ];

    const inactive = computeInactiveCustomers({
      orders,
      customers: [
        {
          id: "c1",
          restaurant_id: RESTAURANT_ID,
          email: "repeat@example.com",
          name: "Repeat Guest",
          phone: "",
          address: null,
          first_order_at: "2026-07-01T06:00:00.000Z",
          last_order_at: "2026-07-15T06:00:00.000Z",
          total_orders: 2,
          paid_order_count: 2,
          total_spend: 72,
          last_reservation_at: null,
          total_reservations: 0,
          lifecycle_stage: "active",
          metadata: {},
          created_at: "2026-07-01T06:00:00.000Z",
          updated_at: "2026-07-15T06:00:00.000Z",
        },
      ],
      now: NOW,
    });

    expect(inactive.inactiveCount).toBe(1);
    expect(inactive.samples[0]?.email).toBe("repeat@example.com");
  });

  it("computes weekday trend comparisons from verified orders", () => {
    const trends = computeSalesTrends({
      orders: [makeOrder({ total: 50 })],
      timezone: "Pacific/Auckland",
      weeks: 4,
      now: NOW,
    });

    expect(trends.yesterday).toBeTruthy();
    expect(typeof (trends.yesterday as { revenue: number }).revenue).toBe("number");
  });

  it("scopes tool execution to the restaurant tenant", async () => {
    await expect(
      executeIntelligenceTool({
        restaurantId: OTHER_RESTAURANT_ID,
        tool: "get_sales_summary",
        arguments: { preset: "7d" },
        now: NOW,
      }),
    ).resolves.toMatchObject({ revenue: 0, orders: 0 });
  });
});
