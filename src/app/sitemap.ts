import type { MetadataRoute } from "next";
import { loadPublishedRestaurants } from "@/lib/restaurant/data";
import { getRestaurantCanonicalUrl } from "@/lib/restaurant/seo";
import { PUBLIC_PAGES } from "@/lib/restaurant/types";
import { getSiteUrl } from "@/lib/env/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  let restaurants = [];

  try {
    restaurants = await loadPublishedRestaurants();
  } catch {
    return [{ url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
  }

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const restaurant of restaurants) {
    for (const page of PUBLIC_PAGES) {
      const path = page ? `/${page}` : "";
      entries.push({
        url: getRestaurantCanonicalUrl(restaurant, path),
        lastModified: new Date(restaurant.updated_at),
        changeFrequency: page === "menu" ? "daily" : "weekly",
        priority: page === "" ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
