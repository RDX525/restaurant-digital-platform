import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { loadPublicMenuForRestaurant } from "@/lib/menu/data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import { RestaurantMenuView } from "@/components/restaurant/RestaurantMenuView";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export async function generateMetadata({ params, searchParams }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams);
  return buildRestaurantMetadata(restaurant, {
    title: `Menu | ${restaurant.name}`,
    description: `Browse the menu at ${restaurant.name}. Prices in NZD.`,
    path: "menu",
  });
}

export default async function MenuPage({ params, searchParams }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams);
  const menu = await loadPublicMenuForRestaurant(restaurant.id);

  return (
    <>
      <StructuredData
        restaurant={restaurant}
        breadcrumbs={[
          { name: "Home", path: "" },
          { name: "Menu", path: "menu" },
        ]}
      />
      <PageHeader
        restaurant={restaurant}
        eyebrow="Dine with us"
        title="Our Menu"
        description={`Seasonal dishes crafted by the team at ${restaurant.name}.`}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <RestaurantMenuView menu={menu} restaurant={restaurant} />
      </div>
    </>
  );
}
