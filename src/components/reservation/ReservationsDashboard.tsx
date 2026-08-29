"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  RefreshCw,
  Users,
} from "lucide-react";
import type { PublicReservation, ReservationSettings } from "@/lib/reservation/types";
import { STATUS_LABELS } from "@/lib/reservation/constants";
import type { ReservationStatus } from "@/lib/reservation/constants";
import { getErrorMessage, cn } from "@/lib/utils";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";
import { DashboardResourceGate } from "@/components/dashboard/DashboardResourceGate";

const POLL_INTERVAL_MS = 10000;

type Action = "confirm" | "reject" | "cancel" | "complete" | "no_show";

function statusTone(status: ReservationStatus) {
  switch (status) {
    case "pending":
      return "badge-live";
    case "confirmed":
      return "badge-success";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-1 ring-red-200/70 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    case "completed":
      return "badge-muted";
    case "no_show":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200/70 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    default:
      return "badge-muted";
  }
}

function actionLabel(action: Action): string {
  switch (action) {
    case "confirm":
      return "Confirm";
    case "reject":
      return "Reject";
    case "cancel":
      return "Cancel";
    case "complete":
      return "Mark completed";
    case "no_show":
      return "No show";
  }
}

function availableActions(status: ReservationStatus): Action[] {
  switch (status) {
    case "pending":
      return ["confirm", "reject"];
    case "confirmed":
      return ["cancel", "complete", "no_show"];
    default:
      return [];
  }
}

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function buildCalendarDays(reservations: PublicReservation[]): { date: string; count: number; covers: number }[] {
  const map = new Map<string, { count: number; covers: number }>();

  for (const reservation of reservations) {
    if (["cancelled", "no_show"].includes(reservation.status)) continue;
    const existing = map.get(reservation.date) ?? { count: 0, covers: 0 };
    existing.count += 1;
    existing.covers += reservation.guestCount;
    map.set(reservation.date, existing);
  }

  return Array.from(map.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function ReservationsDashboard() {
  const {
    restaurantId,
    loading: restaurantLoading,
    error: restaurantError,
  } = useActiveRestaurant();
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "" });
  const [settings, setSettings] = useState<ReservationSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    timezone: "Pacific/Auckland",
    maxPartySize: "12",
    bookingAdvanceDays: "60",
    bookingMinNoticeHours: "2",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const loadReservations = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reservations`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load reservations");
      setReservations(payload);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const loadSettings = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reservation-settings`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load settings");
      setSettings(payload);
      setSettingsForm({
        timezone: payload.timezone,
        maxPartySize: String(payload.max_party_size),
        bookingAdvanceDays: String(payload.booking_advance_days),
        bookingMinNoticeHours: String(payload.booking_min_notice_hours),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    void loadReservations();
    void loadSettings();
    const timer = window.setInterval(() => void loadReservations(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadReservations, loadSettings, restaurantId]);

  const calendarDays = useMemo(() => buildCalendarDays(reservations), [reservations]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return reservations
      .filter(
        (reservation) =>
          reservation.date >= today &&
          ["pending", "confirmed"].includes(reservation.status),
      )
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }, [reservations]);

  const filtered = selectedDate
    ? upcoming.filter((reservation) => reservation.date === selectedDate)
    : upcoming;

  const selected =
    reservations.find((reservation) => reservation.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setRescheduleForm({ date: selected.date, time: selected.time });
    }
  }, [selected]);

  async function runAction(reservation: PublicReservation, action: Action) {
    let cancellationReason: string | undefined;
    if (action === "reject" || action === "cancel") {
      cancellationReason = prompt("Reason (optional)") ?? undefined;
      if (cancellationReason === null) return;
    }

    setBusyId(reservation.id);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/reservations/${reservation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, cancellationReason }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Update failed");
      await loadReservations();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function submitReschedule(reservation: PublicReservation) {
    setBusyId(reservation.id);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/reservations/${reservation.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rescheduleForm),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Reschedule failed");
      await loadReservations();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;

    setSavingSettings(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reservation-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone: settingsForm.timezone,
          reservation_hours: settings.reservation_hours,
          max_party_size: Number(settingsForm.maxPartySize),
          booking_advance_days: Number(settingsForm.bookingAdvanceDays),
          booking_min_notice_hours: Number(settingsForm.bookingMinNoticeHours),
          slot_interval_minutes: settings.slot_interval_minutes,
          max_covers_per_slot: settings.max_covers_per_slot,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to save settings");
      setSettings(payload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingSettings(false);
    }
  }

  const counts = {
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    today: reservations.filter((r) => {
      const today = new Date().toISOString().slice(0, 10);
      return r.date === today && ["pending", "confirmed"].includes(r.status);
    }).length,
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
          { label: "Pending", value: counts.pending, icon: Clock },
          { label: "Confirmed", value: counts.confirmed, icon: CheckCircle2 },
          { label: "Today", value: counts.today, icon: CalendarDays },
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
        <h2 className="font-display text-xl text-pine-900">Calendar</h2>
        <button
          type="button"
          onClick={() => void loadReservations()}
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

      {settings ? (
        <section className="platform-card p-5">
          <h3 className="mb-4 font-semibold text-pine-900">Reservation settings</h3>
          <form onSubmit={saveSettings} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SettingsField
              label="Timezone"
              value={settingsForm.timezone}
              onChange={(value) => setSettingsForm({ ...settingsForm, timezone: value })}
            />
            <SettingsField
              label="Max party size"
              type="number"
              value={settingsForm.maxPartySize}
              onChange={(value) => setSettingsForm({ ...settingsForm, maxPartySize: value })}
            />
            <SettingsField
              label="Booking advance (days)"
              type="number"
              value={settingsForm.bookingAdvanceDays}
              onChange={(value) => setSettingsForm({ ...settingsForm, bookingAdvanceDays: value })}
            />
            <SettingsField
              label="Minimum notice (hours)"
              type="number"
              value={settingsForm.bookingMinNoticeHours}
              onChange={(value) =>
                setSettingsForm({ ...settingsForm, bookingMinNoticeHours: value })
              }
            />
            <div className="sm:col-span-2 lg:col-span-4">
              <button type="submit" disabled={savingSettings} className="btn-secondary">
                {savingSettings ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="platform-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-pine-900">Upcoming bookings</h3>
            {selectedDate ? (
              <button
                type="button"
                className="text-xs font-medium text-pine-500 hover:text-pine-800"
                onClick={() => setSelectedDate(null)}
              >
                Clear filter
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="text-sm text-pine-500">Loading reservations…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-pine-500">No upcoming reservations.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((reservation) => (
                <li key={reservation.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(reservation.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      selectedId === reservation.id
                        ? "border-gold-400 bg-gold-50/60"
                        : "border-pine-100 hover:border-pine-200 hover:bg-cream-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-pine-900">{reservation.guestName}</p>
                        <p className="mt-1 text-sm text-pine-600">
                          {formatDateLabel(reservation.date)} · {reservation.time} ·{" "}
                          {reservation.guestCount} guests
                        </p>
                      </div>
                      <span className={statusTone(reservation.status)}>
                        {STATUS_LABELS[reservation.status]}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="platform-card p-5">
          <h3 className="mb-4 font-semibold text-pine-900">Calendar overview</h3>
          {calendarDays.length === 0 ? (
            <p className="text-sm text-pine-500">No active bookings on the calendar yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {calendarDays.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.date);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition",
                    selectedDate === day.date
                      ? "border-gold-400 bg-gold-50/60"
                      : "border-pine-100 hover:border-pine-200",
                  )}
                >
                  <p className="font-semibold text-pine-900">{formatDateLabel(day.date)}</p>
                  <p className="mt-1 flex items-center gap-3 text-sm text-pine-600">
                    <span>{day.count} bookings</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {day.covers} covers
                    </span>
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected ? (
        <section className="platform-card space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Reservation details</p>
              <h3 className="font-display text-2xl text-pine-900">{selected.guestName}</h3>
              <p className="mt-1 text-sm text-pine-600">
                {formatDateLabel(selected.date)} at {selected.time} · {selected.guestCount}{" "}
                guests · {selected.timezone}
              </p>
            </div>
            <span className={statusTone(selected.status)}>{STATUS_LABELS[selected.status]}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Email" value={selected.guestEmail} />
            <Detail label="Phone" value={selected.guestPhone} />
            <Detail
              label="Special request"
              value={selected.specialRequest || "None"}
              className="sm:col-span-2"
            />
          </div>

          {selected.notifications.length > 0 ? (
            <div>
              <p className="label mb-2">Notifications sent</p>
              <ul className="space-y-1 text-sm text-pine-600">
                {selected.notifications.map((notification, index) => (
                  <li key={`${notification.type}-${index}`}>
                    {notification.type} · {new Date(notification.sent_at).toLocaleString("en-NZ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {availableActions(selected.status).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableActions(selected.status).map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => void runAction(selected, action)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    action === "reject" || action === "cancel" || action === "no_show"
                      ? "border border-red-200 text-red-700 hover:bg-red-50"
                      : "btn-primary",
                  )}
                >
                  {actionLabel(action)}
                </button>
              ))}
            </div>
          ) : null}

          {["pending", "confirmed"].includes(selected.status) ? (
            <div className="rounded-2xl border border-pine-100 bg-cream-50/80 p-4">
              <p className="mb-3 font-semibold text-pine-900">Reschedule</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(event) =>
                    setRescheduleForm({ ...rescheduleForm, date: event.target.value })
                  }
                  className="input"
                />
                <input
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(event) =>
                    setRescheduleForm({ ...rescheduleForm, time: event.target.value })
                  }
                  className="input"
                />
              </div>
              <button
                type="button"
                disabled={busyId === selected.id}
                onClick={() => void submitReschedule(selected)}
                className="btn-secondary mt-3"
              >
                Save new date & time
              </button>
            </div>
          ) : null}

          {selected.status === "cancelled" && selected.cancellationReason ? (
            <p className="text-sm text-pine-600">
              Cancellation reason: {selected.cancellationReason}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="label">{label}</p>
      <p className="mt-1 text-sm text-pine-800">{value}</p>
    </div>
  );
}

function SettingsField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input"
      />
    </div>
  );
}
