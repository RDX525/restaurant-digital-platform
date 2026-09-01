import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { loadPublicMenuForRestaurant } from "@/lib/menu/data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import { RestaurantMenuView } from "@/components/restaurant/RestaurantMenuView";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export const revalidate = 60;

export async function generateMetadata({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return buildRestaurantMetadata(restaurant, {
    title: `Menu | ${restaurant.name}`,
    description: `Browse the menu at ${restaurant.name}. Prices in NZD.`,
    path: "menu",
  });
}

export default async function MenuPage({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
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
        descriptionId="menu-intro"
      />
      <div className="rs-page--readable min-w-0 pb-12 sm:pb-16">
        <RestaurantMenuView menu={menu} restaurant={restaurant} />
      </div>
    </>
  );
}
