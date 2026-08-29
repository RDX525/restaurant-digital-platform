import type { DateRangePreset } from "@/lib/analytics/constants";
import { resolveDateRange } from "@/lib/analytics/date-range";
import { buildAnalyticsReport } from "@/lib/analytics/reports";
import type { OrderRecord } from "@/lib/order/types";
import type { ReservationRecord } from "@/lib/reservation/types";
import type { CustomerProfile } from "@/lib/customer/types";
import {
  formatDateInTimezone,
  getWeekdayInTimezone,
  addDaysToDateIso,
} from "@/lib/reservation/timezone";
import {
  DEFAULT_SLOW_ITEMS_LIMIT,
  DEFAULT_TOP_ITEMS_LIMIT,
  MAX_INACTIVE_CUSTOMER_SAMPLES,
  TREND_LOOKBACK_WEEKS,
} from "../constants";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function isPaidOrder(order: OrderRecord): boolean {
  return order.payment_status === "paid";
}

export function filterPaidOrders(orders: OrderRecord[]): OrderRecord[] {
  return orders.filter(isPaidOrder);
}

export function buildReportForPreset(input: {
  orders: OrderRecord[];
  reservations: ReservationRecord[];
  timezone: string;
  preset: DateRangePreset;
  from?: string;
  to?: string;
  now?: Date;
}) {
  const range = resolveDateRange(
    input.preset,
    input.timezone,
    input.from,
    input.to,
    input.now,
  );

  return buildAnalyticsReport({
    orders: input.orders,
    reservations: input.reservations,
    events: [],
    qrScans: [],
    range,
  });
}

export function computeInactiveCustomers(input: {
  orders: OrderRecord[];
  customers: CustomerProfile[];
  now?: Date;
}): {
  inactiveCount: number;
  samples: Array<{
    email: string;
    name: string;
    daysSinceLastOrder: number;
    typicalIntervalDays: number;
  }>;
} {
  const now = input.now ?? new Date();
  const paidOrders = filterPaidOrders(input.orders);
  const ordersByEmail = new Map<string, string[]>();

  for (const order of paidOrders) {
    const email = order.customer_email.toLowerCase();
    const dates = ordersByEmail.get(email) ?? [];
    dates.push(order.placed_at);
    ordersByEmail.set(email, dates);
  }

  const inactive: Array<{
    email: string;
    name: string;
    daysSinceLastOrder: number;
    typicalIntervalDays: number;
  }> = [];

  for (const customer of input.customers) {
    const email = customer.email.toLowerCase();
    const dates = (ordersByEmail.get(email) ?? []).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    if (dates.length < 2 || !customer.last_order_at) continue;

    const gaps: number[] = [];
    for (let index = 1; index < dates.length; index += 1) {
      const gapMs = new Date(dates[index]).getTime() - new Date(dates[index - 1]).getTime();
      gaps.push(Math.max(1, Math.round(gapMs / 86_400_000)));
    }

    const typicalIntervalDays = Math.max(
      1,
      Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length),
    );

    const daysSinceLastOrder = Math.max(
      0,
      Math.round((now.getTime() - new Date(customer.last_order_at).getTime()) / 86_400_000),
    );

    if (daysSinceLastOrder > typicalIntervalDays) {
      inactive.push({
        email: customer.email,
        name: customer.name,
        daysSinceLastOrder,
        typicalIntervalDays,
      });
    }
  }

  return {
    inactiveCount: inactive.length,
    samples: inactive.slice(0, MAX_INACTIVE_CUSTOMER_SAMPLES),
  };
}

