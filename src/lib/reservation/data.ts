import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeOpeningHours } from "@/lib/restaurant/opening-hours";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { loadRestaurantBySlug, loadRestaurantById } from "@/lib/restaurant/data";
import type { OpeningHours } from "@/lib/restaurant/types";
import {
  ReservationValidationError,
  assertStatusTransition,
  buildAvailability,
  validateReservationSlot,
} from "./availability";
import {
  createDemoReservation,
  getDemoReservationById,
  getDemoReservationSettings,
  listDemoReservationsForRestaurant,
  rescheduleDemoReservation,
  updateDemoReservationSettings,
  updateDemoReservationStatus,
  type ReservationAction,
} from "./demo-store";
import type {
  AvailabilityResult,
  CreateReservationInput,
  PublicReservation,
  ReservationRecord,
  ReservationSettings,
  RescheduleReservationInput,
} from "./types";
import { DASHBOARD_RESERVATIONS_LIMIT } from "@/lib/constants/pagination";
import {
  syncCustomerFromReservation,
  syncCustomerFromReservationReschedule,
} from "@/lib/customer/data";
import {
  notifyReservationChanged,
  notifyReservationReceived,
  notifyReservationStatusAction,
} from "@/lib/notification/dispatch";
import { recordAnalyticsEvent } from "@/lib/analytics/data";

function guestInput(input: CreateReservationInput) {
  return {
    name: input.guestName,
    email: input.guestEmail,
    phone: input.guestPhone,
  };
}

async function notifyCustomerReservationCreated(
  restaurantId: string,
  input: CreateReservationInput,
  createdAt: string,
): Promise<void> {
  await syncCustomerFromReservation({
    restaurantId,
    guest: guestInput(input),
    createdAt,
  });
}

async function notifyCustomerReservationRescheduled(
  restaurantId: string,
  email: string,
  rescheduledAt: string,
): Promise<void> {
  await syncCustomerFromReservationReschedule({
    restaurantId,
    email,
    rescheduledAt,
  });
}

function shouldUseDemoStore(restaurantId: string): boolean {
  return isDemoRestaurantId(restaurantId) && !isSupabaseConfigured();
}

