import { loadRestaurantBySlug, loadRestaurantGallery } from "@/lib/restaurant/data";
import { notFound } from "next/navigation";
import type { PublicRestaurant } from "@/lib/restaurant/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function getPublicRestaurant(
  params: Promise<{ slug: string }>,
  options?: { galleryLimit?: number },
): Promise<PublicRestaurant> {
  const { slug } = await params;
  const restaurant = await loadRestaurantBySlug(slug, false);

  if (!restaurant) notFound();

  if (options?.galleryLimit == null || options.galleryLimit <= 0) {
    return restaurant;
  }

  const gallery = await loadRestaurantGallery(restaurant.id, options.galleryLimit);
  return { ...restaurant, gallery };
}

export type RestaurantPageProps = PageProps;
