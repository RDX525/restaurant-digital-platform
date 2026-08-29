import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  createDemoReservation,
  resetDemoReservationStore,
  updateDemoReservationStatus,
} from "@/lib/reservation/demo-store";
import { ReservationValidationError } from "@/lib/reservation/availability";

const RESTAURANT_ID = getDemoRestaurantId();
const FIXED_NOW = new Date("2026-08-25T08:00:00.000Z");

describe("reservation double booking prevention", () => {
  beforeEach(() => {
    resetDemoReservationStore();
  });

  it("rejects bookings that exceed slot cover capacity", () => {
    createDemoReservation(
      RESTAURANT_ID,
      {
        guestName: "Party A",
        guestEmail: "a@example.com",
        guestPhone: "+64 21 111 1111",
        guestCount: 12,
        date: "2026-09-05",
        time: "18:00",
      },
      undefined,
      FIXED_NOW,
    );

    createDemoReservation(
      RESTAURANT_ID,
      {
        guestName: "Party B",
        guestEmail: "b@example.com",
        guestPhone: "+64 21 222 2222",
        guestCount: 12,
        date: "2026-09-05",
        time: "18:00",
      },
      undefined,
      FIXED_NOW,
    );

    expect(() =>
      createDemoReservation(
        RESTAURANT_ID,
        {
          guestName: "Party C",
          guestEmail: "c@example.com",
          guestPhone: "+64 21 333 3333",
          guestCount: 2,
          date: "2026-09-05",
          time: "18:00",
        },
        undefined,
        FIXED_NOW,
      ),
    ).toThrow(ReservationValidationError);
  });

  it("ignores cancelled reservations when calculating slot capacity", () => {
    const first = createDemoReservation(
      RESTAURANT_ID,
      {
        guestName: "Cancelled party",
        guestEmail: "cancelled@example.com",
        guestPhone: "+64 21 333 3333",
        guestCount: 12,
        date: "2026-09-05",
        time: "19:00",
      },
      undefined,
      FIXED_NOW,
    );

    updateDemoReservationStatus(RESTAURANT_ID, first.id, "reject");

    expect(() =>
      createDemoReservation(
        RESTAURANT_ID,
        {
          guestName: "Replacement party",
          guestEmail: "replacement@example.com",
          guestPhone: "+64 21 444 4444",
          guestCount: 10,
          date: "2026-09-05",
          time: "19:00",
        },
        undefined,
        FIXED_NOW,
      ),
    ).not.toThrow();
  });
});
