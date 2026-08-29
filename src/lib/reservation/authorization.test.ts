import { describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  createDemoReservation,
  getDemoReservationById,
  resetDemoReservationStore,
} from "@/lib/reservation/demo-store";

const RESTAURANT_ID = getDemoRestaurantId();
const OTHER_RESTAURANT_ID = "00000000-0000-4000-8000-000000009999";
const FIXED_NOW = new Date("2026-08-25T08:00:00.000Z");

describe("reservation authorization", () => {
  it("rejects writes for unknown restaurants", () => {
    resetDemoReservationStore();

    expect(() =>
      createDemoReservation(
        OTHER_RESTAURANT_ID,
        {
          guestName: "Guest",
          guestEmail: "guest@example.com",
          guestPhone: "+64 21 000 0000",
          guestCount: 2,
          date: "2026-09-05",
          time: "18:00",
        },
        undefined,
        FIXED_NOW,
      ),
    ).toThrow(/Restaurant not found/);

    expect(getDemoReservationById(OTHER_RESTAURANT_ID, "missing-id")).toBeNull();
  });

  it("scopes reservation reads to the restaurant tenant", () => {
    resetDemoReservationStore();

    const reservation = createDemoReservation(
      RESTAURANT_ID,
      {
        guestName: "Scoped Guest",
        guestEmail: "scoped@example.com",
        guestPhone: "+64 21 555 5555",
        guestCount: 2,
        date: "2026-09-05",
        time: "18:00",
      },
      undefined,
      FIXED_NOW,
    );

    expect(getDemoReservationById(RESTAURANT_ID, reservation.id)?.guest_name).toBe("Scoped Guest");
    expect(getDemoReservationById(OTHER_RESTAURANT_ID, reservation.id)).toBeNull();
  });
});
