import type { PlacedOrder } from "@/lib/order/types";
import type { PublicReservation } from "@/lib/reservation/types";
import type { LifecycleStage } from "./constants";

export interface CustomerProfile {
  id: string;
  restaurant_id: string;
  email: string;
  name: string;
  phone: string;
  address: string | null;
  first_order_at: string | null;
  last_order_at: string | null;
  total_orders: number;
  paid_order_count: number;
  total_spend: number;
  last_reservation_at: string | null;
  total_reservations: number;
  lifecycle_stage: LifecycleStage;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PublicCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string | null;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  lastReservationAt: string | null;
  totalReservations: number;
  lifecycleStage: LifecycleStage;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends PublicCustomer {
  orderHistory: PlacedOrder[];
  reservationHistory: PublicReservation[];
}

export interface OrderCustomerInput {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface ReservationGuestInput {
  name: string;
  email: string;
  phone: string;
}
