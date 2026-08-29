import { createClient } from "@/lib/supabase/server";
import { modifierGroupSchema, reorderSchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";
import { reorderRows } from "@/lib/menu/service";

type Params = { params: Promise<{ itemId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const parsed = modifierGroupSchema.parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("modifier_groups")
      .insert({ ...parsed, menu_item_id: itemId })
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
    await reorderRows(supabase, "modifier_groups", rows);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
