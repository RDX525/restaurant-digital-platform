"use client";

import { usePathname } from "next/navigation";
import {
  getRestaurantNavBase,
  getRestaurantNavHref,
  restaurantUsesRootPaths,
} from "@/lib/restaurant/routing";

export function useRestaurantNav(slug: string) {
  const pathname = usePathname();
  const useRootPaths = restaurantUsesRootPaths(pathname, slug);
  const base = getRestaurantNavBase(slug, useRootPaths);

  return {
    useRootPaths,
    base,
    homeHref: getRestaurantNavHref(slug, "", useRootPaths),
    menuHref: getRestaurantNavHref(slug, "menu", useRootPaths),
    orderHref: getRestaurantNavHref(slug, "order", useRootPaths),
    ordersHref: getRestaurantNavHref(slug, "orders", useRootPaths),
  };
}
