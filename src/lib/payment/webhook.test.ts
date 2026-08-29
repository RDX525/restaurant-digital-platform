import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDemoOrderStore, createDemoOrder, getDemoOrderByIdGlobal } from "@/lib/order/demo-store";
import { resetDemoPaymentStore, getDemoPaymentSessionByOrderId } from "@/lib/payment/demo-store";
import { getDemoFullMenu } from "@/lib/menu/demo-data";
import { getDemoRestaurantId } from "@/lib/utils";
import { calculateOrderTotals, priceOrderLines } from "@/lib/order/pricing";
import {
  createPaymentSessionForOrder,
  handleProviderWebhook,
  initiateDemoProviderCharge,
  simulateWebhookForTests,
} from "@/lib/payment/service";
import { DemoPaymentProvider, createDemoSuccessEvent } from "@/lib/payment/providers/demo";
import { buildWebhookSignatureHeader } from "@/lib/payment/webhook-signature";
import { verifyWebhookSignature } from "@/lib/payment/webhook-signature";

const RESTAURANT_ID = getDemoRestaurantId();

function buildDemoOrder() {
  const menu = getDemoFullMenu();
  const item = menu.categories[0]!.items[0]!;
  const lines = priceOrderLines(menu, [{ menuItemId: item.id, quantity: 1, modifierIds: [] }]);
  const totals = calculateOrderTotals(lines, "pickup");

  return createDemoOrder({
    idempotencyKey: `order-${crypto.randomUUID()}`,
    restaurantId: RESTAURANT_ID,
    restaurantSlug: "demo-restaurant",
    restaurantName: "Demo Restaurant",
    orderType: "pickup",
    customer: {
      name: "Alex Guest",
      email: "alex@example.com",
      phone: "+64 21 000 0000",
      orderType: "pickup",
      address: "",
      notes: "",
    },
    items: [{ menuItemId: item.id, quantity: 1, modifierIds: [] }],
    pricedItems: lines,
    totals,
  });
}

describe("payment webhook security", () => {
  beforeEach(() => {
    resetDemoOrderStore();
    resetDemoPaymentStore();
    vi.stubEnv("PAYMENT_PROVIDER", "demo");
    vi.stubEnv("PAYMENT_DEMO_WEBHOOK_SECRET", "test-webhook-secret");
  });

  it("verifies webhook signatures with timing-safe comparison", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = buildWebhookSignatureHeader(body, "test-webhook-secret");

    expect(verifyWebhookSignature(body, signature, "test-webhook-secret")).toBe(true);
    expect(verifyWebhookSignature(body, "sha256=deadbeef", "test-webhook-secret")).toBe(false);
  });

  it("marks an order paid only through a verified webhook", async () => {
    const order = buildDemoOrder();
    expect(order.payment_status).toBe("pending");

    const session = await createPaymentSessionForOrder({
      orderId: order.id,
      restaurantId: RESTAURANT_ID,
      amount: order.total,
      idempotencyKey: `pay-${order.id}`,
      customerEmail: order.customer.email,
    });

    await initiateDemoProviderCharge({ sessionId: session.id, outcome: "success" });

    const updated = getDemoOrderByIdGlobal(order.id);
    expect(updated?.payment_status).toBe("paid");
  });

  it("rejects webhooks with invalid signatures", async () => {
    const order = buildDemoOrder();
    const session = await createPaymentSessionForOrder({
      orderId: order.id,
      restaurantId: RESTAURANT_ID,
      amount: order.total,
      idempotencyKey: `pay-invalid-${order.id}`,
      customerEmail: order.customer.email,
    });

    const storedSession = getDemoPaymentSessionByOrderId(order.id)!;
    const event = createDemoSuccessEvent({
      eventId: `evt_${crypto.randomUUID()}`,
      providerSessionId: storedSession.provider_session_id!,
      providerTransactionId: `txn_${crypto.randomUUID()}`,
      amount: order.total,
      currency: "NZD",
      orderId: order.id,
    });

    const rawBody = JSON.stringify(event);

    await expect(
      simulateWebhookForTests("demo", { "x-payment-signature": "sha256=invalid" }, rawBody),
    ).rejects.toThrow(/Invalid webhook signature/);

    expect(getDemoOrderByIdGlobal(order.id)?.payment_status).toBe("pending");
    expect(session.status).not.toBe("succeeded");
  });

  it("processes webhook events idempotently", async () => {
    const order = buildDemoOrder();
    await createPaymentSessionForOrder({
      orderId: order.id,
      restaurantId: RESTAURANT_ID,
      amount: order.total,
      idempotencyKey: `pay-idem-${order.id}`,
      customerEmail: order.customer.email,
    });

    const storedSession = getDemoPaymentSessionByOrderId(order.id)!;
    const event = createDemoSuccessEvent({
      eventId: "evt_idempotent_001",
      providerSessionId: storedSession.provider_session_id!,
      providerTransactionId: "txn_idempotent_001",
      amount: order.total,
      currency: "NZD",
      orderId: order.id,
    });

    const { rawBody, signature } = new DemoPaymentProvider().buildSignedWebhookPayload(event);

    const first = await handleProviderWebhook("demo", { "x-payment-signature": signature }, rawBody);
    const second = await handleProviderWebhook("demo", { "x-payment-signature": signature }, rawBody);

    expect(first.processed).toBe(true);
    expect(second.processed).toBe(false);
    expect(getDemoOrderByIdGlobal(order.id)?.payment_status).toBe("paid");
  });

  it("records failed payments without marking the order paid", async () => {
    const order = buildDemoOrder();
    const session = await createPaymentSessionForOrder({
      orderId: order.id,
      restaurantId: RESTAURANT_ID,
      amount: order.total,
      idempotencyKey: `pay-fail-${order.id}`,
      customerEmail: order.customer.email,
    });

    await initiateDemoProviderCharge({ sessionId: session.id, outcome: "failure" });

    expect(getDemoOrderByIdGlobal(order.id)?.payment_status).toBe("failed");
  });
});
