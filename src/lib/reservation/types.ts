import type { OpeningHours } from "@/lib/restaurant/types";
import type { NotificationType, ReservationStatus } from "./constants";

export interface ReservationNotification {
  type: NotificationType;
  sent_at: string;
  channel: "email";
  recipient: string;
}

export interface ReservationRecord {
  id: string;
  restaurant_id: string;
  status: ReservationStatus;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_count: number;
  reservation_date: string;
  reservation_time: string;
  timezone: string;
  special_request: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  rescheduled_at: string | null;
  previous_date: string | null;
  previous_time: string | null;
  notifications: ReservationNotification[];
  created_at: string;
  updated_at: string;
}

export interface ReservationSettings {
  restaurant_id: string;
  timezone: string;
  reservation_hours: OpeningHours;
  max_party_size: number;
  booking_advance_days: number;
  booking_min_notice_hours: number;
  slot_interval_minutes: number;
  max_covers_per_slot: number;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationInput {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  date: string;
  time: string;
  specialRequest?: string;
}

export interface RescheduleReservationInput {
  date: string;
  time: string;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  remainingCovers: number;
}

export interface AvailabilityResult {
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
}

export interface CalendarDaySummary {
  date: string;
  count: number;
  covers: number;
}

export interface PublicReservation {
  id: string;
  status: ReservationStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  date: string;
  time: string;
  timezone: string;
  specialRequest: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  rescheduledAt: string | null;
  previousDate: string | null;
  previousTime: string | null;
  notifications: ReservationNotification[];
  createdAt: string;
  updatedAt: string;
}
