"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, LogIn } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { RESTAURANT_NAV_ITEMS } from "@/lib/restaurant/nav";
import { getRestaurantNavHref, restaurantUsesRootPaths } from "@/lib/restaurant/routing";

export function RestaurantFooter({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  const pathname = usePathname();
  const useRootPaths = restaurantUsesRootPaths(pathname, restaurant.slug);
  return (
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
            {RESTAURANT_NAV_ITEMS.map((item) => (
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
      <div
        className="relative z-10 border-t border-white/10 px-4 py-5 text-center text-xs text-white/40"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
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
  );
}
