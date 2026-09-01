import { describe, expect, it } from "vitest";
import {
  absoluteSocialHref,
  formatRestaurantLocation,
  hexToRgbChannels,
  parseHexColor,
  restaurantAboutImage,
  restaurantSocialEntries,
  restaurantStoryExcerpt,
} from "./theme";

describe("restaurant theme", () => {
  it("parses 3- and 6-digit hex colors", () => {
    expect(parseHexColor("#1a3c34")).toEqual({ r: 26, g: 60, b: 52 });
    expect(parseHexColor("c9a")).toEqual({ r: 204, g: 153, b: 170 });
    expect(parseHexColor("not-a-color")).toBeNull();
  });

  it("chooses light text on dark brand colors", () => {
    expect(hexToRgbChannels("#1a3c34", "0 0 0").on).toBe("#ffffff");
    expect(hexToRgbChannels("#f4e7c5", "0 0 0").on).toBe("#14201c");
  });

  it("formats location without hardcoded country copy", () => {
    expect(
      formatRestaurantLocation({
        city: "Auckland",
        region: "Auckland",
        country: "New Zealand",
      }),
    ).toBe("Auckland, New Zealand");
    expect(
      formatRestaurantLocation({
        city: "Queenstown",
        region: "Otago",
        country: "New Zealand",
      }),
    ).toBe("Queenstown, Otago, New Zealand");
    expect(
      formatRestaurantLocation({ city: null, region: null, country: null }),
    ).toBeNull();
  });

  it("normalizes social urls and skips empty links", () => {
    expect(absoluteSocialHref("instagram.com/harbour")).toBe("https://instagram.com/harbour");
    expect(
      restaurantSocialEntries({
        instagram: "https://instagram.com/harbour",
        facebook: "",
      }),
    ).toEqual([{ network: "instagram", label: "Instagram", href: "https://instagram.com/harbour" }]);
  });

  it("prefers a gallery image that is not the hero for about", () => {
    expect(
      restaurantAboutImage({
        hero_image_url: "https://images.unsplash.com/photo-hero?w=1600",
        gallery: [
          {
            id: "1",
            restaurant_id: "r",
            image_url: "https://images.unsplash.com/photo-hero?w=1200",
            caption: "Dining room",
            sort_order: 0,
            created_at: "",
          },
          {
            id: "2",
            restaurant_id: "r",
            image_url: "https://images.unsplash.com/photo-kitchen?auto=format&w=2000",
            caption: "Kitchen",
            sort_order: 1,
            created_at: "",
          },
        ],
      } as never),
    ).toBe("https://images.unsplash.com/photo-kitchen?auto=format&w=2000");
  });

  it("trims story excerpts without cutting short copy", () => {
    expect(restaurantStoryExcerpt("Short story.")).toBe("Short story.");
    expect(restaurantStoryExcerpt("A".repeat(400)).endsWith("…")).toBe(true);
  });
});
