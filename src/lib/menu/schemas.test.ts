import { describe, expect, it } from "vitest";
import {
  categorySchema,
  menuItemSchema,
  menuPatchSchema,
  menuSchema,
  modifierGroupSchema,
  modifierSchema,
  reorderSchema,
} from "@/lib/menu/schemas";

describe("menuSchema", () => {
  it("accepts valid menu input", () => {
    const result = menuSchema.parse({
      name: "Lunch Menu",
      description: "Available weekdays",
      is_active: true,
    });
    expect(result.name).toBe("Lunch Menu");
  });

  it("rejects empty menu name", () => {
    expect(() => menuSchema.parse({ name: "" })).toThrow();
  });
});

describe("menuPatchSchema", () => {
  it("accepts an activate-only payload without filling other fields", () => {
    expect(menuPatchSchema.parse({ is_active: true })).toEqual({ is_active: true });
  });

  it("rejects an empty patch", () => {
    expect(() => menuPatchSchema.parse({})).toThrow();
  });
});

describe("categorySchema", () => {
  it("accepts valid category input", () => {
    const result = categorySchema.parse({ name: "Burgers" });
    expect(result.name).toBe("Burgers");
  });
});

describe("menuItemSchema", () => {
  it("accepts full item payload", () => {
    const result = menuItemSchema.parse({
      name: "Classic Burger",
      description: "Beef patty with lettuce",
      price: "14.50",
      ingredients: ["beef", "lettuce"],
      allergens: ["gluten"],
      dietary_info: [],
      is_available: true,
      is_sold_out: false,
      is_popular: true,
      is_recommended: false,
    });

    expect(result.name).toBe("Classic Burger");
    expect(result.price).toBe(14.5);
  });

  it("rejects negative price", () => {
    expect(() =>
      menuItemSchema.parse({ name: "Burger", price: -1 }),
    ).toThrow();
  });
});

describe("modifierGroupSchema", () => {
  it("accepts valid modifier group", () => {
    const result = modifierGroupSchema.parse({
      name: "Toppings",
      is_required: false,
      min_selections: 0,
      max_selections: 3,
    });
    expect(result.max_selections).toBe(3);
  });

  it("rejects max less than min", () => {
    expect(() =>
      modifierGroupSchema.parse({
        name: "Toppings",
        min_selections: 2,
        max_selections: 1,
      }),
    ).toThrow();
  });

  it("requires min 1 when group is required", () => {
    expect(() =>
      modifierGroupSchema.parse({
        name: "Cheese",
        is_required: true,
        min_selections: 0,
        max_selections: 1,
      }),
    ).toThrow();
  });
});

describe("modifierSchema", () => {
  it("accepts modifier with price", () => {
    const result = modifierSchema.parse({ name: "Bacon", price: "2.50" });
    expect(result.price).toBe(2.5);
  });
});

describe("reorderSchema", () => {
  it("accepts reorder payload", () => {
    const result = reorderSchema.parse([
      { id: "00000000-0000-4000-8000-000000000001", sort_order: 0 },
      { id: "00000000-0000-4000-8000-000000000002", sort_order: 1 },
    ]);
    expect(result).toHaveLength(2);
  });
});
