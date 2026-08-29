import { headers } from "next/headers";
import { isPreviewMode } from "@/lib/restaurant/routing";
import { loadRestaurantBySlug } from "@/lib/restaurant/data";
import { notFound } from "next/navigation";
import type { PublicRestaurant } from "@/lib/restaurant/types";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

async function isPreviewEnabled(
  searchParams: Promise<{ preview?: string }>,
): Promise<boolean> {
  const query = await searchParams;
  if (isPreviewMode(query)) return true;
  const headerStore = await headers();
  return headerStore.get("x-restaurant-preview") === "1";
}

export async function getPublicRestaurant(
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ preview?: string }>,
  options?: { galleryLimit?: number },
): Promise<PublicRestaurant> {
  const { slug } = await params;
  const preview = await isPreviewEnabled(searchParams);

  const restaurant = await loadRestaurantBySlug(slug, preview);

  if (!restaurant) notFound();

  if (options?.galleryLimit != null) {
    return { ...restaurant, gallery: restaurant.gallery.slice(0, options.galleryLimit) };
  }

  return restaurant;
}

export type RestaurantPageProps = PageProps;
