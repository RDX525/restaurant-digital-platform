import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuPreview } from "@/components/menu/MenuPreview";
import type { FullMenu } from "@/lib/menu/types";

const menu: FullMenu = {
  id: "menu-1",
  restaurant_id: "restaurant-1",
  name: "Lunch",
  description: "Midday favorites",
  is_active: true,
  sort_order: 0,
  created_at: "",
  updated_at: "",
  categories: [
    {
      id: "cat-1",
      menu_id: "menu-1",
      name: "Burgers",
      sort_order: 0,
      is_active: true,
      created_at: "",
      updated_at: "",
      items: [
        {
          id: "item-1",
          category_id: "cat-1",
          name: "Classic Burger",
          description: "Angus beef",
          price: 18,
          photo_url: null,
          ingredients: ["beef"],
          allergens: ["gluten"],
          dietary_info: [],
          is_available: true,
          is_sold_out: false,
          is_popular: true,
          is_recommended: false,
          sort_order: 0,
          created_at: "",
          updated_at: "",
          modifier_groups: [
            {
              id: "group-1",
              menu_item_id: "item-1",
              name: "Add-ons",
              is_required: false,
              min_selections: 0,
              max_selections: 3,
              sort_order: 0,
              created_at: "",
              updated_at: "",
              modifiers: [
                {
                  id: "mod-1",
                  group_id: "group-1",
                  name: "Cheese",
                  price: 2,
                  sort_order: 0,
                  created_at: "",
                  updated_at: "",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("MenuPreview", () => {
  it("renders menu, item, and modifier details", () => {
    render(<MenuPreview menu={menu} publicView />);

    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Classic Burger")).toBeInTheDocument();
    expect(screen.getByText("Popular")).toBeInTheDocument();
    expect(screen.getByText("Cheese")).toBeInTheDocument();
  });
});
