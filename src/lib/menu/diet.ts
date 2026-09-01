import type { FullMenu, MenuItem } from "./types";

export const MENU_DIET_FILTERS = ["all", "veg", "non-veg"] as const;

export type MenuDietFilter = (typeof MENU_DIET_FILTERS)[number];

const VEGETARIAN_TAGS = new Set([
  "vegetarian",
  "vegan",
  "veg",
  "veggie",
  "plant-based",
  "plant based",
]);

export function isVegetarianMenuItem(item: Pick<MenuItem, "dietary_info">): boolean {
  return item.dietary_info.some((tag) => VEGETARIAN_TAGS.has(tag.trim().toLowerCase()));
}

export function categoryDietHint(name: string): MenuDietFilter | null {
  const normalized = name.trim().toLowerCase();
  if (/non[-\s]?veg/.test(normalized) || normalized.includes("non vegetarian")) {
    return "non-veg";
  }
  if (
    normalized === "veg" ||
    normalized.startsWith("veg ") ||
    normalized.includes("vegetarian") ||
    normalized.includes("vegan")
  ) {
    return "veg";
  }
  return null;
}

export function menuItemMatchesDiet(
  item: Pick<MenuItem, "dietary_info">,
  filter: MenuDietFilter,
  categoryName?: string,
): boolean {
  if (filter === "all") return true;

  const categoryHint = categoryName ? categoryDietHint(categoryName) : null;
  if (categoryHint) {
    return categoryHint === filter;
  }

  const vegetarian = isVegetarianMenuItem(item);
  return filter === "veg" ? vegetarian : !vegetarian;
}

export function isDietCategoryName(name: string): boolean {
  return categoryDietHint(name) !== null;
}

export function filterMenuByDiet(menu: FullMenu, filter: MenuDietFilter): FullMenu {
  if (filter === "all") return menu;

  return {
    ...menu,
    categories: menu.categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) =>
          menuItemMatchesDiet(item, filter, category.name),
        ),
      }))
      .filter((category) => category.items.length > 0),
  };
}

export type MenuBrowseFilter =
  | { kind: "all" }
  | { kind: "diet"; diet: Exclude<MenuDietFilter, "all"> }
  | { kind: "category"; categoryId: string };

export function filterMenuForBrowse(menu: FullMenu, filter: MenuBrowseFilter): FullMenu {
  if (filter.kind === "all") return menu;
  if (filter.kind === "diet") return filterMenuByDiet(menu, filter.diet);

  return {
    ...menu,
    categories: menu.categories.filter((category) => category.id === filter.categoryId),
  };
}

export function isSameMenuBrowseFilter(a: MenuBrowseFilter, b: MenuBrowseFilter): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "all") return true;
  if (a.kind === "diet" && b.kind === "diet") return a.diet === b.diet;
  if (a.kind === "category" && b.kind === "category") return a.categoryId === b.categoryId;
  return false;
}
