import { loadRestaurantById } from "@/lib/restaurant/data";
import { listConfirmedReservationsForReminderJob } from "./data";
import { queueReminderIfDue } from "./reminders";

export async function processReservationReminders(now = new Date()): Promise<{
  processed: number;
  sent: number;
}> {
  const reservations = await listConfirmedReservationsForReminderJob(now);
  let sent = 0;

  for (const record of reservations) {
    const restaurant = await loadRestaurantById(record.restaurant_id);
    if (!restaurant) continue;

    const didSend = await queueReminderIfDue(record, restaurant.name, now);
    if (didSend) sent += 1;
  }

  return { processed: reservations.length, sent };
}
