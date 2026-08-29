import { getDemoRestaurantId } from "@/lib/utils";
import {
  applyOrderPaymentChange,
  applyOrderPlaced,
  applyReservationCreated,
  applyReservationRescheduled,
  computeAverageOrderValue,
  createEmptyProfile,
  matchesCustomerSearch,
  normalizeCustomerEmail,
} from "./stats";
import type {
  CustomerProfile,
  OrderCustomerInput,
  PublicCustomer,
  ReservationGuestInput,
} from "./types";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();

let customers: CustomerProfile[] = [];

export function resetDemoCustomerStore(): void {
  customers = [];
}

export function loadDemoCustomers(records: CustomerProfile[]): void {
  customers = structuredClone(records);
}

export function getDemoCustomers(): CustomerProfile[] {
  return structuredClone(customers);
}

function customerKey(restaurantId: string, email: string): string {
  return `${restaurantId}:${normalizeCustomerEmail(email)}`;
}

function findProfile(restaurantId: string, email: string): CustomerProfile | null {
  const normalized = normalizeCustomerEmail(email);
  return (
    customers.find(
      (profile) =>
        profile.restaurant_id === restaurantId && profile.email === normalized,
    ) ?? null
  );
}

function upsertProfile(
  restaurantId: string,
  email: string,
  init?: { name?: string; phone?: string; address?: string | null },
): CustomerProfile {
  if (restaurantId !== DEMO_RESTAURANT_ID) {
    throw new Error("Restaurant not found");
  }

  const existing = findProfile(restaurantId, email);
  if (existing) {
    if (init?.name) existing.name = init.name.trim();
    if (init?.phone) existing.phone = init.phone.trim();
    if (init?.address?.trim()) existing.address = init.address.trim();
    return existing;
  }

  const profile = createEmptyProfile({
    restaurantId,
    email,
    name: init?.name,
    phone: init?.phone,
    address: init?.address,
  });

  customers.unshift(profile);
  return profile;
}

export function syncDemoCustomerFromOrder(input: {
  restaurantId: string;
  customer: OrderCustomerInput;
  placedAt: string;
}): CustomerProfile {
  const profile = upsertProfile(input.restaurantId, input.customer.email, {
    name: input.customer.name,
    phone: input.customer.phone,
    address: input.customer.address,
  });

  applyOrderPlaced(profile, input);
  return structuredClone(profile);
}

export function syncDemoCustomerFromOrderPayment(input: {
  restaurantId: string;
  email: string;
  previousStatus: string;
  nextStatus: string;
  orderTotal: number;
}): CustomerProfile | null {
  const profile = findProfile(input.restaurantId, input.email);
  if (!profile) return null;

  applyOrderPaymentChange(profile, input);
  return structuredClone(profile);
}

export function syncDemoCustomerFromReservation(input: {
  restaurantId: string;
  guest: ReservationGuestInput;
  createdAt: string;
}): CustomerProfile {
  const profile = upsertProfile(input.restaurantId, input.guest.email, {
    name: input.guest.name,
    phone: input.guest.phone,
  });

  applyReservationCreated(profile, input);
  return structuredClone(profile);
}

export function syncDemoCustomerFromReservationReschedule(input: {
  restaurantId: string;
  email: string;
  rescheduledAt: string;
}): CustomerProfile | null {
  const profile = findProfile(input.restaurantId, input.email);
  if (!profile) return null;

  applyReservationRescheduled(profile, input.rescheduledAt);
  return structuredClone(profile);
}

export function listDemoCustomersForRestaurant(
  restaurantId: string,
  query?: string,
): CustomerProfile[] {
  if (restaurantId !== DEMO_RESTAURANT_ID) return [];

  return customers
    .filter(
      (profile) =>
        profile.restaurant_id === restaurantId &&
        matchesCustomerSearch(profile, query ?? ""),
    )
    .sort((a, b) => {
      const aActivity = a.last_order_at ?? a.last_reservation_at ?? a.created_at;
      const bActivity = b.last_order_at ?? b.last_reservation_at ?? b.created_at;
      return bActivity.localeCompare(aActivity);
    });
}

export function getDemoCustomerById(
  restaurantId: string,
  customerId: string,
): CustomerProfile | null {
  if (restaurantId !== DEMO_RESTAURANT_ID) return null;

  return (
    customers.find(
      (profile) => profile.restaurant_id === restaurantId && profile.id === customerId,
    ) ?? null
  );
}

export function getDemoCustomerByEmail(
  restaurantId: string,
  email: string,
): CustomerProfile | null {
  if (restaurantId !== DEMO_RESTAURANT_ID) return null;
  const profile = findProfile(restaurantId, email);
  return profile ? structuredClone(profile) : null;
}

export function mapDemoCustomer(profile: CustomerProfile): PublicCustomer {
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

export { customerKey, normalizeCustomerEmail };
