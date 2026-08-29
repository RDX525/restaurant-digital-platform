export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "confirmation",
  "reminder",
  "cancellation",
  "reschedule",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No show",
};

export const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["cancelled", "completed", "no_show"],
  cancelled: [],
  completed: [],
  no_show: [],
};

export const ACTIVE_SLOT_STATUSES: ReservationStatus[] = ["pending", "confirmed"];

export const DEFAULT_TIMEZONE = "Pacific/Auckland";
export const DEFAULT_MAX_PARTY_SIZE = 12;
export const DEFAULT_BOOKING_ADVANCE_DAYS = 60;
export const DEFAULT_MIN_NOTICE_HOURS = 2;
export const DEFAULT_SLOT_INTERVAL_MINUTES = 30;
export const DEFAULT_MAX_COVERS_PER_SLOT = 24;
