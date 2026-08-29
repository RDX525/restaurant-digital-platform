import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId, ensureDemoStoresSeeded } from "@/lib/restaurant/demo-data";
import { loadPublicMenuForRestaurant } from "@/lib/menu/data";
import { loadRestaurantBySlug } from "@/lib/restaurant/data";
import { validateTableSession } from "@/lib/table/data";
import { ESTIMATED_PREP_MINUTES, STATUS_TRANSITIONS, type OrderStatus } from "@/lib/order/constants";
import { DASHBOARD_ORDERS_LIMIT } from "@/lib/constants/pagination";
import {
  createDemoOrder,
  findDemoOrderByIdempotencyKey,
  getDemoOrderById,
  listDemoOrdersForCustomer,
  listDemoOrdersForRestaurant,
  updateDemoOrderStatus,
} from "@/lib/order/demo-store";
import { OrderValidationError, calculateOrderTotals, validateOrderAgainstMenu } from "@/lib/order/pricing";
import {
  syncCustomerFromOrder,
  syncCustomerFromOrderPayment,
} from "@/lib/customer/data";
import {
  notifyOrderReceived,
  notifyOrderStatusChange,
} from "@/lib/notification/dispatch";
import { recordAnalyticsEvent } from "@/lib/analytics/data";
import { loadRestaurantById } from "@/lib/restaurant/data";
import type {
  CreateOrderInput,
  OrderRecord,
  PlacedOrder,
} from "@/lib/order/types";

function shouldUseDemoStore(restaurantId: string): boolean {
  return isDemoRestaurantId(restaurantId) && !isSupabaseConfigured();
}

function toPlacedOrder(record: OrderRecord, restaurantSlug: string, restaurantName: string): PlacedOrder {
  return {
    id: record.id,
    orderNumber: record.order_number,
    restaurantSlug,
    restaurantName,
    items: record.items,
    customer: record.customer,
    totals: {
      subtotal: record.subtotal,
      discountAmount: record.discount_amount,
      deliveryFee: record.delivery_fee,
      taxAmount: record.tax_amount,
      total: record.total,
      itemCount: record.items.reduce((sum, item) => sum + item.quantity, 0),
    },
    status: record.status,
    paymentStatus: record.payment_status,
    placedAt: record.placed_at,
    estimatedReadyAt: record.estimated_ready_at ?? record.placed_at,
    tableLabel: record.table_label ?? undefined,
  };
}

export async function createOrder(
  input: CreateOrderInput,
  sessionToken?: string | null,
): Promise<PlacedOrder> {
  const restaurant = await loadRestaurantBySlug(input.restaurantSlug);
  if (!restaurant || restaurant.id !== input.restaurantId) {
    throw new OrderValidationError("Restaurant not found.");
  }

  const menu = await loadPublicMenuForRestaurant(restaurant.id);
  if (!menu) {
    throw new OrderValidationError("No active menu available for ordering.");
  }

  const pricedLines = validateOrderAgainstMenu(menu, restaurant.id, input.items);
  const totals = calculateOrderTotals(pricedLines, input.orderType);

  let tableContext = input.tableContext;

  if (input.orderType === "dine_in") {
    if (!sessionToken) {
      throw new OrderValidationError("No active table session. Scan the table QR code.");
    }
    const session = await validateTableSession(sessionToken);
    if (!session) {
      throw new OrderValidationError("Table session expired. Scan the QR code again.");
    }
    if (session.restaurant_id !== restaurant.id) {
      throw new OrderValidationError("Table session does not match this restaurant.");
    }
    tableContext = {
      locationId: session.location.id,
      tableId: session.table.id,
      sessionId: session.session.id,
      tableLabel: session.table_label,
    };
  } else if (input.orderType === "delivery" && !input.customer.address.trim()) {
    throw new OrderValidationError("Delivery address is required.");
  }

  if (shouldUseDemoStore(restaurant.id)) {
    const existing = findDemoOrderByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return toPlacedOrder(existing, restaurant.slug, restaurant.name);
    }

    const record = createDemoOrder({
      ...input,
      pricedItems: pricedLines,
      totals,
      tableContext,
    });
    await syncCustomerFromOrder({
      restaurantId: restaurant.id,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        address: input.customer.address || undefined,
      },
      placedAt: record.placed_at,
    });
    await notifyOrderReceived(record, restaurant.name);
    return toPlacedOrder(record, restaurant.slug, restaurant.name);
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("restaurant_orders")
    .select("*")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    return mapDbOrder(existing, restaurant.slug, restaurant.name);
  }

  const now = new Date();
  const estimatedReadyAt = new Date(now.getTime() + ESTIMATED_PREP_MINUTES * 60 * 1000);
  const orderNumber = `ORD-${now.getTime().toString(36).toUpperCase()}`;

  const { data, error } = await supabase
    .from("restaurant_orders")
    .insert({
      restaurant_id: restaurant.id,
      location_id: tableContext?.locationId ?? null,
      table_id: tableContext?.tableId ?? null,
      session_id: tableContext?.sessionId ?? null,
      table_label: tableContext?.tableLabel ?? null,
      order_type: input.orderType,
      status: "new",
      payment_status: "pending",
      customer: input.customer,
      customer_email: input.customer.email.toLowerCase(),
      items: pricedLines,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      delivery_fee: totals.deliveryFee,
      tax_amount: totals.taxAmount,
      total: totals.total,
      totals,
      idempotency_key: input.idempotencyKey,
      order_number: orderNumber,
      placed_at: now.toISOString(),
      estimated_ready_at: estimatedReadyAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: duplicate } = await supabase
        .from("restaurant_orders")
        .select("*")
        .eq("idempotency_key", input.idempotencyKey)
        .single();
      if (duplicate) return mapDbOrder(duplicate, restaurant.slug, restaurant.name);
    }
    throw error;
  }

  await syncCustomerFromOrder({
    restaurantId: restaurant.id,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      address: input.customer.address || undefined,
    },
    placedAt: data.placed_at as string,
  });

  const orderRecord = mapDbRow(data);
  await notifyOrderReceived(orderRecord, restaurant.name);

  return mapDbOrder(data, restaurant.slug, restaurant.name);
}

