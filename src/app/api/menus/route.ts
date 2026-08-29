import { loadMenusForRestaurant } from "@/lib/menu/data";
import { menuSchema } from "@/lib/menu/schemas";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiAuth } from "@/lib/auth/api-auth";
import { resolveActiveRestaurantId } from "@/lib/auth/active-restaurant";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireApiAuth();
    const restaurantId = await resolveActiveRestaurantId(auth);
    const menus = await loadMenusForRestaurant(restaurantId);
    return jsonOk(menus);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return jsonError(
        new Error("Configure Supabase in .env.local to create menus."),
        503,
      );
    }

    const auth = await requireApiAuth();
    const restaurantId = await resolveActiveRestaurantId(auth);
    const body = await request.json();
    const parsed = menuSchema.parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("menus")
      .insert({
        ...parsed,
        restaurant_id: restaurantId,
      })
      .select()
      .single();

    if (error) throw error;
    return jsonOk(data, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
