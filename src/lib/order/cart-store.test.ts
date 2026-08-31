import { afterEach, describe, expect, it } from "vitest";
import type { CartLineItem } from "./types";
import {
  getCartLinesForMenuItem,
  resetCartItemsSnapshot,
  setCartItemsSnapshot,
} from "./cart-store";

function line(partial: Partial<CartLineItem> & Pick<CartLineItem, "id" | "menuItemId">): CartLineItem {
  return {
    name: "Dish",
    basePrice: 10,
    quantity: 1,
    modifiers: [],
    lineTotal: 10,
    ...partial,
  };
}

afterEach(() => {
  resetCartItemsSnapshot();
});

describe("cart-store", () => {
  it("returns a stable empty array when an item is not in the cart", () => {
    const first = getCartLinesForMenuItem("item-a");
    const second = getCartLinesForMenuItem("item-a");
    expect(first).toBe(second);
    expect(first).toEqual([]);
  });

  it("keeps the same snapshot for unrelated cart updates", () => {
    setCartItemsSnapshot([line({ id: "1", menuItemId: "item-a", quantity: 1 })]);
    const itemA = getCartLinesForMenuItem("item-a");

    setCartItemsSnapshot([
      line({ id: "1", menuItemId: "item-a", quantity: 1 }),
      line({ id: "2", menuItemId: "item-b", quantity: 1 }),
    ]);

    expect(getCartLinesForMenuItem("item-a")).toBe(itemA);
    expect(getCartLinesForMenuItem("item-b")).toHaveLength(1);
  });

  it("returns a new snapshot when the matching line quantity changes", () => {
    setCartItemsSnapshot([line({ id: "1", menuItemId: "item-a", quantity: 1 })]);
    const before = getCartLinesForMenuItem("item-a");
    setCartItemsSnapshot([line({ id: "1", menuItemId: "item-a", quantity: 2, lineTotal: 20 })]);
    const after = getCartLinesForMenuItem("item-a");
    expect(after).not.toBe(before);
    expect(after[0]?.quantity).toBe(2);
  });
});
