import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { loadPublicMenuForRestaurant } from "@/lib/menu/data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import { OrderCheckout } from "@/components/order/OrderCheckout";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export const revalidate = 60;

export async function generateMetadata({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return buildRestaurantMetadata(restaurant, {
    title: `Order | ${restaurant.name}`,
    description: `Order online from ${restaurant.name}.`,
    path: "order",
  });
}

export default async function OrderPage({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  const menu = await loadPublicMenuForRestaurant(restaurant.id);

  return (
    <>
      <StructuredData
        restaurant={restaurant}
        breadcrumbs={[
          { name: "Home", path: "" },
          { name: "Order", path: "order" },
        ]}
      />
      <PageHeader
        restaurant={restaurant}
        eyebrow="Order online"
        title="Your order"
        description={`Add items from the menu, checkout, and pay securely.`}
      />
      <OrderCheckout restaurant={restaurant} menu={menu} />
    </>
  );
}
