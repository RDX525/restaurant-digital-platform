"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, CalendarDays, LogIn } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { RESTAURANT_NAV_ITEMS } from "@/lib/restaurant/nav";
import {
  getRestaurantNavBase,
  getRestaurantNavHref,
  isRestaurantNavActive,
  resolveRestaurantPath,
} from "@/lib/restaurant/routing";
import { useOrderCart } from "@/components/order/OrderCartProvider";
import { cn } from "@/lib/utils";
import { trackPageEvent } from "@/lib/analytics/client";

export function RestaurantHeader({
  restaurant,
  useRootPaths = false,
}: {
  restaurant: PublicRestaurant;
  useRootPaths?: boolean;
}) {
  const pathname = usePathname();
  const { itemCount } = useOrderCart();
  const base = getRestaurantNavBase(restaurant.slug, useRootPaths);
  const orderHref = resolveRestaurantPath(restaurant, restaurant.order_url ?? "order", useRootPaths);
  const reservationHref = resolveRestaurantPath(
    restaurant,
    restaurant.reservation_url ?? "reservations",
    useRootPaths,
  );

  useEffect(() => {
    trackPageEvent(restaurant.slug, "WEBSITE_VISIT", pathname);
  }, [restaurant.slug, pathname]);

  return (
    <header
      className="sticky top-0 z-40 border-b border-pine-900/5 glass"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <Link href={base || "/"} className="flex min-w-0 items-center gap-3">
          {restaurant.logo_url ? (
            <Image
              src={restaurant.logo_url}
              alt={`${restaurant.name} logo`}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-soft"
            />
          ) : (
            <div
              className="nav-gradient-active flex h-11 w-11 items-center justify-center rounded-full font-display text-lg"
              aria-hidden="true"
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
          <span className="truncate font-display text-lg text-pine-900 sm:text-xl">
            {restaurant.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {RESTAURANT_NAV_ITEMS.map((item) => {
            const href = getRestaurantNavHref(restaurant.slug, item.href, useRootPaths);
            const active = isRestaurantNavActive(
              pathname,
              href,
              item.href,
              restaurant.slug,
            );
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "nav-gradient-active"
                    : "text-pine-600 hover:bg-white hover:text-pine-900",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/menus" className="landing-demo-pill hidden sm:inline-flex">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Staff dashboard
          </Link>
          <Link
            href={reservationHref}
            className="btn-primary hidden rounded-full px-4 py-2.5 sm:inline-flex"
          >
            <CalendarDays className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Reserve
          </Link>
          <Link href={orderHref} className="btn-accent relative rounded-full px-3 py-2.5 sm:px-4">
            <ShoppingBag className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Order
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-pine-900">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <nav
        className="scroll-x-touch flex gap-2 border-t border-pine-900/5 px-4 py-2.5 lg:hidden"
        aria-label="Mobile"
      >
        {RESTAURANT_NAV_ITEMS.map((item) => {
          const href = getRestaurantNavHref(restaurant.slug, item.href, useRootPaths);
          const active = isRestaurantNavActive(
            pathname,
            href,
            item.href,
            restaurant.slug,
          );
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium transition shrink-0",
                active ? "nav-gradient-active" : "bg-white text-pine-600 ring-1 ring-pine-900/5",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
