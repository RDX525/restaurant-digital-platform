import { normalizeOpeningHours } from "@/lib/restaurant/opening-hours";
import type { OpeningHours } from "@/lib/restaurant/types";
import { ACTIVE_SLOT_STATUSES, STATUS_TRANSITIONS } from "./constants";
import type {
  AvailabilityResult,
  AvailabilitySlot,
  ReservationRecord,
  ReservationSettings,
} from "./types";
import {
  compareTime,
  generateTimeSlots,
  getWeekdayInTimezone,
  isDateWithinAdvanceWindow,
  meetsMinimumNotice,
} from "./timezone";

export class ReservationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationValidationError";
  }
}

export function getEffectiveReservationHours(
  settings: ReservationSettings,
  restaurantOpeningHours?: OpeningHours,
): OpeningHours {
  const reservationHours = normalizeOpeningHours(settings.reservation_hours);
  if (Object.values(reservationHours).some((day) => !day.closed)) {
    return reservationHours;
  }
  return normalizeOpeningHours(restaurantOpeningHours);
}

export function getCoversForSlot(
  reservations: ReservationRecord[],
  date: string,
  time: string,
  excludeReservationId?: string,
): number {
  return reservations
    .filter(
      (reservation) =>
        reservation.id !== excludeReservationId &&
        reservation.reservation_date === date &&
        reservation.reservation_time.slice(0, 5) === time &&
        ACTIVE_SLOT_STATUSES.includes(reservation.status),
    )
    .reduce((sum, reservation) => sum + reservation.guest_count, 0);
}

export function validateReservationSlot(input: {
  settings: ReservationSettings;
  reservations: ReservationRecord[];
  date: string;
  time: string;
  guestCount: number;
  restaurantOpeningHours?: OpeningHours;
  excludeReservationId?: string;
  now?: Date;
}): void {
  const { settings, reservations, date, time, guestCount } = input;
  const now = input.now ?? new Date();
  const normalizedTime = time.slice(0, 5);

  if (guestCount > settings.max_party_size) {
    throw new ReservationValidationError(
      `Maximum party size is ${settings.max_party_size} guests.`,
    );
  }

  if (!isDateWithinAdvanceWindow(date, settings.timezone, settings.booking_advance_days, now)) {
    throw new ReservationValidationError("Selected date is outside the booking window.");
  }

  if (!meetsMinimumNotice(date, normalizedTime, settings.timezone, settings.booking_min_notice_hours, now)) {
    throw new ReservationValidationError("Reservations require more advance notice.");
  }

  const hours = getEffectiveReservationHours(settings, input.restaurantOpeningHours);
  const weekday = getWeekdayInTimezone(date, settings.timezone);
  const dayHours = hours[weekday];

  if (!dayHours || dayHours.closed) {
    throw new ReservationValidationError("Restaurant is closed on the selected date.");
  }

  if (compareTime(normalizedTime, dayHours.open) < 0 || compareTime(normalizedTime, dayHours.close) >= 0) {
    throw new ReservationValidationError("Selected time is outside reservation hours.");
  }

  const slotCovers = getCoversForSlot(
    reservations,
    date,
    normalizedTime,
    input.excludeReservationId,
  );
  if (slotCovers + guestCount > settings.max_covers_per_slot) {
    throw new ReservationValidationError("This time slot no longer has enough capacity.");
  }
}

export function buildAvailability(input: {
  settings: ReservationSettings;
  reservations: ReservationRecord[];
  date: string;
  guestCount: number;
  restaurantOpeningHours?: OpeningHours;
  now?: Date;
}): AvailabilityResult {
  const { settings, reservations, date, guestCount } = input;
  const now = input.now ?? new Date();
  const hours = getEffectiveReservationHours(settings, input.restaurantOpeningHours);
  const weekday = getWeekdayInTimezone(date, settings.timezone);
  const dayHours = hours[weekday];

  if (
    !dayHours ||
    dayHours.closed ||
    !isDateWithinAdvanceWindow(date, settings.timezone, settings.booking_advance_days, now)
  ) {
    return { date, timezone: settings.timezone, slots: [] };
  }

  const slots = generateTimeSlots(
    dayHours.open,
    dayHours.close,
    settings.slot_interval_minutes,
  ).map((time): AvailabilitySlot => {
    let available = true;
    try {
      validateReservationSlot({
        settings,
        reservations,
        date,
        time,
        guestCount,
        restaurantOpeningHours: input.restaurantOpeningHours,
        now,
      });
    } catch {
      available = false;
    }

    const usedCovers = getCoversForSlot(reservations, date, time);
    const remainingCovers = Math.max(0, settings.max_covers_per_slot - usedCovers);

    return {
      time,
      available: available && remainingCovers >= guestCount,
      remainingCovers,
    };
  });

  return {
    date,
    timezone: settings.timezone,
    slots,
  };
}

export function isSlotFullyBooked(
  settings: ReservationSettings,
  reservations: ReservationRecord[],
  date: string,
  time: string,
): boolean {
  return getCoversForSlot(reservations, date, time.slice(0, 5)) >= settings.max_covers_per_slot;
}

export function assertStatusTransition(
  current: ReservationRecord["status"],
  next: ReservationRecord["status"],
): void {
  if (!STATUS_TRANSITIONS[current].includes(next)) {
    throw new ReservationValidationError(`Cannot transition from ${current} to ${next}.`);
  }
}
