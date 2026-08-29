import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { loadRestaurantById } from "@/lib/restaurant/data";
import { listOrdersForCustomer, recordToPlacedOrder } from "@/lib/order/data";
import { listDemoOrdersForCustomer } from "@/lib/order/demo-store";
import { listReservationsForRestaurant, listReservationsForGuestEmail } from "@/lib/reservation/data";
import {
  applyOrderPaymentChange,
  applyOrderPlaced,
  applyReservationCreated,
  applyReservationRescheduled,
  computeAverageOrderValue,
  createEmptyProfile,
  normalizeCustomerEmail,
} from "./stats";
import {
  getDemoCustomerById,
  listDemoCustomersForRestaurant,
  mapDemoCustomer,
  syncDemoCustomerFromOrder,
  syncDemoCustomerFromOrderPayment,
  syncDemoCustomerFromReservation,
  syncDemoCustomerFromReservationReschedule,
} from "./demo-store";
import type {
  CustomerDetail,
  CustomerProfile,
  OrderCustomerInput,
  PublicCustomer,
  ReservationGuestInput,
} from "./types";
import { DASHBOARD_CUSTOMERS_LIMIT } from "@/lib/constants/pagination";

function shouldUseDemoStore(restaurantId: string): boolean {
  return isDemoRestaurantId(restaurantId) && !isSupabaseConfigured();
}

