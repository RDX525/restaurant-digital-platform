import { jsonError, jsonOk } from "@/lib/api";
import { getAnalyticsReport } from "@/lib/analytics/data";
import { analyticsQuerySchema } from "@/lib/analytics/schemas";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);

    const url = new URL(request.url);
    const parsed = analyticsQuerySchema.parse({
      preset: url.searchParams.get("preset") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });

    const report = await getAnalyticsReport(id, parsed.preset, parsed.from, parsed.to);
    return jsonOk(report);
  } catch (error) {
    return jsonError(error, 500);
  }
}
