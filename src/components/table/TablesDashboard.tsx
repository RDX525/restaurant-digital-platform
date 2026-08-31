"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { TableDashboardRow } from "@/lib/table/types";
import { getErrorMessage, cn } from "@/lib/utils";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";
import { DashboardResourceGate } from "@/components/dashboard/DashboardResourceGate";

function formatRelativeTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusBadge(status: TableDashboardRow["qr_status"]) {
  const styles = {
    active: "badge-success",
    disabled: "badge-muted",
    missing: "badge-muted",
  } as const;
  const labels = {
    active: "Active",
    disabled: "Disabled",
    missing: "Missing",
  } as const;
  return <span className={styles[status]}>{labels[status]}</span>;
}

export function TablesDashboard() {
  const {
    restaurantId,
    loading: restaurantLoading,
    error: restaurantError,
  } = useActiveRestaurant();
  const [tables, setTables] = useState<TableDashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/tables`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load tables");
      setTables(payload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    void loadTables();
  }, [loadTables, restaurantId]);

  async function handleCreate() {
    const label = prompt("Table name or number");
    if (!label?.trim()) return;

    setBusyId("create");
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to create table");
      await loadTables();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRename(table: TableDashboardRow) {
    const label = prompt("Rename table", table.label);
    if (!label?.trim() || label.trim() === table.label) return;

    setBusyId(table.id);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/tables/${table.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: label.trim() }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to rename table");
      await loadTables();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(table: TableDashboardRow) {
    setBusyId(table.id);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/tables/${table.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !table.is_active }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to update table");
      await loadTables();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRegenerate(table: TableDashboardRow) {
    if (
      !confirm(
        `Regenerate QR for ${table.label}? The old code will stop working immediately.`,
      )
    ) {
      return;
    }

    setBusyId(table.id);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/tables/${table.id}/regenerate`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to regenerate QR");
      await loadTables();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function qrImageUrl(tableId: string) {
    return `/api/restaurants/${restaurantId}/tables/${tableId}/qr`;
  }

  function handlePrint(table: TableDashboardRow) {
    const printWindow = window.open(qrImageUrl(table.id), "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.addEventListener("load", () => {
      printWindow.print();
    });
  }

  const totalScans = tables.reduce((sum, table) => sum + table.scan_count, 0);
  const totalOrders = tables.reduce((sum, table) => sum + table.order_count, 0);
  const activeCount = tables.filter((table) => table.qr_status === "active").length;

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
          { label: "Active QR codes", value: activeCount },
          { label: "Total scans", value: totalScans },
          { label: "Orders from QR", value: totalOrders },
        ].map(({ label, value }) => (
          <div key={label} className="panel-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-pine-500">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl text-pine-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Table QR codes</p>
          <h2 className="mt-1 font-display text-2xl text-pine-900">Dine-in tables</h2>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={handleCreate}
          disabled={busyId === "create"}
        >
          <Plus className="h-4 w-4" />
          Add table
        </button>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      {loading ? (
        <div className="platform-card p-10 text-center text-sm text-pine-500">
          Loading tables…
        </div>
      ) : tables.length === 0 ? (
        <div className="platform-card p-10 text-center">
          <QrCode className="mx-auto h-10 w-10 text-pine-300" aria-hidden="true" />
          <p className="mt-4 font-display text-xl text-pine-900">No tables yet</p>
          <p className="mt-2 text-sm text-pine-500">
            Create a table to generate a unique QR code for dine-in ordering.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pine-900/5 bg-white shadow-soft">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-pine-900/5 bg-cream-50/80 text-xs uppercase tracking-[0.12em] text-pine-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Table</th>
                  <th className="px-5 py-4 font-semibold">QR status</th>
                  <th className="px-5 py-4 font-semibold">Last scanned</th>
                  <th className="px-5 py-4 font-semibold">Scans</th>
                  <th className="px-5 py-4 font-semibold">Orders</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-900/5">
                {tables.map((table) => (
                  <tr key={table.id} className={cn(!table.is_active && "opacity-60")}>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleRename(table)}
                        className="font-medium text-pine-900 hover:underline"
                        title="Click to rename"
                      >
                        {table.label}
                      </button>
                      <p className="mt-0.5 text-xs text-pine-500">{table.location_name}</p>
                    </td>
                    <td className="px-5 py-4">{statusBadge(table.qr_status)}</td>
                    <td className="px-5 py-4 text-pine-600">
                      {formatRelativeTime(table.last_scanned_at)}
                    </td>
                    <td className="px-5 py-4 font-medium text-pine-900">{table.scan_count}</td>
                    <td className="px-5 py-4 font-medium text-pine-900">{table.order_count}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-3 py-1.5 text-xs"
                          onClick={() =>
                            setPreviewToken(previewToken === table.id ? null : table.id)
                          }
                          disabled={!table.token || table.qr_status !== "active"}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          QR
                        </button>
                        <a
                          href={qrImageUrl(table.id)}
                          download
                          className={cn(
                            "btn-secondary px-3 py-1.5 text-xs",
                            (!table.token || table.qr_status !== "active") &&
                              "pointer-events-none opacity-40",
                          )}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                        <button
                          type="button"
                          className="btn-secondary px-3 py-1.5 text-xs"
                          onClick={() => handlePrint(table)}
                          disabled={!table.token || table.qr_status !== "active"}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </button>
                        <button
                          type="button"
                          className="btn-secondary px-3 py-1.5 text-xs"
                          onClick={() => handleRegenerate(table)}
                          disabled={busyId === table.id || !table.is_active}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate
                        </button>
                        <button
                          type="button"
                          className="btn-secondary px-3 py-1.5 text-xs"
                          onClick={() => handleToggle(table)}
                          disabled={busyId === table.id}
                        >
                          {table.is_active ? (
                            <ToggleRight className="h-3.5 w-3.5" />
                          ) : (
                            <ToggleLeft className="h-3.5 w-3.5" />
                          )}
                          {table.is_active ? "Disable" : "Enable"}
                        </button>
                      </div>
                      {previewToken === table.id ? (
                        <div className="mt-4 rounded-xl border border-pine-900/5 bg-cream-50 p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrImageUrl(table.id)}
                            alt={`QR code for ${table.label}`}
                            className="mx-auto h-48 w-48"
                          />
                          <p className="mt-3 text-center text-xs text-pine-500">
                            Guests scan to open the menu and start a verified dine-in session.
                          </p>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
