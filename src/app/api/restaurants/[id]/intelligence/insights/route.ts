import { jsonError, jsonOk } from "@/lib/api";
import { listAiInsights } from "@/lib/intelligence/data";
import { insightsQuerySchema } from "@/lib/intelligence/schemas";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);

    const url = new URL(request.url);
    const parsed = insightsQuerySchema.parse({
      type: url.searchParams.get("type") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const insights = await listAiInsights(id, {
      insightType: parsed.type,
      limit: parsed.limit,
    });

    return jsonOk({ insights });
  } catch (error) {
    return jsonError(error, 500);
  }
}
