import { cookies, headers } from "next/headers";
import { loadRestaurantBySlug, loadRestaurantGallery } from "@/lib/restaurant/data";
import { notFound } from "next/navigation";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { validateTableSession } from "@/lib/table/data";
import { TABLE_SESSION_COOKIE } from "@/lib/table/session";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function canViewUnpublishedRestaurant(slug: string): Promise<boolean> {
  const headerStore = await headers();
  if (headerStore.get("x-restaurant-preview") === "1") {
    return true;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(TABLE_SESSION_COOKIE)?.value;
  if (!sessionToken) return false;

  const session = await validateTableSession(sessionToken);
  return session?.restaurant_slug === slug;
}

export async function loadGuestRestaurant(slug: string): Promise<PublicRestaurant | null> {
  const includeUnpublished = await canViewUnpublishedRestaurant(slug);
  return loadRestaurantBySlug(slug, includeUnpublished);
}

/** Published lookup first so public pages stay cacheable and skip cookies/headers. */
export async function loadPublicRestaurantBySlug(
  slug: string,
): Promise<PublicRestaurant | null> {
  const published = await loadRestaurantBySlug(slug, false);
  if (published) return published;
  return loadGuestRestaurant(slug);
}

export async function getPublicRestaurant(
  params: Promise<{ slug: string }>,
  options?: { galleryLimit?: number },
): Promise<PublicRestaurant> {
  const { slug } = await params;
  const restaurant = await loadPublicRestaurantBySlug(slug);

  if (!restaurant) notFound();

  if (options?.galleryLimit == null || options.galleryLimit <= 0) {
    return restaurant;
  }

  const gallery = await loadRestaurantGallery(restaurant.id, options.galleryLimit);
  return { ...restaurant, gallery };
}

export type RestaurantPageProps = PageProps;
