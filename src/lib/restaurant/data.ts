import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getDemoRestaurant,
  isDemoRestaurantId,
  isDemoRestaurantSlug,
} from "@/lib/restaurant/demo-data";
import {
  fetchRestaurantById,
  fetchRestaurantBySlug,
  fetchPublishedRestaurants,
} from "@/lib/restaurant/service";
import type { PublicRestaurant, Restaurant } from "@/lib/restaurant/types";

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
    const supabase = await createClient();
    const restaurant = await fetchRestaurantBySlug(supabase, slug, options);

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

const SHARED_GALLERY_LIMIT = 50;

export const loadRestaurantBySlug = cache(
  async (
    slug: string,
    includeUnpublished = false,
  ): Promise<PublicRestaurant | null> => {
    return loadRestaurantBySlugImpl(slug, {
      includeUnpublished,
      galleryLimit: SHARED_GALLERY_LIMIT,
    });
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
