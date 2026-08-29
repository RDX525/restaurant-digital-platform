import type { ReservationRecord } from "./types";
import { notifyReservationReminder } from "@/lib/notification/dispatch";

const REMINDER_HOURS_BEFORE = 24;

export async function queueReminderIfDue(
  record: ReservationRecord,
  restaurantName: string,
  now = new Date(),
): Promise<boolean> {
  if (record.status !== "confirmed") return false;

  const { zonedDateTimeToUtc } = await import("./timezone");
  const reservationUtc = zonedDateTimeToUtc(
    record.reservation_date,
    record.reservation_time,
    record.timezone,
  );
  const reminderWindowStart = reservationUtc.getTime() - REMINDER_HOURS_BEFORE * 60 * 60 * 1000;

  if (now.getTime() >= reminderWindowStart && now.getTime() < reservationUtc.getTime()) {
    await notifyReservationReminder(record, restaurantName);
    return true;
  }

  return false;
}
