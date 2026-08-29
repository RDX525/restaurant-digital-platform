import { createClient } from "@/lib/supabase/server";
import { modifierGroupBaseSchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ groupId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const parsed = modifierGroupBaseSchema.partial().parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("modifier_groups")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", groupId)
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
    const { groupId } = await params;
    const supabase = await createClient();
    const { error } = await supabase
      .from("modifier_groups")
      .delete()
      .eq("id", groupId);

    if (error) throw error;
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
