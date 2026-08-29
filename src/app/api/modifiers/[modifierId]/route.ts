import { createClient } from "@/lib/supabase/server";
import { modifierSchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ modifierId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { modifierId } = await params;
    const body = await request.json();
    const parsed = modifierSchema.partial().parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("modifiers")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", modifierId)
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
    const { modifierId } = await params;
    const supabase = await createClient();
    const { error } = await supabase
      .from("modifiers")
      .delete()
      .eq("id", modifierId);

    if (error) throw error;
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