function mapRecord(record: ReservationRecord): PublicReservation {
  return {
    id: record.id,
    status: record.status,
    guestName: record.guest_name,
    guestEmail: record.guest_email,
    guestPhone: record.guest_phone,
    guestCount: record.guest_count,
    date: record.reservation_date,
    time: record.reservation_time.slice(0, 5),
    timezone: record.timezone,
    specialRequest: record.special_request,
    confirmedAt: record.confirmed_at,
    cancelledAt: record.cancelled_at,
    cancellationReason: record.cancellation_reason,
    rescheduledAt: record.rescheduled_at,
    previousDate: record.previous_date,
    previousTime: record.previous_time?.slice(0, 5) ?? null,
    notifications: record.notifications,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapSettingsRow(row: Record<string, unknown>): ReservationSettings {
  return {
    restaurant_id: row.restaurant_id as string,
    timezone: row.timezone as string,
    reservation_hours: normalizeOpeningHours(row.reservation_hours as OpeningHours),
    max_party_size: row.max_party_size as number,
    booking_advance_days: row.booking_advance_days as number,
    booking_min_notice_hours: row.booking_min_notice_hours as number,
    slot_interval_minutes: row.slot_interval_minutes as number,
    max_covers_per_slot: row.max_covers_per_slot as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapReservationRow(row: Record<string, unknown>): ReservationRecord {
  return {
    id: row.id as string,
    restaurant_id: row.restaurant_id as string,
    status: row.status as ReservationRecord["status"],
    guest_name: row.guest_name as string,
    guest_email: row.guest_email as string,
    guest_phone: row.guest_phone as string,
    guest_count: row.guest_count as number,
    reservation_date: row.reservation_date as string,
    reservation_time: (row.reservation_time as string).slice(0, 5),
    timezone: row.timezone as string,
    special_request: (row.special_request as string | null) ?? null,
    confirmed_at: (row.confirmed_at as string | null) ?? null,
    cancelled_at: (row.cancelled_at as string | null) ?? null,
    cancellation_reason: (row.cancellation_reason as string | null) ?? null,
    rescheduled_at: (row.rescheduled_at as string | null) ?? null,
    previous_date: (row.previous_date as string | null) ?? null,
    previous_time: row.previous_time
      ? (row.previous_time as string).slice(0, 5)
      : null,
    notifications: (row.notifications as ReservationRecord["notifications"]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function loadReservationSettings(
  restaurantId: string,
): Promise<ReservationSettings | null> {
  if (shouldUseDemoStore(restaurantId)) {
    return getDemoReservationSettings(restaurantId);
  }

  if (!isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? getDemoReservationSettings(restaurantId)
      : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservation_settings")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return isDemoRestaurantId(restaurantId)
      ? getDemoReservationSettings(restaurantId)
      : null;
  }

  return mapSettingsRow(data);
}

export async function saveReservationSettings(
  restaurantId: string,
  patch: Omit<ReservationSettings, "restaurant_id" | "created_at" | "updated_at">,
): Promise<ReservationSettings> {
  if (shouldUseDemoStore(restaurantId)) {
    return updateDemoReservationSettings(restaurantId, patch);
  }

  if (!isSupabaseConfigured()) {
    if (!isDemoRestaurantId(restaurantId)) {
      throw new Error("Restaurant not found");
    }
    return updateDemoReservationSettings(restaurantId, patch);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservation_settings")
    .upsert({
      restaurant_id: restaurantId,
      timezone: patch.timezone,
      reservation_hours: patch.reservation_hours,
      max_party_size: patch.max_party_size,
      booking_advance_days: patch.booking_advance_days,
      booking_min_notice_hours: patch.booking_min_notice_hours,
      slot_interval_minutes: patch.slot_interval_minutes,
      max_covers_per_slot: patch.max_covers_per_slot,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapSettingsRow(data);
}

export async function listReservationsForRestaurant(
  restaurantId: string,
  options?: { date?: string; limit?: number },
): Promise<PublicReservation[]> {
  if (shouldUseDemoStore(restaurantId)) {
    const reservations = listDemoReservationsForRestaurant(restaurantId).map(mapRecord);
    return filterReservations(reservations, options);
  }

  if (!isSupabaseConfigured()) {
    const reservations = isDemoRestaurantId(restaurantId)
      ? listDemoReservationsForRestaurant(restaurantId).map(mapRecord)
      : [];
    return filterReservations(reservations, options);
  }

  const supabase = await createClient();
  let query = supabase
    .from("reservations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  if (options?.date) {
    query = query.eq("reservation_date", options.date);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  } else if (!options?.date) {
    query = query.limit(DASHBOARD_RESERVATIONS_LIMIT);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map((row) => mapRecord(mapReservationRow(row)));
}

export async function listReservationsForGuestEmail(
  restaurantId: string,
  email: string,
  limit = 50,
): Promise<PublicReservation[]> {
  const normalized = email.trim().toLowerCase();

  if (shouldUseDemoStore(restaurantId) || (!isSupabaseConfigured() && isDemoRestaurantId(restaurantId))) {
    return listDemoReservationsForRestaurant(restaurantId)
      .filter((reservation) => reservation.guest_email === normalized)
      .slice(0, limit)
      .map(mapRecord);
  }

  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("guest_email", normalized)
    .order("reservation_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapRecord(mapReservationRow(row)));
}

function filterReservations(
  reservations: PublicReservation[],
  options?: { date?: string; limit?: number },
): PublicReservation[] {
  let filtered = reservations;
  if (options?.date) {
    filtered = filtered.filter((reservation) => reservation.date === options.date);
  }
  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  } else if (!options?.date) {
    filtered = filtered.slice(0, DASHBOARD_RESERVATIONS_LIMIT);
  }
  return filtered;
}

export async function getReservationForRestaurant(
  restaurantId: string,
  reservationId: string,
): Promise<PublicReservation | null> {
  if (shouldUseDemoStore(restaurantId)) {
    const record = getDemoReservationById(restaurantId, reservationId);
    return record ? mapRecord(record) : null;
  }

  if (!isSupabaseConfigured()) {
    const record = getDemoReservationById(restaurantId, reservationId);
    return record ? mapRecord(record) : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("id", reservationId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRecord(mapReservationRow(data)) : null;
}

export async function createReservation(
  restaurantSlug: string,
  input: CreateReservationInput,
): Promise<PublicReservation> {
  const restaurant = await loadRestaurantBySlug(restaurantSlug);
  if (!restaurant) {
    throw new ReservationValidationError("Restaurant not found.");
  }

  const settings = await loadReservationSettings(restaurant.id);
  if (!settings) {
    throw new ReservationValidationError("Reservations are not available.");
  }

  if (shouldUseDemoStore(restaurant.id)) {
    const record = createDemoReservation(
      restaurant.id,
      input,
      restaurant.opening_hours,
    );
    await notifyCustomerReservationCreated(restaurant.id, input, record.created_at);
    await notifyReservationReceived(record, restaurant.name);
    await recordAnalyticsEvent({
      restaurantId: restaurant.id,
      eventType: "RESERVATION_STARTED",
      reservationId: record.id,
    });
    return mapRecord(record);
  }

  if (!isSupabaseConfigured()) {
    const record = createDemoReservation(
      restaurant.id,
      input,
      restaurant.opening_hours,
    );
    await notifyCustomerReservationCreated(restaurant.id, input, record.created_at);
    await notifyReservationReceived(record, restaurant.name);
    await recordAnalyticsEvent({
      restaurantId: restaurant.id,
      eventType: "RESERVATION_STARTED",
      reservationId: record.id,
    });
    return mapRecord(record);
  }

  const supabase = await createClient();
  const existing = await listReservationsForRestaurant(restaurant.id, { date: input.date });

  validateReservationSlot({
    settings,
    reservations: existing.map((reservation) => ({
      id: reservation.id,
      restaurant_id: restaurant.id,
      status: reservation.status,
      guest_name: reservation.guestName,
      guest_email: reservation.guestEmail,
      guest_phone: reservation.guestPhone,
      guest_count: reservation.guestCount,
      reservation_date: reservation.date,
      reservation_time: reservation.time,
      timezone: reservation.timezone,
      special_request: reservation.specialRequest,
      confirmed_at: reservation.confirmedAt,
      cancelled_at: reservation.cancelledAt,
      cancellation_reason: reservation.cancellationReason,
      rescheduled_at: reservation.rescheduledAt,
      previous_date: reservation.previousDate,
      previous_time: reservation.previousTime,
      notifications: reservation.notifications,
      created_at: reservation.createdAt,
      updated_at: reservation.updatedAt,
    })),
    date: input.date,
    time: input.time,
    guestCount: input.guestCount,
    restaurantOpeningHours: restaurant.opening_hours,
  });

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      restaurant_id: restaurant.id,
      status: "pending",
      guest_name: input.guestName.trim(),
      guest_email: input.guestEmail.trim().toLowerCase(),
      guest_phone: input.guestPhone.trim(),
      guest_count: input.guestCount,
      reservation_date: input.date,
      reservation_time: input.time.slice(0, 5),
      timezone: settings.timezone,
      special_request: input.specialRequest?.trim() || null,
      notifications: [],
    })
    .select("*")
    .single();

  if (error) throw error;
  const reservation = mapRecord(mapReservationRow(data));
  await notifyCustomerReservationCreated(restaurant.id, input, reservation.createdAt);
  await notifyReservationReceived(mapReservationRow(data), restaurant.name);
  await recordAnalyticsEvent({
    restaurantId: restaurant.id,
    eventType: "RESERVATION_STARTED",
    reservationId: reservation.id,
  });
  return reservation;
}

export async function getAvailabilityForRestaurant(
  restaurantSlug: string,
  date: string,
  guestCount: number,
): Promise<AvailabilityResult> {
  const restaurant = await loadRestaurantBySlug(restaurantSlug);
  if (!restaurant) {
    throw new ReservationValidationError("Restaurant not found.");
  }

  const settings = await loadReservationSettings(restaurant.id);
  if (!settings) {
    throw new ReservationValidationError("Reservations are not available.");
  }

  const reservations = await listReservationsForRestaurant(restaurant.id, { date });
  const records: ReservationRecord[] = reservations.map((reservation) => ({
    id: reservation.id,
    restaurant_id: restaurant.id,
    status: reservation.status,
    guest_name: reservation.guestName,
    guest_email: reservation.guestEmail,
    guest_phone: reservation.guestPhone,
    guest_count: reservation.guestCount,
    reservation_date: reservation.date,
    reservation_time: reservation.time,
    timezone: reservation.timezone,
    special_request: reservation.specialRequest,
    confirmed_at: reservation.confirmedAt,
    cancelled_at: reservation.cancelledAt,
    cancellation_reason: reservation.cancellationReason,
    rescheduled_at: reservation.rescheduledAt,
    previous_date: reservation.previousDate,
    previous_time: reservation.previousTime,
    notifications: reservation.notifications,
    created_at: reservation.createdAt,
    updated_at: reservation.updatedAt,
  }));

  return buildAvailability({
    settings,
    reservations: records,
    date,
    guestCount,
    restaurantOpeningHours: restaurant.opening_hours,
  });
}

export async function updateReservationStatus(
  restaurantId: string,
  reservationId: string,
  action: ReservationAction,
  cancellationReason?: string,
): Promise<PublicReservation | null> {
  const restaurant = await loadRestaurantById(restaurantId);
  const restaurantName = restaurant?.name ?? "Restaurant";

  if (shouldUseDemoStore(restaurantId)) {
    const record = updateDemoReservationStatus(
      restaurantId,
      reservationId,
      action,
      cancellationReason,
    );
    if (record) {
      await notifyReservationStatusAction(record, action, restaurantName, cancellationReason);
      if (action === "confirm") {
        await recordAnalyticsEvent({
          restaurantId,
          eventType: "RESERVATION_COMPLETED",
          reservationId: record.id,
        });
      }
    }
    return record ? mapRecord(record) : null;
  }

  if (!isSupabaseConfigured()) {
    const record = updateDemoReservationStatus(
      restaurantId,
      reservationId,
      action,
      cancellationReason,
    );
    if (record) {
      await notifyReservationStatusAction(record, action, restaurantName, cancellationReason);
      if (action === "confirm") {
        await recordAnalyticsEvent({
          restaurantId,
          eventType: "RESERVATION_COMPLETED",
          reservationId: record.id,
        });
      }
    }
    return record ? mapRecord(record) : null;
  }

  const existing = await getReservationForRestaurant(restaurantId, reservationId);
  if (!existing) return null;

  const nextStatus =
    action === "confirm"
      ? "confirmed"
      : action === "reject" || action === "cancel"
        ? "cancelled"
        : action === "complete"
          ? "completed"
          : "no_show";

  assertStatusTransition(existing.status, nextStatus);

  const now = new Date().toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: nextStatus,
      confirmed_at: nextStatus === "confirmed" ? now : existing.confirmedAt,
      cancelled_at: nextStatus === "cancelled" ? now : existing.cancelledAt,
      cancellation_reason:
        nextStatus === "cancelled"
          ? cancellationReason?.trim() || null
          : existing.cancellationReason,
      updated_at: now,
    })
    .eq("restaurant_id", restaurantId)
    .eq("id", reservationId)
    .select("*")
    .single();

  if (error) throw error;
  const record = mapReservationRow(data);
  await notifyReservationStatusAction(record, action, restaurantName, cancellationReason);
  if (action === "confirm") {
    await recordAnalyticsEvent({
      restaurantId,
      eventType: "RESERVATION_COMPLETED",
      reservationId: record.id,
    });
  }
  return mapRecord(record);
}

export async function rescheduleReservation(
  restaurantId: string,
  reservationId: string,
  input: RescheduleReservationInput,
): Promise<PublicReservation | null> {
  const restaurant = await loadRestaurantById(restaurantId);
  const openingHours = restaurant?.opening_hours;

  if (shouldUseDemoStore(restaurantId)) {
    const record = rescheduleDemoReservation(
      restaurantId,
      reservationId,
      input,
      openingHours,
    );
    if (record) {
      await notifyCustomerReservationRescheduled(
        restaurantId,
        record.guest_email,
        record.rescheduled_at ?? new Date().toISOString(),
      );
      await notifyReservationChanged(record, restaurant?.name ?? "Restaurant");
    }
    return record ? mapRecord(record) : null;
  }

  if (!isSupabaseConfigured()) {
    const record = rescheduleDemoReservation(
      restaurantId,
      reservationId,
      input,
      openingHours,
    );
    if (record) {
      await notifyCustomerReservationRescheduled(
        restaurantId,
        record.guest_email,
        record.rescheduled_at ?? new Date().toISOString(),
      );
      await notifyReservationChanged(record, restaurant?.name ?? "Restaurant");
    }
    return record ? mapRecord(record) : null;
  }

  const existing = await getReservationForRestaurant(restaurantId, reservationId);
  if (!existing) return null;

  const settings = await loadReservationSettings(restaurantId);
  if (!settings) return null;

  const reservations = await listReservationsForRestaurant(restaurantId, {
    date: input.date,
  });
  validateReservationSlot({
    settings,
    reservations: reservations.map((reservation) => ({
      id: reservation.id,
      restaurant_id: restaurantId,
      status: reservation.status,
      guest_name: reservation.guestName,
      guest_email: reservation.guestEmail,
      guest_phone: reservation.guestPhone,
      guest_count: reservation.guestCount,
      reservation_date: reservation.date,
      reservation_time: reservation.time,
      timezone: reservation.timezone,
      special_request: reservation.specialRequest,
      confirmed_at: reservation.confirmedAt,
      cancelled_at: reservation.cancelledAt,
      cancellation_reason: reservation.cancellationReason,
      rescheduled_at: reservation.rescheduledAt,
      previous_date: reservation.previousDate,
      previous_time: reservation.previousTime,
      notifications: reservation.notifications,
      created_at: reservation.createdAt,
      updated_at: reservation.updatedAt,
    })),
    date: input.date,
    time: input.time,
    guestCount: existing.guestCount,
    restaurantOpeningHours: openingHours,
    excludeReservationId: reservationId,
  });

  const now = new Date().toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .update({
      previous_date: existing.date,
      previous_time: existing.time,
      reservation_date: input.date,
      reservation_time: input.time.slice(0, 5),
      rescheduled_at: now,
      updated_at: now,
    })
    .eq("restaurant_id", restaurantId)
    .eq("id", reservationId)
    .select("*")
    .single();

  if (error) throw error;
  const record = mapReservationRow(data);
  const reservation = mapRecord(record);
  await notifyCustomerReservationRescheduled(
    restaurantId,
    reservation.guestEmail,
    reservation.rescheduledAt ?? now,
  );
  await notifyReservationChanged(record, restaurant?.name ?? "Restaurant");
  return reservation;
}

/** Confirmed reservations within the next 48 hours (cron reminder job). */
export async function listConfirmedReservationsForReminderJob(
  now = new Date(),
): Promise<ReservationRecord[]> {
  if (!isSupabaseConfigured()) {
    const { getDemoReservations } = await import("./demo-store");
    return getDemoReservations().filter((reservation) => reservation.status === "confirmed");
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const today = now.toISOString().slice(0, 10);
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("reservations")
    .select("*")
    .eq("status", "confirmed")
    .gte("reservation_date", today)
    .lte("reservation_date", horizon);

  if (error) throw error;
  return (data ?? []).map(mapReservationRow);
}

export { mapRecord as recordToPublicReservation };
