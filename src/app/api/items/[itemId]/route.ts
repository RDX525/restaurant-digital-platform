import { createClient } from "@/lib/supabase/server";
import { menuItemSchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const parsed = menuItemSchema.partial().parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("menu_items")
      .update({
        ...parsed,
        photo_url:
          parsed.photo_url === undefined
            ? undefined
            : parsed.photo_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return jsonOk(data);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("menu_items").delete().eq("id", itemId);

    if (error) throw error;
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
