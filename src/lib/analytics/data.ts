import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { loadRestaurantBySlug } from "@/lib/restaurant/data";
import { listOrdersForRestaurant } from "@/lib/order/data";
import { listDemoOrdersForRestaurant } from "@/lib/order/demo-store";
import { listDemoReservationsForRestaurant } from "@/lib/reservation/demo-store";
import { loadReservationSettings } from "@/lib/reservation/data";
import { getDemoReservationSettings } from "@/lib/reservation/demo-store";
import type { OrderRecord } from "@/lib/order/types";
import type { ReservationRecord } from "@/lib/reservation/types";
import { resolveDateRange } from "./date-range";
import {
  addDaysToDateIso,
} from "@/lib/reservation/timezone";
import { ANALYTICS_ORDERS_LOOKBACK_DAYS } from "@/lib/constants/pagination";
import {
  listDemoAnalyticsEventsForRestaurant,
  recordDemoAnalyticsEvent,
} from "./demo-store";
import { buildAnalyticsReport, type QrScanRecord } from "./reports";
import type {
  AnalyticsEventRecord,
  AnalyticsReport,
  DateRangeBounds,
  RecordAnalyticsEventInput,
} from "./types";
import type { DateRangePreset } from "./constants";
import { DEFAULT_ANALYTICS_TIMEZONE } from "./constants";

function shouldUseDemoStore(restaurantId: string): boolean {
  return isDemoRestaurantId(restaurantId) && !isSupabaseConfigured();
}

function mapEventRow(row: Record<string, unknown>): AnalyticsEventRecord {
  return {
    id: row.id as string,
    restaurant_id: row.restaurant_id as string,
    event_type: row.event_type as AnalyticsEventRecord["event_type"],
    occurred_at: row.occurred_at as string,
    session_id: (row.session_id as string | null) ?? null,
    path: (row.path as string | null) ?? null,
    menu_item_id: (row.menu_item_id as string | null) ?? null,
    order_id: (row.order_id as string | null) ?? null,
    reservation_id: (row.reservation_id as string | null) ?? null,
    table_id: (row.table_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    user_agent: (row.user_agent as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

async function loadTimezone(restaurantId: string): Promise<string> {
  const settings = shouldUseDemoStore(restaurantId)
    ? getDemoReservationSettings(restaurantId)
    : await loadReservationSettings(restaurantId);
  return settings?.timezone ?? DEFAULT_ANALYTICS_TIMEZONE;
}

async function loadOrders(
  restaurantId: string,
  range?: DateRangeBounds,
): Promise<OrderRecord[]> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? listDemoOrdersForRestaurant(restaurantId)
      : [];
  }

  if (!range) {
    return listOrdersForRestaurant(restaurantId, { limit: 10_000 });
  }

  const lookbackStart = addDaysToDateIso(range.startDate, -ANALYTICS_ORDERS_LOOKBACK_DAYS);
  const lookbackUtc = resolveDateRange("custom", range.timezone, lookbackStart, range.endDate).startUtc;

  return listOrdersForRestaurant(restaurantId, {
    placedFromUtc: lookbackUtc,
    placedBeforeUtc: range.endUtc,
    limit: 10_000,
  });
}

async function loadReservations(
  restaurantId: string,
  range?: DateRangeBounds,
): Promise<ReservationRecord[]> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? listDemoReservationsForRestaurant(restaurantId)
      : [];
  }

  const supabase = await createClient();
  let query = supabase.from("reservations").select("*").eq("restaurant_id", restaurantId);

  if (range) {
    query = query
      .gte("created_at", range.startUtc)
      .lt("created_at", range.endUtc);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => mapReservationRowFromDb(row, restaurantId));
}

