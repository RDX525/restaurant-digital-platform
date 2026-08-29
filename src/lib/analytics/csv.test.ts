import { describe, expect, it } from "vitest";
import { resolveDateRange } from "./date-range";
import { analyticsReportToCsv } from "./csv";
import { buildAnalyticsReport } from "./reports";

describe("analytics CSV export", () => {
  it("includes authoritative financial metrics and item sections", () => {
    const range = resolveDateRange(
      "today",
      "Pacific/Auckland",
      undefined,
      undefined,
      new Date("2026-08-25T02:00:00.000Z"),
    );

    const report = buildAnalyticsReport({
      orders: [
        {
          id: "order-1",
          order_number: "ORD-1",
          restaurant_id: "00000000-0000-4000-8000-000000000001",
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
            phone: "",
            orderType: "pickup",
            address: "",
            notes: "",
          },
          customer_email: "alex@example.com",
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              basePrice: 20,
              quantity: 1,
              modifiers: [],
              lineTotal: 20,
            },
          ],
          subtotal: 20,
          discount_amount: 0,
          delivery_fee: 0,
          tax_amount: 0,
          total: 20,
          idempotency_key: null,
          cancellation_reason: null,
          cancelled_at: null,
          placed_at: "2026-08-25T10:00:00.000Z",
          estimated_ready_at: null,
          updated_at: "2026-08-25T10:00:00.000Z",
        },
      ],
      reservations: [],
      events: [],
      qrScans: [],
      range,
    });

    const csv = analyticsReportToCsv(report);

    expect(csv).toContain("Revenue (paid orders),20.00");
    expect(csv).toContain("Orders (paid),1");
    expect(csv).toContain("Average order value,20.00");
    expect(csv).toContain("Best selling items,Quantity,Revenue");
    expect(csv).toContain("Burger,1,20.00");
  });
});
