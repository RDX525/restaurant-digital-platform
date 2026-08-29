import { describe, expect, it } from "vitest";
import type { OrderRecord } from "@/lib/order/types";
import type { ReservationRecord } from "@/lib/reservation/types";
import { resolveDateRange } from "./date-range";
import { buildAnalyticsReport, computeCustomerSegments } from "./reports";
import type { AnalyticsEventRecord } from "./types";

const RESTAURANT_ID = "00000000-0000-4000-8000-000000000001";
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
      {
        menuItemId: "item-fries",
        name: "Fries",
        basePrice: 6,
        quantity: 1,
        modifiers: [],
        lineTotal: 6,
      },
    ],
    subtotal: 42,
    discount_amount: 0,
    delivery_fee: 0,
    tax_amount: 0,
    total: 42,
    idempotency_key: "key-1",
    cancellation_reason: null,
    cancelled_at: null,
    placed_at: "2026-08-25T10:00:00.000Z",
    estimated_ready_at: "2026-08-25T10:30:00.000Z",
    updated_at: "2026-08-25T10:00:00.000Z",
    ...overrides,
  };
}

function makeEvent(
  overrides: Partial<AnalyticsEventRecord> & Pick<AnalyticsEventRecord, "event_type">,
): AnalyticsEventRecord {
  return {
    id: crypto.randomUUID(),
    restaurant_id: RESTAURANT_ID,
    occurred_at: "2026-08-25T11:00:00.000Z",
    session_id: "session-1",
    path: null,
    menu_item_id: null,
    order_id: null,
    reservation_id: null,
    table_id: null,
    metadata: {},
    user_agent: null,
    created_at: "2026-08-25T11:00:00.000Z",
    ...overrides,
  };
}

function makeReservation(overrides: Partial<ReservationRecord> = {}): ReservationRecord {
  return {
    id: "reservation-1",
    restaurant_id: RESTAURANT_ID,
    status: "pending",
    guest_name: "Taylor",
    guest_email: "taylor@example.com",
    guest_phone: "+64 21 000 0002",
    guest_count: 2,
    reservation_date: "2026-08-26",
    reservation_time: "19:00",
    timezone: "Pacific/Auckland",
    special_request: null,
    confirmed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    rescheduled_at: null,
    previous_date: null,
    previous_time: null,
    notifications: [],
    created_at: "2026-08-25T09:00:00.000Z",
    updated_at: "2026-08-25T09:00:00.000Z",
    ...overrides,
  };
}

describe("analytics reports", () => {
  const range = resolveDateRange("today", "Pacific/Auckland", undefined, undefined, NOW);

  it("calculates revenue and AOV from paid orders only", () => {
    const report = buildAnalyticsReport({
      orders: [
        makeOrder({ id: "paid-1", total: 42, payment_status: "paid" }),
        makeOrder({
          id: "pending-1",
          total: 99,
          payment_status: "pending",
          customer_email: "pending@example.com",
        }),
        makeOrder({
          id: "paid-2",
          total: 18,
          payment_status: "paid",
          customer_email: "sam@example.com",
          order_type: "delivery",
          placed_at: "2026-08-24T10:00:00.000Z",
        }),
      ],
      reservations: [],
      events: [],
      qrScans: [],
      range,
    });

    expect(report.revenue).toBe(42);
    expect(report.orders).toBe(1);
    expect(report.averageOrderValue).toBe(42);
    expect(report.ordersByType).toEqual({
      pickup: 1,
      delivery: 0,
      dine_in: 0,
    });
  });

  it("ignores analytics ORDER_COMPLETED events for financial metrics", () => {
    const report = buildAnalyticsReport({
      orders: [],
      reservations: [],
      events: [
        makeEvent({
          event_type: "ORDER_COMPLETED",
          metadata: { total: "500" },
        }),
      ],
      qrScans: [],
      range,
    });

    expect(report.revenue).toBe(0);
    expect(report.orders).toBe(0);
  });

  it("ranks best-selling and slow-moving items from paid order lines", () => {
    const report = buildAnalyticsReport({
      orders: [makeOrder()],
      reservations: [],
      events: [],
      qrScans: [],
      range,
    });

    expect(report.bestSellingItems[0]).toMatchObject({
      menuItemId: "item-burger",
      quantity: 2,
      revenue: 36,
    });
    expect(report.slowMovingItems[0]).toMatchObject({
      menuItemId: "item-fries",
      quantity: 1,
      revenue: 6,
    });
  });

  it("segments new and returning customers using paid order history", () => {
    const orders = [
      makeOrder({
        id: "prior-order",
        customer_email: "returning@example.com",
        placed_at: "2026-08-20T10:00:00.000Z",
      }),
      makeOrder({
        id: "returning-today",
        customer_email: "returning@example.com",
        placed_at: "2026-08-25T06:00:00.000Z",
      }),
      makeOrder({
        id: "new-today",
        customer_email: "new@example.com",
        placed_at: "2026-08-25T08:00:00.000Z",
      }),
    ];

    const segments = computeCustomerSegments({ orders, range });
    expect(segments.newCustomers).toBe(1);
    expect(segments.returningCustomers).toBe(1);
  });

  it("computes funnel and reservation metrics", () => {
    const report = buildAnalyticsReport({
      orders: [makeOrder()],
      reservations: [
        makeReservation({ id: "res-1" }),
        makeReservation({
          id: "res-cancelled",
          status: "cancelled",
          cancelled_at: "2026-08-25T06:00:00.000Z",
        }),
        makeReservation({
          id: "res-noshow",
          status: "no_show",
          updated_at: "2026-08-25T07:00:00.000Z",
        }),
      ],
      events: [
        makeEvent({ event_type: "WEBSITE_VISIT", session_id: "visit-a" }),
        makeEvent({ event_type: "WEBSITE_VISIT", session_id: "visit-b" }),
        makeEvent({ event_type: "MENU_VIEW" }),
        makeEvent({ event_type: "CHECKOUT_STARTED" }),
        makeEvent({ event_type: "CHECKOUT_STARTED" }),
        makeEvent({ event_type: "RESERVATION_STARTED" }),
        makeEvent({ event_type: "RESERVATION_STARTED" }),
        makeEvent({ event_type: "RESERVATION_COMPLETED" }),
      ],
      qrScans: [
        {
          restaurant_id: RESTAURANT_ID,
          table_id: "table-1",
          scanned_at: "2026-08-25T08:30:00.000Z",
        },
      ],
      range,
    });

    expect(report.websiteVisitors).toBe(2);
    expect(report.menuViews).toBe(1);
    expect(report.qrScans).toBe(1);
    expect(report.checkoutStarted).toBe(2);
    expect(report.orderConversionRate).toBe(50);
    expect(report.reservationStarted).toBe(2);
    expect(report.reservationConversionRate).toBe(50);
    expect(report.reservations).toBe(3);
    expect(report.reservationCancellations).toBe(1);
    expect(report.reservationNoShows).toBe(1);
  });
});
