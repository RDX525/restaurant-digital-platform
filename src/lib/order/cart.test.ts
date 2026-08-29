import { describe, expect, it } from "vitest";
import {
  buildCartLineItem,
  calculateCartTotals,
  calculateLineTotal,
  validateModifierSelection,
} from "@/lib/order/cart";
import type { MenuItemWithModifiers } from "@/lib/menu/types";

const item: MenuItemWithModifiers = {
  id: "item-1",
  category_id: "cat-1",
  name: "Lamb Rack",
  description: null,
  price: 42,
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
  modifier_groups: [
    {
      id: "group-1",
      menu_item_id: "item-1",
      name: "Cooking preference",
      is_required: true,
      min_selections: 1,
      max_selections: 1,
      sort_order: 0,
      created_at: "",
      updated_at: "",
      modifiers: [
        {
          id: "mod-1",
          group_id: "group-1",
          name: "Medium rare",
          price: 0,
          sort_order: 0,
          created_at: "",
          updated_at: "",
        },
      ],
    },
  ],
};

describe("order cart", () => {
  it("calculates line totals with modifiers", () => {
    const lineItem = buildCartLineItem(item, 2, [
      {
        id: "mod-1",
        groupId: "group-1",
        groupName: "Cooking preference",
        name: "Medium rare",
        price: 0,
      },
    ]);

    expect(lineItem.lineTotal).toBe(84);
    expect(calculateLineTotal(42, [], 2)).toBe(84);
  });

  it("requires mandatory modifier groups", () => {
    expect(validateModifierSelection(item, [])).toMatch(/Cooking preference/);
  });

  it("adds delivery fee and GST for delivery orders", () => {
    const lineItem = buildCartLineItem(item, 1, []);
    const totals = calculateCartTotals([lineItem], "delivery");
    expect(totals.deliveryFee).toBeGreaterThan(0);
    expect(totals.taxAmount).toBeGreaterThan(0);
    expect(totals.total).toBeGreaterThan(totals.subtotal);
  });
});
