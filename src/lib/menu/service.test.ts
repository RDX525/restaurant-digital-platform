import { describe, expect, it } from "vitest";
import { filterPublicMenu } from "@/lib/menu/service";
import type { FullMenu } from "@/lib/menu/types";

const baseMenu: FullMenu = {
  id: "menu-1",
  restaurant_id: "restaurant-1",
  name: "Dinner",
  description: null,
  is_active: true,
  sort_order: 0,
  created_at: "",
  updated_at: "",
  categories: [
    {
      id: "cat-1",
      menu_id: "menu-1",
      name: "Mains",
      sort_order: 0,
      is_active: true,
      created_at: "",
      updated_at: "",
      items: [
        {
          id: "item-1",
          category_id: "cat-1",
          name: "Burger",
          description: null,
          price: 15,
          photo_url: null,
          ingredients: [],
          allergens: [],
          dietary_info: [],
          is_available: true,
          is_sold_out: false,
          is_popular: false,
          is_recommended: false,
          sort_order: 0,
          created_at: "",
          updated_at: "",
          modifier_groups: [],
        },
        {
          id: "item-2",
          category_id: "cat-1",
          name: "Sold Out Steak",
          description: null,
          price: 30,
          photo_url: null,
          ingredients: [],
          allergens: [],
          dietary_info: [],
          is_available: true,
          is_sold_out: true,
          is_popular: false,
          is_recommended: false,
          sort_order: 1,
          created_at: "",
          updated_at: "",
          modifier_groups: [],
        },
      ],
    },
    {
      id: "cat-2",
      menu_id: "menu-1",
      name: "Hidden",
      sort_order: 1,
      is_active: false,
      created_at: "",
      updated_at: "",
      items: [],
    },
  ],
};

describe("filterPublicMenu", () => {
  it("hides inactive categories and sold out items", () => {
    const filtered = filterPublicMenu(baseMenu);
    expect(filtered.categories).toHaveLength(1);
    expect(filtered.categories[0].items).toHaveLength(1);
    expect(filtered.categories[0].items[0].name).toBe("Burger");
  });

  it("returns empty categories when menu is inactive", () => {
    const filtered = filterPublicMenu({ ...baseMenu, is_active: false });
    expect(filtered.categories).toHaveLength(0);
  });
});
