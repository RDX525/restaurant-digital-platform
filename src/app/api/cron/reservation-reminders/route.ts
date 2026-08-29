import { jsonError, jsonOk } from "@/lib/api";
import { assertCronAuthorized, CronAuthorizationError } from "@/lib/cron/auth";
import { processReservationReminders } from "@/lib/reservation/reminder-job";

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    const result = await processReservationReminders();
    return jsonOk(result);
  } catch (error) {
    if (error instanceof CronAuthorizationError) {
      return jsonError(error, 401);
    }
    return jsonError(error, 500);
  }
}
