import type { NotificationType } from "./constants";
import type { ReservationNotification, ReservationRecord } from "./types";

export function appendNotification(
  record: ReservationRecord,
  type: NotificationType,
): ReservationNotification {
  const notification: ReservationNotification = {
    type,
    sent_at: new Date().toISOString(),
    channel: "email",
    recipient: record.guest_email,
  };

  record.notifications = [...record.notifications, notification];
  return notification;
}

export function notifyConfirmation(record: ReservationRecord): void {
  appendNotification(record, "confirmation");
}

export function notifyReminder(record: ReservationRecord): void {
  appendNotification(record, "reminder");
}

export function notifyCancellation(record: ReservationRecord): void {
  appendNotification(record, "cancellation");
}

export function notifyReschedule(record: ReservationRecord): void {
  appendNotification(record, "reschedule");
}
