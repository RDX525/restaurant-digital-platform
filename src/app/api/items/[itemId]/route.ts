import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { menuItemPatchSchema } from "@/lib/menu/schemas";
import { patchDemoMenuItem } from "@/lib/menu/demo-store";
import {
  revalidatePublicSiteForMenuItem,
  resolvePublicRevalidateTargetForMenuItem,
  revalidatePublicSiteTarget,
} from "@/lib/menu/revalidate-public";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const parsed = menuItemPatchSchema.parse(body);

    if (!isSupabaseConfigured()) {
      const updated = patchDemoMenuItem(itemId, parsed);
      if (!updated) {
        return jsonError(new Error("Item not found"), 404);
      }
      await revalidatePublicSiteForMenuItem(itemId);
      return jsonOk(updated);
    }

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

    await revalidatePublicSiteForMenuItem(itemId);
    return jsonOk(data);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { itemId } = await params;

    if (!isSupabaseConfigured()) {
      return jsonError(
        new Error("Configure Supabase in .env.local to delete menu items."),
        503,
      );
    }

    const target = await resolvePublicRevalidateTargetForMenuItem(itemId);

    const supabase = await createClient();
    const { error } = await supabase.from("menu_items").delete().eq("id", itemId);

    if (error) throw error;

    revalidatePublicSiteTarget(target);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
