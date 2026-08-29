"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  UtensilsCrossed,
} from "lucide-react";
import type { FullMenu } from "@/lib/menu/types";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { calculateCartTotals, clearIdempotencyKey, getOrCreateIdempotencyKey } from "@/lib/order/cart";
import type {
  CheckoutStep,
  CustomerDetails,
  PlacedOrder,
} from "@/lib/order/types";
import type { PaymentSessionView } from "@/lib/payment/types";
import { useOrderCart } from "@/components/order/OrderCartProvider";
import { useTableSession } from "@/components/table/TableSessionProvider";
import { getRestaurantBasePath } from "@/lib/restaurant/seo";
import { cn, formatPrice } from "@/lib/utils";
import { trackPageEvent } from "@/lib/analytics/client";

interface OrderCheckoutProps {
  restaurant: PublicRestaurant;
  menu: FullMenu | null;
}

export function OrderCheckout({ restaurant, menu }: OrderCheckoutProps) {
  const base = getRestaurantBasePath(restaurant.slug);
  const { items, updateQuantity, removeItem, clearAll } = useOrderCart();
  const { session: tableSession } = useTableSession();
  const isDineIn = Boolean(
    tableSession && tableSession.restaurantSlug === restaurant.slug,
  );
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    email: "",
    phone: "",
    orderType: isDineIn ? "dine_in" : "pickup",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (isDineIn) {
      setCustomer((current) =>
        current.orderType === "dine_in" ? current : { ...current, orderType: "dine_in" },
      );
    }
  }, [isDineIn]);

  useEffect(() => {
    trackPageEvent(restaurant.slug, "CHECKOUT_STARTED", "/order");
  }, [restaurant.slug]);

  const totals = useMemo(
    () => calculateCartTotals(items, customer.orderType),
    [items, customer.orderType],
  );

  async function waitForPaymentConfirmation(
    sessionId: string,
    accessToken: string,
  ): Promise<"paid" | "failed"> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const params = new URLSearchParams({ accessToken });
      const response = await fetch(`/api/payments/sessions/${sessionId}?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to verify payment status.");
      }

      if (payload.orderPaymentStatus === "paid") return "paid";
      if (payload.orderPaymentStatus === "failed") return "failed";

      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    throw new Error("Payment confirmation timed out. Please check your order history.");
  }

  async function submitOrder() {
    setSubmitting(true);
    setError(null);

    try {
      const idempotencyKey = getOrCreateIdempotencyKey(restaurant.slug);

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          restaurantSlug: restaurant.slug,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            modifierIds: item.modifiers.map((modifier) => modifier.id),
            specialInstructions: item.specialInstructions,
          })),
          customer,
        }),
      });

      const orderPayload = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderPayload.error ?? "Unable to create order.");
      }

      const { order, paymentSession, orderHistoryAccessToken, paymentSessionAccessToken } =
        orderPayload as {
          order: PlacedOrder;
          paymentSession: PaymentSessionView;
          orderHistoryAccessToken?: string;
          paymentSessionAccessToken?: string;
        };

      if (paymentSession.checkoutUrl) {
        window.location.href = paymentSession.checkoutUrl;
        return;
      }

      const payResponse = await fetch(`/api/payments/sessions/${paymentSession.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: "success" }),
      });

      if (!payResponse.ok) {
        const payPayload = await payResponse.json();
        throw new Error(payPayload.error ?? "Payment could not be initiated.");
      }

      const paymentResult = await waitForPaymentConfirmation(
        paymentSession.id,
        paymentSessionAccessToken ?? "",
      );
      if (paymentResult !== "paid") {
        throw new Error("Payment failed. Your order was not confirmed.");
      }

      setPlacedOrder({ ...order, paymentStatus: "paid" });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `kati-customer-email:${restaurant.slug}`,
          customer.email,
        );
        if (orderHistoryAccessToken) {
          window.sessionStorage.setItem(
            `kati-order-history-token:${restaurant.slug}:${customer.email.trim().toLowerCase()}`,
            orderHistoryAccessToken,
          );
        }
      }
      clearAll();
      clearIdempotencyKey(restaurant.slug);
      setStep("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "confirmation" && placedOrder) {
    return (
      <ConfirmationView
        order={placedOrder}
        restaurant={restaurant}
        base={base}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <StepIndicator step={step} />

      {step === "cart" ? (
        <CartStep
          items={items}
          menu={menu}
          base={base}
          totals={totals}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
          onContinue={() => {
            if (items.length === 0) {
              setError("Add at least one item to continue.");
              return;
            }
            setError(null);
            setStep("details");
          }}
          error={error}
        />
      ) : null}

      {step === "details" ? (
        <DetailsStep
          customer={customer}
          restaurant={restaurant}
          totals={totals}
          isDineIn={isDineIn}
          tableLabel={tableSession?.tableLabel}
          onChange={setCustomer}
          onBack={() => setStep("cart")}
          onContinue={() => {
            if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim()) {
              setError("Please complete your contact details.");
              return;
            }
            if (customer.orderType === "delivery" && !customer.address.trim()) {
              setError("Please enter a delivery address.");
              return;
            }
            setError(null);
            setStep("payment");
          }}
          error={error}
        />
      ) : null}

      {step === "payment" ? (
        <PaymentStep
          totals={totals}
          submitting={submitting}
          onBack={() => setStep("details")}
          onSubmit={submitOrder}
          error={error}
        />
      ) : null}
    </div>
  );
}

