import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadRestaurantById } from "@/lib/restaurant/data";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { restaurantWebsiteSchema } from "@/lib/restaurant/schemas";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const restaurant = await loadRestaurantById(id, { galleryLimit: 50 });

    if (!restaurant) {
      return jsonError(new Error("Restaurant not found"), 404);
    }

    return jsonOk(restaurant);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const body = await request.json();
    const parsed = restaurantWebsiteSchema.partial().parse(body);

    if (!isSupabaseConfigured()) {
      if (!isDemoRestaurantId(id)) {
        return jsonError(
          new Error("Configure Supabase in .env.local to save changes."),
          503,
        );
      }

      const restaurant = await loadRestaurantById(id, { galleryLimit: 50 });
      if (!restaurant) {
        return jsonError(new Error("Restaurant not found"), 404);
      }

      return jsonOk({
        ...restaurant,
        ...parsed,
        updated_at: new Date().toISOString(),
      });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("restaurants")
      .update({
        ...parsed,
        email: parsed.email === undefined ? undefined : parsed.email || null,
        logo_url:
          parsed.logo_url === undefined ? undefined : parsed.logo_url || null,
        hero_image_url:
          parsed.hero_image_url === undefined
            ? undefined
            : parsed.hero_image_url || null,
        google_maps_url:
          parsed.google_maps_url === undefined
            ? undefined
            : parsed.google_maps_url || null,
        custom_domain:
          parsed.custom_domain === undefined
            ? undefined
            : parsed.custom_domain || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    const restaurant = await loadRestaurantById(id, { galleryLimit: 50 });
    if (!restaurant) {
      return jsonError(new Error("Restaurant not found"), 404);
    }

    return jsonOk(restaurant);
  } catch (error) {
    return jsonError(error, 500);
  }
}