function mapReservationRowFromDb(
  row: Record<string, unknown>,
  restaurantId: string,
): ReservationRecord {
  return {
    id: row.id as string,
    restaurant_id: restaurantId,
    status: row.status as ReservationRecord["status"],
    guest_name: row.guest_name as string,
    guest_email: row.guest_email as string,
    guest_phone: row.guest_phone as string,
    guest_count: Number(row.guest_count),
    reservation_date: row.reservation_date as string,
    reservation_time: row.reservation_time as string,
    timezone: row.timezone as string,
    special_request: (row.special_request as string | null) ?? null,
    confirmed_at: (row.confirmed_at as string | null) ?? null,
    cancelled_at: (row.cancelled_at as string | null) ?? null,
    cancellation_reason: (row.cancellation_reason as string | null) ?? null,
    rescheduled_at: (row.rescheduled_at as string | null) ?? null,
    previous_date: (row.previous_date as string | null) ?? null,
    previous_time: (row.previous_time as string | null) ?? null,
    notifications: (row.notifications as ReservationRecord["notifications"]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

async function loadEvents(
  restaurantId: string,
  range?: DateRangeBounds,
): Promise<AnalyticsEventRecord[]> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? listDemoAnalyticsEventsForRestaurant(restaurantId)
      : [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("analytics_events")
    .select("*")
    .eq("restaurant_id", restaurantId);

  if (range) {
    query = query.gte("occurred_at", range.startUtc).lt("occurred_at", range.endUtc);
  }

  const { data, error } = await query.order("occurred_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapEventRow);
}

async function loadQrScans(
  restaurantId: string,
  range?: DateRangeBounds,
): Promise<QrScanRecord[]> {
  if (!isSupabaseConfigured()) {
    const { getDemoAnalyticsQrScans } = await import("./qr-scans");
    return isDemoRestaurantId(restaurantId) ? getDemoAnalyticsQrScans(restaurantId) : [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("qr_scan_events")
    .select("restaurant_id, table_id, scanned_at")
    .eq("restaurant_id", restaurantId);

  if (range) {
    query = query.gte("scanned_at", range.startUtc).lt("scanned_at", range.endUtc);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as QrScanRecord[];
}

export async function recordAnalyticsEvent(
  input: RecordAnalyticsEventInput,
): Promise<AnalyticsEventRecord> {
  if (shouldUseDemoStore(input.restaurantId) || !isSupabaseConfigured()) {
    if (!isDemoRestaurantId(input.restaurantId)) {
      throw new Error("Restaurant not found");
    }
    return recordDemoAnalyticsEvent(input);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .insert({
      restaurant_id: input.restaurantId,
      event_type: input.eventType,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      session_id: input.sessionId ?? null,
      path: input.path ?? null,
      menu_item_id: input.menuItemId ?? null,
      order_id: input.orderId ?? null,
      reservation_id: input.reservationId ?? null,
      table_id: input.tableId ?? null,
      metadata: input.metadata ?? {},
      user_agent: input.userAgent ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapEventRow(data);
}

export async function recordAnalyticsEventForSlug(input: {
  restaurantSlug: string;
  eventType: RecordAnalyticsEventInput["eventType"];
  sessionId?: string;
  path?: string;
  menuItemId?: string;
  metadata?: Record<string, unknown>;
  userAgent?: string;
}): Promise<AnalyticsEventRecord | null> {
  const restaurant = await loadRestaurantBySlug(input.restaurantSlug);
  if (!restaurant) return null;

  return recordAnalyticsEvent({
    restaurantId: restaurant.id,
    eventType: input.eventType,
    sessionId: input.sessionId,
    path: input.path,
    menuItemId: input.menuItemId,
    metadata: input.metadata,
    userAgent: input.userAgent,
  });
}

export async function getAnalyticsReport(
  restaurantId: string,
  preset: DateRangePreset,
  customFrom?: string,
  customTo?: string,
): Promise<AnalyticsReport> {
  const timezone = await loadTimezone(restaurantId);
  const range: DateRangeBounds = resolveDateRange(preset, timezone, customFrom, customTo);

  const [orders, reservations, events, qrScans] = await Promise.all([
    loadOrders(restaurantId, range),
    loadReservations(restaurantId, range),
    loadEvents(restaurantId, range),
    loadQrScans(restaurantId, range),
  ]);

  return buildAnalyticsReport({
    orders,
    reservations,
    events,
    qrScans,
    range,
  });
}
