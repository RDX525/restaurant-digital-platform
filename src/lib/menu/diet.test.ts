import { describe, expect, it } from "vitest";
import {
  categoryDietHint,
  filterMenuByDiet,
  filterMenuForBrowse,
  isDietCategoryName,
  isVegetarianMenuItem,
  menuItemMatchesDiet,
} from "./diet";
import type { FullMenu, MenuItemWithModifiers } from "./types";

function item(id: string, dietary_info: string[]): MenuItemWithModifiers {
  return {
    id,
    category_id: "cat-1",
    name: id,
    description: null,
    price: 10,
    photo_url: null,
    ingredients: [],
    allergens: [],
    dietary_info,
    is_available: true,
    is_sold_out: false,
    is_popular: false,
    is_recommended: false,
    sort_order: 0,
    created_at: "",
    updated_at: "",
    modifier_groups: [],
  };
}

describe("menu diet filter", () => {
  it("treats vegetarian and vegan tags as veg", () => {
    expect(isVegetarianMenuItem(item("salad", ["Vegetarian"]))).toBe(true);
    expect(isVegetarianMenuItem(item("bowl", ["vegan"]))).toBe(true);
    expect(isVegetarianMenuItem(item("lamb", []))).toBe(false);
  });

  it("matches veg and non-veg filters", () => {
    expect(menuItemMatchesDiet(item("salad", ["vegetarian"]), "veg")).toBe(true);
    expect(menuItemMatchesDiet(item("salad", ["vegetarian"]), "non-veg")).toBe(false);
    expect(menuItemMatchesDiet(item("lamb", []), "non-veg")).toBe(true);
    expect(menuItemMatchesDiet(item("lamb", []), "all")).toBe(true);
  });

  it("hides empty categories after filtering", () => {
    const menu = {
      id: "menu-1",
      restaurant_id: "r-1",
      name: "Dinner",
      description: null,
      is_active: true,
      sort_order: 0,
      created_at: "",
      updated_at: "",
      categories: [
        {
          id: "starters",
          menu_id: "menu-1",
          name: "Starters",
          sort_order: 0,
          is_active: true,
          created_at: "",
          updated_at: "",
          items: [item("paneer", ["veg"])],
        },
        {
          id: "grill",
          menu_id: "menu-1",
          name: "Grill",
          sort_order: 1,
          is_active: true,
          created_at: "",
          updated_at: "",
          items: [item("lamb", [])],
        },
      ],
    } as FullMenu;

    const vegOnly = filterMenuByDiet(menu, "veg");
    expect(vegOnly.categories).toHaveLength(1);
    expect(vegOnly.categories[0]?.items[0]?.id).toBe("paneer");
  });

  it("uses Veg / Non veg category names when items are untagged", () => {
    expect(categoryDietHint("Veg")).toBe("veg");
    expect(categoryDietHint("Non veg")).toBe("non-veg");
    expect(isDietCategoryName("Veg")).toBe(true);
    expect(isDietCategoryName("Lunch")).toBe(false);
    expect(menuItemMatchesDiet(item("thali", []), "veg", "Veg")).toBe(true);
    expect(menuItemMatchesDiet(item("thali", []), "non-veg", "Veg")).toBe(false);
  });

  it("filters the menu to a single named category", () => {
    const menu = {
      id: "menu-1",
      restaurant_id: "r-1",
      name: "All day",
      description: "Breakfast, lunch, dinner, and drinks — all day on the waterfront.",
      is_active: true,
      sort_order: 0,
      created_at: "",
      updated_at: "",
      categories: [
        {
          id: "breakfast",
          menu_id: "menu-1",
          name: "Breakfast",
          sort_order: 0,
          is_active: true,
          created_at: "",
          updated_at: "",
          items: [item("eggs", [])],
        },
        {
          id: "dinner",
          menu_id: "menu-1",
          name: "Dinner",
          sort_order: 1,
          is_active: true,
          created_at: "",
          updated_at: "",
          items: [item("lamb", [])],
        },
      ],
    } as FullMenu;

    const breakfast = filterMenuForBrowse(menu, { kind: "category", categoryId: "breakfast" });
    expect(breakfast.categories).toHaveLength(1);
    expect(breakfast.categories[0]?.name).toBe("Breakfast");
    expect(filterMenuForBrowse(menu, { kind: "all" }).categories).toHaveLength(2);
  });
});
