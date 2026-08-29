import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ categoryId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { categoryId } = await params;
    const body = await request.json();
    const parsed = categorySchema.partial().parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("menu_categories")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", categoryId)
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
    const { categoryId } = await params;
    const supabase = await createClient();
    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId);

    if (error) throw error;
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
