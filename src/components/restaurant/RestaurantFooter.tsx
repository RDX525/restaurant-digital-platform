"use client";

import Link from "next/link";
import Image from "next/image";
import { Phone } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { RESTAURANT_NAV_ITEMS } from "@/lib/restaurant/nav";
import { getRestaurantNavHref, restaurantUsesRootPaths } from "@/lib/restaurant/routing";
import { formatRestaurantLocation } from "@/lib/restaurant/theme";
import { RestaurantSocialLinks } from "@/components/restaurant/RestaurantSocialLinks";
import { usePathname } from "next/navigation";
import { getSiteUrl } from "@/lib/env/site-url";

export function RestaurantFooter({ restaurant }: { restaurant: PublicRestaurant }) {
  const pathname = usePathname();
  const useRootPaths = restaurantUsesRootPaths(pathname, restaurant.slug);
  const platformLoginHref = useRootPaths ? `${getSiteUrl()}/login` : "/login";
  const location = formatRestaurantLocation(restaurant);

  return (
    <footer className="rs-footer relative mt-20">
      <div className="rs-page relative z-10 grid gap-12 py-16 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            {restaurant.logo_url ? (
              <Image
                src={restaurant.logo_url}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-1 ring-white/20"
              />
            ) : null}
            <h2 className="font-display text-2xl tracking-tight">{restaurant.name}</h2>
          </div>
          {restaurant.tagline ? (
            <p className="mt-4 text-sm leading-relaxed text-white/72">{restaurant.tagline}</p>
          ) : null}
          {location ? (
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/45">{location}</p>
          ) : null}
          <RestaurantSocialLinks links={restaurant.social_links} className="mt-6 flex flex-wrap gap-2" />
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Explore
          </h3>
          <ul className="mt-4 space-y-1 text-sm text-white/80">
            {RESTAURANT_NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={getRestaurantNavHref(restaurant.slug, item.href, useRootPaths)}
                  className="inline-flex min-h-11 items-center text-white/80 transition hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Contact
          </h3>
          <div className="mt-4 space-y-1 text-sm text-white/80">
            {restaurant.phone ? (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex min-h-11 items-center gap-2 text-white/80 transition hover:text-white"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {restaurant.phone}
              </a>
            ) : null}
            {restaurant.email ? (
              <a
                href={`mailto:${restaurant.email}`}
                className="flex min-h-11 items-center break-all text-white/80 transition hover:text-white"
              >
                {restaurant.email}
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div
        className="relative z-10 border-t border-white/10 px-4 py-5 text-center text-xs text-white/45 sm:px-6"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} {restaurant.name}
        </p>
        <p className="mt-3">
          <Link
            href={platformLoginHref}
            className="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white/90 transition [@media(hover:hover)]:hover:border-white/40 [@media(hover:hover)]:hover:bg-white/15 [@media(hover:hover)]:hover:text-white"
          >
            Sign in to Kāti
          </Link>
        </p>
        <p className="mt-3">
          Website by{" "}
          <Link
            href={platformLoginHref}
            className="text-white/65 underline-offset-2 transition [@media(hover:hover)]:hover:text-white [@media(hover:hover)]:hover:underline"
          >
            Kāti
          </Link>
        </p>
      </div>
    </footer>
  );
}
