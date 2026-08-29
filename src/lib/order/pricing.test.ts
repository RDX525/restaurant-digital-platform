import { describe, expect, it } from "vitest";
import { getDemoFullMenu } from "@/lib/menu/demo-data";
import { getDemoRestaurantId } from "@/lib/utils";
import {
  OrderValidationError,
  calculateOrderTotals,
  priceOrderLines,
  validateOrderAgainstMenu,
} from "@/lib/order/pricing";

describe("order pricing", () => {
  const menu = getDemoFullMenu();
  const lambRack = menu.categories
    .flatMap((category) => category.items)
    .find((item) => item.name === "Central Otago Lamb Rack")!;

  it("prices lines from database menu data, not client values", () => {
    const lines = priceOrderLines(menu, [
      {
        menuItemId: lambRack.id,
        quantity: 2,
        modifierIds: [lambRack.modifier_groups[0]!.modifiers[0]!.id],
      },
    ]);

    expect(lines[0]!.basePrice).toBe(44);
    expect(lines[0]!.lineTotal).toBe(88);
    expect(lines[0]!.modifiers[0]!.name).toBeTruthy();
  });

  it("rejects unavailable items", () => {
    const unavailable = { ...lambRack, is_available: false };
    const patchedMenu = {
      ...menu,
      categories: menu.categories.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === lambRack.id ? unavailable : item,
        ),
      })),
    };

    expect(() =>
      priceOrderLines(patchedMenu, [
        { menuItemId: lambRack.id, quantity: 1, modifierIds: [lambRack.modifier_groups[0]!.modifiers[0]!.id] },
      ]),
    ).toThrow(OrderValidationError);
  });

  it("rejects cross-menu item references", () => {
    expect(() =>
      validateOrderAgainstMenu(menu, "00000000-0000-4000-8000-000000009999", [
        { menuItemId: lambRack.id, quantity: 1, modifierIds: [] },
      ]),
    ).toThrow(/does not belong/);
  });

  it("rejects modifiers from a different menu item", () => {
    const otherItem = menu.categories.flatMap((c) => c.items).find((i) => i.id !== lambRack.id)!;

    expect(() =>
      priceOrderLines(menu, [
        {
          menuItemId: lambRack.id,
          quantity: 1,
          modifierIds: [otherItem.modifier_groups[0]?.modifiers[0]?.id ?? "invalid"],
        },
      ]),
    ).toThrow(OrderValidationError);
  });

  it("calculates GST and delivery fee server-side", () => {
    const lines = priceOrderLines(menu, [
      {
        menuItemId: menu.categories[0]!.items[0]!.id,
        quantity: 1,
        modifierIds: [],
      },
    ]);

    const deliveryTotals = calculateOrderTotals(lines, "delivery");
    expect(deliveryTotals.deliveryFee).toBeGreaterThan(0);
    expect(deliveryTotals.taxAmount).toBeGreaterThan(0);
    expect(deliveryTotals.total).toBeGreaterThan(deliveryTotals.subtotal);

    const dineInTotals = calculateOrderTotals(lines, "dine_in");
    expect(dineInTotals.deliveryFee).toBe(0);
  });

  it("validates restaurant ownership through menu", () => {
    expect(menu.restaurant_id).toBe(getDemoRestaurantId());
    const lines = validateOrderAgainstMenu(menu, getDemoRestaurantId(), [
      { menuItemId: menu.categories[0]!.items[0]!.id, quantity: 1, modifierIds: [] },
    ]);
    expect(lines).toHaveLength(1);
  });
});
