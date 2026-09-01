import { describe, expect, it } from "vitest";
import {
  buildCartLineItem,
  calculateCartTotals,
  calculateLineTotal,
  cartStorageKey,
  dineInCartScope,
  mergeItemIntoCart,
  countUniqueDishes,
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

  it("merges matching cart lines by increasing quantity", () => {
    const first = buildCartLineItem(item, 1, []);
    const second = buildCartLineItem(item, 2, []);
    const merged = mergeItemIntoCart([first], second);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe(first.id);
    expect(merged[0]?.quantity).toBe(3);
    expect(merged[0]?.lineTotal).toBe(126);
  });

  it("keeps separate lines when modifiers differ", () => {
    const plain = buildCartLineItem(item, 1, []);
    const withModifier = buildCartLineItem(item, 1, [
      {
        id: "mod-1",
        groupId: "group-1",
        groupName: "Cooking preference",
        name: "Medium rare",
        price: 0,
      },
    ]);

    expect(mergeItemIntoCart([plain], withModifier)).toHaveLength(2);
  });

  it("scopes dine-in carts separately from website carts", () => {
    expect(cartStorageKey("demo")).toBe("kati-cart:demo");
    expect(cartStorageKey("demo", "web")).toBe("kati-cart:demo");
    expect(cartStorageKey("demo", dineInCartScope("table-1", "session-a"))).toBe(
      "kati-cart:demo:table:table-1:session:session-a",
    );
    expect(dineInCartScope("table-1", "session-a")).not.toBe(
      dineInCartScope("table-1", "session-b"),
    );
  });

  it("counts unique dishes rather than portions", () => {
    const first = buildCartLineItem(item, 3, []);
    const second = buildCartLineItem(item, 1, [
      {
        id: "mod-1",
        groupId: "group-1",
        groupName: "Cooking preference",
        name: "Medium rare",
        price: 0,
      },
    ]);
    const other = { ...first, id: "line-other", menuItemId: "item-2" };

    expect(countUniqueDishes([first])).toBe(1);
    expect(countUniqueDishes([first, second])).toBe(1);
    expect(countUniqueDishes([first, other])).toBe(2);
  });
});