function mapRow(row: Record<string, unknown>): CustomerProfile {
  return {
    id: row.id as string,
    restaurant_id: row.restaurant_id as string,
    email: row.email as string,
    name: row.name as string,
    phone: row.phone as string,
    address: (row.address as string | null) ?? null,
    first_order_at: (row.first_order_at as string | null) ?? null,
    last_order_at: (row.last_order_at as string | null) ?? null,
    total_orders: Number(row.total_orders ?? 0),
    paid_order_count: Number(row.paid_order_count ?? 0),
    total_spend: Number(row.total_spend ?? 0),
    last_reservation_at: (row.last_reservation_at as string | null) ?? null,
    total_reservations: Number(row.total_reservations ?? 0),
    lifecycle_stage: row.lifecycle_stage as CustomerProfile["lifecycle_stage"],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function mapCustomer(profile: CustomerProfile): PublicCustomer {
  return {
    id: profile.id,
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    address: profile.address,
    firstOrderAt: profile.first_order_at,
    lastOrderAt: profile.last_order_at,
    totalOrders: profile.total_orders,
    totalSpend: profile.total_spend,
    averageOrderValue: computeAverageOrderValue(profile),
    lastReservationAt: profile.last_reservation_at,
    totalReservations: profile.total_reservations,
    lifecycleStage: profile.lifecycle_stage,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

async function loadProfileByEmail(
  restaurantId: string,
  email: string,
): Promise<CustomerProfile | null> {
  if (shouldUseDemoStore(restaurantId)) {
    const { getDemoCustomerByEmail } = await import("./demo-store");
    return getDemoCustomerByEmail(restaurantId, email);
  }

  if (!isSupabaseConfigured()) {
    const { getDemoCustomerByEmail } = await import("./demo-store");
    return isDemoRestaurantId(restaurantId)
      ? getDemoCustomerByEmail(restaurantId, email)
      : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("email", normalizeCustomerEmail(email))
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

async function saveProfile(profile: CustomerProfile): Promise<CustomerProfile> {
  if (shouldUseDemoStore(profile.restaurant_id)) {
    return profile;
  }

  if (!isSupabaseConfigured()) {
    return profile;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_customers")
    .upsert({
      id: profile.id,
      restaurant_id: profile.restaurant_id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      address: profile.address,
      first_order_at: profile.first_order_at,
      last_order_at: profile.last_order_at,
      total_orders: profile.total_orders,
      paid_order_count: profile.paid_order_count,
      total_spend: profile.total_spend,
      last_reservation_at: profile.last_reservation_at,
      total_reservations: profile.total_reservations,
      lifecycle_stage: profile.lifecycle_stage,
      metadata: profile.metadata,
      updated_at: profile.updated_at,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data);
}

async function upsertAndApply(
  restaurantId: string,
  email: string,
  init: { name?: string; phone?: string; address?: string | null },
  apply: (profile: CustomerProfile) => void,
): Promise<CustomerProfile> {
  let profile = await loadProfileByEmail(restaurantId, email);

  if (!profile) {
    profile = createEmptyProfile({
      restaurantId,
      email,
      name: init.name,
      phone: init.phone,
      address: init.address,
    });
  } else {
    if (init.name?.trim()) profile.name = init.name.trim();
    if (init.phone?.trim()) profile.phone = init.phone.trim();
    if (init.address?.trim()) profile.address = init.address.trim();
  }

  apply(profile);
  return saveProfile(profile);
}

export async function syncCustomerFromOrder(input: {
  restaurantId: string;
  customer: OrderCustomerInput;
  placedAt: string;
}): Promise<void> {
  if (shouldUseDemoStore(input.restaurantId) || !isSupabaseConfigured()) {
    if (isDemoRestaurantId(input.restaurantId)) {
      syncDemoCustomerFromOrder(input);
    }
    return;
  }

  await upsertAndApply(
    input.restaurantId,
    input.customer.email,
    {
      name: input.customer.name,
      phone: input.customer.phone,
      address: input.customer.address,
    },
    (profile) => applyOrderPlaced(profile, input),
  );
}

export async function syncCustomerFromOrderPayment(input: {
  restaurantId: string;
  email: string;
  previousStatus: string;
  nextStatus: string;
  orderTotal: number;
}): Promise<void> {
  if (shouldUseDemoStore(input.restaurantId) || !isSupabaseConfigured()) {
    if (isDemoRestaurantId(input.restaurantId)) {
      syncDemoCustomerFromOrderPayment(input);
    }
    return;
  }

  const profile = await loadProfileByEmail(input.restaurantId, input.email);
  if (!profile) return;

  applyOrderPaymentChange(profile, input);
  await saveProfile(profile);
}

export async function syncCustomerFromReservation(input: {
  restaurantId: string;
  guest: ReservationGuestInput;
  createdAt: string;
}): Promise<void> {
  if (shouldUseDemoStore(input.restaurantId) || !isSupabaseConfigured()) {
    if (isDemoRestaurantId(input.restaurantId)) {
      syncDemoCustomerFromReservation(input);
    }
    return;
  }

  await upsertAndApply(
    input.restaurantId,
    input.guest.email,
    {
      name: input.guest.name,
      phone: input.guest.phone,
    },
    (profile) => applyReservationCreated(profile, input),
  );
}

export async function syncCustomerFromReservationReschedule(input: {
  restaurantId: string;
  email: string;
  rescheduledAt: string;
}): Promise<void> {
  if (shouldUseDemoStore(input.restaurantId) || !isSupabaseConfigured()) {
    if (isDemoRestaurantId(input.restaurantId)) {
      syncDemoCustomerFromReservationReschedule(input);
    }
    return;
  }

  const profile = await loadProfileByEmail(input.restaurantId, input.email);
  if (!profile) return;

  applyReservationRescheduled(profile, input.rescheduledAt);
  await saveProfile(profile);
}

export async function listCustomersForRestaurant(
  restaurantId: string,
  query?: string,
): Promise<PublicCustomer[]> {
  if (shouldUseDemoStore(restaurantId)) {
    return listDemoCustomersForRestaurant(restaurantId, query).map(mapDemoCustomer);
  }

  if (!isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId)
      ? listDemoCustomersForRestaurant(restaurantId, query).map(mapDemoCustomer)
      : [];
  }

  const supabase = await createClient();
  let dbQuery = supabase
    .from("restaurant_customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("updated_at", { ascending: false });

  const trimmed = query?.trim();
  if (trimmed) {
    dbQuery = dbQuery.or(
      `name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%,email.ilike.%${trimmed}%`,
    );
  }

  dbQuery = dbQuery.limit(DASHBOARD_CUSTOMERS_LIMIT);

  const { data, error } = await dbQuery;
  if (error) throw error;
  return (data ?? []).map((row) => mapCustomer(mapRow(row)));
}

export async function getCustomerDetail(
  restaurantId: string,
  customerId: string,
): Promise<CustomerDetail | null> {
  let profile: CustomerProfile | null = null;

  if (shouldUseDemoStore(restaurantId)) {
    profile = getDemoCustomerById(restaurantId, customerId);
  } else if (!isSupabaseConfigured()) {
    profile = isDemoRestaurantId(restaurantId)
      ? getDemoCustomerById(restaurantId, customerId)
      : null;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("restaurant_customers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("id", customerId)
      .maybeSingle();

    if (error) throw error;
    profile = data ? mapRow(data) : null;
  }

  if (!profile) return null;

  const orderHistory = await loadOrderHistoryForCustomer(restaurantId, profile.email);
  const reservationHistory = await loadReservationHistoryForCustomer(
    restaurantId,
    profile.email,
  );

  return {
    ...mapCustomer(profile),
    orderHistory,
    reservationHistory,
  };
}

async function loadOrderHistoryForCustomer(restaurantId: string, email: string) {
  const restaurant = await loadRestaurantById(restaurantId);
  const slug = restaurant?.slug ?? "demo-restaurant";
  const name = restaurant?.name ?? "Restaurant";

  if (shouldUseDemoStore(restaurantId) || (!isSupabaseConfigured() && isDemoRestaurantId(restaurantId))) {
    return listDemoOrdersForCustomer(email, restaurantId).map((record) =>
      recordToPlacedOrder(record, slug, name),
    );
  }

  return listOrdersForCustomer(email, slug);
}

async function loadReservationHistoryForCustomer(restaurantId: string, email: string) {
  return listReservationsForGuestEmail(restaurantId, email);
}

export { mapCustomer as recordToPublicCustomer };
