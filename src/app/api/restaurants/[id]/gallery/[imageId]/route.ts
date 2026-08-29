import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, imageId } = await params;
    const supabase = await createClient();
    const { error } = await supabase
      .from("restaurant_gallery_images")
      .delete()
      .eq("id", imageId)
      .eq("restaurant_id", id);

    if (error) throw error;
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
