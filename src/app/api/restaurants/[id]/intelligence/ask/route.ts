import { jsonError, jsonOk } from "@/lib/api";
import { askRestaurantSchema } from "@/lib/intelligence/schemas";
import { askRestaurant } from "@/lib/intelligence/orchestrator";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);

    const body = await request.json();
    const parsed = askRestaurantSchema.parse(body);
    const result = await askRestaurant({
      restaurantId: id,
      question: parsed.question,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 500);
  }
}
