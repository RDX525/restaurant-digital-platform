import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadRestaurantById } from "@/lib/restaurant/data";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { restaurantWebsiteSchema } from "@/lib/restaurant/schemas";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { revalidatePublicRestaurantSite } from "@/lib/cache/revalidate-public-site";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

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
    delete parsed.logo_url;
    delete parsed.hero_image_url;

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
        logo_url: restaurant.logo_url,
        hero_image_url: restaurant.hero_image_url,
        updated_at: new Date().toISOString(),
      });
    }

    const existing = await loadRestaurantById(id, { galleryLimit: 0 });
    const supabase = await createClient();

    const { error } = await supabase
      .from("restaurants")
      .update({
        ...parsed,
        email: parsed.email === undefined ? undefined : parsed.email || null,
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

    revalidatePublicRestaurantSite({
      slug: restaurant.slug,
      previousSlug: existing?.slug,
    });

    return jsonOk(restaurant);
  } catch (error) {
    return jsonError(error, 500);
  }
}
