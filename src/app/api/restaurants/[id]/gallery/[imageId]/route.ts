import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { loadRestaurantById } from "@/lib/restaurant/data";
import {
  RESTAURANT_ASSETS_BUCKET,
  restaurantAssetPathFromPublicUrl,
} from "@/lib/restaurant/storage";
import { revalidatePublicRestaurantSite } from "@/lib/cache/revalidate-public-site";

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, imageId } = await params;
    await guardRestaurantRoute(id, "website.manage");
    const supabase = await createClient();
    const { data: existing, error: loadError } = await supabase
      .from("restaurant_gallery_images")
      .select("image_url")
      .eq("id", imageId)
      .eq("restaurant_id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabase
      .from("restaurant_gallery_images")
      .delete()
      .eq("id", imageId)
      .eq("restaurant_id", id);

    if (error) throw error;

    const objectPath = existing?.image_url
      ? restaurantAssetPathFromPublicUrl(existing.image_url as string, id)
      : null;
    if (objectPath) {
      await supabase.storage.from(RESTAURANT_ASSETS_BUCKET).remove([objectPath]);
    }

    const restaurant = await loadRestaurantById(id, { galleryLimit: 0 });
    if (restaurant) {
      revalidatePublicRestaurantSite({ slug: restaurant.slug });
    }

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
