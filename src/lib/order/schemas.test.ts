import { describe, expect, it } from "vitest";
import {
  createOrderSchema,
  orderHistoryQuerySchema,
  updateOrderStatusSchema,
} from "@/lib/order/schemas";

describe("order schemas", () => {
  it("accepts minimal valid create order payload without prices", () => {
    const parsed = createOrderSchema.parse({
      idempotencyKey: "idem-12345678",
      restaurantSlug: "demo-restaurant",
      items: [
        {
          menuItemId: "00000000-0000-4000-8000-000000000401",
          quantity: 2,
          modifierIds: [],
        },
      ],
      customer: {
        name: "Alex",
        email: "alex@example.com",
        phone: "+64 21 000 0000",
        orderType: "pickup",
        address: "",
        notes: "",
      },
    });

    expect(parsed.items[0]!.quantity).toBe(2);
    expect(parsed.customer.email).toBe("alex@example.com");
    expect(parsed).not.toHaveProperty("totals");
  });

  it("rejects invalid guest email on create order", () => {
    expect(() =>
      createOrderSchema.parse({
        idempotencyKey: "idem-12345678",
        restaurantSlug: "demo-restaurant",
        items: [
          {
            menuItemId: "00000000-0000-4000-8000-000000000401",
            quantity: 1,
            modifierIds: [],
          },
        ],
        customer: {
          name: "Alex",
          email: "not-an-email",
          phone: "+64 21 000 0000",
          orderType: "pickup",
          address: "",
          notes: "",
        },
      }),
    ).toThrow();
  });

  it("rejects create order payload missing idempotency key", () => {
    expect(() =>
      createOrderSchema.parse({
        restaurantSlug: "demo-restaurant",
        items: [],
        customer: {},
      }),
    ).toThrow();
  });

  it("validates order history query", () => {
    const parsed = orderHistoryQuerySchema.parse({
      email: "Guest@Example.com",
      restaurantSlug: "demo-restaurant",
    });
    expect(parsed.email).toBe("guest@example.com");
  });

  it("validates status updates including cancellation", () => {
    expect(updateOrderStatusSchema.parse({ status: "accepted" }).status).toBe("accepted");
    expect(
      updateOrderStatusSchema.parse({
        status: "cancelled",
        cancellationReason: "Out of stock",
      }).cancellationReason,
    ).toBe("Out of stock");
  });
});
