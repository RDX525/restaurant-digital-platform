"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { useRestaurantNav } from "@/hooks/useRestaurantNav";
import type { AvailabilitySlot } from "@/lib/reservation/types";
import { getErrorMessage } from "@/lib/utils";
import { parseGuestContact } from "@/lib/validation/guest-contact";
import Link from "next/link";

interface ReservationFormProps {
  restaurant: PublicRestaurant;
}

export function ReservationForm({ restaurant }: ReservationFormProps) {
  const { homeHref } = useRestaurantNav(restaurant.slug);
  const [submitted, setSubmitted] = useState<{
    name: string;
    date: string;
    time: string;
    guests: number;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    notes: "",
  });
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [timezone, setTimezone] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string; name?: string }>(
    {},
  );

  const loadAvailability = useCallback(async () => {
    if (!form.date) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        restaurantSlug: restaurant.slug,
        date: form.date,
        guestCount: form.guests,
      });
      const response = await fetch(`/api/reservations/availability?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load availability");
      setSlots(payload.slots ?? []);
      setTimezone(payload.timezone ?? "");
      if (form.time && !payload.slots?.some((slot: AvailabilitySlot) => slot.time === form.time && slot.available)) {
        setForm((current) => ({ ...current, time: "" }));
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [form.date, form.guests, form.time, restaurant.slug]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      if (!form.name.trim()) {
        setFieldErrors({ name: "Enter your name" });
        throw new Error("Please check your contact details.");
      }

      const contact = parseGuestContact(
        { email: form.email, phone: form.phone },
        restaurant.country,
      );
      if (!contact.ok) {
        setFieldErrors(contact.errors);
        throw new Error("Please check your contact details.");
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          guestName: form.name.trim(),
          guestEmail: contact.email,
          guestPhone: contact.phone,
          guestCount: Number(form.guests),
          date: form.date,
          time: form.time,
          specialRequest: form.notes || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Booking failed");

      setSubmitted({
        name: form.name,
        date: form.date,
        time: form.time,
        guests: Number(form.guests),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="platform-card p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gold-500" />
        <h2 className="mt-4 font-display text-2xl text-pine-900">Booking request received</h2>
        <p className="mt-2 text-sm text-pine-600">
          Thanks {submitted.name}. We will confirm your table for {submitted.guests} guests on{" "}
          {submitted.date} at {submitted.time}.
        </p>
        <Link href={homeHref} className="btn-secondary mt-6 inline-flex">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="platform-card space-y-4 p-6 sm:p-8">
      <div className="mb-2 flex items-center gap-2 text-pine-800">
        <CalendarDays className="h-5 w-5 text-gold-600" />
        <h2 className="font-display text-2xl">Request a table</h2>
      </div>

      {timezone ? (
        <p className="text-xs text-pine-500">All times shown in {timezone.replace("_", " ")}</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Name"
          value={form.name}
          onChange={(value) => setForm({ ...form, name: value })}
          required
          error={fieldErrors.name}
        />
        <Field
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(value) => setForm({ ...form, phone: value })}
          required
          error={fieldErrors.phone}
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setForm({ ...form, email: value })}
          required
          error={fieldErrors.email}
        />
        <Field
          label="Guests"
          type="number"
          min={1}
          max={12}
          value={form.guests}
          onChange={(value) => setForm({ ...form, guests: value })}
          required
        />
        <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value, time: "" })} required />
      </div>

      <div>
        <label className="label">Time</label>
        {loadingSlots ? (
          <div className="flex items-center gap-2 text-sm text-pine-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading available times…
          </div>
        ) : !form.date ? (
          <p className="text-sm text-pine-500">Select a date to see available times.</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-pine-500">No reservation times available for this date.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => setForm({ ...form, time: slot.time })}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium touch-manipulation transition ${
                  form.time === slot.time
                    ? "border-gold-500 bg-gold-50 text-pine-900"
                    : slot.available
                      ? "border-pine-200 text-pine-700 hover:border-pine-300"
                      : "cursor-not-allowed border-pine-100 text-pine-300"
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="reservation-notes" className="label">
          Special request
        </label>
        <textarea
          id="reservation-notes"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          rows={3}
          className="input resize-none"
          placeholder="Occasion, seating preferences, accessibility needs"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !form.time}
        className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit booking request"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  max,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  error?: string;
}) {
  const fieldId = `reservation-${label.toLowerCase()}`;
  return (
    <div>
      <label htmlFor={fieldId} className="label">
        {label}
      </label>
      <input
        id={fieldId}
        type={type}
        value={value}
        required={required}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="input"
        aria-invalid={Boolean(error)}
        autoComplete={type === "email" ? "email" : type === "tel" ? "tel" : undefined}
        placeholder={type === "tel" ? "021 123 4567" : undefined}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
