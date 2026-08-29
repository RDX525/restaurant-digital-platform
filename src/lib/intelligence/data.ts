import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { listOrdersForRestaurant } from "@/lib/order/data";
import { listDemoOrdersForRestaurant } from "@/lib/order/demo-store";
import { listDemoReservationsForRestaurant } from "@/lib/reservation/demo-store";
import { listReservationsForRestaurant, loadReservationSettings } from "@/lib/reservation/data";
import { getDemoReservationSettings } from "@/lib/reservation/demo-store";
import { listCustomersForRestaurant } from "@/lib/customer/data";
import { listDemoCustomersForRestaurant } from "@/lib/customer/demo-store";
import { DEFAULT_ANALYTICS_TIMEZONE } from "@/lib/analytics/constants";
import type { OrderRecord } from "@/lib/order/types";
import type { ReservationRecord } from "@/lib/reservation/types";
import type { CustomerProfile } from "@/lib/customer/types";
import {
  listDemoInsightsForRestaurant,
  storeDemoInsight,
} from "./demo-store";
import type { AiInsightRecord, RestaurantContext } from "./types";
import type { InsightType } from "./constants";

function shouldUseDemoStore(restaurantId: string): boolean {
  return isDemoRestaurantId(restaurantId) && !isSupabaseConfigured();
}

export async function loadRestaurantTimezone(restaurantId: string): Promise<string> {
  const settings = shouldUseDemoStore(restaurantId)
    ? getDemoReservationSettings(restaurantId)
    : await loadReservationSettings(restaurantId);
  return settings?.timezone ?? DEFAULT_ANALYTICS_TIMEZONE;
}

export async function loadVerifiedOrders(restaurantId: string): Promise<OrderRecord[]> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId) ? listDemoOrdersForRestaurant(restaurantId) : [];
  }
  return listOrdersForRestaurant(restaurantId);
}

export async function loadVerifiedReservations(
  restaurantId: string,
): Promise<ReservationRecord[]> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? listDemoReservationsForRestaurant(restaurantId)
      : [];
  }

  const publicReservations = await listReservationsForRestaurant(restaurantId);
  return publicReservations.map((reservation) => ({
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
  }));
}

export async function loadVerifiedCustomers(restaurantId: string): Promise<CustomerProfile[]> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId) ? listDemoCustomersForRestaurant(restaurantId) : [];
  }

  const customers = await listCustomersForRestaurant(restaurantId);
  return customers.map((customer) => ({
    id: customer.id,
    restaurant_id: restaurantId,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    first_order_at: customer.firstOrderAt,
    last_order_at: customer.lastOrderAt,
    total_orders: customer.totalOrders,
    paid_order_count: customer.totalOrders,
    total_spend: customer.totalSpend,
    last_reservation_at: customer.lastReservationAt,
    total_reservations: customer.totalReservations,
    lifecycle_stage: customer.lifecycleStage,
    metadata: {},
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  }));
}

export async function loadRestaurantContext(restaurantId: string): Promise<RestaurantContext> {
  return {
    restaurantId,
    timezone: await loadRestaurantTimezone(restaurantId),
  };
}

export async function storeAiInsight(input: {
  restaurantId: string;
  insightType: InsightType;
  sourceMetrics: Record<string, unknown>;
  generatedText: string;
}): Promise<AiInsightRecord> {
  if (shouldUseDemoStore(input.restaurantId) || !isSupabaseConfigured()) {
    if (!isDemoRestaurantId(input.restaurantId)) {
      throw new Error("Restaurant not found");
    }
    return storeDemoInsight({
      restaurantId: input.restaurantId,
      insightType: input.insightType,
      sourceMetrics: input.sourceMetrics,
      generatedText: input.generatedText,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_insights")
    .insert({
      restaurant_id: input.restaurantId,
      insight_type: input.insightType,
      source_metrics: input.sourceMetrics,
      generated_text: input.generatedText,
    })
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: data.id as string,
    restaurant_id: data.restaurant_id as string,
    insight_type: data.insight_type as InsightType,
    source_metrics: (data.source_metrics as Record<string, unknown>) ?? {},
    generated_text: data.generated_text as string,
    created_at: data.created_at as string,
  };
}

export async function listAiInsights(
  restaurantId: string,
  options?: { insightType?: InsightType; limit?: number },
): Promise<AiInsightRecord[]> {
  if (shouldUseDemoStore(restaurantId) || !isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? listDemoInsightsForRestaurant(restaurantId, options)
      : [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("ai_insights")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 20);

  if (options?.insightType) {
    query = query.eq("insight_type", options.insightType);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    restaurant_id: row.restaurant_id as string,
    insight_type: row.insight_type as InsightType,
    source_metrics: (row.source_metrics as Record<string, unknown>) ?? {},
    generated_text: row.generated_text as string,
    created_at: row.created_at as string,
  }));
}
