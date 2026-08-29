import { jsonError, jsonOk } from "@/lib/api";
import { menuDescriptionSchema } from "@/lib/intelligence/schemas";
import { generateMenuDescriptionDraft } from "@/lib/intelligence/orchestrator";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);

    const body = await request.json();
    const parsed = menuDescriptionSchema.parse(body);
    const result = await generateMenuDescriptionDraft({
      restaurantId: id,
      itemName: parsed.itemName,
      category: parsed.category,
      ingredients: parsed.ingredients,
      notes: parsed.notes,
      tone: parsed.tone,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 500);
  }
}
