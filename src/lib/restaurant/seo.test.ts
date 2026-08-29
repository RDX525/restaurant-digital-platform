import { describe, expect, it } from "vitest";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import {
  buildRestaurantMetadata,
  getRestaurantBasePath,
  getRestaurantCanonicalUrl,
} from "@/lib/restaurant/seo";
import { isPreviewMode, resolveRestaurantPath } from "@/lib/restaurant/routing";

const restaurant: PublicRestaurant = {
  id: "1",
  name: "Demo Restaurant",
  slug: "demo-restaurant",
  tagline: "Great food",
  about_text: "About us",
  logo_url: null,
  hero_image_url: null,
  primary_color: "#c2410c",
  secondary_color: "#1c1917",
  accent_color: "#f97316",
  phone: null,
  email: null,
  address_line1: null,
  address_line2: null,
  city: "Auckland",
  region: null,
  postal_code: null,
  country: "New Zealand",
  latitude: null,
  longitude: null,
  google_maps_url: null,
  opening_hours: {},
  social_links: {},
  order_url: "/r/demo-restaurant/order",
  reservation_url: "/r/demo-restaurant/reservations",
  meta_title: "Demo Restaurant",
  meta_description: "Best dining",
  is_published: true,
  custom_domain: null,
  created_at: "",
  updated_at: "",
  gallery: [],
};

describe("restaurant seo", () => {
  it("builds canonical urls from slug", () => {
    expect(getRestaurantBasePath("demo-restaurant")).toBe("/r/demo-restaurant");
    expect(getRestaurantCanonicalUrl(restaurant, "menu")).toContain("/menu");
  });

  it("builds metadata with canonical and open graph", () => {
    const metadata = buildRestaurantMetadata(restaurant, {
      title: "Menu | Demo Restaurant",
      path: "menu",
    });
    expect(metadata.title).toBe("Menu | Demo Restaurant");
    expect(metadata.alternates?.canonical).toContain("/menu");
    expect(metadata.openGraph?.title).toBe("Menu | Demo Restaurant");
  });
});

describe("restaurant routing", () => {
  it("detects preview mode", () => {
    expect(isPreviewMode({ preview: "1" })).toBe(true);
    expect(isPreviewMode({ preview: "true" })).toBe(true);
    expect(isPreviewMode({})).toBe(false);
  });

  it("resolves internal restaurant paths", () => {
    expect(resolveRestaurantPath(restaurant, "order")).toBe(
      "/r/demo-restaurant/order",
    );
  });
});
