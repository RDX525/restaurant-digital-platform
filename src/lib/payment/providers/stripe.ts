import Stripe from "stripe";
import type {
  PaymentProvider,
  PaymentProviderSessionInput,
  PaymentProviderSessionResult,
  PaymentRefundInput,
  PaymentRefundResult,
  PaymentWebhookEvent,
} from "../types";
import { getSiteUrl } from "@/lib/env/site-url";
import { getPaymentWebhookSecrets } from "../config";

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY must be set when PAYMENT_PROVIDER=stripe.");
  }
  return key;
}

function getStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey());
}

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

function fromMinorUnits(amount: number): number {
  return amount / 100;
}

function mapStripeEvent(event: Stripe.Event): PaymentWebhookEvent {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const amount = fromMinorUnits(session.amount_total ?? 0);
    const currency = (session.currency ?? "nzd").toUpperCase();

    return {
      eventId: event.id,
      type: "payment.succeeded",
      providerSessionId: session.id,
      providerTransactionId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? session.id,
      amount,
      currency,
      orderId: session.metadata?.orderId,
    };
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const amount = fromMinorUnits(session.amount_total ?? 0);
    const currency = (session.currency ?? "nzd").toUpperCase();

    return {
      eventId: event.id,
      type: "payment.failed",
      providerSessionId: session.id,
      providerTransactionId: session.id,
      amount,
      currency,
      orderId: session.metadata?.orderId,
    };
  }

  throw new Error(`Unsupported Stripe webhook event: ${event.type}`);
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  async createSession(input: PaymentProviderSessionInput): Promise<PaymentProviderSessionResult> {
    const stripe = getStripeClient();
    const siteUrl = getSiteUrl().replace(/\/$/, "");
    const slug = input.metadata?.restaurantSlug ?? "restaurant";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: toMinorUnits(input.amount),
            product_data: {
              name: "Restaurant order",
              description: `Order ${input.orderId.slice(0, 8)}`,
            },
          },
        },
      ],
      success_url: `${siteUrl}/r/${slug}/order?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/r/${slug}/order?payment=cancelled`,
      metadata: {
        orderId: input.orderId,
        restaurantId: input.restaurantId,
        idempotencyKey: input.idempotencyKey,
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return {
      providerSessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  verifyWebhookSignature(
    headers: Record<string, string | undefined>,
    rawBody: string,
  ): boolean {
    const secret = getPaymentWebhookSecrets("stripe");
    if (!secret) return false;

    const signature = headers["stripe-signature"];
    if (!signature) return false;

    try {
      getStripeClient().webhooks.constructEvent(rawBody, signature, secret);
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(
    rawBody: string,
    headers?: Record<string, string | undefined>,
  ): PaymentWebhookEvent {
    const secret = getPaymentWebhookSecrets("stripe");
    if (!secret) {
      throw new Error("PAYMENT_STRIPE_WEBHOOK_SECRET is not configured.");
    }

    const signature = headers?.["stripe-signature"];
    if (!signature) {
      throw new Error("Missing Stripe-Signature header.");
    }

    const event = getStripeClient().webhooks.constructEvent(rawBody, signature, secret);
    return mapStripeEvent(event);
  }

  async refund(input: PaymentRefundInput): Promise<PaymentRefundResult> {
    const stripe = getStripeClient();
    const refund = await stripe.refunds.create({
      payment_intent: input.providerTransactionId,
      amount: toMinorUnits(input.amount),
    });

    return {
      providerRefundId: refund.id,
      status: refund.status === "succeeded" ? "succeeded" : "pending",
    };
  }
}
