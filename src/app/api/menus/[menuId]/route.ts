import { loadFullMenuById } from "@/lib/menu/data";
import { filterPublicMenu } from "@/lib/menu/service";
import { menuSchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";
import { guardMenuRoute } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ menuId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { menuId } = await params;
    const full = new URL(request.url).searchParams.get("full") === "1";
    const menu = await loadFullMenuById(menuId);

    if (!menu) {
      return jsonError(new Error("Menu not found"), 404);
    }

    return jsonOk(full ? menu : filterPublicMenu(menu));
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    if (!isSupabaseConfigured()) {
      return jsonError(
        new Error("Configure Supabase in .env.local to update menus."),
        503,
      );
    }

    const { menuId } = await params;
    await guardMenuRoute(menuId);
    const body = await request.json();
    const parsed = menuSchema.partial().parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("menus")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", menuId)
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
    if (!isSupabaseConfigured()) {
      return jsonError(
        new Error("Configure Supabase in .env.local to delete menus."),
        503,
      );
    }

    const { menuId } = await params;
    await guardMenuRoute(menuId);
    const supabase = await createClient();
    const { error } = await supabase.from("menus").delete().eq("id", menuId);

    if (error) throw error;
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
