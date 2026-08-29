import { getDemoRestaurantId } from "@/lib/utils";
import type { AnalyticsEventRecord, RecordAnalyticsEventInput } from "./types";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();
let events: AnalyticsEventRecord[] = [];

export function resetDemoAnalyticsStore(): void {
  events = [];
}

export function loadDemoAnalyticsEvents(records: AnalyticsEventRecord[]): void {
  events = structuredClone(records);
}

export function getDemoAnalyticsEvents(): AnalyticsEventRecord[] {
  return structuredClone(events);
}

export function recordDemoAnalyticsEvent(input: RecordAnalyticsEventInput): AnalyticsEventRecord {
  if (input.restaurantId !== DEMO_RESTAURANT_ID) {
    throw new Error("Restaurant not found");
  }

  const now = new Date().toISOString();
  const record: AnalyticsEventRecord = {
    id: crypto.randomUUID(),
    restaurant_id: input.restaurantId,
    event_type: input.eventType,
    occurred_at: input.occurredAt ?? now,
    session_id: input.sessionId ?? null,
    path: input.path ?? null,
    menu_item_id: input.menuItemId ?? null,
    order_id: input.orderId ?? null,
    reservation_id: input.reservationId ?? null,
    table_id: input.tableId ?? null,
    metadata: input.metadata ?? {},
    user_agent: input.userAgent ?? null,
    created_at: now,
  };

  events.unshift(record);
  return structuredClone(record);
}

export function listDemoAnalyticsEventsForRestaurant(
  restaurantId: string,
): AnalyticsEventRecord[] {
  if (restaurantId !== DEMO_RESTAURANT_ID) return [];
  return events.filter((event) => event.restaurant_id === restaurantId);
}
