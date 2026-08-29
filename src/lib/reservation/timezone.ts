import type { DayOfWeek } from "@/lib/restaurant/types";
import { DAYS_ORDER } from "@/lib/restaurant/types";

const WEEKDAY_TO_DAY: Record<string, DayOfWeek> = {
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday",
  sunday: "sunday",
};

export function getZonedDateTimeParts(
  instant: Date,
  timezone: string,
): { year: number; month: number; day: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(instant);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour) % 24,
    minute: Number(lookup.minute),
  };
}

export function zonedDateTimeToUtc(dateIso: string, time: string, timezone: string): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = getZonedDateTimeParts(new Date(utcMs), timezone);
    const targetTotal =
      Date.UTC(year, month - 1, day, hour, minute, 0) / 60_000;
    const actualTotal =
      Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0) /
      60_000;
    const deltaMinutes = targetTotal - actualTotal;

    if (deltaMinutes === 0) break;
    utcMs += deltaMinutes * 60_000;
  }

  return new Date(utcMs);
}

export function getWeekdayInTimezone(dateIso: string, timezone: string): DayOfWeek {
  const instant = zonedDateTimeToUtc(dateIso, "12:00", timezone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  })
    .format(instant)
    .toLowerCase();

  return WEEKDAY_TO_DAY[weekday] ?? "monday";
}

export function getNowInTimezone(_timezone: string): Date {
  return new Date();
}

export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDaysToDateIso(dateIso: string, days: number): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function compareTime(a: string, b: string): number {
  return a.localeCompare(b);
}

export function generateTimeSlots(open: string, close: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const [openHour, openMinute] = open.split(":").map(Number);
  const [closeHour, closeMinute] = close.split(":").map(Number);

  let cursor = openHour * 60 + openMinute;
  const end = closeHour * 60 + closeMinute;

  while (cursor < end) {
    const hour = Math.floor(cursor / 60);
    const minute = cursor % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    cursor += intervalMinutes;
  }

  return slots;
}

export function isDateWithinAdvanceWindow(
  dateIso: string,
  timezone: string,
  advanceDays: number,
  now = new Date(),
): boolean {
  const today = formatDateInTimezone(now, timezone);
  const maxDate = addDaysToDateIso(today, advanceDays);
  return dateIso >= today && dateIso <= maxDate;
}

export function meetsMinimumNotice(
  dateIso: string,
  time: string,
  timezone: string,
  minNoticeHours: number,
  now = new Date(),
): boolean {
  const reservationUtc = zonedDateTimeToUtc(dateIso, time, timezone);
  const minUtc = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
  return reservationUtc.getTime() >= minUtc.getTime();
}

export { DAYS_ORDER };
