import { createClient } from "@/lib/supabase/server";
import { menuItemSchema, reorderSchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";
import { reorderRows } from "@/lib/menu/service";

type Params = { params: Promise<{ categoryId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { categoryId } = await params;
    const body = await request.json();
    const parsed = menuItemSchema.parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        ...parsed,
        category_id: categoryId,
        photo_url: parsed.photo_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return jsonOk(data, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const rows = reorderSchema.parse(body);
    const supabase = await createClient();
    await reorderRows(supabase, "menu_items", rows);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
