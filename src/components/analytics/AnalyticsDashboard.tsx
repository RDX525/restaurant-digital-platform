"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  ShoppingBag,
  CalendarDays,
  Globe,
} from "lucide-react";
import type { AnalyticsReport } from "@/lib/analytics/types";
import type { DateRangePreset } from "@/lib/analytics/constants";
import { getErrorMessage, formatPrice } from "@/lib/utils";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";
import { DashboardResourceGate } from "@/components/dashboard/DashboardResourceGate";

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "custom", label: "Custom" },
];

export function AnalyticsDashboard() {
  const {
    restaurantId,
    loading: restaurantLoading,
    error: restaurantError,
  } = useActiveRestaurant();
  const [preset, setPreset] = useState<DateRangePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ preset });
    if (preset === "custom") {
      if (customFrom) params.set("from", customFrom);
      if (customTo) params.set("to", customTo);
    }
    return params.toString();
  }, [preset, customFrom, customTo]);

  const loadReport = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/analytics?${queryString}`,
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load analytics");
      setReport(payload);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, queryString]);

  useEffect(() => {
    if (!restaurantId) return;
    void loadReport();
  }, [loadReport, restaurantId]);

  function exportCsv() {
    if (!restaurantId) return;
    window.open(
      `/api/restaurants/${restaurantId}/analytics/export?${queryString}`,
      "_blank",
    );
  }

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preset === item.id
                  ? "nav-gradient-active"
                  : "border border-pine-200 text-pine-700 hover:bg-cream-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadReport()}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      {preset === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="input"
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading || !report ? (
        <p className="text-sm text-pine-500">Loading analytics…</p>
      ) : (
        <>
          <p className="text-sm text-pine-500">
            {report.range.label} · {report.range.timezone.replace("_", " ")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: formatPrice(report.revenue), icon: TrendingUp },
              { label: "Orders", value: String(report.orders), icon: ShoppingBag },
              { label: "AOV", value: formatPrice(report.averageOrderValue), icon: BarChart3 },
              { label: "Reservations", value: String(report.reservations), icon: CalendarDays },
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

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="platform-card p-5">
              <h3 className="mb-4 font-semibold text-pine-900">Orders by type</h3>
              <ul className="space-y-2 text-sm text-pine-700">
                <li>Pickup: {report.ordersByType.pickup}</li>
                <li>Delivery: {report.ordersByType.delivery}</li>
                <li>Dine-in: {report.ordersByType.dine_in}</li>
              </ul>
            </section>

            <section className="platform-card p-5">
              <h3 className="mb-4 font-semibold text-pine-900">Customers</h3>
              <ul className="space-y-2 text-sm text-pine-700">
                <li className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  New: {report.newCustomers}
                </li>
                <li>Returning: {report.returningCustomers}</li>
              </ul>
            </section>

            <section className="platform-card p-5">
              <h3 className="mb-4 font-semibold text-pine-900">Best-selling items</h3>
              {report.bestSellingItems.length === 0 ? (
                <p className="text-sm text-pine-500">No paid orders in this range.</p>
              ) : (
                <ul className="space-y-2 text-sm text-pine-700">
                  {report.bestSellingItems.map((item) => (
                    <li key={item.menuItemId} className="flex justify-between gap-3">
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} · {formatPrice(item.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="platform-card p-5">
              <h3 className="mb-4 font-semibold text-pine-900">Slow-moving items</h3>
              {report.slowMovingItems.length === 0 ? (
                <p className="text-sm text-pine-500">No item data in this range.</p>
              ) : (
                <ul className="space-y-2 text-sm text-pine-700">
                  {report.slowMovingItems.map((item) => (
                    <li key={item.menuItemId} className="flex justify-between gap-3">
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} · {formatPrice(item.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="platform-card p-5">
              <h3 className="mb-4 font-semibold text-pine-900">Reservations</h3>
              <ul className="space-y-2 text-sm text-pine-700">
                <li>Total: {report.reservations}</li>
                <li>Cancellations: {report.reservationCancellations}</li>
                <li>No-shows: {report.reservationNoShows}</li>
              </ul>
            </section>

            <section className="platform-card p-5">
              <h3 className="mb-4 font-semibold text-pine-900">Funnel</h3>
              <ul className="space-y-2 text-sm text-pine-700">
                <li className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  Website visitors: {report.websiteVisitors}
                </li>
                <li>Menu views: {report.menuViews}</li>
                <li>QR scans: {report.qrScans}</li>
                <li>Checkout started: {report.checkoutStarted}</li>
                <li>Order conversion: {report.orderConversionRate.toFixed(1)}%</li>
                <li>Reservation started: {report.reservationStarted}</li>
                <li>Reservation conversion: {report.reservationConversionRate.toFixed(1)}%</li>
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
