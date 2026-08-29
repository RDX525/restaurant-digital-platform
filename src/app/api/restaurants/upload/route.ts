import { createClient } from "@/lib/supabase/server";
import { fetchRestaurantById } from "@/lib/restaurant/service";
import { jsonError, jsonOk } from "@/lib/api";

const BUCKET = "restaurant-assets";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export async function POST(request: Request) {
  try {
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

    if (typeof assetType !== "string" || !["logo", "hero"].includes(assetType)) {
      return jsonError(new Error("assetType must be logo or hero"), 422);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(new Error("Invalid image type"), 422);
    }

    if (file.size > MAX_BYTES) {
      return jsonError(new Error("Image must be 5MB or smaller"), 422);
    }

    const extension = file.type.split("/")[1]?.replace("svg+xml", "svg") ?? "jpg";
    const path = `${restaurantId}/${assetType}-${Date.now()}.${extension}`;
    const supabase = await createClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const field = assetType === "logo" ? "logo_url" : "hero_image_url";

    const { error } = await supabase
      .from("restaurants")
      .update({
        [field]: publicData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", restaurantId);

    if (error) throw error;

    const restaurant = await fetchRestaurantById(supabase, restaurantId);
    if (!restaurant) {
      return jsonError(new Error("Restaurant not found"), 404);
    }

    return jsonOk({ url: publicData.publicUrl, restaurant });
  } catch (error) {
    return jsonError(error, 500);
  }
}
