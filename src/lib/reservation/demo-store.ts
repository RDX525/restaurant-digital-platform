import { normalizeOpeningHours } from "@/lib/restaurant/opening-hours";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  DEFAULT_BOOKING_ADVANCE_DAYS,
  DEFAULT_MAX_COVERS_PER_SLOT,
  DEFAULT_MAX_PARTY_SIZE,
  DEFAULT_MIN_NOTICE_HOURS,
  DEFAULT_SLOT_INTERVAL_MINUTES,
  DEFAULT_TIMEZONE,
} from "./constants";
import {
  ReservationValidationError,
  assertStatusTransition,
  validateReservationSlot,
} from "./availability";
import type {
  CreateReservationInput,
  ReservationRecord,
  ReservationSettings,
  RescheduleReservationInput,
} from "./types";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();

const DEFAULT_RESERVATION_HOURS = normalizeOpeningHours({
  monday: { open: "17:00", close: "21:30", closed: false },
  tuesday: { open: "17:00", close: "21:30", closed: false },
  wednesday: { open: "17:00", close: "21:30", closed: false },
  thursday: { open: "17:00", close: "21:30", closed: false },
  friday: { open: "17:00", close: "22:00", closed: false },
  saturday: { open: "12:00", close: "22:00", closed: false },
  sunday: { open: "12:00", close: "20:30", closed: false },
});

let settings: ReservationSettings = {
  restaurant_id: DEMO_RESTAURANT_ID,
  timezone: DEFAULT_TIMEZONE,
  reservation_hours: DEFAULT_RESERVATION_HOURS,
  max_party_size: DEFAULT_MAX_PARTY_SIZE,
  booking_advance_days: DEFAULT_BOOKING_ADVANCE_DAYS,
  booking_min_notice_hours: DEFAULT_MIN_NOTICE_HOURS,
  slot_interval_minutes: DEFAULT_SLOT_INTERVAL_MINUTES,
  max_covers_per_slot: DEFAULT_MAX_COVERS_PER_SLOT,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

let reservations: ReservationRecord[] = [];

export function resetDemoReservationStore(): void {
  reservations = [];
  settings = {
    restaurant_id: DEMO_RESTAURANT_ID,
    timezone: DEFAULT_TIMEZONE,
    reservation_hours: DEFAULT_RESERVATION_HOURS,
    max_party_size: DEFAULT_MAX_PARTY_SIZE,
    booking_advance_days: DEFAULT_BOOKING_ADVANCE_DAYS,
    booking_min_notice_hours: DEFAULT_MIN_NOTICE_HOURS,
    slot_interval_minutes: DEFAULT_SLOT_INTERVAL_MINUTES,
    max_covers_per_slot: DEFAULT_MAX_COVERS_PER_SLOT,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  };
}

export function loadDemoReservations(records: ReservationRecord[]): void {
  reservations = structuredClone(records);
}

export function getDemoReservations(): ReservationRecord[] {
  return structuredClone(reservations);
}

export function getDemoReservationSettings(restaurantId: string): ReservationSettings | null {
  if (restaurantId !== DEMO_RESTAURANT_ID) return null;
  return structuredClone(settings);
}

export function updateDemoReservationSettings(
  restaurantId: string,
  patch: Omit<ReservationSettings, "restaurant_id" | "created_at" | "updated_at">,
): ReservationSettings {
  if (restaurantId !== DEMO_RESTAURANT_ID) {
    throw new Error("Restaurant not found");
  }

  settings = {
    ...settings,
    ...patch,
    reservation_hours: normalizeOpeningHours(patch.reservation_hours),
    updated_at: new Date().toISOString(),
  };

  return structuredClone(settings);
}

function buildRecord(
  restaurantId: string,
  input: CreateReservationInput,
  timezone: string,
): ReservationRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    restaurant_id: restaurantId,
    status: "pending",
    guest_name: input.guestName.trim(),
    guest_email: input.guestEmail.trim().toLowerCase(),
    guest_phone: input.guestPhone.trim(),
    guest_count: input.guestCount,
    reservation_date: input.date,
    reservation_time: input.time.slice(0, 5),
    timezone,
    special_request: input.specialRequest?.trim() || null,
    confirmed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    rescheduled_at: null,
    previous_date: null,
    previous_time: null,
    notifications: [],
    created_at: now,
    updated_at: now,
  };
}

