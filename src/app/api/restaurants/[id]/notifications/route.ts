import { jsonError, jsonOk } from "@/lib/api";
import {
  listNotificationLogsForRestaurant,
  loadRestaurantNotificationPreferences,
  mapPublicPreferences,
  saveRestaurantNotificationPreferences,
} from "@/lib/notification/data";
import { processNotificationRetries } from "@/lib/notification/service";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const preferencesSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  typeOverrides: z.record(
    z.record(z.boolean()),
  ).default({}),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const [logs, prefs] = await Promise.all([
      listNotificationLogsForRestaurant(id),
      loadRestaurantNotificationPreferences(id),
    ]);
    return jsonOk({
      logs,
      preferences: mapPublicPreferences(prefs),
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const body = await request.json();
    const parsed = preferencesSchema.parse(body);
    const prefs = await saveRestaurantNotificationPreferences(id, parsed);
    return jsonOk(mapPublicPreferences(prefs));
  } catch (error) {
    return jsonError(error, 400);
  }
}

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const processed = await processNotificationRetries();
    return jsonOk({ processed });
  } catch (error) {
    return jsonError(error, 500);
  }
}
