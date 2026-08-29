import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FullMenu,
  Menu,
  MenuCategory,
  MenuCategoryWithItems,
  MenuItem,
  MenuItemWithModifiers,
  Modifier,
  ModifierGroup,
} from "./types";

function mapItem(
  item: MenuItem,
  groups: ModifierGroup[],
  modifiers: Modifier[],
): MenuItemWithModifiers {
  return {
    ...item,
    price: Number(item.price),
    modifier_groups: groups
      .filter((group) => group.menu_item_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((group) => ({
        ...group,
        modifiers: modifiers
          .filter((modifier) => modifier.group_id === group.id)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((modifier) => ({
            ...modifier,
            price: Number(modifier.price),
          })),
      })),
  };
}

export async function fetchFullMenu(
  supabase: SupabaseClient,
  menuId: string,
): Promise<FullMenu | null> {
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .select("*")
    .eq("id", menuId)
    .single();

  if (menuError || !menu) return null;

  const { data: categories, error: categoriesError } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("menu_id", menuId)
    .order("sort_order", { ascending: true });

  if (categoriesError) throw categoriesError;

  const categoryIds = (categories ?? []).map((category) => category.id);
  if (categoryIds.length === 0) {
    return { ...menu, categories: [] };
  }

  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .in("category_id", categoryIds)
    .order("sort_order", { ascending: true });

  if (itemsError) throw itemsError;

  const itemIds = (items ?? []).map((item) => item.id);
  let groups: ModifierGroup[] = [];
  let modifiers: Modifier[] = [];

  if (itemIds.length > 0) {
    const { data: groupRows, error: groupsError } = await supabase
      .from("modifier_groups")
      .select("*")
      .in("menu_item_id", itemIds)
      .order("sort_order", { ascending: true });

    if (groupsError) throw groupsError;
    groups = groupRows ?? [];

    const groupIds = groups.map((group) => group.id);
    if (groupIds.length > 0) {
      const { data: modifierRows, error: modifiersError } = await supabase
        .from("modifiers")
        .select("*")
        .in("group_id", groupIds)
        .order("sort_order", { ascending: true });

      if (modifiersError) throw modifiersError;
      modifiers = modifierRows ?? [];
    }
  }

  const categoriesWithItems: MenuCategoryWithItems[] = (categories ?? []).map(
    (category: MenuCategory) => ({
      ...category,
      items: (items ?? [])
        .filter((item) => item.category_id === category.id)
        .map((item) => mapItem(item, groups, modifiers)),
    }),
  );

  return {
    ...menu,
    categories: categoriesWithItems,
  };
}

export async function fetchMenusForRestaurant(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<Menu[]> {
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function reorderRows(
  supabase: SupabaseClient,
  table: string,
  rows: { id: string; sort_order: number }[],
) {
  const updatedAt = new Date().toISOString();
  await Promise.all(
    rows.map((row) =>
      supabase
        .from(table)
        .update({ sort_order: row.sort_order, updated_at: updatedAt })
        .eq("id", row.id)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ),
  );
}

export function filterPublicMenu(menu: FullMenu): FullMenu {
  if (!menu.is_active) {
    return { ...menu, categories: [] };
  }

  return {
    ...menu,
    categories: menu.categories
      .filter((category) => category.is_active)
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) => item.is_available && !item.is_sold_out,
        ),
      }))
      .filter((category) => category.items.length > 0),
  };
}
