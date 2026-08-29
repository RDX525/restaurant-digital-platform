import { describe, expect, it } from "vitest";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDemoRestaurant } from "@/lib/restaurant/demo-data";
import { loadRestaurantBySlug } from "@/lib/restaurant/data";

describe("demo restaurant fallback", () => {
  it("loads published demo restaurant without Supabase", async () => {
    if (isSupabaseConfigured()) return;

    const restaurant = await loadRestaurantBySlug("harbour-kitchen", false);

    expect(restaurant?.name).toBe("Harbour Kitchen");
    expect(restaurant?.is_published).toBe(true);
  });

  it("supports legacy demo-restaurant slug", async () => {
    if (isSupabaseConfigured()) return;

    const restaurant = await loadRestaurantBySlug("demo-restaurant", false);
    expect(restaurant?.name).toBe("Harbour Kitchen");
  });

  it("includes demo gallery content", () => {
    expect(getDemoRestaurant().gallery.length).toBeGreaterThan(0);
  });
});
