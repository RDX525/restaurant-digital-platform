import type { OrderRecord } from "@/lib/order/types";
import type { OrderStatus } from "@/lib/order/constants";
import type { ReservationRecord } from "@/lib/reservation/types";
import type { ReservationAction } from "@/lib/reservation/demo-store";
import type { NotificationType } from "./constants";
import { sendTransactionalNotification } from "./service";

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function orderTypeLabel(orderType: OrderRecord["order_type"]): string {
  if (orderType === "dine_in") return "dine-in";
  return orderType;
}

export async function notifyOrderEvent(
  order: OrderRecord,
  notificationType: NotificationType,
  restaurantName: string,
  extra: Record<string, string> = {},
): Promise<void> {
  await sendTransactionalNotification({
    restaurantId: order.restaurant_id,
    entityType: "order",
    entityId: order.id,
    notificationType,
    recipientEmail: order.customer_email,
    recipientPhone: order.customer.phone,
    customerEmail: order.customer_email,
    templateVariables: {
      customerName: order.customer.name,
      orderNumber: order.order_number,
      orderTotal: formatMoney(order.total),
      orderType: orderTypeLabel(order.order_type),
      restaurantName,
      reason: extra.reason ?? "Not specified",
      ...extra,
    },
  });
}

const ORDER_STATUS_TO_NOTIFICATION: Partial<Record<OrderStatus, NotificationType>> = {
  accepted: "ORDER_ACCEPTED",
  ready: "ORDER_READY",
  completed: "ORDER_COMPLETED",
  cancelled: "ORDER_CANCELLED",
};

export async function notifyOrderStatusChange(
  order: OrderRecord,
  status: OrderStatus,
  restaurantName: string,
  cancellationReason?: string,
): Promise<void> {
  const notificationType = ORDER_STATUS_TO_NOTIFICATION[status];
  if (!notificationType) return;

  await notifyOrderEvent(order, notificationType, restaurantName, {
    reason: cancellationReason ?? "Not specified",
  });
}

export async function notifyOrderReceived(
  order: OrderRecord,
  restaurantName: string,
): Promise<void> {
  await notifyOrderEvent(order, "ORDER_RECEIVED", restaurantName);
}

export async function notifyReservationEvent(
  reservation: ReservationRecord,
  notificationType: NotificationType,
  restaurantName: string,
  extra: Record<string, string> = {},
): Promise<void> {
  await sendTransactionalNotification({
    restaurantId: reservation.restaurant_id,
    entityType: "reservation",
    entityId: reservation.id,
    notificationType,
    recipientEmail: reservation.guest_email,
    recipientPhone: reservation.guest_phone,
    customerEmail: reservation.guest_email,
    templateVariables: {
      guestName: reservation.guest_name,
      guestCount: String(reservation.guest_count),
      reservationDate: reservation.reservation_date,
      reservationTime: reservation.reservation_time.slice(0, 5),
      restaurantName,
      reason: extra.reason ?? "Not specified",
      ...extra,
    },
  });
}

export async function notifyReservationReceived(
  reservation: ReservationRecord,
  restaurantName: string,
): Promise<void> {
  await notifyReservationEvent(reservation, "RESERVATION_RECEIVED", restaurantName);
}

export async function notifyReservationStatusAction(
  reservation: ReservationRecord,
  action: ReservationAction,
  restaurantName: string,
  cancellationReason?: string,
): Promise<void> {
  switch (action) {
    case "confirm":
      await notifyReservationEvent(reservation, "RESERVATION_CONFIRMED", restaurantName);
      break;
    case "reject":
    case "cancel":
      await notifyReservationEvent(reservation, "RESERVATION_CANCELLED", restaurantName, {
        reason: cancellationReason ?? "Not specified",
      });
      break;
    default:
      break;
  }
}

export async function notifyReservationChanged(
  reservation: ReservationRecord,
  restaurantName: string,
): Promise<void> {
  await notifyReservationEvent(reservation, "RESERVATION_CHANGED", restaurantName);
}

export async function notifyReservationReminder(
  reservation: ReservationRecord,
  restaurantName: string,
): Promise<void> {
  await notifyReservationEvent(reservation, "RESERVATION_REMINDER", restaurantName);
}
