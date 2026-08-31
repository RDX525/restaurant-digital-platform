"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  CalendarDays,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import type { CustomerDetail, PublicCustomer } from "@/lib/customer/types";
import { getErrorMessage, formatPrice, cn } from "@/lib/utils";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";
import { DashboardResourceGate } from "@/components/dashboard/DashboardResourceGate";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomersDashboard() {
  const {
    restaurantId,
    loading: restaurantLoading,
    error: restaurantError,
  } = useActiveRestaurant();
  const [customers, setCustomers] = useState<PublicCustomer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customersRequestRef = useRef<AbortController | null>(null);

  const loadCustomers = useCallback(async (search?: string) => {
    if (!restaurantId) return;
    customersRequestRef.current?.abort();
    const controller = new AbortController();
    customersRequestRef.current = controller;
    try {
      const params = new URLSearchParams();
      if (search?.trim()) params.set("q", search.trim());
      const response = await fetch(
        `/api/restaurants/${restaurantId}/customers?${params.toString()}`,
        { signal: controller.signal },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load customers");
      setCustomers(payload);
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(getErrorMessage(err));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [restaurantId]);

  const loadDetail = useCallback(
    async (customerId: string) => {
      if (!restaurantId) return;
      setDetailLoading(true);
      try {
        const response = await fetch(
          `/api/restaurants/${restaurantId}/customers/${customerId}`,
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load customer");
        setDetail(payload);
      } catch (err) {
        setError(getErrorMessage(err));
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [restaurantId],
  );

  useEffect(() => {
    if (!restaurantId) return;
    void loadCustomers(debouncedQuery);
    return () => {
      customersRequestRef.current?.abort();
    };
  }, [loadCustomers, debouncedQuery, restaurantId]);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      withOrders: customers.filter((customer) => customer.totalOrders > 0).length,
      withReservations: customers.filter((customer) => customer.totalReservations > 0).length,
    };
  }, [customers]);

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
          { label: "Profiles", value: stats.total, icon: UserRound },
          { label: "With orders", value: stats.withOrders, icon: ShoppingBag },
          { label: "With reservations", value: stats.withReservations, icon: CalendarDays },
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
        <div className="relative min-w-[16rem] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pine-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone, or email"
            className="input pl-10"
          />
        </div>
        <button
          type="button"
          onClick={() => void loadCustomers(query)}
          className="btn-secondary inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section className="platform-card p-5">
          <h3 className="mb-4 font-semibold text-pine-900">Customers</h3>
          {loading ? (
            <p className="text-sm text-pine-500">Loading customers…</p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-pine-500">
              No customer profiles yet. Profiles appear when guests place orders or book tables.
            </p>
          ) : (
            <ul className="space-y-2">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(customer.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      selectedId === customer.id
                        ? "border-gold-400 bg-gold-50/60"
                        : "border-pine-100 hover:border-pine-200 hover:bg-cream-50",
                    )}
                  >
                    <p className="font-semibold text-pine-900">{customer.name || "Guest"}</p>
                    <p className="mt-1 text-sm text-pine-600">{customer.email}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-pine-500">
                      <span>{customer.totalOrders} orders</span>
                      <span>{customer.totalReservations} reservations</span>
                      <span>{formatPrice(customer.totalSpend)} spent</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="platform-card p-5">
          {!selectedId ? (
            <div className="flex h-full min-h-[20rem] items-center justify-center text-sm text-pine-500">
              Select a customer to view profile and history.
            </div>
          ) : detailLoading ? (
            <p className="text-sm text-pine-500">Loading profile…</p>
          ) : detail ? (
            <CustomerDetailPanel detail={detail} />
          ) : (
            <p className="text-sm text-pine-500">Customer not found.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function CustomerDetailPanel({ detail }: { detail: CustomerDetail }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Customer profile</p>
        <h3 className="font-display text-2xl text-pine-900">{detail.name || "Guest"}</h3>
        <div className="mt-3 space-y-1 text-sm text-pine-600">
          <p className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {detail.email}
          </p>
          <p className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4" aria-hidden="true" />
            {detail.phone || "—"}
          </p>
          {detail.address ? <p>{detail.address}</p> : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Total orders", value: String(detail.totalOrders) },
          { label: "Total spend", value: formatPrice(detail.totalSpend) },
          { label: "Average order", value: formatPrice(detail.averageOrderValue) },
          { label: "Total reservations", value: String(detail.totalReservations) },
          { label: "First order", value: formatDate(detail.firstOrderAt) },
          { label: "Last order", value: formatDate(detail.lastOrderAt) },
          { label: "Last reservation", value: formatDate(detail.lastReservationAt) },
          { label: "Lifecycle", value: detail.lifecycleStage },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-pine-100 bg-cream-50/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pine-500">
              {label}
            </p>
            <p className="mt-1 font-semibold text-pine-900">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h4 className="mb-3 font-semibold text-pine-900">Order history</h4>
        {detail.orderHistory.length === 0 ? (
          <p className="text-sm text-pine-500">No orders yet.</p>
        ) : (
          <ul className="space-y-2">
            {detail.orderHistory.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-pine-100 px-4 py-3 text-sm text-pine-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-pine-900">{order.orderNumber}</span>
                  <span>{formatPrice(order.totals.total)}</span>
                </div>
                <p className="mt-1 text-pine-500">
                  {formatDate(order.placedAt)} · {order.status} · {order.paymentStatus}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="mb-3 font-semibold text-pine-900">Reservation history</h4>
        {detail.reservationHistory.length === 0 ? (
          <p className="text-sm text-pine-500">No reservations yet.</p>
        ) : (
          <ul className="space-y-2">
            {detail.reservationHistory.map((reservation) => (
              <li
                key={reservation.id}
                className="rounded-xl border border-pine-100 px-4 py-3 text-sm text-pine-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-pine-900">
                    {reservation.date} · {reservation.time}
                  </span>
                  <span className="capitalize">{reservation.status.replace("_", " ")}</span>
                </div>
                <p className="mt-1 text-pine-500">{reservation.guestCount} guests</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
