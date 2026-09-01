"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, CalendarDays, LogIn } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { RESTAURANT_NAV_ITEMS } from "@/lib/restaurant/nav";
import { useOrderCartCount } from "@/components/order/OrderCartProvider";
import { cn } from "@/lib/utils";
import { trackPageEvent } from "@/lib/analytics/client";
import { getSiteUrl } from "@/lib/env/site-url";
import {
  getRestaurantNavBase,
  getRestaurantNavHref,
  isRestaurantNavActive,
  resolveRestaurantPath,
  restaurantUsesRootPaths,
} from "@/lib/restaurant/routing";

export function RestaurantHeader({ restaurant }: { restaurant: PublicRestaurant }) {
  const pathname = usePathname();
  const useRootPaths = restaurantUsesRootPaths(pathname, restaurant.slug);
  const platformLoginHref = useRootPaths ? `${getSiteUrl()}/login` : "/login";
  const base = getRestaurantNavBase(restaurant.slug, useRootPaths);
  const reservationHref = resolveRestaurantPath(
    restaurant,
    restaurant.reservation_url ?? "reservations",
    useRootPaths,
  );
  const navItems = useMemo(
    () =>
      RESTAURANT_NAV_ITEMS.map((item) => {
        const href = getRestaurantNavHref(restaurant.slug, item.href, useRootPaths);
        return {
          href,
          label: item.label,
          active: isRestaurantNavActive(pathname, href, item.href, restaurant.slug),
        };
      }),
    [pathname, restaurant.slug, useRootPaths],
  );

  useEffect(() => {
    trackPageEvent(restaurant.slug, "WEBSITE_VISIT", pathname);
  }, [restaurant.slug, pathname]);

  return (
    <header
      className="rs-header sticky top-0 z-40 border-b"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="rs-page grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3 sm:gap-4 sm:py-4 xl:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Link
          href={base || "/"}
          aria-label={restaurant.name}
          className="flex min-w-0 items-center gap-3 touch-manipulation"
        >
          {restaurant.logo_url ? (
            <Image
              src={restaurant.logo_url}
              alt={`${restaurant.name} logo`}
              width={44}
              height={44}
              priority
              sizes="44px"
              className="h-11 w-11 shrink-0 rounded-full object-cover shadow-soft ring-1 ring-black/5"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg"
              style={{
                backgroundColor: "rgb(var(--rs-primary))",
                color: "var(--rs-on-primary)",
              }}
              aria-hidden="true"
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
          <span className="hidden min-w-0 truncate font-display text-lg tracking-tight text-pine-900 min-[480px]:inline sm:text-xl">
            {restaurant.name}
          </span>
        </Link>

        <nav className="hidden items-center justify-center gap-1 xl:flex" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href || "home"}
              href={item.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium touch-manipulation transition-colors duration-150 xl:px-4",
                item.active
                  ? "rs-nav-active"
                  : "text-pine-600 [@media(hover:hover)]:hover:bg-white/70 [@media(hover:hover)]:hover:text-pine-900",
              )}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <Link
            href={platformLoginHref}
            aria-label="Sign in"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-pine-600 transition [@media(hover:hover)]:hover:bg-white/70 [@media(hover:hover)]:hover:text-pine-900 sm:px-3"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign in</span>
          </Link>
          <Link
            href={reservationHref}
            className="btn-primary hidden rounded-full px-4 py-2.5 sm:inline-flex"
          >
            <CalendarDays className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Reserve
          </Link>
          <OrderCartLink restaurant={restaurant} useRootPaths={useRootPaths} />
        </div>
      </div>

      <nav
        className="flex w-full min-w-0 items-stretch gap-0.5 border-t border-black/5 px-1 py-1.5 sm:gap-2 sm:px-6 sm:py-2 xl:hidden"
        aria-label="Primary"
      >
        {navItems.map((item) => (
          <Link
            key={item.href || "home"}
            href={item.href}
            className={cn(
              "inline-flex min-h-11 min-w-0 flex-1 basis-0 items-center justify-center rounded-full px-0.5 text-center text-[11px] font-medium leading-tight touch-manipulation sm:px-3 sm:text-sm",
              item.active ? "rs-nav-active" : "text-pine-700",
            )}
            aria-current={item.active ? "page" : undefined}
          >
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}

function OrderCartLink({
  restaurant,
  useRootPaths,
}: {
  restaurant: PublicRestaurant;
  useRootPaths: boolean;
}) {
  const itemCount = useOrderCartCount();
  const orderIsExternal =
    restaurant.order_url?.startsWith("http://") || restaurant.order_url?.startsWith("https://");
  const orderHref = orderIsExternal
    ? restaurant.order_url!
    : getRestaurantNavHref(restaurant.slug, "order", useRootPaths);

  const label =
    itemCount > 0
      ? `Order, ${itemCount} ${itemCount === 1 ? "dish" : "dishes"}`
      : "Order";

  const className = "btn-accent relative rounded-full px-2.5 py-2.5 sm:px-4";
  const content = (
    <>
      <ShoppingBag className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
      <span className="hidden sm:inline">Order</span>
      {itemCount > 0 ? (
        <span
          className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-pine-900"
          aria-hidden="true"
        >
          {itemCount}
        </span>
      ) : null}
    </>
  );

  if (orderIsExternal) {
    return (
      <a href={orderHref} aria-label={label} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={orderHref} aria-label={label} className={className}>
      {content}
    </Link>
  );
}
