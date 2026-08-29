import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export async function generateMetadata({ params, searchParams }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams);
  return buildRestaurantMetadata(restaurant, {
    title: `About | ${restaurant.name}`,
    description: restaurant.about_text ?? restaurant.tagline ?? undefined,
    path: "about",
  });
}

export default async function AboutPage({ params, searchParams }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams);

  return (
    <>
      <StructuredData
        restaurant={restaurant}
        breadcrumbs={[
          { name: "Home", path: "" },
          { name: "About", path: "about" },
        ]}
      />
      <PageHeader
        restaurant={restaurant}
        eyebrow="About us"
        title={`The story of ${restaurant.name}`}
        description={restaurant.tagline ?? undefined}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {restaurant.about_text ? (
          <div className="panel">
            <p className="prose-restaurant whitespace-pre-line">{restaurant.about_text}</p>
          </div>
        ) : (
          <div className="empty-state">About content coming soon.</div>
        )}
      </div>
    </>
  );
}
