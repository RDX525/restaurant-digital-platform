import { getDemoRestaurantId } from "@/lib/utils";
import { ESTIMATED_PREP_MINUTES, type OrderStatus } from "@/lib/order/constants";
import type {
  CreateOrderInput,
  CustomerDetails,
  OrderLineItem,
  OrderRecord,
  OrderTotals,
  OrderType,
} from "@/lib/order/types";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();
let orderCounter = 1000;
let orders: OrderRecord[] = [];

export function resetDemoOrderStore(): void {
  orders = [];
  orderCounter = 1042;
}

export function loadDemoOrders(records: OrderRecord[]): void {
  orders = structuredClone(records);
  orderCounter = 1042;
}

export function getDemoOrders(): OrderRecord[] {
  return structuredClone(orders);
}

export function countDemoOrdersByTable(tableId: string): number {
  return orders.filter(
    (order) => order.table_id === tableId && order.status !== "cancelled",
  ).length;
}

function nextOrderNumber(): string {
  orderCounter += 1;
  return `ORD-${orderCounter}`;
}

function buildRecord(input: {
  restaurantId: string;
  orderType: OrderType;
  customer: CustomerDetails;
  items: OrderLineItem[];
  totals: OrderTotals;
  idempotencyKey: string;
  tableContext?: CreateOrderInput["tableContext"];
}): OrderRecord {
  const now = new Date();
  const estimatedReadyAt = new Date(now.getTime() + ESTIMATED_PREP_MINUTES * 60 * 1000);

  return {
    id: crypto.randomUUID(),
    order_number: nextOrderNumber(),
    restaurant_id: input.restaurantId,
    location_id: input.tableContext?.locationId ?? null,
    table_id: input.tableContext?.tableId ?? null,
    session_id: input.tableContext?.sessionId ?? null,
    table_label: input.tableContext?.tableLabel ?? null,
    order_type: input.orderType,
    status: "new",
    payment_status: "pending",
    customer: input.customer,
    customer_email: input.customer.email.toLowerCase(),
    items: structuredClone(input.items),
    subtotal: input.totals.subtotal,
    discount_amount: input.totals.discountAmount,
    delivery_fee: input.totals.deliveryFee,
    tax_amount: input.totals.taxAmount,
    total: input.totals.total,
    idempotency_key: input.idempotencyKey,
    cancellation_reason: null,
    cancelled_at: null,
    placed_at: now.toISOString(),
    estimated_ready_at: estimatedReadyAt.toISOString(),
    updated_at: now.toISOString(),
  };
}

export function findDemoOrderByIdempotencyKey(key: string): OrderRecord | null {
  return orders.find((order) => order.idempotency_key === key) ?? null;
}

export function createDemoOrder(
  input: CreateOrderInput & {
    pricedItems: OrderLineItem[];
    totals: OrderTotals;
  },
): OrderRecord {
  if (input.restaurantId !== DEMO_RESTAURANT_ID) {
    throw new Error("Restaurant not found");
  }

  const existing = findDemoOrderByIdempotencyKey(input.idempotencyKey);
  if (existing) return existing;

  const record = buildRecord({
    restaurantId: input.restaurantId,
    orderType: input.orderType,
    customer: input.customer,
    items: input.pricedItems,
    totals: input.totals,
    idempotencyKey: input.idempotencyKey,
    tableContext: input.tableContext,
  });

  orders.unshift(record);
  return record;
}

export function listDemoOrdersForRestaurant(restaurantId: string): OrderRecord[] {
  return orders
    .filter((order) => order.restaurant_id === restaurantId)
    .sort((a, b) => b.placed_at.localeCompare(a.placed_at));
}

export function listDemoOrdersForCustomer(
  email: string,
  restaurantId?: string,
): OrderRecord[] {
  const normalized = email.toLowerCase();
  return orders
    .filter(
      (order) =>
        order.customer_email === normalized &&
        (!restaurantId || order.restaurant_id === restaurantId),
    )
    .sort((a, b) => b.placed_at.localeCompare(a.placed_at));
}

export function getDemoOrderById(restaurantId: string, orderId: string): OrderRecord | null {
  return (
    orders.find(
      (order) => order.id === orderId && order.restaurant_id === restaurantId,
    ) ?? null
  );
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function updateDemoOrderStatus(
  restaurantId: string,
  orderId: string,
  status: OrderStatus,
  cancellationReason?: string,
): OrderRecord | null {
  const order = getDemoOrderById(restaurantId, orderId);
  if (!order) return null;

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(status)) {
    throw new Error(`Cannot transition from ${order.status} to ${status}`);
  }

  order.status = status;
  order.updated_at = new Date().toISOString();

  if (status === "cancelled") {
    order.cancelled_at = order.updated_at;
    order.cancellation_reason = cancellationReason?.trim() || "Cancelled by restaurant";
  }

  return order;
}

export function getDemoOrderByIdGlobal(orderId: string): OrderRecord | null {
  return orders.find((order) => order.id === orderId) ?? null;
}

export function updateDemoOrderPaymentStatus(
  orderId: string,
  paymentStatus: OrderRecord["payment_status"],
): OrderRecord | null {
  const order = getDemoOrderByIdGlobal(orderId);
  if (!order) return null;
  order.payment_status = paymentStatus;
  order.updated_at = new Date().toISOString();
  return order;
}
