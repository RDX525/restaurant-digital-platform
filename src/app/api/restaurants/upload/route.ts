import { createClient } from "@/lib/supabase/server";
import { fetchRestaurantById } from "@/lib/restaurant/service";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  RESTAURANT_ASSETS_BUCKET,
  restaurantAssetExtension,
  restaurantAssetObjectPath,
} from "@/lib/restaurant/storage";
import { revalidatePublicRestaurantSite } from "@/lib/cache/revalidate-public-site";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return jsonError(
        new Error("Configure Supabase in .env.local to upload branding assets."),
        503,
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const restaurantId = formData.get("restaurantId");
    const assetType = formData.get("assetType");

    if (!(file instanceof File)) {
      return jsonError(new Error("File is required"), 422);
    }

    if (typeof restaurantId !== "string" || !restaurantId) {
      return jsonError(new Error("restaurantId is required"), 422);
    }

    await guardRestaurantRoute(restaurantId, "website.manage");

    if (assetType !== "logo" && assetType !== "hero") {
      return jsonError(new Error("assetType must be logo or hero"), 422);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(new Error("Invalid image type"), 422);
    }

    if (file.size > MAX_BYTES) {
      return jsonError(new Error("Image must be 5MB or smaller"), 422);
    }

    const path = restaurantAssetObjectPath(
      restaurantId,
      assetType,
      restaurantAssetExtension(file.type),
    );
    const supabase = await createClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(RESTAURANT_ASSETS_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from(RESTAURANT_ASSETS_BUCKET)
      .getPublicUrl(path);
    const field = assetType === "logo" ? "logo_url" : "hero_image_url";

    const { data: updated, error } = await supabase
      .from("restaurants")
      .update({
        [field]: publicData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId)
      .select("*")
      .single();

    if (error) throw error;
    if (!updated) {
      return jsonError(new Error("Restaurant branding could not be saved."), 500);
    }

    const restaurant = await fetchRestaurantById(supabase, restaurantId, {
      galleryLimit: 50,
    });
    if (!restaurant) {
      return jsonError(new Error("Restaurant not found"), 404);
    }

    revalidatePublicRestaurantSite({ slug: restaurant.slug });

    return jsonOk({ url: publicData.publicUrl, restaurant });
  } catch (error) {
    return jsonError(error, 500);
  }
}
