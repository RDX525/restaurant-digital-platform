import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReservationRecord } from "./types";
import { queueReminderIfDue } from "./reminders";

vi.mock("@/lib/notification/dispatch", () => ({
  notifyReservationReminder: vi.fn().mockResolvedValue(undefined),
}));

import { notifyReservationReminder } from "@/lib/notification/dispatch";

function buildReservation(overrides: Partial<ReservationRecord> = {}): ReservationRecord {
  return {
    id: "res-1",
    restaurant_id: "rest-1",
    status: "confirmed",
    guest_name: "Alex",
    guest_email: "alex@example.com",
    guest_phone: "+15551234567",
    guest_count: 2,
    reservation_date: "2026-09-01",
    reservation_time: "19:00",
    timezone: "America/New_York",
    special_request: null,
    confirmed_at: "2026-08-29T12:00:00.000Z",
    cancelled_at: null,
    cancellation_reason: null,
    rescheduled_at: null,
    previous_date: null,
    previous_time: null,
    notifications: [],
    created_at: "2026-08-29T12:00:00.000Z",
    updated_at: "2026-08-29T12:00:00.000Z",
    ...overrides,
  };
}

describe("queueReminderIfDue", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends a reminder within 24 hours of the reservation", async () => {
    const record = buildReservation();
    const now = new Date("2026-09-01T00:00:00.000Z");

    const sent = await queueReminderIfDue(record, "Harbour Kitchen", now);

    expect(sent).toBe(true);
    expect(notifyReservationReminder).toHaveBeenCalledWith(record, "Harbour Kitchen");
  });

  it("does not send when reservation is more than 24 hours away", async () => {
    const record = buildReservation();
    const now = new Date("2026-08-30T12:00:00.000Z");

    const sent = await queueReminderIfDue(record, "Harbour Kitchen", now);

    expect(sent).toBe(false);
    expect(notifyReservationReminder).not.toHaveBeenCalled();
  });

  it("does not send after the reservation time has passed", async () => {
    const record = buildReservation();
    const now = new Date("2026-09-02T04:00:00.000Z");

    const sent = await queueReminderIfDue(record, "Harbour Kitchen", now);

    expect(sent).toBe(false);
    expect(notifyReservationReminder).not.toHaveBeenCalled();
  });

  it("does not send for non-confirmed reservations", async () => {
    const record = buildReservation({ status: "pending" });
    const now = new Date("2026-09-01T00:00:00.000Z");

    const sent = await queueReminderIfDue(record, "Harbour Kitchen", now);

    expect(sent).toBe(false);
    expect(notifyReservationReminder).not.toHaveBeenCalled();
  });
});
