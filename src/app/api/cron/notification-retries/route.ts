import { jsonError, jsonOk } from "@/lib/api";
import { assertCronAuthorized, CronAuthorizationError } from "@/lib/cron/auth";
import { processNotificationRetries } from "@/lib/notification/service";

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    const processed = await processNotificationRetries();
    return jsonOk({ processed });
  } catch (error) {
    if (error instanceof CronAuthorizationError) {
      return jsonError(error, 401);
    }
    return jsonError(error, 500);
  }
}
