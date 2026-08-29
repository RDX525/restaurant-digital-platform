"use client";

import { useCallback, useEffect, useState } from "react";
import { useIntervalWhenVisible } from "@/hooks/useIntervalWhenVisible";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Package,
  RefreshCw,
  Truck,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import type { PlacedOrder } from "@/lib/order/types";
import { STATUS_LABELS, STATUS_TRANSITIONS } from "@/lib/order/constants";
import type { OrderStatus } from "@/lib/order/constants";
import { getErrorMessage, formatPrice, cn } from "@/lib/utils";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";
import { DashboardResourceGate } from "@/components/dashboard/DashboardResourceGate";

const POLL_INTERVAL_MS = 8000;

function orderTypeIcon(type: PlacedOrder["customer"]["orderType"]) {
  if (type === "delivery") return Truck;
  if (type === "dine_in") return UtensilsCrossed;
  return Package;
}

function statusTone(status: OrderStatus) {
  switch (status) {
    case "new":
      return "badge-live";
    case "accepted":
    case "preparing":
      return "badge-popular";
    case "ready":
      return "badge-success";
    case "completed":
      return "badge-muted";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-1 ring-red-200/70 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    default:
      return "badge-muted";
  }
}

function nextActions(status: OrderStatus): { label: string; status: OrderStatus }[] {
  return (STATUS_TRANSITIONS[status] ?? []).map((next) => ({
    label: next === "cancelled" ? "Cancel" : STATUS_LABELS[next],
    status: next,
  }));
}

export function OrdersDashboard() {
  const {
    restaurantId,
    loading: restaurantLoading,
    error: restaurantError,
  } = useActiveRestaurant();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/orders`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load orders");
      setOrders(payload);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    void loadOrders();
  }, [loadOrders, restaurantId]);

  useIntervalWhenVisible(loadOrders, restaurantId ? POLL_INTERVAL_MS : null);

  async function refundOrder(order: PlacedOrder) {
    if (!confirm(`Refund ${order.orderNumber}?`)) return;
    setBusyId(order.id);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/orders/${order.id}/refund`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Refund failed");
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(
    order: PlacedOrder,
    status: OrderStatus,
  ) {
    let cancellationReason: string | undefined;
    if (status === "cancelled") {
      cancellationReason = prompt("Cancellation reason (optional)") ?? undefined;
      if (cancellationReason === null) return;
    }

    setBusyId(order.id);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/orders/${order.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, cancellationReason }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to update order");
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const filtered =
    filter === "all" ? orders : orders.filter((order) => order.status === filter);

  const counts = {
    new: orders.filter((o) => o.status === "new").length,
    active: orders.filter((o) =>
      ["accepted", "preparing", "ready"].includes(o.status),
    ).length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  if (restaurantLoading || restaurantError || !restaurantId) {
    return (
      <DashboardResourceGate
        loading={restaurantLoading}
        error={restaurantError}
        ready={Boolean(restaurantId)}
      >
        {null}
      </DashboardResourceGate>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "New orders", value: counts.new, icon: Clock },
          { label: "In progress", value: counts.active, icon: ChefHat },
          { label: "Completed today", value: counts.completed, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel-muted">
            <div className="flex items-center gap-2 text-pine-500">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.15em]">{label}</p>
            </div>
            <p className="mt-2 font-display text-3xl text-pine-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Live orders</p>
          <h2 className="mt-1 font-display text-2xl text-pine-900">Order queue</h2>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void loadOrders()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "new", "accepted", "preparing", "ready", "completed", "cancelled"] as const).map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                filter === status ? "nav-gradient-active" : "bg-white text-pine-600 ring-1 ring-pine-900/5",
              )}
            >
              {status === "all" ? "All" : STATUS_LABELS[status]}
            </button>
          ),
        )}
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      {loading ? (
        <div className="platform-card p-10 text-center text-sm text-pine-500">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="platform-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-pine-300" aria-hidden="true" />
          <p className="mt-4 font-display text-xl text-pine-900">No orders yet</p>
          <p className="mt-2 text-sm text-pine-500">
            New orders from pickup, delivery, and dine-in will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const TypeIcon = orderTypeIcon(order.customer.orderType);
            const actions = nextActions(order.status);

            return (
              <article key={order.id} className="platform-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg text-pine-900">{order.orderNumber}</span>
                      <span className={statusTone(order.status)}>{STATUS_LABELS[order.status]}</span>
                      <span className="badge-muted capitalize">{order.customer.orderType.replace("_", " ")}</span>
                      <span className={cn(
                        "badge-muted capitalize",
                        order.paymentStatus === "paid" && "badge-success",
                        order.paymentStatus === "failed" && "bg-red-50 text-red-700 ring-1 ring-red-200/70",
                      )}>
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-pine-600">
                      {order.customer.name} · {order.customer.phone} · {order.customer.email}
                    </p>
                    {order.tableLabel ? (
                      <p className="mt-1 text-sm text-pine-500">
                        <UtensilsCrossed className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                        {order.tableLabel}
                      </p>
                    ) : null}
                    {order.customer.orderType === "delivery" && order.customer.address ? (
                      <p className="mt-1 text-sm text-pine-500">{order.customer.address}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl text-pine-900">{formatPrice(order.totals.total)}</p>
                    <p className="mt-1 text-xs text-pine-500">
                      {new Intl.DateTimeFormat("en-NZ", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(order.placedAt))}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-1 border-t border-pine-900/5 pt-4 text-sm text-pine-700">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.menuItemId}-${item.name}`} className="flex justify-between gap-3">
                      <span>
                        <TypeIcon className="mr-1 inline h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                        {item.quantity}× {item.name}
                        {item.modifiers.length
                          ? ` (${item.modifiers.map((m) => m.name).join(", ")})`
                          : ""}
                      </span>
                      <span>{formatPrice(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                {order.customer.notes ? (
                  <p className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-sm text-pine-600">
                    Note: {order.customer.notes}
                  </p>
                ) : null}

                {actions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => void updateStatus(order, action.status)}
                        className={cn(
                          "rounded-xl px-3 py-2 text-xs font-semibold transition",
                          action.status === "cancelled"
                            ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                            : "btn-primary py-2",
                        )}
                      >
                        {action.status === "cancelled" ? (
                          <>
                            <XCircle className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                            Cancel
                          </>
                        ) : (
                          action.label
                        )}
                      </button>
                    ))}
                    {order.paymentStatus === "paid" ? (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => void refundOrder(order)}
                        className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                      >
                        Refund
                      </button>
                    ) : null}
                  </div>
                ) : order.paymentStatus === "paid" ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => void refundOrder(order)}
                      className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                    >
                      Refund
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
