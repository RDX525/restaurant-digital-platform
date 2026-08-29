import { jsonError, jsonOk } from "@/lib/api";
import {
  getReservationForRestaurant,
  rescheduleReservation,
  updateReservationStatus,
} from "@/lib/reservation/data";
import {
  rescheduleReservationSchema,
  updateReservationStatusSchema,
} from "@/lib/reservation/schemas";
import { ReservationValidationError } from "@/lib/reservation/availability";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { auditFromAuth } from "@/lib/audit/log";

type Params = { params: Promise<{ id: string; reservationId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, reservationId } = await params;
    await guardRestaurantRoute(id, "reservations.manage");
    const reservation = await getReservationForRestaurant(id, reservationId);
    if (!reservation) return jsonError(new Error("Reservation not found"), 404);
    return jsonOk(reservation);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, reservationId } = await params;
    await guardRestaurantRoute(id, "reservations.manage");
    const auth = await guardRestaurantRoute(id, "reservations.manage");
    const body = await request.json();
    const parsed = updateReservationStatusSchema.parse(body);

    const reservation = await updateReservationStatus(
      id,
      reservationId,
      parsed.action,
      parsed.cancellationReason,
    );

    if (!reservation) return jsonError(new Error("Reservation not found"), 404);

    await auditFromAuth(auth, {
      restaurantId: id,
      action: "reservation.status_updated",
      entityType: "reservation",
      entityId: reservationId,
      metadata: { action: parsed.action },
    });

    return jsonOk(reservation);
  } catch (error) {
    if (error instanceof ReservationValidationError) {
      return jsonError(error, 422);
    }
    return jsonError(error, 400);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id, reservationId } = await params;
    await guardRestaurantRoute(id, "reservations.manage");
    const auth = await guardRestaurantRoute(id, "reservations.manage");
    const body = await request.json();
    const parsed = rescheduleReservationSchema.parse(body);

    const reservation = await rescheduleReservation(id, reservationId, {
      date: parsed.date,
      time: parsed.time,
    });

    if (!reservation) return jsonError(new Error("Reservation not found"), 404);

    await auditFromAuth(auth, {
      restaurantId: id,
      action: "reservation.rescheduled",
      entityType: "reservation",
      entityId: reservationId,
      metadata: { date: parsed.date, time: parsed.time },
    });

    return jsonOk(reservation);
  } catch (error) {
    if (error instanceof ReservationValidationError) {
      return jsonError(error, 422);
    }
    return jsonError(error, 400);
  }
}
