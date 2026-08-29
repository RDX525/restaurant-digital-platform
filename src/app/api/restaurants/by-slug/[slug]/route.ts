import { loadRestaurantBySlug } from "@/lib/restaurant/data";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const preview = new URL(request.url).searchParams.get("preview") === "1";
    const restaurant = await loadRestaurantBySlug(slug, preview);

    if (!restaurant) {
      return jsonError(new Error("Restaurant not found"), 404);
    }

    return jsonOk(restaurant);
  } catch (error) {
    return jsonError(error, 500);
  }
}
