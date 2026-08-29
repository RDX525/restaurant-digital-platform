import { DEFAULT_LIFECYCLE_STAGE } from "./constants";
import type { CustomerProfile, OrderCustomerInput, ReservationGuestInput } from "./types";

export function normalizeCustomerEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function computeAverageOrderValue(profile: Pick<CustomerProfile, "total_spend" | "paid_order_count">): number {
  if (profile.paid_order_count <= 0) return 0;
  return Math.round((profile.total_spend / profile.paid_order_count) * 100) / 100;
}

export function createEmptyProfile(input: {
  restaurantId: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string | null;
  now?: string;
}): CustomerProfile {
  const now = input.now ?? new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    restaurant_id: input.restaurantId,
    email: normalizeCustomerEmail(input.email),
    name: input.name?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    address: input.address?.trim() || null,
    first_order_at: null,
    last_order_at: null,
    total_orders: 0,
    paid_order_count: 0,
    total_spend: 0,
    last_reservation_at: null,
    total_reservations: 0,
    lifecycle_stage: DEFAULT_LIFECYCLE_STAGE,
    metadata: {},
    created_at: now,
    updated_at: now,
  };
}

export function mergeContactDetails(
  profile: CustomerProfile,
  input: { name?: string; phone?: string; address?: string | null },
): void {
  if (input.name?.trim()) profile.name = input.name.trim();
  if (input.phone?.trim()) profile.phone = input.phone.trim();
  if (input.address?.trim()) profile.address = input.address.trim();
}

export function applyOrderPlaced(
  profile: CustomerProfile,
  input: {
    customer: OrderCustomerInput;
    placedAt: string;
  },
): void {
  mergeContactDetails(profile, {
    name: input.customer.name,
    phone: input.customer.phone,
    address: input.customer.address,
  });

  profile.total_orders += 1;

  if (!profile.first_order_at || input.placedAt < profile.first_order_at) {
    profile.first_order_at = input.placedAt;
  }

  if (!profile.last_order_at || input.placedAt > profile.last_order_at) {
    profile.last_order_at = input.placedAt;
  }

  profile.updated_at = new Date().toISOString();
}

export function applyOrderPaymentChange(
  profile: CustomerProfile,
  input: {
    previousStatus: string;
    nextStatus: string;
    orderTotal: number;
  },
): void {
  const wasPaid = input.previousStatus === "paid";
  const isPaid = input.nextStatus === "paid";
  const isRefunded = input.nextStatus === "refunded";

  if (!wasPaid && isPaid) {
    profile.paid_order_count += 1;
    profile.total_spend = roundMoney(profile.total_spend + input.orderTotal);
  }

  if (wasPaid && isRefunded) {
    profile.paid_order_count = Math.max(0, profile.paid_order_count - 1);
    profile.total_spend = roundMoney(Math.max(0, profile.total_spend - input.orderTotal));
  }

  profile.updated_at = new Date().toISOString();
}

export function applyReservationCreated(
  profile: CustomerProfile,
  input: {
    guest: ReservationGuestInput;
    createdAt: string;
  },
): void {
  mergeContactDetails(profile, {
    name: input.guest.name,
    phone: input.guest.phone,
  });

  profile.total_reservations += 1;

  if (!profile.last_reservation_at || input.createdAt > profile.last_reservation_at) {
    profile.last_reservation_at = input.createdAt;
  }

  profile.updated_at = new Date().toISOString();
}

export function applyReservationRescheduled(
  profile: CustomerProfile,
  rescheduledAt: string,
): void {
  if (!profile.last_reservation_at || rescheduledAt > profile.last_reservation_at) {
    profile.last_reservation_at = rescheduledAt;
  }

  profile.updated_at = new Date().toISOString();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function matchesCustomerSearch(profile: CustomerProfile, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    profile.name.toLowerCase().includes(normalized) ||
    profile.phone.toLowerCase().includes(normalized) ||
    profile.email.toLowerCase().includes(normalized)
  );
}
