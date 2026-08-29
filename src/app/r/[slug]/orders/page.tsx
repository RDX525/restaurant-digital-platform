import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { OrderHistory } from "@/components/order/OrderHistory";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";

export async function generateMetadata({ params, searchParams }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams);
  return buildRestaurantMetadata(restaurant, {
    title: `Order history | ${restaurant.name}`,
    description: `View your order history at ${restaurant.name}.`,
    path: "orders",
  });
}

export default async function OrdersHistoryPage({ params, searchParams }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams);
  return <OrderHistory restaurant={restaurant} />;
}
