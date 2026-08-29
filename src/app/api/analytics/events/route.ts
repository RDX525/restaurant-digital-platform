import { jsonError, jsonOk } from "@/lib/api";
import { recordAnalyticsEventForSlug } from "@/lib/analytics/data";
import { recordAnalyticsEventSchema } from "@/lib/analytics/schemas";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, {
    scope: "analytics-events",
    limit: 120,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = recordAnalyticsEventSchema.parse(body);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const event = await recordAnalyticsEventForSlug({
      restaurantSlug: parsed.restaurantSlug,
      eventType: parsed.eventType,
      sessionId: parsed.sessionId,
      path: parsed.path,
      menuItemId: parsed.menuItemId,
      metadata: parsed.metadata,
      userAgent,
    });

    if (!event) return jsonError(new Error("Restaurant not found"), 404);
    return jsonOk({ id: event.id }, 201);
  } catch (error) {
    return jsonError(error, 400);
  }
}
