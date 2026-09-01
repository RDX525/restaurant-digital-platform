import { describe, expect, it } from "vitest";
import { menuImageObjectPath } from "@/lib/menu/storage";

describe("menuImageObjectPath", () => {
  it("prefixes the object key with restaurant_id for storage RLS", () => {
    expect(menuImageObjectPath("rest-1", "item-1", "png", 1700000000000)).toBe(
      "rest-1/item-1/1700000000000.png",
    );
  });
});
