import { describe, expect, it } from "vitest";
import {
  getRestaurantNavHref,
  isRestaurantNavActive,
  restaurantUsesRootPaths,
} from "./routing";

describe("restaurantUsesRootPaths", () => {
  it("uses platform paths under /r/[slug]", () => {
    expect(restaurantUsesRootPaths("/r/harbour-kitchen/menu", "harbour-kitchen")).toBe(
      false,
    );
  });

  it("uses root paths on a custom domain", () => {
    expect(restaurantUsesRootPaths("/menu", "harbour-kitchen")).toBe(true);
  });
});

describe("isRestaurantNavActive", () => {
  it("marks home only on the restaurant root", () => {
    const href = getRestaurantNavHref("harbour-kitchen", "", false);
    expect(isRestaurantNavActive("/r/harbour-kitchen", href, "", "harbour-kitchen")).toBe(
      true,
    );
    expect(
      isRestaurantNavActive("/r/harbour-kitchen/menu", href, "", "harbour-kitchen"),
    ).toBe(false);
    expect(
      isRestaurantNavActive("/r/harbour-kitchen/about", href, "", "harbour-kitchen"),
    ).toBe(false);
  });

  it("marks nested restaurant pages without lighting up siblings", () => {
    const menuHref = getRestaurantNavHref("harbour-kitchen", "menu", false);
    expect(
      isRestaurantNavActive("/r/harbour-kitchen/menu", menuHref, "menu", "harbour-kitchen"),
    ).toBe(true);
    expect(
      isRestaurantNavActive(
        "/r/harbour-kitchen/menu/item",
        menuHref,
        "menu",
        "harbour-kitchen",
      ),
    ).toBe(true);
    expect(
      isRestaurantNavActive(
        "/r/harbour-kitchen/contact",
        menuHref,
        "menu",
        "harbour-kitchen",
      ),
    ).toBe(false);
  });

  it("resolves custom-domain home and inner pages", () => {
    const homeHref = getRestaurantNavHref("harbour-kitchen", "", true);
    const aboutHref = getRestaurantNavHref("harbour-kitchen", "about", true);
    expect(isRestaurantNavActive("/", homeHref, "", "harbour-kitchen")).toBe(true);
    expect(isRestaurantNavActive("/about", homeHref, "", "harbour-kitchen")).toBe(false);
    expect(isRestaurantNavActive("/about", aboutHref, "about", "harbour-kitchen")).toBe(
      true,
    );
  });
});
