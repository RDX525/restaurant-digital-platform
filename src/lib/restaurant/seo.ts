import type { Metadata } from "next";
import type { PublicRestaurant, Restaurant } from "./types";
import { formatAddress } from "./service";
import { getSiteUrl } from "@/lib/env/site-url";

export function getRestaurantBasePath(slug: string): string {
  return `/r/${slug}`;
}

export function getRestaurantCanonicalUrl(
  restaurant: Pick<Restaurant, "slug" | "custom_domain">,
  path = "",
): string {
  const base =
    restaurant.custom_domain != null
      ? `https://${restaurant.custom_domain}`
      : `${getSiteUrl()}${getRestaurantBasePath(restaurant.slug)}`;

  if (!path || path === "/") return base;
  return `${base}/${path.replace(/^\//, "")}`;
}

export function buildRestaurantMetadata(
  restaurant: PublicRestaurant,
  page?: {
    title?: string;
    description?: string;
    path?: string;
    noIndex?: boolean;
  },
): Metadata {
  const title =
    page?.title ??
    restaurant.meta_title ??
    `${restaurant.name} | Restaurant`;
  const description =
    page?.description ??
    restaurant.meta_description ??
    restaurant.tagline ??
    `Visit ${restaurant.name} for great food and hospitality.`;
  const canonical = getRestaurantCanonicalUrl(restaurant, page?.path);
  const image =
    restaurant.hero_image_url ??
    restaurant.logo_url ??
    restaurant.gallery[0]?.image_url;

  return {
    title,
    description,
    alternates: { canonical },
    robots: page?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: restaurant.name,
      type: "website",
      locale: "en_NZ",
      ...(image ? { images: [{ url: image, alt: restaurant.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function buildRestaurantJsonLd(restaurant: PublicRestaurant) {
  const address = formatAddress(restaurant);
  const openingHours = Object.entries(restaurant.opening_hours ?? {})
    .filter(([, hours]) => hours && !hours.closed)
    .map(([day, hours]) => {
      const dayMap: Record<string, string> = {
        monday: "Mo",
        tuesday: "Tu",
        wednesday: "We",
        thursday: "Th",
        friday: "Fr",
        saturday: "Sa",
        sunday: "Su",
      };
      return `${dayMap[day]} ${hours!.open}-${hours!.close}`;
    });

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.about_text ?? restaurant.tagline ?? undefined,
    url: getRestaurantCanonicalUrl(restaurant),
    telephone: restaurant.phone ?? undefined,
    email: restaurant.email ?? undefined,
    image: restaurant.gallery.map((item) => item.image_url),
    logo: restaurant.logo_url ?? undefined,
    servesCuisine: "Restaurant",
    ...(address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: [restaurant.address_line1, restaurant.address_line2]
              .filter(Boolean)
              .join(", "),
            addressLocality: restaurant.city ?? undefined,
            addressRegion: restaurant.region ?? undefined,
            postalCode: restaurant.postal_code ?? undefined,
            addressCountry: restaurant.country ?? undefined,
          },
        }
      : {}),
    ...(restaurant.latitude != null && restaurant.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          },
        }
      : {}),
    ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),
    sameAs: Object.values(restaurant.social_links ?? {}).filter(Boolean),
    potentialAction: [
      restaurant.reservation_url
        ? {
            "@type": "ReserveAction",
            target: restaurant.reservation_url,
          }
        : null,
      restaurant.order_url
        ? {
            "@type": "OrderAction",
            target: restaurant.order_url,
          }
        : null,
    ].filter(Boolean),
  };
}

export function buildBreadcrumbJsonLd(
  restaurant: PublicRestaurant,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getRestaurantCanonicalUrl(restaurant, item.path),
    })),
  };
}
