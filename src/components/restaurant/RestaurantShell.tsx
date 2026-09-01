import type { PublicRestaurant } from "@/lib/restaurant/types";
import { restaurantThemeStyle } from "@/lib/restaurant/theme";
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
        <div className="restaurant-site min-h-dvh w-full min-w-0 max-w-full" style={restaurantThemeStyle(restaurant)}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
            style={{ top: "max(1rem, env(safe-area-inset-top))" }}
          >
            Skip to content
          </a>
          <RestaurantHeader restaurant={restaurant} />
          <TableSessionBanner />
          <main id="main-content" className="min-w-0 max-w-full">
            {children}
          </main>
          <RestaurantFooter restaurant={restaurant} />
        </div>
      </OrderCartProvider>
    </TableSessionProvider>
  );
}
