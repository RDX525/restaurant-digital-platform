import { createClient } from "@/lib/supabase/server";
import { galleryImageSchema } from "@/lib/restaurant/schemas";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = galleryImageSchema.parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("restaurant_gallery_images")
      .insert({ ...parsed, restaurant_id: id })
      .select()
      .single();

    if (error) throw error;
    return jsonOk(data, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
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
