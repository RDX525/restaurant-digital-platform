import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { OrderHistory } from "@/components/order/OrderHistory";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export const revalidate = 60;

export async function generateMetadata({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return buildRestaurantMetadata(restaurant, {
    title: `Order history | ${restaurant.name}`,
    description: `View your order history at ${restaurant.name}.`,
    path: "orders",
  });
}

export default async function OrdersHistoryPage({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return <OrderHistory restaurant={restaurant} />;
}
