import { getDemoFullMenu } from "@/lib/menu/demo-data";
import type { FullMenu, MenuItemWithModifiers } from "@/lib/menu/types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

let menu: FullMenu = clone(getDemoFullMenu());

export function resetDemoMenuStore(): void {
  menu = clone(getDemoFullMenu());
}

export function getDemoMenuStore(): FullMenu {
  return clone(menu);
}

export function patchDemoMenuItem(
  itemId: string,
  patch: Partial<
    Pick<
      MenuItemWithModifiers,
      | "name"
      | "description"
      | "price"
      | "photo_url"
      | "ingredients"
      | "allergens"
      | "dietary_info"
      | "is_available"
      | "is_sold_out"
      | "is_popular"
      | "is_recommended"
      | "sort_order"
    >
  >,
): MenuItemWithModifiers | null {
  let updated: MenuItemWithModifiers | null = null;

  menu = {
    ...menu,
    categories: menu.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        if (item.id !== itemId) return item;
        updated = {
          ...item,
          ...patch,
          updated_at: new Date().toISOString(),
        };
        return updated;
      }),
    })),
    updated_at: new Date().toISOString(),
  };

  return updated ? clone(updated) : null;
}
