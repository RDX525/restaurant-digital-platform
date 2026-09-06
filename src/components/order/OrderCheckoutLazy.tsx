"use client";

import dynamic from "next/dynamic";
import type { FullMenu } from "@/lib/menu/types";
import type { PublicRestaurant } from "@/lib/restaurant/types";

const OrderCheckout = dynamic(
  () =>
    import("@/components/order/OrderCheckout").then((mod) => mod.OrderCheckout),
  {
    loading: () => (
      <div className="rs-page space-y-4 py-8" aria-busy="true" aria-label="Loading checkout">
        <div className="skeleton h-12 w-full max-w-md" />
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    ),
  },
);

export function OrderCheckoutLazy({
  restaurant,
  menu,
}: {
  restaurant: PublicRestaurant;
  menu: FullMenu | null;
}) {
  return <OrderCheckout restaurant={restaurant} menu={menu} />;
}
