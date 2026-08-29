import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";

const BUCKET = "menu-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const itemId = formData.get("itemId");

    if (!(file instanceof File)) {
      return jsonError(new Error("File is required"), 422);
    }

    if (typeof itemId !== "string" || !itemId) {
      return jsonError(new Error("itemId is required"), 422);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(new Error("Only JPEG, PNG, and WebP images are allowed"), 422);
    }

    if (file.size > MAX_BYTES) {
      return jsonError(new Error("Image must be 5MB or smaller"), 422);
    }

    const extension = file.type.split("/")[1] ?? "jpg";
    const path = `${itemId}/${Date.now()}.${extension}`;
    const supabase = await createClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { data, error } = await supabase
      .from("menu_items")
      .update({
        photo_url: publicData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;

    return jsonOk({ photo_url: publicData.publicUrl, item: data });
  } catch (error) {
    return jsonError(error, 500);
  }
}
