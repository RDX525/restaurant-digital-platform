import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getDemoRestaurant,
  isDemoRestaurantId,
  isDemoRestaurantSlug,
} from "@/lib/restaurant/demo-data";
import {
  fetchRestaurantById,
  fetchRestaurantBySlug,
  fetchRestaurantGallery,
  fetchPublishedRestaurants,
} from "@/lib/restaurant/service";
import type { PublicRestaurant, Restaurant } from "@/lib/restaurant/types";
import { PUBLIC_RESTAURANT_CACHE_TAG } from "@/lib/cache/public-site";

type SlugOptions = { includeUnpublished?: boolean; galleryLimit?: number };

function sliceDemoGallery(limit?: number) {
  const gallery = getDemoRestaurant().gallery;
  if (limit == null || limit <= 0) return [];
  return gallery.slice(0, limit);
}

function shouldUseDemoFallback(slug: string, options?: SlugOptions): boolean {
  if (!isDemoRestaurantSlug(slug)) return false;
  if (options?.includeUnpublished) return true;
  return getDemoRestaurant().is_published;
}

async function loadRestaurantBySlugImpl(
  slug: string,
  options?: SlugOptions,
): Promise<PublicRestaurant | null> {
  if (shouldUseDemoFallback(slug, options) && !isSupabaseConfigured()) {
    const demo = getDemoRestaurant();
    return { ...demo, gallery: sliceDemoGallery(options?.galleryLimit) };
  }

  if (!isSupabaseConfigured()) {
    if (!shouldUseDemoFallback(slug, options)) return null;
    const demo = getDemoRestaurant();
    return { ...demo, gallery: sliceDemoGallery(options?.galleryLimit) };
  }

  try {
    const supabase = options?.includeUnpublished
      ? await createClient()
      : createPublicClient();
    if (!supabase) return null;

    const restaurant = await fetchRestaurantBySlug(supabase, slug, {
      ...options,
      galleryLimit: options?.galleryLimit ?? 0,
    });

    if (restaurant) return restaurant;

    if (shouldUseDemoFallback(slug, options)) {
      const demo = getDemoRestaurant();
      return { ...demo, gallery: sliceDemoGallery(options?.galleryLimit) };
    }

    return null;
  } catch {
    if (shouldUseDemoFallback(slug, options)) {
      const demo = getDemoRestaurant();
      return { ...demo, gallery: sliceDemoGallery(options?.galleryLimit) };
    }
    return null;
  }
}

const getCachedPublishedRestaurant =
  process.env.VITEST === "true"
    ? (slug: string) =>
        loadRestaurantBySlugImpl(slug, { includeUnpublished: false, galleryLimit: 0 })
    : unstable_cache(
        async (slug: string) =>
          loadRestaurantBySlugImpl(slug, { includeUnpublished: false, galleryLimit: 0 }),
        ["public-restaurant-by-slug", "harbour-demo-v2"],
        { revalidate: 60, tags: [PUBLIC_RESTAURANT_CACHE_TAG] },
      );

const getCachedRestaurantGallery =
  process.env.VITEST === "true"
    ? loadRestaurantGalleryUncached
    : unstable_cache(loadRestaurantGalleryUncached, ["public-restaurant-gallery"], {
        revalidate: 60,
        tags: [PUBLIC_RESTAURANT_CACHE_TAG],
      });

async function loadRestaurantGalleryUncached(restaurantId: string, limit: number) {
  if (isDemoRestaurantId(restaurantId) && !isSupabaseConfigured()) {
    return sliceDemoGallery(limit);
  }

  const supabase = createPublicClient();
  if (!supabase) {
    return isDemoRestaurantId(restaurantId) ? sliceDemoGallery(limit) : [];
  }

  try {
    return await fetchRestaurantGallery(supabase, restaurantId, limit);
  } catch {
    return isDemoRestaurantId(restaurantId) ? sliceDemoGallery(limit) : [];
  }
}

export const loadRestaurantBySlug = cache(
  async (
    slug: string,
    includeUnpublished = false,
  ): Promise<PublicRestaurant | null> => {
    if (includeUnpublished) {
      return loadRestaurantBySlugImpl(slug, { includeUnpublished: true, galleryLimit: 0 });
    }
    return getCachedPublishedRestaurant(slug);
  },
);

export const loadRestaurantGallery = cache(
  async (restaurantId: string, limit: number): Promise<PublicRestaurant["gallery"]> => {
    return getCachedRestaurantGallery(restaurantId, limit);
  },
);

export async function loadRestaurantById(
  id: string,
  options?: { galleryLimit?: number },
): Promise<PublicRestaurant | null> {
  if (isDemoRestaurantId(id) && !isSupabaseConfigured()) {
    const demo = getDemoRestaurant();
    return { ...demo, gallery: sliceDemoGallery(options?.galleryLimit) };
  }

  if (!isSupabaseConfigured()) {
    if (!isDemoRestaurantId(id)) return null;
    const demo = getDemoRestaurant();
    return { ...demo, gallery: sliceDemoGallery(options?.galleryLimit) };
  }

  try {
    const supabase = await createClient();
    const restaurant = await fetchRestaurantById(supabase, id, options);

    if (restaurant) return restaurant;

    if (isDemoRestaurantId(id)) {
      const demo = getDemoRestaurant();
      return { ...demo, gallery: sliceDemoGallery(options?.galleryLimit) };
    }

    return null;
  } catch {
    if (isDemoRestaurantId(id)) {
      const demo = getDemoRestaurant();
      return { ...demo, gallery: sliceDemoGallery(options?.galleryLimit) };
    }
    return null;
  }
}

export async function loadPublishedRestaurants(): Promise<Restaurant[]> {
  if (!isSupabaseConfigured()) {
    return [getDemoRestaurant()];
  }

  try {
    const supabase = await createClient();
    const restaurants = await fetchPublishedRestaurants(supabase);
    if (restaurants.length > 0) return restaurants;
    return [getDemoRestaurant()];
  } catch {
    return [getDemoRestaurant()];
  }
}
