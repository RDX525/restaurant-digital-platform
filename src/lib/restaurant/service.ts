import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicRestaurant, Restaurant } from "./types";

type SlugOptions = { includeUnpublished?: boolean; galleryLimit?: number };

function mapRestaurant(row: Restaurant): Restaurant {
  return {
    ...row,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    opening_hours: (row.opening_hours ?? {}) as Restaurant["opening_hours"],
    social_links: (row.social_links ?? {}) as Restaurant["social_links"],
  };
}

export async function fetchRestaurantBySlug(
  supabase: SupabaseClient,
  slug: string,
  options?: SlugOptions,
): Promise<PublicRestaurant | null> {
  let query = supabase.from("restaurants").select("*").eq("slug", slug);

  if (!options?.includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data: restaurant, error } = await query.single();
  if (error || !restaurant) return null;

  let gallery: PublicRestaurant["gallery"] = [];
  if (options?.galleryLimit != null && options.galleryLimit > 0) {
    const { data, error: galleryError } = await supabase
      .from("restaurant_gallery_images")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true })
      .limit(options.galleryLimit);

    if (galleryError) throw galleryError;
    gallery = data ?? [];
  }

  return {
    ...mapRestaurant(restaurant as Restaurant),
    gallery,
  };
}

export async function fetchRestaurantByDomain(
  supabase: SupabaseClient,
  domain: string,
  options?: SlugOptions,
): Promise<PublicRestaurant | null> {
  const { data: domainRow, error: domainError } = await supabase
    .from("restaurant_domains")
    .select("restaurant_id")
    .eq("domain", domain)
    .single();

  if (domainError || !domainRow) {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("slug")
      .eq("custom_domain", domain)
      .maybeSingle();

    if (!restaurant?.slug) return null;
    return fetchRestaurantBySlug(supabase, restaurant.slug, options);
  }

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", domainRow.restaurant_id)
    .maybeSingle();

  if (error || !restaurant) return null;
  if (!options?.includeUnpublished && !restaurant.is_published) return null;

  return fetchRestaurantBySlug(supabase, restaurant.slug, options);
}

export async function fetchRestaurantById(
  supabase: SupabaseClient,
  id: string,
  options?: { galleryLimit?: number },
): Promise<PublicRestaurant | null> {
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !restaurant) return null;

  let gallery: PublicRestaurant["gallery"] = [];
  if (options?.galleryLimit != null && options.galleryLimit > 0) {
    const { data, error: galleryError } = await supabase
      .from("restaurant_gallery_images")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order", { ascending: true })
      .limit(options.galleryLimit);

    if (galleryError) throw galleryError;
    gallery = data ?? [];
  }

  return {
    ...mapRestaurant(restaurant as Restaurant),
    gallery,
  };
}

export async function fetchPublishedRestaurants(
  supabase: SupabaseClient,
): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_published", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRestaurant(row as Restaurant));
}

export async function fetchActiveMenuForRestaurant(
  supabase: SupabaseClient,
  restaurantId: string,
) {
  const { data, error } = await supabase
    .from("menus")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export function formatAddress(restaurant: Restaurant): string {
  return [
    restaurant.address_line1,
    restaurant.address_line2,
    restaurant.city,
    restaurant.region,
    restaurant.postal_code,
    restaurant.country,
  ]
    .filter(Boolean)
    .join(", ");
}
