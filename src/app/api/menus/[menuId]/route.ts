import { loadFullMenuById } from "@/lib/menu/data";
import { filterPublicMenu } from "@/lib/menu/service";
import { menuPatchSchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";
import { guardMenuRoute } from "@/lib/auth/guards";
import { resolveRestaurantIdForMenu } from "@/lib/menu/authorization";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadRestaurantById } from "@/lib/restaurant/data";
import { revalidatePublicRestaurantSite } from "@/lib/cache/revalidate-public-site";

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
    const parsed = menuPatchSchema.parse(body);
    const restaurantId = await resolveRestaurantIdForMenu(menuId);
    const supabase = await createClient();
    const updatedAt = new Date().toISOString();

    if (parsed.is_active === true) {
      const { error: deactivateError } = await supabase
        .from("menus")
        .update({ is_active: false, updated_at: updatedAt })
        .eq("restaurant_id", restaurantId)
        .neq("id", menuId)
        .select("id");

      if (deactivateError) throw deactivateError;
    }

    const { data, error } = await supabase
      .from("menus")
      .update({ ...parsed, updated_at: updatedAt })
      .eq("id", menuId)
      .select()
      .single();

    if (error) throw error;

    await revalidateMenusForRestaurant(restaurantId, [menuId]);
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
    const restaurantId = await resolveRestaurantIdForMenu(menuId);
    const supabase = await createClient();
    const { error } = await supabase.from("menus").delete().eq("id", menuId);

    if (error) throw error;

    await revalidateMenusForRestaurant(restaurantId, [menuId]);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}

async function revalidateMenusForRestaurant(restaurantId: string, extraMenuIds: string[] = []) {
  const supabase = await createClient();
  const [{ data: menuRows }, restaurant] = await Promise.all([
    supabase.from("menus").select("id").eq("restaurant_id", restaurantId),
    loadRestaurantById(restaurantId, { galleryLimit: 0 }),
  ]);

  if (!restaurant) return;

  revalidatePublicRestaurantSite({
    slug: restaurant.slug,
    menuIds: [...new Set([...(menuRows ?? []).map((row) => row.id), ...extraMenuIds])],
  });
}

