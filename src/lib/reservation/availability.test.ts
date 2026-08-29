import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import { buildAvailability, validateReservationSlot } from "@/lib/reservation/availability";
import {
  getDemoReservationSettings,
  resetDemoReservationStore,
} from "@/lib/reservation/demo-store";

const RESTAURANT_ID = getDemoRestaurantId();
const FIXED_NOW = new Date("2026-08-25T08:00:00.000Z");

describe("reservation availability", () => {
  beforeEach(() => {
    resetDemoReservationStore();
  });

  it("returns reservation-hour slots for an open day", () => {
    const settings = getDemoReservationSettings(RESTAURANT_ID)!;
    const availability = buildAvailability({
      settings,
      reservations: [],
      date: "2026-09-05",
      guestCount: 2,
      now: FIXED_NOW,
    });

    expect(availability.timezone).toBe("Pacific/Auckland");
    expect(availability.slots.length).toBeGreaterThan(0);
    expect(availability.slots.some((slot) => slot.time === "18:00" && slot.available)).toBe(true);
  });

  it("marks slots unavailable when party size exceeds max party size", () => {
    const settings = getDemoReservationSettings(RESTAURANT_ID)!;

    expect(() =>
      validateReservationSlot({
        settings,
        reservations: [],
        date: "2026-09-05",
        time: "18:00",
        guestCount: settings.max_party_size + 1,
        now: FIXED_NOW,
      }),
    ).toThrow(/Maximum party size/);
  });

  it("returns no slots for closed days", () => {
    const settings = getDemoReservationSettings(RESTAURANT_ID)!;
    const closedSettings = {
      ...settings,
      reservation_hours: {
        ...settings.reservation_hours,
        saturday: { open: "12:00", close: "22:00", closed: true },
      },
    };

    const availability = buildAvailability({
      settings: closedSettings,
      reservations: [],
      date: "2026-09-05",
      guestCount: 2,
      now: FIXED_NOW,
    });

    expect(availability.slots).toEqual([]);
  });
});
