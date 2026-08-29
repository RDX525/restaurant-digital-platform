import type { AnalyticsEventRecord } from "@/lib/analytics/types";
import type { CustomerProfile } from "@/lib/customer/types";
import type { AiInsightRecord } from "@/lib/intelligence/types";
import type { OrderRecord } from "@/lib/order/types";
import type { ReservationRecord } from "@/lib/reservation/types";
import {
  DEMO_EMAIL_DOMAIN,
  HARBOUR_KITCHEN_SLUG,
  HARBOUR_LOCATION_ID,
  HARBOUR_RESTAURANT_ID,
  harbourTableId,
} from "./constants";
import { getHarbourMenuItem } from "./menu";

function daysAgo(days: number, hour = 12, minute = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function daysAhead(days: number, hour = 19, minute = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function demoEmail(local: string): string {
  return `${local}@${DEMO_EMAIL_DOMAIN}`;
}

export function buildHarbourKitchenCustomers(): CustomerProfile[] {
  const seeds = [
    { id: "00000000-0000-4000-8000-000000000601", local: "alex.morgan", name: "Alex Morgan", phone: "+64 21 555 0101", orders: 6, spend: 248.5, reservations: 2 },
    { id: "00000000-0000-4000-8000-000000000602", local: "jordan.walsh", name: "Jordan Walsh", phone: "+64 21 555 0102", orders: 4, spend: 162.0, reservations: 1 },
    { id: "00000000-0000-4000-8000-000000000603", local: "sam.taylor", name: "Sam Taylor", phone: "+64 21 555 0103", orders: 3, spend: 98.5, reservations: 3 },
    { id: "00000000-0000-4000-8000-000000000604", local: "riley.chen", name: "Riley Chen", phone: "+64 21 555 0104", orders: 2, spend: 71.0, reservations: 0 },
    { id: "00000000-0000-4000-8000-000000000605", local: "casey.ngata", name: "Casey Ngata", phone: "+64 21 555 0105", orders: 5, spend: 312.0, reservations: 2 },
    { id: "00000000-0000-4000-8000-000000000606", local: "morgan.singh", name: "Morgan Singh", phone: "+64 21 555 0106", orders: 1, spend: 44.0, reservations: 1 },
    { id: "00000000-0000-4000-8000-000000000607", local: "taylor.brown", name: "Taylor Brown", phone: "+64 21 555 0107", orders: 2, spend: 55.5, reservations: 0 },
    { id: "00000000-0000-4000-8000-000000000608", local: "jamie.park", name: "Jamie Park", phone: "+64 21 555 0108", orders: 3, spend: 127.0, reservations: 1 },
  ];

  return seeds.map((seed, index) => {
    const email = demoEmail(seed.local);
    const paidOrders = Math.max(1, seed.orders - 1);
    return {
      id: seed.id,
      restaurant_id: HARBOUR_RESTAURANT_ID,
      email,
      name: seed.name,
      phone: seed.phone,
      address: null,
      first_order_at: daysAgo(28 - index * 2),
      last_order_at: daysAgo(index + 1, 18),
      total_orders: seed.orders,
      paid_order_count: paidOrders,
      total_spend: seed.spend,
      last_reservation_at: seed.reservations > 0 ? daysAgo(index + 3, 19) : null,
      total_reservations: seed.reservations,
      lifecycle_stage: (seed.orders >= 5 ? "regular" : seed.orders >= 2 ? "returning" : "new") as CustomerProfile["lifecycle_stage"],
      metadata: { synthetic: true },
      created_at: daysAgo(30),
      updated_at: daysAgo(index + 1),
    };
  });
}

function lineItem(itemId: string, qty: number, modifierIds: string[] = []) {
  const menuItem = getHarbourMenuItem(itemId);
  if (!menuItem) throw new Error(`Unknown menu item ${itemId}`);
  const modifiers = menuItem.modifier_groups.flatMap((group) =>
    group.modifiers
      .filter((modifier) => modifierIds.includes(modifier.id))
      .map((modifier) => ({
        id: modifier.id,
        groupId: group.id,
        groupName: group.name,
        name: modifier.name,
        price: Number(modifier.price),
      })),
  );
  const modifierTotal = modifiers.reduce((sum, entry) => sum + entry.price, 0);
  const lineTotal = (Number(menuItem.price) + modifierTotal) * qty;
  return {
    menuItemId: itemId,
    name: menuItem.name,
    basePrice: Number(menuItem.price),
    quantity: qty,
    modifiers,
    lineTotal,
  };
}

export function buildHarbourKitchenOrders(): OrderRecord[] {
  const snapper = "00000000-0000-4000-8000-000000000831";
  const lamb = "00000000-0000-4000-8000-000000000835";
  const fishChips = "00000000-0000-4000-8000-000000000821";
  const breakfast = "00000000-0000-4000-8000-000000000811";
  const flatWhite = "00000000-0000-4000-8000-000000000841";
  const burger = "00000000-0000-4000-8000-000000000825";

  const specs = [
    { id: "00000000-0000-4000-8000-000000000701", num: 1042, email: demoEmail("alex.morgan"), name: "Alex Morgan", phone: "+64 21 555 0101", type: "dine_in" as const, status: "completed" as const, payment: "paid" as const, days: 1, table: 5, items: [lineItem(snapper, 1), lineItem(flatWhite, 2)] },
    { id: "00000000-0000-4000-8000-000000000702", num: 1041, email: demoEmail("jordan.walsh"), name: "Jordan Walsh", phone: "+64 21 555 0102", type: "pickup" as const, status: "ready" as const, payment: "paid" as const, days: 2, items: [lineItem(burger, 1, ["00000000-0000-4000-8000-000000000922"])] },
    { id: "00000000-0000-4000-8000-000000000703", num: 1040, email: demoEmail("casey.ngata"), name: "Casey Ngata", phone: "+64 21 555 0105", type: "dine_in" as const, status: "preparing" as const, payment: "paid" as const, days: 0, table: 12, items: [lineItem(lamb, 1, ["00000000-0000-4000-8000-000000000911"])] },
    { id: "00000000-0000-4000-8000-000000000704", num: 1039, email: demoEmail("sam.taylor"), name: "Sam Taylor", phone: "+64 21 555 0103", type: "delivery" as const, status: "accepted" as const, payment: "paid" as const, days: 3, items: [lineItem(fishChips, 2)] },
    { id: "00000000-0000-4000-8000-000000000705", num: 1038, email: demoEmail("jamie.park"), name: "Jamie Park", phone: "+64 21 555 0108", type: "pickup" as const, status: "new" as const, payment: "pending" as const, days: 0, items: [lineItem(breakfast, 1), lineItem(flatWhite, 1)] },
    { id: "00000000-0000-4000-8000-000000000706", num: 1037, email: demoEmail("riley.chen"), name: "Riley Chen", phone: "+64 21 555 0104", type: "dine_in" as const, status: "cancelled" as const, payment: "failed" as const, days: 5, table: 3, items: [lineItem(snapper, 1)] },
  ];

  return specs.map((spec) => {
    const subtotal = spec.items.reduce((sum, entry) => sum + entry.lineTotal, 0);
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const deliveryFee = spec.type === "delivery" ? 6.5 : 0;
    const total = subtotal + tax + deliveryFee;
    const placedAt = daysAgo(spec.days, 12 + (spec.num % 5));
    return {
      id: spec.id,
      order_number: `HK-${spec.num}`,
      restaurant_id: HARBOUR_RESTAURANT_ID,
      location_id: spec.table ? HARBOUR_LOCATION_ID : null,
      table_id: spec.table ? harbourTableId(spec.table) : null,
      session_id: null,
      table_label: spec.table ? `Table ${spec.table}` : null,
      order_type: spec.type,
      status: spec.status,
      payment_status: spec.payment,
      customer: {
        name: spec.name,
        email: spec.email,
        phone: spec.phone,
        orderType: spec.type,
        address: spec.type === "delivery" ? "42 Demo Street, Auckland 1010" : "",
        notes: "",
      },
      customer_email: spec.email,
      items: spec.items,
      subtotal,
      discount_amount: 0,
      delivery_fee: deliveryFee,
      tax_amount: tax,
      total,
      idempotency_key: `seed-order-${spec.num}`,
      cancellation_reason: spec.status === "cancelled" ? "Guest cancelled before prep" : null,
      cancelled_at: spec.status === "cancelled" ? placedAt : null,
      placed_at: placedAt,
      estimated_ready_at: placedAt,
      updated_at: placedAt,
    };
  });
}

export function buildHarbourKitchenReservations(): ReservationRecord[] {
  const guests = [
    { name: "Alex Morgan", email: demoEmail("alex.morgan"), phone: "+64 21 555 0101" },
    { name: "Jordan Walsh", email: demoEmail("jordan.walsh"), phone: "+64 21 555 0102" },
    { name: "Casey Ngata", email: demoEmail("casey.ngata"), phone: "+64 21 555 0105" },
    { name: "Sam Taylor", email: demoEmail("sam.taylor"), phone: "+64 21 555 0103" },
  ];

  type Spec = {
    id: string;
    guest: number;
    count: number;
    time: string;
    status: ReservationRecord["status"];
    ahead?: number;
    ago?: number;
  };

  const specs: Spec[] = [
    { id: "00000000-0000-4000-8000-000000000801", guest: 0, count: 2, ahead: 2, time: "19:00", status: "confirmed" },
    { id: "00000000-0000-4000-8000-000000000802", guest: 1, count: 4, ahead: 3, time: "18:30", status: "pending" },
    { id: "00000000-0000-4000-8000-000000000803", guest: 2, count: 6, ahead: 5, time: "20:00", status: "confirmed" },
    { id: "00000000-0000-4000-8000-000000000804", guest: 3, count: 2, ago: 4, time: "19:30", status: "completed" },
    { id: "00000000-0000-4000-8000-000000000805", guest: 0, count: 3, ago: 10, time: "12:30", status: "cancelled" },
  ];

  return specs.map((spec) => {
    const guest = guests[spec.guest]!;
    const isPast = spec.ago != null;
    const dateIso = isPast
      ? daysAgo(spec.ago!, 0).slice(0, 10)
      : daysAhead(spec.ahead!, 0).slice(0, 10);
    const createdAt = isPast ? daysAgo(spec.ago! + 2) : daysAgo(1);
    return {
      id: spec.id,
      restaurant_id: HARBOUR_RESTAURANT_ID,
      status: spec.status,
      guest_name: guest.name,
      guest_email: guest.email,
      guest_phone: guest.phone,
      guest_count: spec.count,
      reservation_date: dateIso,
      reservation_time: spec.time,
      timezone: "Pacific/Auckland",
      special_request: spec.count >= 6 ? "Window table if possible (demo request)" : null,
      confirmed_at: spec.status === "confirmed" || spec.status === "completed" ? createdAt : null,
      cancelled_at: spec.status === "cancelled" ? createdAt : null,
      cancellation_reason: spec.status === "cancelled" ? "Plans changed" : null,
      rescheduled_at: null,
      previous_date: null,
      previous_time: null,
      notifications: [],
      created_at: createdAt,
      updated_at: createdAt,
    };
  });
}

export function buildHarbourKitchenAnalyticsEvents(): AnalyticsEventRecord[] {
  const paths = ["/", "/menu", "/order", "/reservations", "/gallery"];
  const types: AnalyticsEventRecord["event_type"][] = [
    "WEBSITE_VISIT",
    "MENU_VIEW",
    "ADD_TO_CART",
    "CHECKOUT_STARTED",
    "ORDER_COMPLETED",
    "RESERVATION_STARTED",
    "QR_SCAN",
  ];

  return Array.from({ length: 24 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(750 + index).padStart(12, "0")}`,
    restaurant_id: HARBOUR_RESTAURANT_ID,
    event_type: types[index % types.length]!,
    occurred_at: daysAgo(index % 14, 8 + (index % 10)),
    session_id: `demo-session-${index % 6}`,
    path: paths[index % paths.length] ?? "/",
    menu_item_id: index % 3 === 0 ? "00000000-0000-4000-8000-000000000831" : null,
    order_id: index === 10 ? "00000000-0000-4000-8000-000000000701" : null,
    reservation_id: index === 12 ? "00000000-0000-4000-8000-000000000801" : null,
    table_id: index === 6 ? harbourTableId(5) : null,
    metadata: { synthetic: true, slug: HARBOUR_KITCHEN_SLUG },
    user_agent: "HarbourKitchenDemo/1.0",
    created_at: daysAgo(index % 14),
  }));
}

export function buildHarbourKitchenInsights(): AiInsightRecord[] {
  return [
    {
      id: "00000000-0000-4000-8000-000000000751",
      restaurant_id: HARBOUR_RESTAURANT_ID,
      insight_type: "daily_brief",
      source_metrics: { revenue: 1248.5, paid_orders: 18, reservations: 12, synthetic: true },
      generated_text:
        "Harbour Kitchen had a strong week on the waterfront. Dinner service drove 62% of paid revenue, with Pan-Seared Snapper and Lamb Rack as top sellers. (Synthetic demo insight.)",
      created_at: daysAgo(1),
    },
    {
      id: "00000000-0000-4000-8000-000000000752",
      restaurant_id: HARBOUR_RESTAURANT_ID,
      insight_type: "menu_insight",
      source_metrics: { top_item: "Pan-Seared Snapper", orders: 42, synthetic: true },
      generated_text:
        "Snapper remains your hero dish — 42 orders in 30 days. Promote a lunch-to-dinner upsell in the QR menu. (Synthetic demo insight.)",
      created_at: daysAgo(3),
    },
    {
      id: "00000000-0000-4000-8000-000000000753",
      restaurant_id: HARBOUR_RESTAURANT_ID,
      insight_type: "recommendation",
      source_metrics: { peak_day: "Saturday", avg_covers: 3.8, synthetic: true },
      generated_text:
        "Saturday 6–8pm slots fill first. Tables 10–14 see the highest QR scan volume. (Synthetic demo insight.)",
      created_at: daysAgo(5),
    },
  ];
}

export function buildHarbourKitchenQrScans() {
  return [5, 7, 12, 3, 8].map((tableNum, index) => ({
    restaurant_id: HARBOUR_RESTAURANT_ID,
    table_id: harbourTableId(tableNum),
    scanned_at: daysAgo(index + 1, 13),
  }));
}