function StepIndicator({ step }: { step: CheckoutStep }) {
  const steps = [
    { id: "cart", label: "Cart" },
    { id: "details", label: "Details" },
    { id: "payment", label: "Payment" },
  ] as const;

  const activeIndex = steps.findIndex((entry) => entry.id === step);

  return (
    <ol className="checkout-steps">
      {steps.map((entry, index) => {
        const active = index <= activeIndex;
        return (
          <li key={entry.id} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "checkout-step",
                  active ? "checkout-step-active" : "checkout-step-inactive",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  active ? "text-pine-900" : "text-pine-400",
                )}
              >
                {entry.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span className="h-px w-8 bg-pine-900/10" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function CartStep({
  items,
  menu,
  base,
  totals,
  onUpdateQuantity,
  onRemove,
  onContinue,
  error,
}: {
  items: ReturnType<typeof useOrderCart>["items"];
  menu: FullMenu | null;
  base: string;
  totals: ReturnType<typeof calculateCartTotals>;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
  onContinue: () => void;
  error: string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="card-elevated p-10 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-pine-300" aria-hidden="true" />
        <h2 className="mt-4 font-display text-2xl text-pine-900">Your cart is empty</h2>
        <p className="mt-2 text-sm text-pine-500">
          Browse the menu and add dishes to start your order.
        </p>
        <Link href={`${base}/menu`} className="btn-accent mt-6">
          Browse menu
          <ArrowRight className="h-4 w-4" />
        </Link>
        {menu?.categories.length ? (
          <p className="mt-4 text-xs text-pine-400">
            {menu.categories.reduce((sum, category) => sum + category.items.length, 0)} items
            available
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-elevated divide-y divide-pine-900/5">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-pine-900">{item.name}</h3>
                  {item.modifiers.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-xs text-pine-500">
                      {item.modifiers.map((modifier) => (
                        <li key={modifier.id}>
                          {modifier.groupName}: {modifier.name}
                          {modifier.price > 0 ? ` (+${formatPrice(modifier.price)})` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.specialInstructions ? (
                    <p className="mt-2 text-xs text-pine-500">
                      Note: {item.specialInstructions}
                    </p>
                  ) : null}
                </div>
                <p className="font-display text-lg text-pine-900">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="rounded-lg border border-pine-900/10 p-2 hover:bg-cream-50"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="rounded-lg border border-pine-900/10 p-2 hover:bg-cream-50"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SummaryCard totals={totals} />

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <Link href={`${base}/menu`} className="btn-secondary">
          Add more items
        </Link>
        <button
          type="button"
          onClick={onContinue}
          className="btn-primary flex-1 py-3 sm:flex-none"
        >
          Continue to details
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DetailsStep({
  customer,
  restaurant,
  totals,
  isDineIn,
  tableLabel,
  onChange,
  onBack,
  onContinue,
  error,
}: {
  customer: CustomerDetails;
  restaurant: PublicRestaurant;
  totals: ReturnType<typeof calculateCartTotals>;
  isDineIn: boolean;
  tableLabel?: string;
  onChange: (value: CustomerDetails) => void;
  onBack: () => void;
  onContinue: () => void;
  error: string | null;
}) {
  const orderTypes = isDineIn
    ? (["dine_in"] as const)
    : (["pickup", "delivery"] as const);

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <div className="mb-5 flex items-center gap-2 text-pine-800">
          <User className="h-5 w-5" />
          <h2 className="font-display text-2xl">Your details</h2>
        </div>

        {isDineIn ? (
          <div className="info-banner mb-5 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Dine-in order for <strong>{tableLabel}</strong>. Your table is verified from the QR scan.
            </span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            value={customer.name}
            onChange={(value) => onChange({ ...customer, name: value })}
            autoComplete="name"
          />
          <Field
            label="Phone"
            value={customer.phone}
            onChange={(value) => onChange({ ...customer, phone: value })}
            autoComplete="tel"
          />
          <div className="sm:col-span-2">
            <Field
              label="Email"
              type="email"
              value={customer.email}
              onChange={(value) => onChange({ ...customer, email: value })}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="label">Order type</p>
          <div className={cn("grid gap-3", orderTypes.length > 1 ? "sm:grid-cols-2" : "max-w-sm")}>
            {orderTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ ...customer, orderType: type })}
                className={cn(
                  "rounded-xl border px-4 py-4 text-left transition",
                  customer.orderType === type
                    ? "border-pine-700 bg-cream-50"
                    : "border-pine-900/10 hover:border-pine-900/20",
                )}
              >
                <p className="font-medium capitalize text-pine-900">
                  {type === "dine_in" ? "Dine in" : type}
                </p>
                <p className="mt-1 text-xs text-pine-500">
                  {type === "pickup"
                    ? `Collect from ${restaurant.address_line1 ?? "the restaurant"}`
                    : type === "dine_in"
                      ? `Served to ${tableLabel ?? "your table"}`
                      : "Delivered to your door"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {customer.orderType === "delivery" ? (
          <div className="mt-4">
            <label htmlFor="delivery-address" className="label">
              Delivery address
            </label>
            <textarea
              id="delivery-address"
              value={customer.address}
              onChange={(event) => onChange({ ...customer, address: event.target.value })}
              rows={3}
              className="input resize-none"
              placeholder="Street, suburb, city, postcode"
            />
          </div>
        ) : null}

        <div className="mt-4">
          <label htmlFor="order-notes" className="label">
            Order notes
          </label>
          <textarea
            id="order-notes"
            value={customer.notes}
            onChange={(event) => onChange({ ...customer, notes: event.target.value })}
            rows={3}
            className="input resize-none"
            placeholder="Allergies, timing requests, or delivery instructions"
          />
        </div>
      </div>

      <SummaryCard totals={totals} showDelivery={totals.deliveryFee > 0} />

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="btn-primary flex-1 py-3 sm:flex-none"
        >
          Continue to payment
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PaymentStep({
  totals,
  submitting,
  onBack,
  onSubmit,
  error,
}: {
  totals: ReturnType<typeof calculateCartTotals>;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <div className="mb-5 flex items-center gap-2 text-pine-800">
          <CreditCard className="h-5 w-5" />
          <h2 className="font-display text-2xl">Secure payment</h2>
        </div>

        <p className="info-banner mb-5">
          Card details are handled by our payment provider. Kāti never stores raw card numbers,
          expiry dates, or CVC codes.
        </p>

        <div className="rounded-xl border border-pine-900/10 bg-cream-50 p-5 text-sm text-pine-700">
          <p className="font-medium text-pine-900">Demo payment provider</p>
          <p className="mt-2 leading-relaxed">
            Clicking pay creates a payment session and confirms it through a signed server webhook.
            Your order is only marked paid after that webhook is verified — not when this button is
            clicked alone.
          </p>
        </div>
      </div>

      <SummaryCard totals={totals} showDelivery={totals.deliveryFee > 0} />

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="btn-secondary" disabled={submitting}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="btn-primary flex-1 py-3 sm:flex-none"
        >
          {submitting ? "Confirming payment…" : `Pay ${formatPrice(totals.total)} securely`}
        </button>
      </div>
    </div>
  );
}

function ConfirmationView({
  order,
  restaurant,
  base,
}: {
  order: PlacedOrder;
  restaurant: PublicRestaurant;
  base: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="card-elevated p-8 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-14 w-14 text-gold-500" aria-hidden="true" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-pine-400">
          Order confirmed
        </p>
        <h2 className="mt-2 font-display text-3xl text-pine-900">Thank you, {order.customer.name}</h2>
        <p className="mt-3 text-sm text-pine-600">
          Your order{" "}
          <span className="font-semibold text-pine-900">{order.orderNumber}</span> has been
          placed at {restaurant.name}.
        </p>

        <div className="panel-muted mt-8 p-5 text-left">
          <div className="flex items-center gap-2 text-sm text-pine-700">
            {order.customer.orderType === "delivery" ? (
              <Truck className="h-4 w-4" />
            ) : order.customer.orderType === "dine_in" ? (
              <UtensilsCrossed className="h-4 w-4" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            <span className="capitalize">
              {order.customer.orderType === "dine_in" ? "Dine in" : order.customer.orderType}
              {order.tableLabel ? ` · ${order.tableLabel}` : ""}
            </span>
            <span aria-hidden="true">·</span>
            <span>Ready around {formatTime(order.estimatedReadyAt)}</span>
          </div>
          <ul className="mt-4 space-y-2 border-t border-pine-900/5 pt-4 text-sm text-pine-700">
            {order.items.map((item) => (
              <li key={`${item.menuItemId}-${item.name}`} className="flex justify-between gap-3">
                <span>
                  {item.quantity}× {item.name}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-pine-900/5 pt-4 font-medium text-pine-900">
            <span>Total paid</span>
            <span>{formatPrice(order.totals.total)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={base} className="btn-secondary">
            Back to home
          </Link>
          <Link href={`${base}/orders`} className="btn-secondary">
            Order history
          </Link>
          <Link href={`${base}/menu`} className="btn-accent">
            Order again
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  totals,
  showDelivery = false,
}: {
  totals: ReturnType<typeof calculateCartTotals>;
  showDelivery?: boolean;
}) {
  return (
    <div className="card-elevated p-5">
      <div className="space-y-2 text-sm text-pine-600">
        <div className="flex justify-between">
          <span>Subtotal ({totals.itemCount} items)</span>
          <span>{formatPrice(totals.subtotal)}</span>
        </div>
        {totals.discountAmount > 0 ? (
          <div className="flex justify-between text-emerald-700">
            <span>Discount</span>
            <span>-{formatPrice(totals.discountAmount)}</span>
          </div>
        ) : null}
        {showDelivery ? (
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{formatPrice(totals.deliveryFee)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>GST (15%)</span>
          <span>{formatPrice(totals.taxAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-pine-900/5 pt-3 text-base font-semibold text-pine-900">
          <span>Total</span>
          <span>{formatPrice(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="input"
      />
    </div>
  );
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
