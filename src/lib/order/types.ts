import type { OrderStatus, PaymentStatus } from "./constants";

export type OrderType = "pickup" | "delivery" | "dine_in";

export interface CartModifier {
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  price: number;
}

export interface CartLineItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  modifiers: CartModifier[];
  specialInstructions?: string;
  lineTotal: number;
}

export interface CartState {
  restaurantSlug: string;
  items: CartLineItem[];
  updatedAt: string;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  orderType: OrderType;
  address: string;
  notes: string;
}

export interface PaymentDetails {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

export interface OrderLineItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  modifiers: CartModifier[];
  specialInstructions?: string;
  lineTotal: number;
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  restaurantSlug: string;
  restaurantName: string;
  items: OrderLineItem[];
  customer: CustomerDetails;
  totals: OrderTotals;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  placedAt: string;
  estimatedReadyAt: string;
  tableLabel?: string;
  paymentSessionId?: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  restaurant_id: string;
  location_id: string | null;
  table_id: string | null;
  session_id: string | null;
  table_label: string | null;
  order_type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  customer: CustomerDetails;
  customer_email: string;
  items: OrderLineItem[];
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  tax_amount: number;
  total: number;
  idempotency_key: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  placed_at: string;
  estimated_ready_at: string | null;
  updated_at: string;
}

export interface CreateOrderInput {
  idempotencyKey: string;
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  orderType: OrderType;
  customer: CustomerDetails;
  items: OrderLineItemInput[];
  tableContext?: {
    locationId: string;
    tableId: string;
    sessionId: string;
    tableLabel: string;
  };
}

export interface OrderLineItemInput {
  menuItemId: string;
  quantity: number;
  modifierIds: string[];
  specialInstructions?: string;
}

export type CheckoutStep = "cart" | "details" | "payment" | "confirmation";
