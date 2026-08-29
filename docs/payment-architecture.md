# Payment Architecture (Phase 1)

This document describes how direct ordering payments work in Kāti. The design prioritises **provider swapability**, **webhook-only confirmation**, and **never trusting the browser** for payment success.

## Principles

1. **No raw card data** — Card numbers, expiry, and CVC are never sent to or stored by Kāti.
2. **Webhook-only paid status** — An order is marked `paid` only after a verified provider webhook is processed server-side.
3. **Provider abstraction** — All providers implement the same interface so Stripe or others can be added later.
4. **Idempotency** — Order creation and webhook processing are idempotent to prevent duplicate charges or status updates.

## Flow

```
Customer checkout
    │
    ▼
POST /api/orders
    │  Creates order (payment_status: pending)
    │  Creates payment session
    ▼
POST /api/payments/sessions/:id/pay   (demo only — triggers provider server-side)
    │
    ▼
Payment provider processes charge
    │
    ▼
POST /api/webhooks/payments/:provider   (signed webhook)
    │
    ▼
Verify signature → parse event → idempotency check
    │
    ▼
Update payment session + transaction + order.payment_status
    │
    ▼
Customer polls GET /api/payments/sessions/:id until paid/failed
```

## Components

| Layer | Path | Responsibility |
|-------|------|----------------|
| Provider interface | `src/lib/payment/types.ts` | Contract for all payment providers |
| Demo provider | `src/lib/payment/providers/demo.ts` | Local/dev provider with signed webhooks |
| Payment service | `src/lib/payment/service.ts` | Sessions, webhook handling, refunds |
| Payment data | `src/lib/payment/data.ts` | Supabase persistence + demo fallback |
| Webhook signatures | `src/lib/payment/webhook-signature.ts` | HMAC SHA-256 verification |

## Provider interface

Every provider must implement:

```typescript
interface PaymentProvider {
  readonly name: string;
  createSession(input): Promise<ProviderSessionResult>;
  verifyWebhookSignature(headers, rawBody): boolean;
  parseWebhookEvent(rawBody): PaymentWebhookEvent;
  refund?(input): Promise<RefundResult>;
}
```

Register new providers in `src/lib/payment/providers/index.ts` and set `PAYMENT_PROVIDER`.

## Data model

### `payment_sessions`
Links an order to a provider checkout/charge attempt.

- `order_id`, `restaurant_id`, `provider`, `amount`, `currency`
- `status`: `pending` | `processing` | `succeeded` | `failed` | `cancelled`
- `provider_session_id`, `idempotency_key`

### `payment_transactions`
Immutable record of charges and refunds.

- `provider_transaction_id` — provider reference
- `transaction_type`: `charge` | `refund`
- `status`: `pending` | `succeeded` | `failed`

### `payment_webhook_events`
Idempotency log for processed webhooks.

- Unique on `(provider, event_id)`

### `restaurant_orders.payment_status`
`pending` | `paid` | `failed` | `refunded`

Updated **only** by webhook processing in `processVerifiedWebhook()`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `PAYMENT_PROVIDER` | Active provider (`demo` default) |
| `PAYMENT_DEMO_WEBHOOK_SECRET` | HMAC secret for demo webhook signatures |
| `PAYMENT_{PROVIDER}_WEBHOOK_SECRET` | Per-provider webhook secret (e.g. Stripe) |

See `.env.example`.

## API routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/orders` | Public | Create order + payment session |
| GET | `/api/payments/sessions/:id` | Public | Poll payment/order status (read-only) |
| POST | `/api/payments/sessions/:id/pay` | Public | Demo: trigger server-side charge |
| POST | `/api/webhooks/payments/:provider` | Public (signed) | Provider webhooks |
| POST | `/api/restaurants/:id/orders/:orderId/refund` | Staff | Initiate refund (demo) |

## Security notes

- The browser **never** sets `payment_status` to `paid`.
- `POST .../pay` only moves the session to `processing` and asks the demo provider to emit a signed webhook internally — the same code path as external webhooks.
- Webhook signatures use HMAC-SHA256 compared with `timingSafeEqual`.
- Duplicate webhook `event_id` values are ignored.
- Webhook amount/currency must match the payment session.

## Adding a new provider (e.g. Stripe)

1. Implement `PaymentProvider` in `src/lib/payment/providers/stripe.ts`.
2. Register in `getPaymentProvider()`.
3. Set `PAYMENT_PROVIDER=stripe` and `PAYMENT_STRIPE_WEBHOOK_SECRET`.
4. Replace demo pay UI with provider checkout redirect or Elements.
5. Configure Stripe webhook URL → `POST /api/webhooks/payments/stripe`.

No changes required to order creation, webhook handler, or order status logic.

## Tests

- `src/lib/payment/webhook.test.ts` — signature verification, idempotency, paid-only-via-webhook
- Run: `npm test`
