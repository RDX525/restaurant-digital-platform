import { jsonError, jsonOk } from "@/lib/api";
import { generateDailyBrief } from "@/lib/intelligence/orchestrator";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);

    const result = await generateDailyBrief({ restaurantId: id });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 500);
  }
}
