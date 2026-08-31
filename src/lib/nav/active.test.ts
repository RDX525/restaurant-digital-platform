import { describe, expect, it } from "vitest";
import { isPrefixRouteActive } from "./active";

describe("isPrefixRouteActive", () => {
  it("marks an exact dashboard route as active", () => {
    expect(isPrefixRouteActive("/dashboard/menus", "/dashboard/menus")).toBe(true);
  });

  it("marks nested editor routes as active", () => {
    expect(
      isPrefixRouteActive("/dashboard/menus/abc", "/dashboard/menus"),
    ).toBe(true);
  });

  it("does not treat sibling routes as active", () => {
    expect(isPrefixRouteActive("/dashboard/orders", "/dashboard/menus")).toBe(
      false,
    );
    expect(
      isPrefixRouteActive("/dashboard/menus-archive", "/dashboard/menus"),
    ).toBe(false);
  });
});
