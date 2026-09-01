import type { PublicRestaurant } from "@/lib/restaurant/types";
import {
  buildBreadcrumbJsonLd,
  buildRestaurantJsonLd,
} from "@/lib/restaurant/seo";

interface StructuredDataProps {
  restaurant: PublicRestaurant;
  breadcrumbs?: { name: string; path: string }[];
}

export function StructuredData({
  restaurant,
  breadcrumbs = [],
}: StructuredDataProps) {
  const schemas =
    breadcrumbs.length > 0
      ? [buildBreadcrumbJsonLd(restaurant, breadcrumbs)]
      : [buildRestaurantJsonLd(restaurant)];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}
