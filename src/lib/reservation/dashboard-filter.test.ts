import { describe, expect, it } from "vitest";
import {
  filterReservationsForDashboard,
  reservationListEmptyMessage,
  reservationListHeading,
} from "./dashboard-filter";
import type { ReservationStatus } from "./constants";

function row(
  id: string,
  status: ReservationStatus,
  date: string,
  time = "18:00",
) {
  return { id, status, date, time };
}

const today = "2026-09-01";

describe("filterReservationsForDashboard", () => {
  const rows = [
    row("1", "pending", "2026-09-02", "19:00"),
    row("2", "confirmed", "2026-09-01", "12:00"),
    row("3", "completed", "2026-08-30", "20:00"),
    row("4", "cancelled", "2026-08-29", "18:30"),
    row("5", "pending", "2026-08-20", "18:00"),
    row("6", "no_show", "2026-08-28", "19:30"),
  ];

  it("keeps upcoming as future pending and confirmed only", () => {
    const filtered = filterReservationsForDashboard(rows, "upcoming", { today });
    expect(filtered.map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("lists completed history newest first", () => {
    const filtered = filterReservationsForDashboard(rows, "completed", { today });
    expect(filtered.map((item) => item.id)).toEqual(["3"]);
  });

  it("lists cancelled and rejected (cancelled status) newest first", () => {
    const filtered = filterReservationsForDashboard(rows, "cancelled", { today });
    expect(filtered.map((item) => item.id)).toEqual(["4"]);
  });

  it("can narrow any filter to a calendar date", () => {
    const filtered = filterReservationsForDashboard(rows, "all", {
      today,
      selectedDate: "2026-08-30",
    });
    expect(filtered.map((item) => item.id)).toEqual(["3"]);
  });
});

describe("reservation list copy", () => {
  it("labels cancelled as cancelled and rejected", () => {
    expect(reservationListHeading("cancelled")).toBe("Cancelled & rejected");
    expect(reservationListEmptyMessage("cancelled")).toMatch(/rejected/i);
  });
});
