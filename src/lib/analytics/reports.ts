import type { OrderRecord } from "@/lib/order/types";
import type { ReservationRecord } from "@/lib/reservation/types";
import {
  BEST_SELLING_ITEM_LIMIT,
  SLOW_MOVING_ITEM_LIMIT,
  type AnalyticsEventType,
} from "./constants";
import { isWithinRange } from "./date-range";
import type {
  AnalyticsEventRecord,
  AnalyticsReport,
  DateRangeBounds,
  ItemSalesStat,
} from "./types";

export interface QrScanRecord {
  restaurant_id: string;
  table_id: string;
  scanned_at: string;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function isPaidOrder(order: OrderRecord): boolean {
  return order.payment_status === "paid";
}

function filterPaidOrdersInRange(orders: OrderRecord[], range: DateRangeBounds): OrderRecord[] {
  return orders.filter(
    (order) => isPaidOrder(order) && isWithinRange(order.placed_at, range),
  );
}

function aggregateItemSales(orders: OrderRecord[]): ItemSalesStat[] {
  const map = new Map<string, ItemSalesStat>();

  for (const order of orders) {
    for (const item of order.items) {
      const existing = map.get(item.menuItemId) ?? {
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.lineTotal;
      map.set(item.menuItemId, existing);
    }
  }

  return Array.from(map.values()).map((item) => ({
    ...item,
    revenue: roundMoney(item.revenue),
  }));
}

function countUniqueSessions(
  events: AnalyticsEventRecord[],
  eventType: AnalyticsEventType,
  range: DateRangeBounds,
): number {
  const sessions = new Set<string>();

  for (const event of events) {
    if (event.event_type !== eventType || !isWithinRange(event.occurred_at, range)) continue;
    sessions.add(event.session_id ?? event.id);
  }

  return sessions.size;
}

function countEvents(
  events: AnalyticsEventRecord[],
  eventType: AnalyticsEventType,
  range: DateRangeBounds,
): number {
  return events.filter(
    (event) => event.event_type === eventType && isWithinRange(event.occurred_at, range),
  ).length;
}

export function computeCustomerSegments(input: {
  orders: OrderRecord[];
  range: DateRangeBounds;
}): { newCustomers: number; returningCustomers: number } {
  const paidOrders = input.orders.filter(isPaidOrder);
  const inRange = paidOrders.filter((order) => isWithinRange(order.placed_at, input.range));
  const seenInRange = new Set<string>();
  let newCustomers = 0;
  let returningCustomers = 0;

  for (const order of inRange) {
    const email = order.customer_email.toLowerCase();
    if (seenInRange.has(email)) continue;
    seenInRange.add(email);

    const hadPriorPaidOrder = paidOrders.some(
      (prior) =>
        prior.customer_email.toLowerCase() === email &&
        new Date(prior.placed_at).getTime() < new Date(input.range.startUtc).getTime(),
    );

    if (hadPriorPaidOrder) returningCustomers += 1;
    else newCustomers += 1;
  }

  return { newCustomers, returningCustomers };
}

export function buildAnalyticsReport(input: {
  orders: OrderRecord[];
  reservations: ReservationRecord[];
  events: AnalyticsEventRecord[];
  qrScans: QrScanRecord[];
  range: DateRangeBounds;
}): AnalyticsReport {
  const paidOrders = filterPaidOrdersInRange(input.orders, input.range);
  const revenue = roundMoney(paidOrders.reduce((sum, order) => sum + order.total, 0));
  const orderCount = paidOrders.length;
  const averageOrderValue = orderCount > 0 ? roundMoney(revenue / orderCount) : 0;

  const ordersByType = {
    pickup: 0,
    delivery: 0,
    dine_in: 0,
  } as AnalyticsReport["ordersByType"];

  for (const order of paidOrders) {
    ordersByType[order.order_type] += 1;
  }

  const itemSales = aggregateItemSales(paidOrders);
  const bestSellingItems = [...itemSales]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, BEST_SELLING_ITEM_LIMIT);

  const slowMovingItems = [...itemSales]
    .sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue)
    .slice(0, SLOW_MOVING_ITEM_LIMIT);

  const reservationsInRange = input.reservations.filter((reservation) =>
    isWithinRange(reservation.created_at, input.range),
  );

  const reservationCancellations = input.reservations.filter(
    (reservation) =>
      reservation.status === "cancelled" &&
      reservation.cancelled_at &&
      isWithinRange(reservation.cancelled_at, input.range),
  ).length;

  const reservationNoShows = input.reservations.filter(
    (reservation) =>
      reservation.status === "no_show" &&
      isWithinRange(reservation.updated_at, input.range),
  ).length;

  const qrScansFromTable = input.qrScans.filter((scan) =>
    isWithinRange(scan.scanned_at, input.range),
  ).length;

  const qrScansFromEvents = countEvents(input.events, "QR_SCAN", input.range);
  const qrScans = qrScansFromTable + qrScansFromEvents;

  const websiteVisitors = countUniqueSessions(input.events, "WEBSITE_VISIT", input.range);
  const menuViews = countEvents(input.events, "MENU_VIEW", input.range);
  const checkoutStarted = countEvents(input.events, "CHECKOUT_STARTED", input.range);
  const reservationStarted = countEvents(input.events, "RESERVATION_STARTED", input.range);
  const reservationCompleted = countEvents(input.events, "RESERVATION_COMPLETED", input.range);

  const orderConversionRate =
    checkoutStarted > 0 ? roundMoney((orderCount / checkoutStarted) * 100) : 0;
  const reservationConversionRate =
    reservationStarted > 0
      ? roundMoney((reservationCompleted / reservationStarted) * 100)
      : 0;

  const { newCustomers, returningCustomers } = computeCustomerSegments({
    orders: input.orders,
    range: input.range,
  });

  return {
    range: input.range,
    revenue,
    orders: orderCount,
    averageOrderValue,
    ordersByType,
    bestSellingItems,
    slowMovingItems,
    newCustomers,
    returningCustomers,
    reservations: reservationsInRange.length,
    reservationCancellations,
    reservationNoShows,
    websiteVisitors,
    menuViews,
    qrScans,
    checkoutStarted,
    orderConversionRate,
    reservationStarted,
    reservationConversionRate,
  };
}