export async function listOrdersForRestaurant(
  restaurantId: string,
  options?: { limit?: number; placedFromUtc?: string; placedBeforeUtc?: string },
): Promise<OrderRecord[]> {
  if (shouldUseDemoStore(restaurantId)) {
    ensureDemoStoresSeeded();
    let orders = listDemoOrdersForRestaurant(restaurantId);
    if (options?.placedFromUtc) {
      orders = orders.filter(
        (order) => new Date(order.placed_at).getTime() >= new Date(options.placedFromUtc!).getTime(),
      );
    }
    if (options?.placedBeforeUtc) {
      orders = orders.filter(
        (order) => new Date(order.placed_at).getTime() < new Date(options.placedBeforeUtc!).getTime(),
      );
    }
    return orders.slice(0, options?.limit ?? DASHBOARD_ORDERS_LIMIT);
  }

  const supabase = await createClient();
  let query = supabase
    .from("restaurant_orders")
    .select("*")
    .eq("restaurant_id", restaurantId);

  if (options?.placedFromUtc) {
    query = query.gte("placed_at", options.placedFromUtc);
  }
  if (options?.placedBeforeUtc) {
    query = query.lt("placed_at", options.placedBeforeUtc);
  }

  query = query.order("placed_at", { ascending: false }).limit(options?.limit ?? DASHBOARD_ORDERS_LIMIT);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(mapDbRow);
}

export async function listOrdersForCustomer(
  email: string,
  restaurantSlug?: string,
): Promise<PlacedOrder[]> {
  let restaurantId: string | undefined;
  let restaurantName = "Restaurant";

  if (restaurantSlug) {
    const restaurant = await loadRestaurantBySlug(restaurantSlug);
    if (!restaurant) return [];
    restaurantId = restaurant.id;
    restaurantName = restaurant.name;
  }

  if (restaurantId && shouldUseDemoStore(restaurantId)) {
    return listDemoOrdersForCustomer(email, restaurantId).map((record) =>
      toPlacedOrder(record, restaurantSlug!, restaurantName),
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("restaurant_orders")
    .select("*, restaurants(slug, name)")
    .eq("customer_email", email.toLowerCase())
    .order("placed_at", { ascending: false });

  if (restaurantId) {
    query = query.eq("restaurant_id", restaurantId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const restaurant = Array.isArray(row.restaurants) ? row.restaurants[0] : row.restaurants;
    return mapDbOrder(row, restaurant?.slug ?? restaurantSlug ?? "", restaurant?.name ?? restaurantName);
  });
}

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: OrderStatus,
  cancellationReason?: string,
): Promise<OrderRecord | null> {
  if (shouldUseDemoStore(restaurantId)) {
    const record = updateDemoOrderStatus(restaurantId, orderId, status, cancellationReason);
    if (record) {
      const restaurant = await loadRestaurantById(restaurantId);
      await notifyOrderStatusChange(
        record,
        status,
        restaurant?.name ?? "Restaurant",
        cancellationReason,
      );
    }
    return record;
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("restaurant_orders")
    .select("*")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!current) return null;

  const allowed = STATUS_TRANSITIONS[current.status as keyof typeof STATUS_TRANSITIONS];
  if (!allowed?.includes(status)) {
    throw new Error(`Cannot transition from ${current.status} to ${status}`);
  }

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "cancelled") {
    patch.cancelled_at = patch.updated_at;
    patch.cancellation_reason = cancellationReason?.trim() || "Cancelled by restaurant";
  }

  const { data, error } = await supabase
    .from("restaurant_orders")
    .update(patch)
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) throw error;
  const record = mapDbRow(data);
  const restaurant = await loadRestaurantById(restaurantId);
  await notifyOrderStatusChange(
    record,
    status,
    restaurant?.name ?? "Restaurant",
    cancellationReason,
  );
  return record;
}

