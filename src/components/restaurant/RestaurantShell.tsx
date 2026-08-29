import type { PublicRestaurant } from "@/lib/restaurant/types";
import { OrderCartProvider } from "@/components/order/OrderCartProvider";
import { TableSessionProvider } from "@/components/table/TableSessionProvider";
import { TableSessionBanner } from "@/components/table/TableSessionBanner";
import { RestaurantHeader } from "@/components/restaurant/RestaurantHeader";
import { RestaurantFooter } from "@/components/restaurant/RestaurantFooter";

interface RestaurantShellProps {
  restaurant: PublicRestaurant;
  children: React.ReactNode;
}

export function RestaurantShell({ restaurant, children }: RestaurantShellProps) {
  return (
    <TableSessionProvider>
      <OrderCartProvider restaurantSlug={restaurant.slug}>
        <div className="min-h-dvh bg-mesh-light text-pine-900">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
          >
            Skip to content
          </a>
          <RestaurantHeader restaurant={restaurant} />
          <TableSessionBanner />
          <main id="main-content">{children}</main>
          <RestaurantFooter restaurant={restaurant} />
        </div>
      </OrderCartProvider>
    </TableSessionProvider>
  );
}
