import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import { resetDemoReservationStore, createDemoReservation } from "@/lib/reservation/demo-store";
import { updateReservationStatus } from "@/lib/reservation/data";
import { resetDemoNotificationStore, getDemoNotificationLogs } from "@/lib/notification/demo-store";
import { setUseRecordingNotificationProviders } from "@/lib/notification/providers";

const RESTAURANT_ID = getDemoRestaurantId();
const FIXED_NOW = new Date("2026-08-25T08:00:00.000Z");

describe("reservation status transitions", () => {
  beforeEach(() => {
    resetDemoReservationStore();
    resetDemoNotificationStore();
    setUseRecordingNotificationProviders(true);
  });

  it("allows pending to confirmed and cancelled", () => {
    const reservation = createDemoReservation(
      RESTAURANT_ID,
      {
        guestName: "Taylor",
        guestEmail: "taylor@example.com",
        guestPhone: "+64 21 666 6666",
        guestCount: 2,
        date: "2026-09-05",
        time: "18:00",
      },
      undefined,
      FIXED_NOW,
    );

    expect(reservation.status).toBe("pending");
  });

  it("sends confirmation notification when confirmed", async () => {
    const reservation = createDemoReservation(
      RESTAURANT_ID,
      {
        guestName: "Taylor",
        guestEmail: "taylor@example.com",
        guestPhone: "+64 21 666 6666",
        guestCount: 2,
        date: "2026-09-05",
        time: "18:00",
      },
      undefined,
      FIXED_NOW,
    );

    await updateReservationStatus(RESTAURANT_ID, reservation.id, "confirm");

    const logs = getDemoNotificationLogs();
    expect(logs.some((log) => log.notification_type === "RESERVATION_CONFIRMED")).toBe(true);
  });

  it("sends cancellation notification when rejected", async () => {
    const reservation = createDemoReservation(
      RESTAURANT_ID,
      {
        guestName: "Jordan",
        guestEmail: "jordan@example.com",
        guestPhone: "+64 21 777 7777",
        guestCount: 2,
        date: "2026-09-05",
        time: "19:00",
      },
      undefined,
      FIXED_NOW,
    );

    await updateReservationStatus(
      RESTAURANT_ID,
      reservation.id,
      "reject",
      "Fully booked",
    );

    const logs = getDemoNotificationLogs();
    expect(logs.some((log) => log.notification_type === "RESERVATION_CANCELLED")).toBe(true);
  });
});
