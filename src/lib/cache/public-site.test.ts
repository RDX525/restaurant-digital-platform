import { describe, expect, it } from "vitest";
import {
  PUBLIC_MENU_CACHE_TAG,
  PUBLIC_RESTAURANT_CACHE_TAG,
  publicMenuByIdPath,
  publicRestaurantMenuPath,
  publicRestaurantPath,
} from "@/lib/cache/public-site";

describe("public site cache helpers", () => {
  it("builds the live restaurant path from slug", () => {
    expect(publicRestaurantPath("harbour-kitchen")).toBe("/r/harbour-kitchen");
    expect(publicRestaurantMenuPath("harbour-kitchen")).toBe("/r/harbour-kitchen/menu");
    expect(publicMenuByIdPath("menu-1")).toBe("/menu/menu-1");
  });

  it("uses stable tags for published restaurant and menu pages", () => {
    expect(PUBLIC_RESTAURANT_CACHE_TAG).toBe("public-restaurant");
    expect(PUBLIC_MENU_CACHE_TAG).toBe("public-menu");
  });
});
