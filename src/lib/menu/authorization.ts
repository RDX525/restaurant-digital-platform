import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDemoRestaurantId } from "@/lib/utils";
import { NotFoundError } from "@/lib/auth/errors";

async function resolveViaJoins(type: string, id: string): Promise<string> {
  const admin = createAdminClient();

  if (type === "menu") {
    const { data } = await admin.from("menus").select("restaurant_id").eq("id", id).maybeSingle();
    if (!data?.restaurant_id) throw new NotFoundError("Menu not found");
    return data.restaurant_id;
  }

  if (type === "category") {
    const { data } = await admin
      .from("menu_categories")
      .select("menu_id, menus(restaurant_id)")
      .eq("id", id)
      .maybeSingle();
    const restaurantId = (data?.menus as { restaurant_id?: string } | null)?.restaurant_id;
    if (!restaurantId) throw new NotFoundError("Category not found");
    return restaurantId;
  }

  if (type === "item") {
    const { data } = await admin
      .from("menu_items")
      .select("category_id, menu_categories(menu_id, menus(restaurant_id))")
      .eq("id", id)
      .maybeSingle();
    const category = data?.menu_categories as
      | { menus?: { restaurant_id?: string } }
      | null
      | undefined;
    const restaurantId = category?.menus?.restaurant_id;
    if (!restaurantId) throw new NotFoundError("Menu item not found");
    return restaurantId;
  }

  if (type === "modifier_group") {
    const { data } = await admin
      .from("modifier_groups")
      .select("menu_item_id, menu_items(category_id, menu_categories(menu_id, menus(restaurant_id)))")
      .eq("id", id)
      .maybeSingle();
    const item = data?.menu_items as
      | { menu_categories?: { menus?: { restaurant_id?: string } } }
      | null
      | undefined;
    const restaurantId = item?.menu_categories?.menus?.restaurant_id;
    if (!restaurantId) throw new NotFoundError("Modifier group not found");
    return restaurantId;
  }

  if (type === "modifier") {
    const { data } = await admin
      .from("modifiers")
      .select(
        "group_id, modifier_groups(menu_item_id, menu_items(category_id, menu_categories(menu_id, menus(restaurant_id))))",
      )
      .eq("id", id)
      .maybeSingle();
    const group = data?.modifier_groups as
      | {
          menu_items?: {
            menu_categories?: { menus?: { restaurant_id?: string } };
          };
        }
      | null
      | undefined;
    const restaurantId = group?.menu_items?.menu_categories?.menus?.restaurant_id;
    if (!restaurantId) throw new NotFoundError("Modifier not found");
    return restaurantId;
  }

  throw new NotFoundError("Resource not found");
}

async function resolveRestaurantId(type: string, id: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return getDemoRestaurantId();
  }
  return resolveViaJoins(type, id);
}

export async function resolveRestaurantIdForMenu(menuId: string): Promise<string> {
  return resolveRestaurantId("menu", menuId);
}

export async function resolveRestaurantIdForCategory(categoryId: string): Promise<string> {
  return resolveRestaurantId("category", categoryId);
}

export async function resolveRestaurantIdForMenuItem(itemId: string): Promise<string> {
  return resolveRestaurantId("item", itemId);
}

export async function resolveRestaurantIdForModifierGroup(groupId: string): Promise<string> {
  return resolveRestaurantId("modifier_group", groupId);
}

export async function resolveRestaurantIdForModifier(modifierId: string): Promise<string> {
  return resolveRestaurantId("modifier", modifierId);
}
