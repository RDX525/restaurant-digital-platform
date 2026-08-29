import type { OrderType } from "@/lib/order/types";
import type { AnalyticsEventType, DateRangePreset } from "./constants";

export interface AnalyticsEventRecord {
  id: string;
  restaurant_id: string;
  event_type: AnalyticsEventType;
  occurred_at: string;
  session_id: string | null;
  path: string | null;
  menu_item_id: string | null;
  order_id: string | null;
  reservation_id: string | null;
  table_id: string | null;
  metadata: Record<string, unknown>;
  user_agent: string | null;
  created_at: string;
}

export interface DateRangeBounds {
  preset: DateRangePreset;
  timezone: string;
  startDate: string;
  endDate: string;
  startUtc: string;
  endUtc: string;
  label: string;
}

export interface ItemSalesStat {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface AnalyticsReport {
  range: DateRangeBounds;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  ordersByType: Record<OrderType, number>;
  bestSellingItems: ItemSalesStat[];
  slowMovingItems: ItemSalesStat[];
  newCustomers: number;
  returningCustomers: number;
  reservations: number;
  reservationCancellations: number;
  reservationNoShows: number;
  websiteVisitors: number;
  menuViews: number;
  qrScans: number;
  checkoutStarted: number;
  orderConversionRate: number;
  reservationStarted: number;
  reservationConversionRate: number;
}

export interface RecordAnalyticsEventInput {
  restaurantId: string;
  eventType: AnalyticsEventType;
  sessionId?: string;
  path?: string;
  menuItemId?: string;
  orderId?: string;
  reservationId?: string;
  tableId?: string;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  occurredAt?: string;
}

export interface ClientAnalyticsEventInput {
  restaurantSlug: string;
  eventType: AnalyticsEventType;
  sessionId?: string;
  path?: string;
  menuItemId?: string;
  metadata?: Record<string, string>;
}
