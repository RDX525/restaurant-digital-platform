import { describe, expect, it } from "vitest";
import {
  addDaysToDateIso,
  formatDateInTimezone,
  getWeekdayInTimezone,
  isDateWithinAdvanceWindow,
  meetsMinimumNotice,
  zonedDateTimeToUtc,
} from "@/lib/reservation/timezone";

describe("reservation timezone handling", () => {
  it("resolves weekdays in the restaurant timezone", () => {
    expect(getWeekdayInTimezone("2026-09-05", "Pacific/Auckland")).toBe("saturday");
    expect(getWeekdayInTimezone("2026-09-07", "Pacific/Auckland")).toBe("monday");
  });

  it("formats dates in the restaurant timezone", () => {
    const utcInstant = new Date("2026-08-25T12:00:00.000Z");
    expect(formatDateInTimezone(utcInstant, "Pacific/Auckland")).toMatch(/2026-08-2[56]/);
  });

  it("converts local restaurant date/time to UTC", () => {
    const utc = zonedDateTimeToUtc("2026-09-05", "18:00", "Pacific/Auckland");
    expect(utc.toISOString()).toMatch(/2026-09-05T0[56]:00:00.000Z/);
  });

  it("enforces booking advance windows using restaurant-local dates", () => {
    const now = new Date("2026-08-25T08:00:00.000Z");
    const today = formatDateInTimezone(now, "Pacific/Auckland");

    expect(isDateWithinAdvanceWindow(today, "Pacific/Auckland", 60, now)).toBe(true);
    expect(
      isDateWithinAdvanceWindow(addDaysToDateIso(today, 61), "Pacific/Auckland", 60, now),
    ).toBe(false);
  });

  it("enforces minimum notice using restaurant-local time", () => {
    const now = new Date("2026-08-25T08:00:00.000Z");
    const today = formatDateInTimezone(now, "Pacific/Auckland");

    expect(meetsMinimumNotice(today, "23:59", "Pacific/Auckland", 2, now)).toBe(true);
    expect(meetsMinimumNotice(today, "09:00", "Pacific/Auckland", 2, now)).toBe(false);
  });
});
