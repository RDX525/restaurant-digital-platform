import { createClient } from "@/lib/supabase/server";
import { galleryImageSchema } from "@/lib/restaurant/schemas";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { loadRestaurantById } from "@/lib/restaurant/data";
import { revalidatePublicRestaurantSite } from "@/lib/cache/revalidate-public-site";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id, "website.manage");
    const body = await request.json();
    const parsed = galleryImageSchema.parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("restaurant_gallery_images")
      .insert({ ...parsed, restaurant_id: id })
      .select()
      .single();

    if (error) throw error;

    const restaurant = await loadRestaurantById(id, { galleryLimit: 0 });
    if (restaurant) {
      revalidatePublicRestaurantSite({ slug: restaurant.slug });
    }

    return jsonOk(data, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id, "website.manage");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("restaurant_gallery_images")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return jsonOk(data ?? []);
  } catch (error) {
    return jsonError(error, 500);
  }
}