export function computeSalesTrends(input: {
  orders: OrderRecord[];
  timezone: string;
  weeks?: number;
  now?: Date;
}): Record<string, unknown> {
  const now = input.now ?? new Date();
  const weeks = input.weeks ?? TREND_LOOKBACK_WEEKS;
  const paidOrders = filterPaidOrders(input.orders);
  const today = formatDateInTimezone(now, input.timezone);
  const startDate = addDaysToDateIso(today, -(weeks * 7 - 1));
  const range = resolveDateRange("custom", input.timezone, startDate, today, now);
  const inRange = paidOrders.filter(
    (order) =>
      new Date(order.placed_at).getTime() >= new Date(range.startUtc).getTime() &&
      new Date(order.placed_at).getTime() < new Date(range.endUtc).getTime(),
  );

  const dailyRevenue = new Map<string, number>();
  const weekdayRevenue = new Map<string, { total: number; count: number }>();

  for (const order of inRange) {
    const date = formatDateInTimezone(new Date(order.placed_at), input.timezone);
    dailyRevenue.set(date, roundMoney((dailyRevenue.get(date) ?? 0) + order.total));

    const weekday = getWeekdayInTimezone(date, input.timezone);
    const bucket = weekdayRevenue.get(weekday) ?? { total: 0, count: 0 };
    bucket.total = roundMoney(bucket.total + order.total);
    bucket.count += 1;
    weekdayRevenue.set(weekday, bucket);
  }

  const weekdayAverages = Object.fromEntries(
    Array.from(weekdayRevenue.entries()).map(([weekday, bucket]) => [
      weekday,
      bucket.count > 0 ? roundMoney(bucket.total / bucket.count) : 0,
    ]),
  );

  const yesterdayRange = resolveDateRange("yesterday", input.timezone, undefined, undefined, now);
  const yesterdayOrders = paidOrders.filter(
    (order) =>
      new Date(order.placed_at).getTime() >= new Date(yesterdayRange.startUtc).getTime() &&
      new Date(order.placed_at).getTime() < new Date(yesterdayRange.endUtc).getTime(),
  );
  const yesterdayRevenue = roundMoney(
    yesterdayOrders.reduce((sum, order) => sum + order.total, 0),
  );
  const yesterdayWeekday = getWeekdayInTimezone(yesterdayRange.startDate, input.timezone);
  const recentSameWeekdayAverage = weekdayAverages[yesterdayWeekday] ?? 0;
  const yesterdayDeltaPercent =
    recentSameWeekdayAverage > 0
      ? roundPercent(((yesterdayRevenue - recentSameWeekdayAverage) / recentSameWeekdayAverage) * 100)
      : 0;

  let weakestDay = "";
  let weakestRevenue = Number.POSITIVE_INFINITY;
  for (const [date, revenue] of dailyRevenue.entries()) {
    if (revenue < weakestRevenue) {
      weakestRevenue = revenue;
      weakestDay = date;
    }
  }

  const dinnerOrders = inRange.filter((order) => {
    const hour = new Date(order.placed_at).getUTCHours();
    return hour >= 17 || hour <= 22;
  });
  const dinnerRevenue = roundMoney(dinnerOrders.reduce((sum, order) => sum + order.total, 0));
  const dinnerAverage =
    dinnerOrders.length > 0 ? roundMoney(dinnerRevenue / dinnerOrders.length) : 0;

  return {
    range: {
      label: range.label,
      startDate: range.startDate,
      endDate: range.endDate,
      timezone: range.timezone,
    },
    dailyRevenue: Object.fromEntries(dailyRevenue.entries()),
    weekdayAverages,
    yesterday: {
      date: yesterdayRange.startDate,
      weekday: yesterdayWeekday,
      revenue: yesterdayRevenue,
      orders: yesterdayOrders.length,
      recentSameWeekdayAverage,
      deltaPercent: yesterdayDeltaPercent,
    },
    weakestDay: weakestDay
      ? {
          date: weakestDay,
          revenue: dailyRevenue.get(weakestDay) ?? 0,
        }
      : null,
    dinner: {
      averageOrderRevenue: dinnerAverage,
      orders: dinnerOrders.length,
    },
  };
}

export function getTopItemsLimit(limit?: number): number {
  return limit ?? DEFAULT_TOP_ITEMS_LIMIT;
}

export function getSlowItemsLimit(limit?: number): number {
  return limit ?? DEFAULT_SLOW_ITEMS_LIMIT;
}
