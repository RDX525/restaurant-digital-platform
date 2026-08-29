"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, Phone, ShoppingBag, CalendarDays, LogIn } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import {
  getRestaurantNavBase,
  getRestaurantNavHref,
  isRestaurantNavActive,
  resolveRestaurantPath,
} from "@/lib/restaurant/routing";
import { OrderCartProvider, useOrderCart } from "@/components/order/OrderCartProvider";
import { TableSessionProvider } from "@/components/table/TableSessionProvider";
import { TableSessionBanner } from "@/components/table/TableSessionBanner";
import { cn } from "@/lib/utils";
import { trackPageEvent } from "@/lib/analytics/client";

const NAV_ITEMS = [
  { href: "", label: "Home" },
  { href: "about", label: "About" },
  { href: "menu", label: "Menu" },
  { href: "gallery", label: "Gallery" },
  { href: "contact", label: "Contact" },
];

interface RestaurantShellProps {
  restaurant: PublicRestaurant;
  children: React.ReactNode;
  useRootPaths?: boolean;
}

export function RestaurantShell({
  restaurant,
  children,
  useRootPaths = false,
}: RestaurantShellProps) {
  return (
    <TableSessionProvider>
      <OrderCartProvider restaurantSlug={restaurant.slug}>
        <RestaurantShellContent restaurant={restaurant} useRootPaths={useRootPaths}>
          {children}
        </RestaurantShellContent>
      </OrderCartProvider>
    </TableSessionProvider>
  );
}

function RestaurantShellContent({
  restaurant,
  children,
  useRootPaths = false,
}: RestaurantShellProps) {
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
    <div className="min-h-screen bg-mesh-light text-pine-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-pine-900/5 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
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
            {NAV_ITEMS.map((item) => {
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
            <Link href={orderHref} className="btn-accent relative rounded-full px-4 py-2.5">
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
          className="flex gap-2 overflow-x-auto border-t border-pine-900/5 px-4 py-2.5 lg:hidden"
          aria-label="Mobile"
        >
          {NAV_ITEMS.map((item) => {
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
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                  active ? "nav-gradient-active" : "bg-white text-pine-600 ring-1 ring-pine-900/5",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <TableSessionBanner />

      <main id="main-content">{children}</main>

      <footer className="bg-brand-surface relative mt-20">
        <div className="grain pointer-events-none absolute inset-0 z-[1] opacity-25" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
          <div>
            <h2 className="font-display text-2xl">{restaurant.name}</h2>
            {restaurant.tagline ? (
              <p className="mt-3 text-sm leading-relaxed text-white/70">{restaurant.tagline}</p>
            ) : null}
            {restaurant.city ? (
              <p className="mt-4 text-xs uppercase tracking-[0.15em] text-white/40">
                {restaurant.city}, Aotearoa New Zealand
              </p>
            ) : null}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={getRestaurantNavHref(restaurant.slug, item.href, useRootPaths)}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
              Contact
            </h3>
            <div className="mt-4 space-y-2.5 text-sm text-white/80">
              {restaurant.phone ? (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {restaurant.phone}
                </a>
              ) : null}
              {restaurant.email ? (
                <a href={`mailto:${restaurant.email}`} className="block transition hover:text-white">
                  {restaurant.email}
                </a>
              ) : null}
              <Link
                href={getRestaurantNavHref(restaurant.slug, "menu", useRootPaths)}
                className="flex items-center gap-2 transition hover:text-white"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
                View menu
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">
          <p>
            © {new Date().getFullYear()} {restaurant.name}
          </p>
          <p className="mt-2">
            Powered by{" "}
            <Link
              href="/"
              className="text-white/60 underline-offset-2 transition hover:text-white hover:underline"
            >
              Kāti
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-white/60 underline-offset-2 transition hover:text-white hover:underline sm:hidden"
            >
              <LogIn className="h-3 w-3" aria-hidden="true" />
              Staff sign in
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
