import { jsonError, jsonOk } from "@/lib/api";
import { saveCustomerNotificationPreferences, mapPublicPreferences } from "@/lib/notification/data";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const preferencesSchema = z.object({
  customerEmail: z.string().email(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  typeOverrides: z.record(z.record(z.boolean())).default({}),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const body = await request.json();
    const parsed = preferencesSchema.parse(body);
    const prefs = await saveCustomerNotificationPreferences(id, parsed.customerEmail, {
      emailEnabled: parsed.emailEnabled,
      smsEnabled: parsed.smsEnabled,
      typeOverrides: parsed.typeOverrides,
    });
    return jsonOk(mapPublicPreferences(prefs));
  } catch (error) {
    return jsonError(error, 400);
  }
}
