"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Search } from "lucide-react";
import type { PlacedOrder } from "@/lib/order/types";
import { STATUS_LABELS } from "@/lib/order/constants";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { useRestaurantNav } from "@/hooks/useRestaurantNav";

interface OrderHistoryProps {
  restaurant: PublicRestaurant;
}

export function OrderHistory({ restaurant }: OrderHistoryProps) {
  const { orderHref } = useRestaurantNav(restaurant.slug);
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(`kati-customer-email:${restaurant.slug}`);
    if (saved) setEmail(saved);
  }, [restaurant.slug]);

  async function searchHistory(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        email: email.trim(),
        restaurantSlug: restaurant.slug,
      });
      const storedToken = window.sessionStorage.getItem(
        `kati-order-history-token:${restaurant.slug}:${email.trim().toLowerCase()}`,
      );
      if (storedToken) {
        params.set("accessToken", storedToken);
      }
      const response = await fetch(`/api/orders?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load order history");
      setOrders(payload);
    } catch (err) {
      setError(getErrorMessage(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <p className="eyebrow">Order history</p>
        <h1 className="mt-1 font-display text-3xl text-pine-900">Your past orders</h1>
        <p className="mt-2 text-sm text-pine-600">
          Enter the email you used at checkout to view orders from {restaurant.name}.
        </p>
      </div>

      <form onSubmit={searchHistory} className="card-elevated mb-8 flex flex-wrap gap-3 p-5">
        <div className="min-w-0 flex-1">
          <label htmlFor="history-email" className="label">
            Email address
          </label>
          <input
            id="history-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <button type="submit" className="btn-primary self-end" disabled={loading}>
          <Search className="h-4 w-4" />
          {loading ? "Searching…" : "Find orders"}
        </button>
      </form>

      {error ? <div className="alert-error mb-6">{error}</div> : null}

      {searched && !loading && orders.length === 0 && !error ? (
        <div className="card-elevated p-10 text-center">
          <History className="mx-auto h-10 w-10 text-pine-300" aria-hidden="true" />
          <p className="mt-4 font-display text-xl text-pine-900">No orders found</p>
          <p className="mt-2 text-sm text-pine-500">
            We could not find any orders for that email at this restaurant.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="card-elevated p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-pine-900">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-pine-500">
                  {new Intl.DateTimeFormat("en-NZ", {
                    dateStyle: "full",
                    timeStyle: "short",
                  }).format(new Date(order.placedAt))}
                </p>
              </div>
              <div className="text-right">
                <span className="badge-muted">{STATUS_LABELS[order.status]}</span>
                <p className="mt-2 font-display text-xl text-pine-900">
                  {formatPrice(order.totals.total)}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1 border-t border-pine-900/5 pt-4 text-sm text-pine-700">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.menuItemId}`} className="flex justify-between gap-3">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <Link href={orderHref} className="btn-secondary">
          Place a new order
        </Link>
      </div>
    </div>
  );
}