export function listDemoReservationsForRestaurant(restaurantId: string): ReservationRecord[] {
  return reservations
    .filter((reservation) => reservation.restaurant_id === restaurantId)
    .sort((a, b) => {
      const dateCompare = a.reservation_date.localeCompare(b.reservation_date);
      if (dateCompare !== 0) return dateCompare;
      return a.reservation_time.localeCompare(b.reservation_time);
    });
}

export function getDemoReservationById(
  restaurantId: string,
  reservationId: string,
): ReservationRecord | null {
  return (
    reservations.find(
      (reservation) =>
        reservation.restaurant_id === restaurantId && reservation.id === reservationId,
    ) ?? null
  );
}

export function createDemoReservation(
  restaurantId: string,
  input: CreateReservationInput,
  restaurantOpeningHours?: ReservationSettings["reservation_hours"],
  now = new Date(),
): ReservationRecord {
  if (restaurantId !== DEMO_RESTAURANT_ID) {
    throw new Error("Restaurant not found");
  }

  validateReservationSlot({
    settings,
    reservations,
    date: input.date,
    time: input.time,
    guestCount: input.guestCount,
    restaurantOpeningHours,
    now,
  });

  const record = buildRecord(restaurantId, input, settings.timezone);
  reservations.unshift(record);
  return structuredClone(record);
}

export type ReservationAction = "confirm" | "reject" | "cancel" | "complete" | "no_show";

function actionToStatus(action: ReservationAction): ReservationRecord["status"] {
  switch (action) {
    case "confirm":
      return "confirmed";
    case "reject":
    case "cancel":
      return "cancelled";
    case "complete":
      return "completed";
    case "no_show":
      return "no_show";
  }
}

export function updateDemoReservationStatus(
  restaurantId: string,
  reservationId: string,
  action: ReservationAction,
  cancellationReason?: string,
): ReservationRecord | null {
  const record = getDemoReservationById(restaurantId, reservationId);
  if (!record) return null;

  const nextStatus = actionToStatus(action);
  assertStatusTransition(record.status, nextStatus);

  const now = new Date().toISOString();
  record.status = nextStatus;
  record.updated_at = now;

  if (nextStatus === "confirmed") {
    record.confirmed_at = now;
  }

  if (nextStatus === "cancelled") {
    record.cancelled_at = now;
    record.cancellation_reason = cancellationReason?.trim() || null;
  }

  return structuredClone(record);
}

export function rescheduleDemoReservation(
  restaurantId: string,
  reservationId: string,
  input: RescheduleReservationInput,
  restaurantOpeningHours?: ReservationSettings["reservation_hours"],
  now = new Date(),
): ReservationRecord | null {
  const record = getDemoReservationById(restaurantId, reservationId);
  if (!record) return null;

  if (!["pending", "confirmed"].includes(record.status)) {
    throw new ReservationValidationError("Only active reservations can be rescheduled.");
  }

  validateReservationSlot({
    settings,
    reservations,
    date: input.date,
    time: input.time,
    guestCount: record.guest_count,
    restaurantOpeningHours,
    excludeReservationId: record.id,
    now,
  });

  record.previous_date = record.reservation_date;
  record.previous_time = record.reservation_time;
  record.reservation_date = input.date;
  record.reservation_time = input.time.slice(0, 5);
  record.rescheduled_at = new Date().toISOString();
  record.updated_at = record.rescheduled_at;

  return structuredClone(record);
}
