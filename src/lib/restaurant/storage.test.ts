import { describe, expect, it } from "vitest";
import {
  restaurantAssetExtension,
  restaurantAssetObjectPath,
  restaurantAssetPathFromPublicUrl,
} from "./storage";

describe("restaurant asset storage", () => {
  it("scopes gallery files under the restaurant folder", () => {
    expect(restaurantAssetObjectPath("rest-1", "gallery", "jpg", 100)).toBe(
      "rest-1/gallery/100.jpg",
    );
    expect(restaurantAssetObjectPath("rest-1", "logo", "png", 100)).toBe(
      "rest-1/logo-100.png",
    );
  });

  it("maps jpeg mime types to jpg", () => {
    expect(restaurantAssetExtension("image/jpeg")).toBe("jpg");
    expect(restaurantAssetExtension("image/webp")).toBe("webp");
  });

  it("extracts a tenant-owned object path from a public URL", () => {
    const path = restaurantAssetPathFromPublicUrl(
      "https://abc.supabase.co/storage/v1/object/public/restaurant-assets/rest-1/gallery/100.jpg",
      "rest-1",
    );
    expect(path).toBe("rest-1/gallery/100.jpg");
  });

  it("rejects public URLs that belong to another restaurant", () => {
    expect(
      restaurantAssetPathFromPublicUrl(
        "https://abc.supabase.co/storage/v1/object/public/restaurant-assets/other/gallery/100.jpg",
        "rest-1",
      ),
    ).toBeNull();
  });
});