function mapDbRow(row: Record<string, unknown>): OrderRecord {
  return {
    id: row.id as string,
    order_number: (row.order_number as string) ?? `ORD-${(row.id as string).slice(0, 8)}`,
    restaurant_id: row.restaurant_id as string,
    location_id: (row.location_id as string) ?? null,
    table_id: (row.table_id as string) ?? null,
    session_id: (row.session_id as string) ?? null,
    table_label: (row.table_label as string) ?? null,
    order_type: row.order_type as OrderRecord["order_type"],
    status: row.status as OrderRecord["status"],
    payment_status: row.payment_status as OrderRecord["payment_status"],
    customer: row.customer as OrderRecord["customer"],
    customer_email: (row.customer_email as string) ?? "",
    items: row.items as OrderRecord["items"],
    subtotal: Number(row.subtotal ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    delivery_fee: Number(row.delivery_fee ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    total: Number(row.total ?? 0),
    idempotency_key: (row.idempotency_key as string) ?? null,
    cancellation_reason: (row.cancellation_reason as string) ?? null,
    cancelled_at: (row.cancelled_at as string) ?? null,
    placed_at: row.placed_at as string,
    estimated_ready_at: (row.estimated_ready_at as string) ?? null,
    updated_at: (row.updated_at as string) ?? (row.placed_at as string),
  };
}

function mapDbOrder(
  row: Record<string, unknown>,
  restaurantSlug: string,
  restaurantName: string,
): PlacedOrder {
  return toPlacedOrder(mapDbRow(row), restaurantSlug, restaurantName);
}

export function recordToPlacedOrder(
  record: OrderRecord,
  restaurantSlug: string,
  restaurantName: string,
): PlacedOrder {
  return toPlacedOrder(record, restaurantSlug, restaurantName);
}

export async function getOrderForRestaurant(
  restaurantId: string,
  orderId: string,
): Promise<OrderRecord | null> {
  if (shouldUseDemoStore(restaurantId)) {
    return getDemoOrderById(restaurantId, orderId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_orders")
    .select("*")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  return data ? mapDbRow(data) : null;
}

export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  if (!isSupabaseConfigured()) {
    const { getDemoOrderByIdGlobal } = await import("@/lib/order/demo-store");
    return getDemoOrderByIdGlobal(orderId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (data) return mapDbRow(data);

  const { getDemoOrderByIdGlobal } = await import("@/lib/order/demo-store");
  return getDemoOrderByIdGlobal(orderId);
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: OrderRecord["payment_status"],
): Promise<OrderRecord | null> {
  const existing = await getOrderById(orderId);
  if (!existing) return null;

  if (!isSupabaseConfigured()) {
    const { updateDemoOrderPaymentStatus } = await import("@/lib/order/demo-store");
    const updated = updateDemoOrderPaymentStatus(orderId, paymentStatus);
    if (updated && updated.payment_status !== existing.payment_status) {
      await syncCustomerFromOrderPayment({
        restaurantId: updated.restaurant_id,
        email: updated.customer_email,
        previousStatus: existing.payment_status,
        nextStatus: updated.payment_status,
        orderTotal: updated.total,
      });

      if (updated.payment_status === "paid") {
        await recordAnalyticsEvent({
          restaurantId: updated.restaurant_id,
          eventType: "ORDER_COMPLETED",
          orderId: updated.id,
          metadata: {
            orderNumber: updated.order_number,
            total: String(updated.total),
          },
        });
      }
    }
    return updated;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_orders")
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw error;
  const updated = data ? mapDbRow(data) : null;

  if (updated && updated.payment_status !== existing.payment_status) {
    await syncCustomerFromOrderPayment({
      restaurantId: updated.restaurant_id,
      email: updated.customer_email,
      previousStatus: existing.payment_status,
      nextStatus: updated.payment_status,
      orderTotal: updated.total,
    });

    if (updated.payment_status === "paid") {
      await recordAnalyticsEvent({
        restaurantId: updated.restaurant_id,
        eventType: "ORDER_COMPLETED",
        orderId: updated.id,
        metadata: {
          orderNumber: updated.order_number,
          total: String(updated.total),
        },
      });
    }
  }

  return updated;
}
