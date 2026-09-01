import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { loadRestaurantById } from "@/lib/restaurant/data";
import {
  RESTAURANT_ASSETS_BUCKET,
  restaurantAssetExtension,
  restaurantAssetObjectPath,
} from "@/lib/restaurant/storage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { revalidatePublicRestaurantSite } from "@/lib/cache/revalidate-public-site";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    if (!isSupabaseConfigured()) {
      return jsonError(
        new Error("Configure Supabase in .env.local to upload gallery photos."),
        503,
      );
    }

    const { id } = await params;
    await guardRestaurantRoute(id, "website.manage");

    const formData = await request.formData();
    const file = formData.get("file");
    const captionValue = formData.get("caption");
    const sortOrderValue = formData.get("sortOrder");

    if (!(file instanceof File)) {
      return jsonError(new Error("File is required"), 422);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(new Error("Use a JPEG, PNG, or WebP image"), 422);
    }

    if (file.size > MAX_BYTES) {
      return jsonError(new Error("Image must be 5MB or smaller"), 422);
    }

    const caption =
      typeof captionValue === "string" && captionValue.trim()
        ? captionValue.trim().slice(0, 200)
        : null;
    const sortOrder = Number.parseInt(
      typeof sortOrderValue === "string" ? sortOrderValue : "0",
      10,
    );

    const supabase = await createClient();
    const path = restaurantAssetObjectPath(
      id,
      "gallery",
      restaurantAssetExtension(file.type),
    );
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(RESTAURANT_ASSETS_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from(RESTAURANT_ASSETS_BUCKET)
      .getPublicUrl(path);

    const { data, error } = await supabase
      .from("restaurant_gallery_images")
      .insert({
        restaurant_id: id,
        image_url: publicData.publicUrl,
        caption,
        sort_order: Number.isFinite(sortOrder) && sortOrder >= 0 ? sortOrder : 0,
      })
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
